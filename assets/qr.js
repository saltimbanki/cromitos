/* =============================================================================
   Xerador de código QR en SVG (sen dependencias, offline-first).
   Soporta modo Byte, niveis de corrección M, versións 1–12 (ata 287 bytes).
   Exposición: window.QR.svg(text, opts)
   ============================================================================= */

(function () {
  'use strict';

  var GF_EXP = new Uint8Array(512);
  var GF_LOG = new Uint8Array(256);
  (function initGF() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) GF_EXP[j] = GF_EXP[j - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGenerator(ecLen) {
    var g = [1];
    for (var i = 0; i < ecLen; i++) {
      var next = new Array(g.length + 1);
      for (var k = 0; k < next.length; k++) next[k] = 0;
      var factor = GF_EXP[i];
      for (var j = 0; j < g.length; j++) {
        next[j] ^= g[j];
        next[j + 1] ^= gfMul(g[j], factor);
      }
      g = next;
    }
    return g;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenerator(ecLen);
    var res = new Uint8Array(data.length + ecLen);
    res.set(data);
    for (var i = 0; i < data.length; i++) {
      var coef = res[i];
      if (coef !== 0) {
        for (var j = 0; j < gen.length; j++) {
          res[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    return res.slice(data.length);
  }

  // Táboa para EC Level M (versions 1..12): [ecPerBlock, [[count, dataLen], ...]]
  var VERSIONS_M = [
    null,
    [10, [[1, 16]]],
    [16, [[1, 28]]],
    [26, [[1, 44]]],
    [18, [[2, 32]]],
    [24, [[2, 43]]],
    [16, [[4, 27]]],
    [18, [[4, 31]]],
    [22, [[2, 38], [2, 39]]],
    [22, [[3, 36], [2, 37]]],
    [26, [[4, 43], [1, 44]]],
    [30, [[1, 50], [4, 51]]],
    [22, [[6, 36], [2, 37]]]
  ];

  var ALIGN = [
    null,
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58]
  ];

  function totalDataBytes(ver) {
    var groups = VERSIONS_M[ver][1];
    var sum = 0;
    for (var i = 0; i < groups.length; i++) sum += groups[i][0] * groups[i][1];
    return sum;
  }

  function pickVersion(byteLen) {
    for (var v = 1; v < VERSIONS_M.length; v++) {
      var headerBits = 4 + (v < 10 ? 8 : 16);
      var capBits = totalDataBytes(v) * 8;
      if (headerBits + byteLen * 8 <= capBits) return v;
    }
    throw new Error('QR payload demasiado longo (' + byteLen + ' bytes)');
  }

  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
      else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    return new Uint8Array(out);
  }

  function encodeData(bytes, ver) {
    var dataCap = totalDataBytes(ver);
    var bits = [];
    function pushBits(val, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }

    pushBits(4, 4); // Modo Byte
    pushBits(bytes.length, ver < 10 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);

    var maxBits = dataCap * 8;
    var term = Math.min(4, maxBits - bits.length);
    for (var t = 0; t < term; t++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    var out = new Uint8Array(dataCap);
    for (var b = 0; b < bits.length / 8; b++) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[b * 8 + k];
      out[b] = v;
    }
    var pad = [0xec, 0x11];
    for (var p = bits.length / 8, pi = 0; p < dataCap; p++, pi++) {
      out[p] = pad[pi & 1];
    }
    return out;
  }

  function interleave(dataBytes, ver) {
    var spec = VERSIONS_M[ver];
    var ecLen = spec[0];
    var groups = spec[1];
    var dataBlocks = [];
    var ecBlocks = [];
    var off = 0;
    var maxData = 0;

    for (var g = 0; g < groups.length; g++) {
      var count = groups[g][0];
      var len = groups[g][1];
      if (len > maxData) maxData = len;
      for (var c = 0; c < count; c++) {
        var blk = dataBytes.slice(off, off + len);
        off += len;
        dataBlocks.push(blk);
        ecBlocks.push(rsEncode(blk, ecLen));
      }
    }

    var res = [];
    for (var i = 0; i < maxData; i++) {
      for (var b = 0; b < dataBlocks.length; b++) {
        if (i < dataBlocks[b].length) res.push(dataBlocks[b][i]);
      }
    }
    for (var e = 0; e < ecLen; e++) {
      for (var b2 = 0; b2 < ecBlocks.length; b2++) {
        res.push(ecBlocks[b2][e]);
      }
    }
    return new Uint8Array(res);
  }

  function makeMatrix(ver) {
    var size = ver * 4 + 17;
    var mod = [];
    var isFunc = [];
    for (var r = 0; r < size; r++) {
      mod.push(new Uint8Array(size));
      isFunc.push(new Uint8Array(size));
    }

    function setFunc(r, c, val) {
      mod[r][c] = val ? 1 : 0;
      isFunc[r][c] = 1;
    }

    function drawFinder(top, left) {
      for (var r = -1; r <= 7; r++) {
        for (var c = -1; c <= 7; c++) {
          var rr = top + r, cc = left + c;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                   (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                   (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunc(rr, cc, on);
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Timing patterns
    for (var i = 8; i < size - 8; i++) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    // Dark module
    setFunc(size - 8, 8, 1);

    // Alignment patterns
    var pos = ALIGN[ver];
    for (var a = 0; a < pos.length; a++) {
      for (var b = 0; b < pos.length; b++) {
        var ar = pos[a], ac = pos[b];
        if ((ar === 6 && ac === 6) ||
            (ar === 6 && ac === size - 7) ||
            (ar === size - 7 && ac === 6)) continue;
        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            var d = Math.max(Math.abs(dr), Math.abs(dc));
            setFunc(ar + dr, ac + dc, d === 2 || d === 0);
          }
        }
      }
    }

    // Reserve format info
    for (var f = 0; f < 9; f++) {
      if (f !== 6) {
        isFunc[8][f] = 1;
        isFunc[f][8] = 1;
      }
    }
    for (var f2 = size - 8; f2 < size; f2++) {
      isFunc[8][f2] = 1;
      isFunc[f2][8] = 1;
    }

    // Version info (>= 7)
    if (ver >= 7) {
      var rem = ver;
      for (var k = 0; k < 12; k++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
      var bits = (ver << 12) | rem;
      for (var vi = 0; vi < 18; vi++) {
        var bit = (bits >> vi) & 1;
        var vr = Math.floor(vi / 3);
        var vc = size - 11 + (vi % 3);
        setFunc(vr, vc, bit);
        setFunc(vc, vr, bit);
      }
    }

    return { size: size, mod: mod, isFunc: isFunc };
  }

  function placeData(mat, codewords) {
    var size = mat.size;
    var bitIdx = 0;
    var totalBits = codewords.length * 8;
    var up = true;

    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        var r = up ? size - 1 - vert : vert;
        for (var j = 0; j < 2; j++) {
          var c = right - j;
          if (!mat.isFunc[r][c]) {
            var bit = 0;
            if (bitIdx < totalBits) {
              bit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            mat.mod[r][c] = bit;
          }
        }
      }
      up = !up;
    }
  }

  function maskCond(mask, r, c) {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2 + (r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
    return false;
  }

  function drawFormat(mat, mask) {
    var size = mat.size;
    // EC Level M = 00
    var data = mask; // (0 << 3) | mask
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;

    for (var k = 0; k <= 5; k++) mat.mod[8][k] = (bits >> k) & 1;
    mat.mod[8][7] = (bits >> 6) & 1;
    mat.mod[8][8] = (bits >> 7) & 1;
    mat.mod[7][8] = (bits >> 8) & 1;
    for (var m = 9; m < 15; m++) mat.mod[14 - m][8] = (bits >> m) & 1;

    for (var n = 0; n < 8; n++) mat.mod[size - 1 - n][8] = (bits >> n) & 1;
    for (var p = 8; p < 15; p++) mat.mod[8][size - 15 + p] = (bits >> p) & 1;
  }

  function penalty(mat) {
    var size = mat.size;
    var mod = mat.mod;
    var score = 0;

    // Regra 1: 5+ seguidos
    for (var r = 0; r < size; r++) {
      var runR = 1, runC = 1;
      for (var c = 1; c < size; c++) {
        if (mod[r][c] === mod[r][c - 1]) {
          runR++;
          if (runR === 5) score += 3;
          else if (runR > 5) score += 1;
        } else runR = 1;

        if (mod[c][r] === mod[c - 1][r]) {
          runC++;
          if (runC === 5) score += 3;
          else if (runC > 5) score += 1;
        } else runC = 1;
      }
    }

    // Regra 2: bloques 2x2
    for (var r2 = 0; r2 < size - 1; r2++) {
      for (var c2 = 0; c2 < size - 1; c2++) {
        var v = mod[r2][c2];
        if (v === mod[r2][c2 + 1] && v === mod[r2 + 1][c2] && v === mod[r2 + 1][c2 + 1]) {
          score += 3;
        }
      }
    }

    // Regra 3: patrón 1:1:3:1:1
    function checkLine(get) {
      for (var i = 0; i <= size - 11; i++) {
        if (get(i) === 1 && get(i + 1) === 0 && get(i + 2) === 1 && get(i + 3) === 1 &&
            get(i + 4) === 1 && get(i + 5) === 0 && get(i + 6) === 1 &&
            get(i + 7) === 0 && get(i + 8) === 0 && get(i + 9) === 0 && get(i + 10) === 0) {
          score += 40;
        }
        if (get(i) === 0 && get(i + 1) === 0 && get(i + 2) === 0 && get(i + 3) === 0 &&
            get(i + 4) === 1 && get(i + 5) === 0 && get(i + 6) === 1 &&
            get(i + 7) === 1 && get(i + 8) === 1 && get(i + 9) === 0 && get(i + 10) === 1) {
          score += 40;
        }
      }
    }
    for (var idx = 0; idx < size; idx++) {
      checkLine(function (k) { return mod[idx][k]; });
      checkLine(function (k) { return mod[k][idx]; });
    }

    // Regra 4: proporción escura
    var dark = 0;
    for (var r4 = 0; r4 < size; r4++) {
      for (var c4 = 0; c4 < size; c4++) if (mod[r4][c4]) dark++;
    }
    var pct = Math.abs((dark * 100) / (size * size) - 50);
    score += Math.floor(pct / 5) * 10;
    return score;
  }

  function applyMask(mat, mask) {
    var size = mat.size;
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (!mat.isFunc[r][c] && maskCond(mask, r, c)) {
          mat.mod[r][c] ^= 1;
        }
      }
    }
  }

  function encode(text) {
    var bytes = utf8Bytes(String(text || ''));
    var ver = pickVersion(bytes.length);
    var data = encodeData(bytes, ver);
    var codewords = interleave(data, ver);
    var mat = makeMatrix(ver);
    placeData(mat, codewords);

    var bestMask = 0;
    var bestScore = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(mat, m);
      drawFormat(mat, m);
      var s = penalty(mat);
      if (s < bestScore) {
        bestScore = s;
        bestMask = m;
      }
      applyMask(mat, m); // revertir
    }

    applyMask(mat, bestMask);
    drawFormat(mat, bestMask);
    return mat;
  }

  function toSVG(text, opts) {
    opts = opts || {};
    var margin = opts.margin == null ? 3 : opts.margin;
    var mat = encode(text);
    var size = mat.size;
    var total = size + margin * 2;
    var paths = [];

    for (var r = 0; r < size; r++) {
      var c = 0;
      while (c < size) {
        if (mat.mod[r][c]) {
          var start = c;
          while (c < size && mat.mod[r][c]) c++;
          paths.push('M' + (start + margin) + ',' + (r + margin) + 'h' + (c - start) + 'v1h-' + (c - start) + 'z');
        } else {
          c++;
        }
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" ' +
      'shape-rendering="crispEdges" role="img" aria-label="Código QR">' +
      '<rect width="' + total + '" height="' + total + '" fill="#ffffff"/>' +
      '<path d="' + paths.join('') + '" fill="#111111"/>' +
      '</svg>';
  }

  window.QR = { encode: encode, svg: toSVG };
})();
