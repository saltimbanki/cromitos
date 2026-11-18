/* =============================================================================
   Cromos · Álbum U.D. Barbadás
   App local (sen servidor): catálogo desde data/catalog.js, colección en localStorage.
   Identidade dun cromo: categoría + páxina + nome. Sen numeración visible.
   ============================================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     Catálogo (en localStorage; nunca no repositorio público)
     --------------------------------------------------------------------------- */

  var CAT_KEY = 'cromos.catalog.v1';
  var CAT = null;
  var STICKERS = [];
  var CATEGORIES = [];
  var TOTAL = 0;
  var BY_ID = new Map();
  var CAT_BY_ID = new Map();
  var SEARCH = [];
  var BY_CAT = new Map();

  function isValidCatalog(obj) {
    return !!(obj && obj.meta && Array.isArray(obj.categories) && Array.isArray(obj.stickers) && obj.stickers.length > 0);
  }

  function loadCatalog() {
    try {
      var raw = JSON.parse(localStorage.getItem(CAT_KEY) || 'null');
      if (isValidCatalog(raw)) return raw;
    } catch (e) { /* noop */ }
    if (isValidCatalog(window.__CATALOG__)) return window.__CATALOG__;
    return null;
  }

  function saveCatalog(catObj) {
    try { localStorage.setItem(CAT_KEY, JSON.stringify(catObj)); } catch (e) { /* noop */ }
  }

  function initCatalog(catObj) {
    CAT = isValidCatalog(catObj) ? catObj : null;
    BY_ID = new Map();
    CAT_BY_ID = new Map();
    BY_CAT = new Map();
    if (!CAT) {
      STICKERS = [];
      CATEGORIES = [];
      TOTAL = 0;
      SEARCH = [];
      return;
    }
    STICKERS = CAT.stickers;
    CATEGORIES = CAT.categories;
    TOTAL = STICKERS.length;
    CATEGORIES.forEach(function (c) { CAT_BY_ID.set(c.id, c); BY_CAT.set(c.id, []); });
    STICKERS.forEach(function (s) {
      BY_ID.set(s.id, s);
      (BY_CAT.get(s.cat) || []).push(s);
    });
    SEARCH = STICKERS.map(function (s) {
      return {
        id: s.id,
        s: s,
        key: norm(s.name),
        catName: (CAT_BY_ID.get(s.cat) || {}).name || s.cat
      };
    });
  }

  initCatalog(loadCatalog());

  /* ---------------------------------------------------------------------------
     Textos (todo nun sitio, por se hai que axustar galego)
     --------------------------------------------------------------------------- */

  var L = {
    album: 'Álbum',
    missing: 'Faltan',
    dups: 'Repetidos',
    stats: 'Estatísticas',
    done: 'Completado',
    owned: 'Pegados',
    ownedOne: 'Pegado',
    missingOne: 'Falta',
    dupsWord: 'repetidos',
    search: 'Buscar por nome',
    searchHint: 'Escribe dous caracteres ou máis',
    noResults: 'Ningún cromo con ese nome',
    undo: 'Desfacer',
    settings: 'Axustes',
    collector: 'Álbum de',
    switchCollector: 'Cambiar de álbum',
    addCollector: 'Engadir álbum',
    addCollectorHint: 'Outro fillo/a, outra colección',
    editCollector: 'Editar álbum',
    deleteCollector: 'Borrar álbum',
    namePlaceholder: 'Ex.: Thiago',
    albumColor: 'Cor do álbum',
    albumColorHint: 'Esta cor pinta a barra superior e o fondo da app.',
    appearance: 'Aparencia',
    lightTheme: 'Clara',
    darkTheme: 'Escura',
    changeAlbumHint: 'Toca para cambiar ou xestionar',
    albums: 'álbums',
    excelData: 'Datos do Excel',
    applySeed: 'Cubrir co estado do Excel',
    applySeedHint: 'cromos xa pegados · substitúe este álbum',
    mergeTitle: 'Mesturar copia',
    mergeHint: 'Mestúrase co que xa tes neste teléfono: por cada cromo queda a cantidade maior. Nunca borra nada.',
    mergeDo: 'Mesturar',
    mergeNewAlbum: 'novo',
    mergeNoChange: 'sen cambios',
    mergeNothing: 'Non hai nada novo nesta copia.',
    backup: 'Copia de seguridade',
    backupSave: 'Gardar copia (.json)',
    backupLoad: 'Mesturar unha copia',
    catalog: 'Catálogo',
    wipe: 'Borrar todos os datos',
    confirm: 'Estás seguro?',
    cancel: 'Cancelar',
    shareDups: 'Compartir repetidos',
    shareMissing: 'Compartir o que falta',
    emptyAlbum: 'Álbum baleiro',
    emptyMissing: 'Non che falta ningún cromo',
    emptyDups: 'Non tes repetidos',
    emptyMissingSub: 'Marca os cromos que xa tes e aquí aparecerán os que che faltan.',
    emptyDupsSub: 'Cando te saia un cromo repetido, pulsa + e aparecerá aquí.',
    emptyAlbumSub: 'Pulsa un cromo para marcar que xa o tes.',
    allDone: 'Álbum completo!',
    allDoneSub: 'Xa tes os 390 cromos.',
    pages: 'páxinas',
    page: 'Páxina',
    of: 'de',
    stNothing: 'Sen datos',
    stored: 'Gardado',
    storageError: 'Non se puido gardar no navegador',
    shareCopied: 'Lista copiada',
    shareFail: 'Non se puido compartir',
    restored: 'Copia restaurada',
    badFile: 'O ficheiro non é unha copia válida',
    orphan: 'cromos do catálogo anterior xa non existen',
    clean: 'Limpar',
    tradeQR: 'Trocar (QR)',
    tradeTitle: 'Troco por QR',
    myQR: 'O meu QR',
    compareOther: 'Comparar',
    copyLink: 'Copiar ligazón',
    linkCopied: 'Ligazón copiada',
    pastePlaceholder: 'Pega aquí a ligazón ou código C1...',
    compareDo: 'Comparar',
    scanCamera: 'Escanear coa cámara',
    stopCamera: 'Pechar cámara',
    cameraNoSupport: 'Este navegador non ten lector QR integrado. En iPhone usa a cámara do móbil ou pega aquí a ligazón/código.',
    cameraError: 'Non se puido abrir a cámara',
    tradeGive: 'Ti dás',
    tradeGet: 'Che dan',
    tradeNothing: 'Non hai cromos para trocar entre estes dous álbums.',
    tradeCopy: 'Copiar resumo do troco',
    tradeCopied: 'Resumo copiado',
    badCode: 'O código ou ligazón non é válido',
    wrongCatalog: 'Este QR é doutro catálogo'
  };

  /* ---------------------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------------------- */

  var viewEl, topbarEl, tabsEl, toastEl, sheetRoot;

  function norm(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pct(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  function pctLabel(part, total) {
    var p = pct(part, total);
    return (p === 0 && part > 0) ? '&lt;1%' : p + '%';
  }

  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  }

  function shortPageLabel(page, side) {
    return 'Pág. ' + page + (side ? ' (' + side + ')' : '');
  }

  function vibrate(n) {
    try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) { /* noop */ }
  }

  /* ---------------------------------------------------------------------------
     Cores · cada álbum ten a súa e pinta a app
     --------------------------------------------------------------------------- */

  var PALETTE = [
    { hex: '#0f7b5f', name: 'Verde' },
    { hex: '#0d9488', name: 'Turquesa' },
    { hex: '#0891b2', name: 'Ciano' },
    { hex: '#2563eb', name: 'Azul' },
    { hex: '#4f46e5', name: 'Índigo' },
    { hex: '#7c3aed', name: 'Violeta' },
    { hex: '#c026d3', name: 'Maxenta' },
    { hex: '#e11d48', name: 'Framboesa' },
    { hex: '#dc2626', name: 'Vermello' },
    { hex: '#ea580c', name: 'Laranxa' },
    { hex: '#c98500', name: 'Ámbar' },
    { hex: '#475569', name: 'Grafito' }
  ];

  function hexRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function luminance(hex) {
    var rgb = hexRgb(hex);
    if (!rgb) return 0;
    var ch = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  /* Branco ou case-negro, o que mellor contraste dea sobre a cor. */
  function contrastInk(hex) {
    var l = luminance(hex);
    var onWhite = 1.05 / (l + 0.05);
    var onBlack = (l + 0.05) / 0.05;
    return onBlack > onWhite ? '#12171b' : '#ffffff';
  }

  function paletteColor(i) {
    var n = PALETTE.length;
    return PALETTE[((i % n) + n) % n].hex;
  }

  function collectorColor(c) {
    return (c && hexRgb(c.color)) ? c.color : PALETTE[0].hex;
  }

  /* ---------------------------------------------------------------------------
     Iconas
     --------------------------------------------------------------------------- */

  function svg(paths, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + paths + '</svg>';
  }

  var ICON = {
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/>'),
    gear: svg('<path d="M3.5 8h4M12 8h8.5M3.5 16h8.5M16.5 16h4"/><circle cx="9.5" cy="8" r="2.2"/><circle cx="14.5" cy="16" r="2.2"/>'),
    back: svg('<path d="M15 18 9 12l6-6"/>'),
    chevronDown: svg('<path d="M6 9.5 12 15.5l6-6"/>'),
    chevronRight: svg('<path d="M9.5 6 15.5 12 9.5 18"/>'),
    undo: svg('<path d="M9.5 14.5 5 10l4.5-4.5"/><path d="M5 10h10.5a4.5 4.5 0 0 1 0 9H12"/>'),
    close: svg('<path d="M6 6 18 18M18 6 6 18"/>'),
    album: svg('<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>'),
    missing: svg('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r="1.1" fill="currentColor"/><circle cx="4.6" cy="12" r="1.1" fill="currentColor"/><circle cx="4.6" cy="17.5" r="1.1" fill="currentColor"/>'),
    dups: svg('<rect x="9" y="9" width="11.5" height="11.5" rx="2"/><path d="M5.5 15.5V6a2 2 0 0 1 2-2h9"/>'),
    stats: svg('<path d="M3.5 20.5V12M9.8 20.5V4.5M16.1 20.5v-6"M22.4 20.5V8.5"/>'),
    share: svg('<path d="M12 3.5v11.5"/><path d="m8 7 4-3.5L16 7"/><path d="M5.5 13.5V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5.5"/>'),
    download: svg('<path d="M12 3.5v11"/><path d="m8 10.5 4 4 4-4"/><path d="M5 20h14"/>'),
    upload: svg('<path d="M12 14.5v-11"/><path d="m8 7.5 4-4 4 4"/><path d="M5 20h14"/>'),
    plus: svg('<path d="M12 5.5v13M5.5 12h13"/>'),
    trash: svg('<path d="M4 6.5h16"/><path d="M9.5 6.5V4.5h5v2"/><path d="m6.5 6.5.9 13h9.2l.9-13"/>'),
    pencil: svg('<path d="M4 20h4L19.5 8.5 15.5 4.5 4 16v4z"/>'),
    warning: svg('<path d="M12 3.2 21 20H3L12 3.2z"/><path d="M12 9.5v4.2M12 16.8v.2"/>'),
    check: svg('<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>'),
    moon: svg('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'),
    qr: svg('<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><path d="M14 14h2.5v2.5H14zM18.5 14H20v2.5M14 18.5h2.5V20M18.5 18.5H20V20"/>')
  };

  /* ---------------------------------------------------------------------------
     Estado
     --------------------------------------------------------------------------- */

  var STORE_KEY = 'cromos.v1';
  var TONE_KEY = 'cromos.tone';
  var SCHEMA = 1;
  var SEED_NAMES = ['Thiago', 'Enzo'];
  var EXCEL_SEED = window.__SEED__ || null;

  var state = null;
  var ui = {
    tab: 'album',
    catId: null,
    pageIdx: null,
    searchOpen: false,
    searchDirty: false,
    query: '',
    compact: false,
    open: new Set()
  };
  var undoStack = [];
  var toastTimer = null;
  var sheetColor = PALETTE[0].hex;
  var lastTone = null;
  var pendingMerge = null;

  function catalogSignature() {
    if (!CAT || !CAT.meta) return '';
    return TOTAL + '|' + CATEGORIES.length + '|' + (CAT.meta.generated || '');
  }

  /* ---------------------------------------------------------------------------
     Estado inicial do álbum de Thiago, tal e como está no Excel (data/seed.js).
     Só se aplica unha vez: despois mandan os datos do usuario.
     --------------------------------------------------------------------------- */

  function seedSignature() {
    return (EXCEL_SEED && EXCEL_SEED.signature) ? String(EXCEL_SEED.signature) : '';
  }

  function seedAlbumName() {
    return (EXCEL_SEED && EXCEL_SEED.album) ? EXCEL_SEED.album : SEED_NAMES[0];
  }

  /* Devolve {stickerId: cantidade} só se o seed corresponde a este catálogo. */
  function seedCounts() {
    if (!EXCEL_SEED || !EXCEL_SEED.counts) return null;
    if (EXCEL_SEED.signature && EXCEL_SEED.signature !== catalogSignature()) return null;
    var out = {};
    Object.keys(EXCEL_SEED.counts).forEach(function (id) {
      if (!BY_ID.has(id)) return; /* cromo que xa non está no catálogo */
      var n = Math.floor(Number(EXCEL_SEED.counts[id]));
      if (n > 0) out[id] = n;
    });
    return out;
  }

  function cloneCounts(src) {
    var out = {};
    Object.keys(src || {}).forEach(function (k) { out[k] = src[k]; });
    return out;
  }

  function osTheme() {
    try {
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function freshState() {
    return {
      schema: SCHEMA,
      catalog: catalogSignature(),
      theme: osTheme(),
      seed: seedSignature(),
      collectors: [],
      activeId: null,
      collections: {}
    };
  }

  /* Primeira vez: se hai seed (build local con --with-seed), os dous álbums da
     casa xa creados e Thiago co estado do Excel. No build público non hai seed:
     arráncase sen álbums, para que cada un poña os seus. */
  function seededState() {
    var seed = seedCounts();
    if (!seed) return freshState();

    var s = freshState();
    var target = seedAlbumName().toLowerCase();

    SEED_NAMES.forEach(function (name, i) {
      var c = { id: uid('c'), name: name, color: paletteColor(i) };
      s.collectors.push(c);
      s.collections[c.id] = (name.toLowerCase() === target) ? cloneCounts(seed) : {};
    });
    s.activeId = s.collectors[0].id;
    return s;
  }

  function applyTheme() {
    var t = (state && state.theme === 'dark') ? 'dark' : 'light';
    if (document.documentElement.getAttribute('data-theme') !== t) {
      document.documentElement.setAttribute('data-theme', t);
    }
  }

  function applyTone() {
    var c = activeCollector();
    var tone = collectorColor(c);
    if (tone === lastTone) return;
    lastTone = tone;

    var ink = contrastInk(tone);
    var root = document.documentElement;
    root.style.setProperty('--tone', tone);
    root.style.setProperty('--tone-ink', ink);

    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', tone);

    try { localStorage.setItem(TONE_KEY, tone + '|' + ink); } catch (e) { /* noop */ }
  }

  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { raw = null; }
    if (!raw) return seededState();
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return seededState();
      if (!Array.isArray(parsed.collectors)) parsed.collectors = [];
      if (!parsed.collections || typeof parsed.collections !== 'object') parsed.collections = {};
      parsed.schema = SCHEMA;
      parsed.catalog = catalogSignature();
      if (parsed.theme !== 'light' && parsed.theme !== 'dark') parsed.theme = osTheme();

      parsed.collectors = parsed.collectors.map(function (c, i) {
        return {
          id: c.id || uid('c'),
          name: String(c.name || 'Álbum').slice(0, 24),
          color: hexRgb(c.color) ? c.color : paletteColor(i)
        };
      });

      if (!parsed.collectors.length) parsed.activeId = null;
      else if (!parsed.collectors.some(function (c) { return c.id === parsed.activeId; })) {
        parsed.activeId = parsed.collectors[0].id;
      }
      parsed.collectors.forEach(function (c) {
        if (!parsed.collections[c.id]) parsed.collections[c.id] = {};
      });

      /* Estados creados antes de existir data/seed.js: cúbrese o álbum de Thiago
         co que xa estaba pegado no Excel, só se aínda está baleiro. */
      if (parsed.seed !== seedSignature()) {
        var seed = seedCounts();
        if (seed) {
          var target = seedAlbumName().toLowerCase();
          parsed.collectors.forEach(function (c) {
            if (c.name.trim().toLowerCase() !== target) return;
            if (Object.keys(parsed.collections[c.id]).length) return;
            parsed.collections[c.id] = cloneCounts(seed);
          });
        }
        parsed.seed = seedSignature();
      }
      return parsed;
    } catch (e) {
      return seededState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      toast(L.storageError, true);
      return false;
    }
  }

  function activeCollector() {
    return state.collectors.filter(function (c) { return c.id === state.activeId; })[0] || null;
  }

  function coll(cid) {
    var id = cid || state.activeId;
    if (!id) return {};
    if (!state.collections[id]) state.collections[id] = {};
    return state.collections[id];
  }

  function qty(stickerId, cid) {
    return coll(cid)[stickerId] || 0;
  }

  /* ---------------------------------------------------------------------------
     Modelo
     --------------------------------------------------------------------------- */

  function setQty(stickerId, value, opts) {
    var cid = state.activeId;
    if (!cid) return;
    var before = qty(stickerId, cid);
    var next = Math.max(0, Math.min(99, Math.round(value)));
    if (next === before) return;

    if (!opts || !opts.silent) {
      undoStack.push({ cid: cid, id: stickerId, before: before });
      if (undoStack.length > 60) undoStack.shift();
    }

    if (next === 0) delete state.collections[cid][stickerId];
    else state.collections[cid][stickerId] = next;

    save();
    return before;
  }

  function toggle(id) {
    var current = qty(id);
    setQty(id, current > 0 ? 0 : 1);
    vibrate(current > 0 ? 8 : 12);
  }

  function step(id, delta) {
    var current = qty(id);
    setQty(id, current + delta);
    vibrate(8);
  }

  function undo() {
    var last = undoStack.pop();
    if (!last) return;
    if (last.cid !== state.activeId) {
      state.activeId = last.cid;
    }
    setQty(last.id, last.before, { silent: true });
    var s = BY_ID.get(last.id);
    toast('Desfeito: ' + (s ? s.name : ''), false, 2200);
  }

  function statsOf(cid) {
    var col = state.collections[cid] || {};
    var owned = 0;
    var dups = 0;
    Object.keys(col).forEach(function (id) {
      var q = col[id] || 0;
      if (q >= 1) owned++;
      if (q > 1) dups += q - 1;
    });
    return {
      owned: owned,
      dups: dups,
      missing: TOTAL - owned,
      total: TOTAL,
      pct: pct(owned, TOTAL)
    };
  }

  function orphansOf(cid) {
    var col = state.collections[cid] || {};
    return Object.keys(col).filter(function (id) { return !BY_ID.has(id); });
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  function orphanText(n) {
    return plural(n, 'cromo do catálogo anterior xa non existe', 'cromos do catálogo anterior xa non existen');
  }

  /* ---------------------------------------------------------------------------
     Toast
     --------------------------------------------------------------------------- */

  function toast(message, isError, ms) {
    if (!toastEl) return;
    toastEl.innerHTML = '<span>' + esc(message) + '</span>' +
      (undoStack.length && !isError
        ? '<button type="button" data-act="undo">' + L.undo + '</button>'
        : '');
    toastEl.classList.add('is-open');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-open');
    }, ms || 2600);
  }

  /* ---------------------------------------------------------------------------
     Router / render
     --------------------------------------------------------------------------- */

  function setUI(patch) {
    Object.keys(patch).forEach(function (k) { ui[k] = patch[k]; });
    render();
  }

  function goAlbum() {
    ui.catId = null;
    ui.pageIdx = null;
    ui.searchOpen = false;
    ui.query = '';
    render();
    if (history.state && history.state.catId) {
      try { history.back(); } catch (e) { /* noop */ }
    }
  }

  function openCategory(catId) {
    ui.catId = catId;
    ui.pageIdx = null;
    ui.searchOpen = false;
    ui.query = '';
    render();
    try { history.pushState({ catId: catId }, ''); } catch (e) { /* noop */ }
  }

  function render() {
    applyTheme();
    applyTone();
    if (!CAT) {
      topbarEl.innerHTML = '';
      tabsEl.innerHTML = '';
      viewEl.innerHTML = '';
      openCatalogSetup();
      return;
    }
    if (!state.collectors.length) {
      renderTopbar();
      renderTabs();
      viewEl.innerHTML = '';
      openOnboarding();
      return;
    }
    var scroll = viewEl.scrollTop;
    renderTopbar();
    renderTabs();
    renderView();
    viewEl.scrollTop = scroll;
    closeSheetIfAny();
  }

  function renderTopbar() {
    if (ui.searchOpen) {
      var wasFocused = document.activeElement && document.activeElement.id === 'search-input';
      topbarEl.innerHTML =
        '<div class="tbar">' +
        '<div class="searchbar">' +
        '<input id="search-input" type="search" inputmode="search" autocomplete="off" ' +
        'autocorrect="off" autocapitalize="off" spellcheck="false" ' +
        'placeholder="' + esc(L.search) + '" value="' + esc(ui.query) + '" aria-label="' + esc(L.search) + '">' +
        '<button class="icon-btn" type="button" data-act="search-close" aria-label="Pechar busca">' + ICON.close + '</button>' +
        '</div>' +
        '</div>';
      var input = document.getElementById('search-input');
      if (input && (wasFocused || !ui.searchDirty)) {
        ui.searchDirty = true;
        input.focus();
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) { /* noop */ }
      }
      return;
    }
    ui.searchDirty = false;

    var canUndo = undoStack.length > 0;
    var actions =
      (canUndo ? '<button class="icon-btn" type="button" data-act="undo" aria-label="' + esc(L.undo) + '">' + ICON.undo + '</button>' : '') +
      '<button class="icon-btn" type="button" data-act="search-open" aria-label="' + esc(L.search) + '">' + ICON.search + '</button>' +
      '<button class="icon-btn" type="button" data-act="settings" aria-label="' + esc(L.settings) + '">' + ICON.gear + '</button>';

    var picker;
    if (ui.compact) {
      picker =
        '<div class="csel-wrap">' +
        '<select class="csel" id="collector-select" aria-label="' + esc(L.switchCollector) + '">' +
        state.collectors.map(function (c) {
          return '<option value="' + esc(c.id) + '"' + (c.id === state.activeId ? ' selected' : '') + '>' +
            esc(c.name) + '</option>';
        }).join('') +
        '</select>' +
        '<span class="csel-chevron">' + ICON.chevronDown + '</span>' +
        '</div>';
    } else {
      picker =
        '<div class="cchips" id="cchips">' +
        state.collectors.map(function (c) {
          var active = c.id === state.activeId;
          return '<button class="cchip" type="button" data-act="pick-collector" data-id="' + esc(c.id) + '"' +
            ' aria-pressed="' + (active ? 'true' : 'false') + '"' +
            ' aria-label="' + esc(c.name + ' · ' + L.switchCollector) + '">' +
            '<span class="cd" style="background:' + esc(collectorColor(c)) + '" aria-hidden="true"></span>' +
            '<span class="cname">' + esc(c.name) + '</span>' +
            '</button>';
        }).join('') +
        '</div>';
    }

    topbarEl.innerHTML = '<div class="tbar">' + picker + '<div class="tbar-actions">' + actions + '</div></div>';

    if (!ui.compact) measureChips();
  }

  /* Se os chips non collen, cámbiase a un select. Mídese despois de pintar. */
  function measureChips() {
    requestAnimationFrame(function () {
      if (ui.compact) return;
      var box = document.getElementById('cchips');
      if (!box) return;
      if (box.scrollWidth > box.clientWidth + 2) {
        ui.compact = true;
        renderTopbar();
      }
    });
  }

  function renderTabs() {
    var st = statsOf(state.activeId);
    var tabs = [
      { id: 'album', label: L.album, icon: ICON.album, badge: 0 },
      { id: 'missing', label: L.missing, icon: ICON.missing, badge: 0 },
      { id: 'dups', label: L.dups, icon: ICON.dups, badge: st.dups },
      { id: 'stats', label: L.stats, icon: ICON.stats, badge: 0 }
    ];
    tabsEl.innerHTML = tabs.map(function (t) {
      var badge = t.badge > 0
        ? '<span class="badge">' + (t.badge > 99 ? '99+' : t.badge) + '</span>'
        : '';
      return '<button class="tab" type="button" role="tab" data-act="tab" data-tab="' + t.id + '"' +
        ' aria-selected="' + (ui.tab === t.id && !ui.searchOpen ? 'true' : 'false') + '">' +
        t.icon + '<span>' + esc(t.label) + '</span>' + badge + '</button>';
    }).join('');
  }

  function renderView() {
    if (ui.searchOpen) return viewSearch();
    if (ui.catId) return viewCategory();
    if (ui.tab === 'album') return viewAlbum();
    if (ui.tab === 'missing') return viewMissing();
    if (ui.tab === 'dups') return viewDups();
    if (ui.tab === 'stats') return viewStats();
    return viewAlbum();
  }

  /* ---------------------------------------------------------------------------
     Vistas
     --------------------------------------------------------------------------- */

  function viewAlbum() {
    var st = statsOf(state.activeId);
    var col = coll();

    var cats = CATEGORIES.map(function (c) {
      var list = BY_CAT.get(c.id) || [];
      var owned = list.filter(function (s) { return (col[s.id] || 0) >= 1; }).length;
      var done = owned === list.length;
      return '<button class="cat' + (done ? ' is-done' : '') + '" type="button" data-act="cat" data-cat="' + c.id + '">' +
        '<span class="cat-name">' + esc(c.name) + '</span>' +
        '<span class="cat-count"><b>' + owned + '</b> / ' + list.length + '</span>' +
        '<span class="cat-bar"><i style="width:' + pct(owned, list.length) + '%"></i></span>' +
        '</button>';
    }).join('');

    var orphans = orphansOf(state.activeId).length;

    viewEl.innerHTML =
      '<div class="view">' +
      '<div class="hero">' +
      '<div class="hero-top"><span class="hero-label">' + esc(L.done) + '</span>' +
      '<span class="hero-pct">' + pctLabel(st.owned, TOTAL) + '</span></div>' +
      '<div class="hero-bar"><i style="width:' + st.pct + '%"></i></div>' +
      '<div class="hero-sub">' + st.owned + ' ' + esc(L.of) + ' ' + TOTAL + ' · ' +
      st.dups + ' ' + esc(L.dupsWord) + '</div>' +
      '</div>' +
      (orphans ? '<div class="notice">' + ICON.warning + '<span>' + esc(orphanText(orphans)) +
        '. <button type="button" data-act="clean-orphans" style="font-weight:700;color:inherit;text-decoration:underline">' + esc(L.clean) + '</button></span></div>' : '') +
      '<div class="cat-list">' + cats + '</div>' +
      '</div>';
  }

  function allPages() {
    var list = [];
    CATEGORIES.forEach(function (c) {
      c.pages.forEach(function (p) {
        list.push({ catId: c.id, pageIdx: p.index });
      });
    });
    return list;
  }

  function stepPage(delta) {
    var list = allPages();
    if (!list.length) return;
    var cat = CAT_BY_ID.get(ui.catId);
    var curPage = ui.pageIdx != null ? ui.pageIdx : (cat && cat.pages[0] ? cat.pages[0].index : null);
    var pos = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].catId === ui.catId && list[i].pageIdx === curPage) { pos = i; break; }
    }
    if (pos < 0) return;
    var target = list[pos + delta];
    if (!target) return;
    var catChanged = target.catId !== ui.catId;
    ui.catId = target.catId;
    ui.pageIdx = target.pageIdx;
    ui.slideDir = delta > 0 ? 'next' : 'prev';
    render();
    viewEl.scrollTop = 0;
    if (catChanged) {
      try { history.replaceState({ catId: ui.catId }, ''); } catch (e) { /* noop */ }
    }
  }

  function viewCategory() {
    var cat = CAT_BY_ID.get(ui.catId);
    if (!cat) return goAlbum();

    var col = coll();
    var pages = cat.pages;
    var current = ui.pageIdx;
    if (current == null || !pages.some(function (p) { return p.index === current; })) {
      current = pages[0].index;
    }

    var seq = allPages();
    var seqPos = -1;
    for (var i = 0; i < seq.length; i++) {
      if (seq[i].catId === ui.catId && seq[i].pageIdx === current) { seqPos = i; break; }
    }
    var hasPrev = seqPos > 0;
    var hasNext = seqPos >= 0 && seqPos < seq.length - 1;

    var page = pages.filter(function (p) { return p.index === current; })[0];
    var ids = page ? page.stickers : [];

    var chips = pages.map(function (p) {
      var total = p.stickers.length;
      var owned = p.stickers.filter(function (id) { return (col[id] || 0) >= 1; }).length;
      return '<button class="chip" type="button" data-act="page" data-page="' + p.index + '"' +
        ' aria-pressed="' + (p.index === current ? 'true' : 'false') + '">' +
        esc(p.label || shortPageLabel(p.index, p.side)) + ' · ' + owned + '/' + total +
        '</button>';
    }).join('');

    var owned = ids.filter(function (id) { return (col[id] || 0) >= 1; }).length;
    var slideCls = ui.slideDir ? ' slide-' + ui.slideDir : '';
    ui.slideDir = null;

    viewEl.innerHTML =
      '<div class="cat-sticky">' +
      '<div class="subhead">' +
      '<button class="back-btn" type="button" data-act="back" aria-label="Volver">' + ICON.back + '</button>' +
      '<h2>' + esc(cat.name) + '</h2>' +
      '<span class="count">' + owned + '/' + ids.length + '</span>' +
      '<div class="nav-pair">' +
      '<button class="nav-btn" type="button" data-act="page-prev" aria-label="Páxina anterior"' + (hasPrev ? '' : ' disabled') + '>' + ICON.back + '</button>' +
      '<button class="nav-btn" type="button" data-act="page-next" aria-label="Páxina seguinte"' + (hasNext ? '' : ' disabled') + '>' + ICON.chevronRight + '</button>' +
      '</div>' +
      '</div>' +
      '<div class="chips">' + chips + '</div>' +
      '</div>' +
      '<div class="rows' + slideCls + '">' + ids.map(function (id) { return rowHTML(BY_ID.get(id), { meta: 'role' }); }).join('') + '</div>' +
      '<div style="height:20px"></div>';
  }

  function rowHTML(sticker, opts) {
    if (!sticker) return '';
    opts = opts || {};
    var q = qty(sticker.id);
    var owned = q >= 1;

    var meta = [];
    if (opts.meta === 'context') {
      var cat = CAT_BY_ID.get(sticker.cat);
      meta.push(cat ? cat.name : sticker.cat);
      meta.push(shortPageLabel(sticker.page, sticker.side));
    }
    if (opts.meta === 'dups') {
      meta.push(plural(q - 1, 'repetido', 'repetidos'));
      meta.push(shortPageLabel(sticker.page, sticker.side));
    }
    if (sticker.role) meta.push(sticker.role);

    var actions = owned
      ? '<div class="stepper">' +
          '<button class="step" type="button" data-act="dec" data-id="' + esc(sticker.id) + '" aria-label="Menos">−</button>' +
          '<span class="qty">' + q + '</span>' +
          '<button class="step" type="button" data-act="inc" data-id="' + esc(sticker.id) + '" aria-label="Máis">+</button>' +
        '</div>'
      : '<span class="pill">' + esc(L.missingOne) + '</span>';

    return '<div class="row' + (owned ? ' is-owned' : '') + '">' +
      '<span class="row-dot" aria-hidden="true"></span>' +
      '<button class="row-main" type="button" data-act="toggle" data-id="' + esc(sticker.id) + '">' +
      '<span class="row-name">' + esc(sticker.name) + '</span>' +
      (meta.length ? '<span class="row-meta">' + esc(meta.join(' · ')) + '</span>' : '') +
      '</button>' +
      actions +
      '</div>';
  }

  function viewSearch() {
    var q = norm(ui.query);
    var body;

    if (q.length < 2) {
      body = '<div class="empty"><span class="emoji">🔎</span><p><strong>' + esc(L.search) + '</strong>' +
        esc(L.searchHint) + '</p></div>';
    } else {
      var terms = q.split(' ');
      var hits = SEARCH.filter(function (item) {
        return terms.every(function (t) { return item.key.indexOf(t) !== -1; });
      }).slice(0, 80);

      body = hits.length
        ? '<div class="rows">' + hits.map(function (h) {
            return rowHTML(h.s, { meta: 'context' });
          }).join('') + '</div>'
        : '<div class="empty"><span class="emoji">🤷</span><p><strong>' + esc(L.noResults) + '</strong>' +
          esc(ui.query) + '</p></div>';
    }

    viewEl.innerHTML = '<div style="height:10px"></div>' + body + '<div style="height:20px"></div>';
  }

  function groupByCategory(ids) {
    var groups = [];
    var index = new Map();
    ids.forEach(function (id) {
      var s = BY_ID.get(id);
      if (!s) return;
      if (!index.has(s.cat)) {
        index.set(s.cat, { cat: CAT_BY_ID.get(s.cat), ids: [] });
        groups.push(index.get(s.cat));
      }
      index.get(s.cat).ids.push(id);
    });
    return groups;
  }

  function viewMissing() {
    var col = coll();
    var missing = STICKERS.filter(function (s) { return (col[s.id] || 0) < 1; }).map(function (s) { return s.id; });

    if (!missing.length) {
      return emptyState('🏆', L.allDone, L.allDoneSub);
    }

    var groups = groupByCategory(missing);
    viewEl.innerHTML =
      '<div class="view" style="padding-bottom:0">' +
      '<div class="btn-row" style="margin-bottom:14px">' +
      '<button class="btn secondary" type="button" data-act="share-missing">' + ICON.share + ' ' + esc(L.shareMissing) + '</button>' +
      '<button class="btn secondary" type="button" data-act="trade-qr" data-mode="my">' + ICON.qr + ' ' + esc(L.tradeQR) + '</button>' +
      '</div></div>' +
      '<div class="acc-list">' + groups.map(function (g) {
        var open = ui.open.has('missing:' + g.cat.id);
        return '<div class="acc' + (open ? ' is-open' : '') + '">' +
          '<button class="acc-head" type="button" data-act="acc" data-acc="missing:' + g.cat.id + '">' +
          '<span class="acc-name">' + esc(g.cat.name) + '</span>' +
          '<span class="acc-count">' + g.ids.length + '</span>' +
          ICON.chevronRight +
          '</button>' +
          (open ? '<div class="rows">' + g.ids.map(function (id) {
            return rowHTML(BY_ID.get(id), { meta: 'none' });
          }).join('') + '</div>' : '') +
          '</div>';
      }).join('') + '</div><div style="height:20px"></div>';
  }

  function viewDups() {
    var col = coll();
    var dups = STICKERS.filter(function (s) { return (col[s.id] || 0) > 1; }).map(function (s) { return s.id; });

    if (!dups.length) {
      return emptyState('📦', L.emptyDups, L.emptyDupsSub);
    }

    var groups = groupByCategory(dups);
    var totalDups = dups.reduce(function (acc, id) { return acc + ((col[id] || 0) - 1); }, 0);

    viewEl.innerHTML =
      '<div class="view" style="padding-bottom:0">' +
      '<div class="btn-row" style="margin-bottom:14px">' +
      '<button class="btn secondary" type="button" data-act="share-dups">' + ICON.share + ' ' + esc(L.shareDups) + ' (' + totalDups + ')</button>' +
      '<button class="btn secondary" type="button" data-act="trade-qr" data-mode="my">' + ICON.qr + ' ' + esc(L.tradeQR) + '</button>' +
      '</div></div>' +
      '<div class="acc-list">' + groups.map(function (g) {
        var open = ui.open.has('dups:' + g.cat.id);
        var count = g.ids.reduce(function (acc, id) { return acc + ((col[id] || 0) - 1); }, 0);
        return '<div class="acc' + (open ? ' is-open' : '') + '">' +
          '<button class="acc-head" type="button" data-act="acc" data-acc="dups:' + g.cat.id + '">' +
          '<span class="acc-name">' + esc(g.cat.name) + '</span>' +
          '<span class="acc-count">' + count + '</span>' +
          ICON.chevronRight +
          '</button>' +
          (open ? '<div class="rows">' + g.ids.map(function (id) {
            return rowHTML(BY_ID.get(id), { meta: 'dups' });
          }).join('') + '</div>' : '') +
          '</div>';
      }).join('') + '</div><div style="height:20px"></div>';
  }

  function viewStats() {
    var st = statsOf(state.activeId);
    var multi = state.collectors.length > 1;

    var rows = CATEGORIES.map(function (c) {
      var list = BY_CAT.get(c.id) || [];
      var col = coll();
      var owned = list.filter(function (s) { return (col[s.id] || 0) >= 1; }).length;
      var dups = list.reduce(function (acc, s) { var q = col[s.id] || 0; return acc + (q > 1 ? q - 1 : 0); }, 0);
      return '<tr>' +
        '<td class="name">' + esc(c.name) + '<div class="mini-bar"><i style="width:' + pct(owned, list.length) + '%"></i></div></td>' +
        '<td class="num">' + owned + '/' + list.length + '</td>' +
        '<td class="num">' + pctLabel(owned, list.length) + '</td>' +
        '<td class="num">' + dups + '</td>' +
        '</tr>';
    }).join('');

    var compare = '';
    if (multi) {
      compare = '<h3 class="section-title">Comparativa</h3>' +
        '<table class="table"><thead><tr><th>Álbum</th><th style="text-align:right">Pegados</th><th style="text-align:right">Repetidos</th><th style="text-align:right">%</th></tr></thead><tbody>' +
        state.collectors.map(function (c) {
          var s = statsOf(c.id);
          return '<tr' + (c.id === state.activeId ? ' style="font-weight:700"' : '') + '>' +
            '<td class="name">' + esc(c.name) + '</td>' +
            '<td class="num">' + s.owned + '</td>' +
            '<td class="num">' + s.dups + '</td>' +
            '<td class="num">' + pctLabel(s.owned, TOTAL) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    viewEl.innerHTML =
      '<div class="view">' +
      '<div class="stats-grid">' +
      '<div class="stat is-accent"><b>' + st.owned + '</b><span>' + esc(L.owned) + '</span></div>' +
      '<div class="stat"><b>' + st.missing + '</b><span>' + esc(L.missing) + '</span></div>' +
      '<div class="stat"><b>' + st.dups + '</b><span>' + esc(L.dups) + '</span></div>' +
      '<div class="stat"><b>' + pctLabel(st.owned, TOTAL) + '</b><span>' + esc(L.done) + '</span></div>' +
      '</div>' +
      '<div class="hero-bar" style="margin-bottom:4px"><i style="width:' + st.pct + '%"></i></div>' +
      '<h3 class="section-title">Por categoría</h3>' +
      '<table class="table"><thead><tr><th>Categoría</th><th style="text-align:right">Ten</th><th style="text-align:right">%</th><th style="text-align:right">Rep.</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      compare +
      '<div style="height:24px"></div>' +
      '</div>';
  }

  function emptyState(emoji, title, sub) {
    viewEl.innerHTML = '<div class="empty"><span class="emoji">' + emoji + '</span>' +
      '<p><strong>' + esc(title) + '</strong>' + esc(sub) + '</p></div>';
  }

  /* ---------------------------------------------------------------------------
     Sheets
     --------------------------------------------------------------------------- */

  function openSheet(title, bodyHTML, opts) {
    opts = opts || {};
    closeSheetIfAny();
    var root = sheetRoot;
    root.innerHTML =
      '<div class="sheet-backdrop" data-act="sheet-close"></div>' +
      '<div class="sheet is-open" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head">' +
      '<h3>' + esc(title) + '</h3>' +
      (opts.locked ? '' : '<button class="sheet-close" type="button" data-act="sheet-close" aria-label="Pechar">' + ICON.close + '</button>') +
      '</div>' +
      '<div class="sheet-body">' + bodyHTML + '</div>' +
      '</div>';
    document.body.style.overflow = 'hidden';
    var first = root.querySelector('input');
    if (first) {
      setTimeout(function () {
        first.focus();
        try { first.setSelectionRange(first.value.length, first.value.length); } catch (e) { /* noop */ }
      }, 60);
    }
  }

  function closeSheetIfAny() {
    stopQrCamera();
    if (sheetRoot && sheetRoot.innerHTML.trim()) {
      sheetRoot.innerHTML = '';
      document.body.style.overflow = '';
    }
  }

  function openCatalogSetup() {
    openSheet('Cargar álbum', '' +
      '<p class="hint" style="margin-top:0">Por privacidade, esta app non garda ningún nome na internet. Para empezar, carga o ficheiro <code>.json</code> do álbum (ou unha copia de seguridade).</p>' +
      '<div style="height:12px"></div>' +
      '<button class="btn" type="button" data-act="backup-import">' + ICON.upload + ' Cargar ficheiro (.json)</button>',
      { locked: true });
  }

  function openOnboarding() {
    openSheet('Ben-vido/a', '' +
      '<p class="hint" style="margin-top:0">Este álbum gárdase só neste dispositivo. Non se envía nada a ningún servidor.</p>' +
      '<label class="label" for="new-name">Nome do álbum</label>' +
      '<input class="field" id="new-name" type="text" placeholder="Ex.: Thiago" maxlength="24" autocomplete="off">' +
      '<p class="hint">Podes engadir máis álbums despois (un por fillo/a).</p>' +
      '<div style="height:16px"></div>' +
      '<button class="btn" type="button" data-act="create-collector">Empezar</button>' +
      '<div style="height:8px"></div>' +
      '<button class="btn secondary" type="button" data-act="backup-import">Xa teño unha copia (.json)</button>',
      { locked: true });
  }

  function openCollectorsSheet() {
    var body = state.collectors.map(function (c) {
      var s = statsOf(c.id);
      var active = c.id === state.activeId;
      var color = collectorColor(c);
      return '<div class="sheet-item ' + (active ? 'is-active' : '') + '">' +
        '<button class="grow" type="button" data-act="pick-collector" data-id="' + esc(c.id) + '" style="text-align:left;display:flex;align-items:center;gap:11px">' +
        '<span class="avatar" style="background:' + esc(color) + ';color:' + esc(contrastInk(color)) + '">' +
        esc(c.name.trim().charAt(0).toUpperCase() || '?') + '</span>' +
        '<span class="grow">' + esc(c.name) +
        '<small>' + s.owned + '/' + TOTAL + ' · ' + plural(s.dups, 'repetido', 'repetidos') + '</small></span>' +
        (active ? ICON.check : '') +
        '</button>' +
        '<button type="button" data-act="rename-collector" data-id="' + esc(c.id) + '" aria-label="' + esc(L.editCollector) + '" style="padding:8px">' + ICON.pencil + '</button>' +
        '<button type="button" data-act="delete-collector" data-id="' + esc(c.id) + '" aria-label="' + esc(L.deleteCollector) + '" style="padding:8px;color:var(--danger)">' + ICON.trash + '</button>' +
        '</div>';
    }).join('');

    body += '<div style="height:12px"></div>' +
      '<button class="btn secondary" type="button" data-act="add-collector">' + ICON.plus + ' ' + esc(L.addCollector) + '</button>';

    openSheet(L.switchCollector, body);
  }

  function swatchesHTML(selected) {
    return '<div class="swatches">' + PALETTE.map(function (p) {
      return '<button class="swatch" type="button" data-act="pick-color" data-color="' + p.hex + '"' +
        ' style="--s:' + p.hex + '" aria-label="' + esc(p.name) + '"' +
        ' aria-pressed="' + (p.hex === selected ? 'true' : 'false') + '">' + ICON.check + '</button>';
    }).join('') + '</div>';
  }

  function openNameSheet(mode, collectorId) {
    var isEdit = mode === 'edit';
    var current = isEdit
      ? state.collectors.filter(function (c) { return c.id === collectorId; })[0]
      : null;

    sheetColor = current ? collectorColor(current) : paletteColor(state.collectors.length);
    var initial = current ? (current.name.trim().charAt(0).toUpperCase() || '?') : '?';

    openSheet(isEdit ? L.editCollector : L.addCollector, '' +
      '<div style="display:flex;align-items:center;gap:13px;padding:4px 0 2px">' +
        '<span class="avatar" id="name-preview" aria-hidden="true" style="width:44px;height:44px;font-size:17px;' +
        'background:' + esc(sheetColor) + ';color:' + esc(contrastInk(sheetColor)) + '">' + esc(initial) + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<input class="field" id="name-input" type="text" maxlength="24" autocomplete="off" ' +
          'placeholder="' + esc(L.namePlaceholder) + '" value="' + esc(current ? current.name : '') + '">' +
        '</div>' +
      '</div>' +
      '<span class="label">' + esc(L.albumColor) + '</span>' +
      swatchesHTML(sheetColor) +
      '<p class="hint">' + esc(L.albumColorHint) + '</p>' +
      '<div style="height:18px"></div>' +
      '<button class="btn" type="button" data-act="save-name" data-mode="' + mode + '" data-id="' + esc(collectorId || '') + '">Gardar</button>' +
      '<div style="height:8px"></div>' +
      '<button class="btn secondary" type="button" data-act="sheet-close">' + esc(L.cancel) + '</button>');
  }

  function openSettings() {
    var st = statsOf(state.activeId);
    var orphans = orphansOf(state.activeId).length;
    var active = activeCollector();
    var tone = collectorColor(active);
    var theme = state.theme === 'dark' ? 'dark' : 'light';
    var seed = seedCounts();
    var seedN = seed ? Object.keys(seed).length : 0;

    var body = '' +
      '<h3 class="section-title" style="margin-left:0">' + esc(L.album) + '</h3>' +
      '<button class="sheet-item" type="button" data-act="collectors">' +
        '<span class="avatar" style="background:' + esc(tone) + ';color:' + esc(contrastInk(tone)) + '">' +
        esc(active ? (active.name.trim().charAt(0).toUpperCase() || '?') : '?') + '</span>' +
        '<span class="grow">' + esc(active ? active.name : '—') +
        '<small>' + plural(state.collectors.length, 'álbum', L.albums) + ' · ' + esc(L.changeAlbumHint) + '</small></span>' +
        ICON.chevronRight +
      '</button>' +
      '<button class="sheet-item" type="button" data-act="add-collector">' +
        ICON.plus + '<span class="grow">' + esc(L.addCollector) + '<small>' + esc(L.addCollectorHint) + '</small></span>' +
      '</button>' +

      (seed ? (
        '<h3 class="section-title" style="margin-left:0">' + esc(L.excelData) + '</h3>' +
        '<button class="sheet-item" type="button" data-act="apply-seed">' +
          ICON.check + '<span class="grow">' + esc(L.applySeed) +
          '<small>' + seedN + ' ' + esc(L.applySeedHint) + '</small></span>' +
        '</button>'
      ) : '') +

      '<h3 class="section-title" style="margin-left:0">' + esc(L.appearance) + '</h3>' +
      '<div class="seg">' +
        '<button type="button" data-act="theme" data-theme="light" aria-pressed="' + (theme === 'light' ? 'true' : 'false') + '">' +
        ICON.sun + ' ' + esc(L.lightTheme) + '</button>' +
        '<button type="button" data-act="theme" data-theme="dark" aria-pressed="' + (theme === 'dark' ? 'true' : 'false') + '">' +
        ICON.moon + ' ' + esc(L.darkTheme) + '</button>' +
      '</div>' +

      '<h3 class="section-title" style="margin-left:0">' + esc(L.backup) + '</h3>' +
      '<button class="sheet-item" type="button" data-act="backup-export">' +
        ICON.download + '<span class="grow">' + esc(L.backupSave) + '<small>Copia de seguridade de todos os álbums</small></span>' +
      '</button>' +
      '<button class="sheet-item" type="button" data-act="backup-import">' +
        ICON.upload + '<span class="grow">' + esc(L.backupLoad) + '<small>Mestúrase co que xa tes · nunca borra</small></span>' +
      '</button>' +

      '<h3 class="section-title" style="margin-left:0">' + esc(L.catalog) + '</h3>' +
      '<div class="sheet-item"><span class="grow" style="font-size:14px">' +
        TOTAL + ' cromos · ' + CATEGORIES.length + ' categorías<br>' +
        '<small>Fonte: ' + esc(CAT.meta.source) + ' · xerado ' + esc(CAT.meta.generated) + '</small>' +
      '</span></div>' +
      (orphans ? '<div class="notice" style="margin:10px 0">' + ICON.warning + '<span>' + esc(orphanText(orphans)) +
        '. <button type="button" data-act="clean-orphans" style="font-weight:700;color:inherit;text-decoration:underline">' + esc(L.clean) + '</button></span></div>' : '') +

      '<h3 class="section-title" style="margin-left:0">Zona perigosa</h3>' +
      '<button class="sheet-item" type="button" data-act="reset-collector" style="color:var(--danger)">' +
        ICON.trash + '<span class="grow">Baleirar este álbum<small>' + esc(activeCollector() ? activeCollector().name : '') + ' · ' + st.owned + ' cromos marcados</small></span>' +
      '</button>' +
      '<button class="sheet-item" type="button" data-act="wipe" style="color:var(--danger)">' +
        ICON.trash + '<span class="grow">' + esc(L.wipe) + '<small>Borra todos os álbums e os datos deste dispositivo</small></span>' +
      '</button>' +
      '<div style="height:24px"></div>';

    openSheet(L.settings, body);
  }

  function confirmSheet(message, action, label, danger) {
    openSheet(L.confirm, '' +
      '<p style="font-size:15px;line-height:1.5;margin:4px 0 20px">' + esc(message) + '</p>' +
      '<div class="btn-row">' +
      '<button class="btn secondary" type="button" data-act="sheet-close">' + esc(L.cancel) + '</button>' +
      '<button class="btn' + (danger ? ' danger' : '') + '" type="button" data-act="' + action + '"' +
      (danger ? ' style="background:var(--danger);color:#fff;border:0"' : '') + '>' + esc(label) + '</button>' +
      '</div>');
  }

  /* ---------------------------------------------------------------------------
     Copia de seguridade
     --------------------------------------------------------------------------- */

  function exportBackup() {
    var payload = {
      app: 'cromos',
      schema: SCHEMA,
      catalog: catalogSignature(),
      exported: new Date().toISOString(),
      album: CAT ? CAT.meta.album : 'Álbum de Cromos',
      catalogData: CAT,
      data: {
        theme: state.theme,
        collectors: state.collectors,
        activeId: state.activeId,
        collections: state.collections
      }
    };
    var name = 'cromos-barbadas-' + new Date().toISOString().slice(0, 10) + '.json';
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });

    try {
      if (navigator.canShare && navigator.share && window.File) {
        var file = new File([blob], name, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'Copia de cromos' }).catch(function () { download(blob, name); });
          return;
        }
      }
    } catch (e) { /* noop */ }

    download(blob, name);
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
    toast('Copia gardada: ' + name, false, 3000);
  }

  function importBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try { parsed = JSON.parse(String(reader.result)); } catch (e) { parsed = null; }
      var incomingCat = parsed && (isValidCatalog(parsed.catalogData) ? parsed.catalogData : (isValidCatalog(parsed) ? parsed : null));
      var data = parsed && parsed.data;
      var hasCollectors = !!(data && Array.isArray(data.collectors) && typeof data.collections === 'object' && data.collectors.length);

      if (!CAT && !incomingCat) {
        toast(L.badFile, true, 4000);
        return;
      }

      if (incomingCat) {
        var prevSig = catalogSignature();
        saveCatalog(incomingCat);
        initCatalog(incomingCat);
        if (prevSig && catalogSignature() !== prevSig) {
          toast('Catálogo actualizado (' + TOTAL + ' cromos)', false, 2600);
        }
      }

      if (hasCollectors) {
        var plan = planMerge(data);
        if (!plan.albums.length) { toast(L.badFile, true, 4000); return; }
        openMergeSheet(plan);
        return;
      }

      if (incomingCat) {
        state.catalog = catalogSignature();
        save();
        closeSheetIfAny();
        render();
        return;
      }

      toast(L.badFile, true, 4000);
    };
    reader.onerror = function () { toast(L.badFile, true, 4000); };
    reader.readAsText(file);
  }

  /* Mestura: por cada cromo queda a cantidade maior. Nunca borra nada. */
  function planMerge(data) {
    var plan = { albums: [], added: 0, upgraded: 0, before: 0, after: 0 };
    var localByName = {};
    state.collectors.forEach(function (c) {
      localByName[c.name.trim().toLowerCase()] = c;
    });

    data.collectors.forEach(function (inc, i) {
      var name = String(inc.name || 'Álbum').slice(0, 24);
      var key = name.trim().toLowerCase();
      var local = localByName[key] || null;
      var incoming = (data.collections && data.collections[inc.id]) || {};
      var current = local ? coll(local.id) : {};
      var result = cloneCounts(current);
      var added = 0;
      var upgraded = 0;

      Object.keys(incoming).forEach(function (sid) {
        if (!BY_ID.has(sid)) return; /* cromo que xa non está no catálogo */
        var q = Math.floor(Number(incoming[sid]));
        if (!(q > 0)) return;
        var prev = result[sid] || 0;
        if (q > prev) {
          result[sid] = q;
          if (prev === 0) added++;
          else upgraded++;
        }
      });

      plan.albums.push({
        id: local ? local.id : null,
        name: local ? local.name : name,
        color: local
          ? collectorColor(local)
          : (hexRgb(inc.color) ? inc.color : paletteColor(state.collectors.length + i)),
        isNew: !local,
        before: Object.keys(current).length,
        after: Object.keys(result).length,
        added: added,
        upgraded: upgraded,
        counts: result
      });
      plan.added += added;
      plan.upgraded += upgraded;
      plan.before += Object.keys(current).length;
      plan.after += Object.keys(result).length;
    });

    return plan;
  }

  function applyMerge(plan) {
    plan.albums.forEach(function (a) {
      var target = a.id
        ? state.collectors.filter(function (c) { return c.id === a.id; })[0]
        : null;
      if (!target) {
        target = { id: uid('c'), name: a.name, color: a.color };
        state.collectors.push(target);
      }
      state.collections[target.id] = cloneCounts(a.counts);
    });
    state.seed = seedSignature();
    if (!state.activeId || !state.collectors.some(function (c) { return c.id === state.activeId; })) {
      state.activeId = state.collectors[0] ? state.collectors[0].id : null;
    }
    undoStack = [];
    lastTone = null;
    save();
    closeSheetIfAny();
    render();
    toast(
      plan.added + (plan.added === 1 ? ' cromo novo' : ' cromos novos') +
      (plan.upgraded ? ' · ' + plural(plan.upgraded, 'repetido', 'repetidos') : ''),
      false,
      3000
    );
  }

  function openMergeSheet(plan) {
    var rows = plan.albums.map(function (a) {
      var delta = a.after - a.before;
      var tail;
      if (a.isNew && a.after > 0) tail = L.mergeNewAlbum;
      else if (delta > 0) tail = '+' + delta;
      else tail = L.mergeNoChange;
      return '<div class="merge-row' + (delta > 0 ? ' is-up' : '') + '">' +
        '<span class="cd" style="background:' + esc(a.color) + '" aria-hidden="true"></span>' +
        '<span class="grow">' + esc(a.name) +
        '<small>' + a.before + ' → ' + a.after + '</small></span>' +
        '<b>' + esc(tail) + '</b>' +
        '</div>';
    }).join('');

    var summary = plan.added || plan.upgraded
      ? plural(plan.added, 'cromo novo', 'cromos novos') +
        (plan.upgraded ? ' · ' + plural(plan.upgraded, 'repetido', 'repetidos') : '')
      : L.mergeNothing;

    openSheet(L.mergeTitle, '' +
      '<p class="hint" style="margin-top:0">' + esc(L.mergeHint) + '</p>' +
      '<div class="merge-list">' + rows + '</div>' +
      '<p class="merge-sum">' + esc(summary) + '</p>' +
      '<div style="height:16px"></div>' +
      '<button class="btn" type="button" data-act="do-merge">' + esc(L.mergeDo) + '</button>' +
      '<div style="height:8px"></div>' +
      '<button class="btn secondary" type="button" data-act="sheet-close">' + esc(L.cancel) + '</button>');

    pendingMerge = plan;
  }

  /* ---------------------------------------------------------------------------
     Compartir
     --------------------------------------------------------------------------- */

  function buildListText(kind) {
    var c = activeCollector();
    var col = coll();
    var lines = [];
    lines.push('Álbum EDB / U.D. Barbadás — ' + (c ? c.name : ''));

    if (kind === 'dups') {
      var dups = STICKERS.filter(function (s) { return (col[s.id] || 0) > 1; });
      var totalDups = dups.reduce(function (a, s) { return a + ((col[s.id] || 0) - 1); }, 0);
      lines.push('REPETIDOS (' + totalDups + ')');
      if (!dups.length) lines.push('· ningún');
      groupByCategory(dups.map(function (s) { return s.id; })).forEach(function (g) {
        var names = g.ids.map(function (id) {
          var q = col[id] || 0;
          var s = BY_ID.get(id);
          return s.name + (q - 1 > 1 ? ' x' + (q - 1) : '');
        });
        lines.push('· ' + g.cat.name + ': ' + names.join(', '));
      });
    } else {
      var missing = STICKERS.filter(function (s) { return (col[s.id] || 0) < 1; });
      lines.push('ME FALTAN (' + missing.length + ')');
      if (!missing.length) lines.push('· ningún, álbum completo!');
      groupByCategory(missing.map(function (s) { return s.id; })).forEach(function (g) {
        lines.push('· ' + g.cat.name + ': ' + g.ids.map(function (id) { return BY_ID.get(id).name; }).join(', '));
      });
    }

    return lines.join('\n');
  }

  function shareText(kind) {
    var text = buildListText(kind);
    if (navigator.share) {
      navigator.share({ text: text }).catch(function () {
        copyText(text);
      });
      return;
    }
    copyText(text);
  }

  function copyText(text, msg) {
    var okMsg = msg || L.shareCopied;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast(okMsg, false, 2500);
      }).catch(function () {
        toast(L.shareFail, true, 3000);
      });
      return;
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast(okMsg, false, 2500);
    } catch (e) {
      toast(L.shareFail, true, 3000);
    }
  }

  /* ---------------------------------------------------------------------------
     Troco por QR / ligazón (bitset anónimo: sen nomes nin IDs)
     --------------------------------------------------------------------------- */

  var qrStream = null;
  var qrRaf = 0;
  var lastMatch = null;

  function b64uEncode(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64uDecode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function encodeTradeCode() {
    var col = coll();
    var byteLen = Math.ceil(TOTAL / 8);
    var buf = new Uint8Array(byteLen * 2);
    for (var i = 0; i < TOTAL; i++) {
      var q = col[STICKERS[i].id] || 0;
      if (q >= 1) buf[i >> 3] |= (1 << (i & 7));
      if (q >= 2) buf[byteLen + (i >> 3)] |= (1 << (i & 7));
    }
    return 'C1.' + TOTAL + '.' + b64uEncode(buf);
  }

  function tradeURL() {
    var base = location.href.split('#')[0];
    return base + '#x=' + encodeTradeCode();
  }

  function decodeTradeCode(raw) {
    var txt = String(raw || '').trim();
    var m = txt.match(/C1\.\d+\.[A-Za-z0-9_-]+/);
    if (!m) return { error: L.badCode };
    var parts = m[0].split('.');
    var count = parseInt(parts[1], 10);
    if (count !== TOTAL) return { error: L.wrongCatalog };
    try {
      var buf = b64uDecode(parts[2]);
      var byteLen = Math.ceil(TOTAL / 8);
      if (buf.length !== byteLen * 2) return { error: L.badCode };
      var owned = new Uint8Array(TOTAL);
      var dups = new Uint8Array(TOTAL);
      for (var i = 0; i < TOTAL; i++) {
        owned[i] = (buf[i >> 3] >> (i & 7)) & 1;
        dups[i] = (buf[byteLen + (i >> 3)] >> (i & 7)) & 1;
      }
      return { owned: owned, dups: dups };
    } catch (e) {
      return { error: L.badCode };
    }
  }

  function computeTradeMatch(other) {
    var col = coll();
    var give = [];
    var get = [];
    for (var i = 0; i < TOTAL; i++) {
      var s = STICKERS[i];
      var q = col[s.id] || 0;
      if (q >= 2 && !other.owned[i]) give.push(s.id);
      if (q === 0 && other.dups[i]) get.push(s.id);
    }
    return { give: give, get: get };
  }

  function stopQrCamera() {
    if (qrRaf) { cancelAnimationFrame(qrRaf); qrRaf = 0; }
    if (qrStream) {
      qrStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* noop */ } });
      qrStream = null;
    }
  }

  function openTradeSheet(mode) {
    stopQrCamera();
    mode = mode === 'compare' ? 'compare' : 'my';
    var c = activeCollector();
    var st = statsOf(state.activeId);

    var seg = '<div class="qr-seg">' +
      '<button type="button" data-act="trade-mode" data-mode="my" class="' + (mode === 'my' ? 'is-on' : '') + '">' + esc(L.myQR) + '</button>' +
      '<button type="button" data-act="trade-mode" data-mode="compare" class="' + (mode === 'compare' ? 'is-on' : '') + '">' + esc(L.compareOther) + '</button>' +
      '</div>';

    var body = seg;
    if (mode === 'my') {
      var url = tradeURL();
      var svgQR = window.QR ? window.QR.svg(url, { margin: 3 }) : '';
      body +=
        '<div class="qr-box">' + svgQR + '</div>' +
        '<p class="qr-meta"><strong>' + esc(c ? c.name : '') + '</strong> · ' +
        st.owned + ' ' + L.owned.toLowerCase() + ' · ' +
        (TOTAL - st.owned) + ' ' + L.missing.toLowerCase() + ' · ' +
        st.dups + ' ' + L.dupsWord + '</p>' +
        '<div class="btn-row">' +
        '<button class="btn secondary" type="button" data-act="trade-copy-link">' + esc(L.copyLink) + '</button>' +
        '<button class="btn" type="button" data-act="trade-share-link">' + ICON.share + ' Compartir</button>' +
        '</div>' +
        '<p class="qr-note">O QR só leva os cromos que faltan e os repetidos: sen nomes nin datos persoais.</p>';
    } else {
      body +=
        '<div id="qr-cam-wrap"></div>' +
        '<button class="btn" type="button" id="qr-scan-btn" data-act="trade-scan">' + ICON.qr + ' ' + esc(L.scanCamera) + '</button>' +
        '<div style="height:14px"></div>' +
        '<label class="label" for="trade-paste">Ou pega a ligazón / código</label>' +
        '<input class="field" id="trade-paste" type="text" placeholder="' + esc(L.pastePlaceholder) + '" autocomplete="off" spellcheck="false">' +
        '<div style="height:10px"></div>' +
        '<button class="btn secondary" type="button" data-act="trade-compare-paste">' + esc(L.compareDo) + '</button>' +
        '<p class="qr-note">En iPhone podes escanear o QR directo coa cámara do móbil.</p>';
    }

    openSheet(L.tradeTitle, body);
  }

  function startQrCamera() {
    var wrap = document.getElementById('qr-cam-wrap');
    var btn = document.getElementById('qr-scan-btn');
    if (!wrap) return;

    if (!('BarcodeDetector' in window) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      wrap.innerHTML = '<p class="qr-note" style="margin:0 0 12px">' + esc(L.cameraNoSupport) + '</p>';
      return;
    }

    var detector;
    try {
      detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) {
      wrap.innerHTML = '<p class="qr-note" style="margin:0 0 12px">' + esc(L.cameraNoSupport) + '</p>';
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (stream) {
      qrStream = stream;
      wrap.innerHTML = '<div class="qr-cam"><video id="qr-video" playsinline muted autoplay></video></div>';
      var video = document.getElementById('qr-video');
      video.srcObject = stream;
      if (btn) {
        btn.dataset.act = 'trade-stop';
        btn.textContent = L.stopCamera;
      }

      function tick() {
        if (!qrStream || !video) return;
        if (video.readyState >= 2) {
          detector.detect(video).then(function (codes) {
            if (!qrStream) return;
            for (var i = 0; i < codes.length; i++) {
              var decoded = decodeTradeCode(codes[i].rawValue);
              if (!decoded.error) {
                stopQrCamera();
                openMatchResult(decoded);
                return;
              }
            }
            qrRaf = requestAnimationFrame(tick);
          }).catch(function () {
            if (qrStream) qrRaf = requestAnimationFrame(tick);
          });
        } else {
          qrRaf = requestAnimationFrame(tick);
        }
      }
      qrRaf = requestAnimationFrame(tick);
    }).catch(function () {
      wrap.innerHTML = '<p class="qr-note" style="margin:0 0 12px;color:var(--danger)">' + esc(L.cameraError) + '</p>';
    });
  }

  function renderMatchSection(title, ids, showQty) {
    if (!ids.length) return '';
    var col = coll();
    var groups = groupByCategory(ids);
    return '<div class="match-sec"><h4>' + esc(title) + ' (' + ids.length + ')</h4>' +
      groups.map(function (g) {
        var names = g.ids.map(function (id) {
          var s = BY_ID.get(id);
          var extra = showQty && (col[id] || 0) > 2 ? ' (x' + ((col[id] || 0) - 1) + ')' : '';
          return esc(s.name) + extra;
        }).join(', ');
        return '<div class="match-group"><strong>' + esc(g.cat.name) + '</strong><span>' + names + '</span></div>';
      }).join('') +
      '</div>';
  }

  function buildMatchText(match) {
    var c = activeCollector();
    var lines = ['Troco de cromos — ' + (c ? c.name : '')];
    lines.push('');
    lines.push('EU DOU (' + match.give.length + '):');
    if (!match.give.length) lines.push('· ningún');
    groupByCategory(match.give).forEach(function (g) {
      lines.push('· ' + g.cat.name + ': ' + g.ids.map(function (id) { return BY_ID.get(id).name; }).join(', '));
    });
    lines.push('');
    lines.push('ME DAN (' + match.get.length + '):');
    if (!match.get.length) lines.push('· ningún');
    groupByCategory(match.get).forEach(function (g) {
      lines.push('· ' + g.cat.name + ': ' + g.ids.map(function (id) { return BY_ID.get(id).name; }).join(', '));
    });
    return lines.join('\n');
  }

  function openMatchResult(other) {
    stopQrCamera();
    var match = computeTradeMatch(other);
    lastMatch = match;
    var c = activeCollector();

    var body =
      '<p class="hint" style="margin-top:0">Comparando co álbum de <strong>' + esc(c ? c.name : '') + '</strong>.</p>' +
      '<div class="match-summary">' +
      '<div class="match-kpi"><strong>' + match.give.length + '</strong><span>' + esc(L.tradeGive) + '</span></div>' +
      '<div class="match-kpi"><strong>' + match.get.length + '</strong><span>' + esc(L.tradeGet) + '</span></div>' +
      '</div>';

    if (!match.give.length && !match.get.length) {
      body += '<p class="hint">' + esc(L.tradeNothing) + '</p>';
    } else {
      body += renderMatchSection(L.tradeGive, match.give, true);
      body += renderMatchSection(L.tradeGet, match.get, false);
      body += '<div style="height:14px"></div>' +
        '<button class="btn secondary" type="button" data-act="trade-copy-match">' + ICON.share + ' ' + esc(L.tradeCopy) + '</button>';
    }

    openSheet('Resultado do troco', body);
  }

  function checkHashTrade() {
    var h = location.hash || '';
    if (h.indexOf('x=') === -1) return;
    if (!state || !state.collectors || !state.collectors.length) return;
    var decoded = decodeTradeCode(h);
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* noop */ }
    if (decoded.error) {
      toast(decoded.error, true, 3000);
      return;
    }
    openMatchResult(decoded);
  }

  /* ---------------------------------------------------------------------------
     Accións
     --------------------------------------------------------------------------- */

  function handleAction(act, el) {
    switch (act) {
      case 'tab':
        ui.tab = el.dataset.tab;
        ui.catId = null;
        ui.pageIdx = null;
        ui.searchOpen = false;
        ui.query = '';
        render();
        viewEl.scrollTop = 0;
        break;

      case 'cat':
        openCategory(el.dataset.cat);
        viewEl.scrollTop = 0;
        break;

      case 'back':
        goAlbum();
        break;

      case 'page':
        ui.pageIdx = Number(el.dataset.page);
        render();
        break;

      case 'toggle':
        toggle(el.dataset.id);
        render();
        break;

      case 'inc':
        step(el.dataset.id, 1);
        render();
        break;

      case 'dec':
        step(el.dataset.id, -1);
        render();
        break;

      case 'undo':
        undo();
        render();
        break;

      case 'acc':
        var key = el.dataset.acc;
        if (ui.open.has(key)) ui.open.delete(key);
        else ui.open.add(key);
        render();
        break;

      case 'search-open':
        ui.searchOpen = true;
        ui.query = '';
        render();
        break;

      case 'search-close':
        ui.searchOpen = false;
        ui.query = '';
        render();
        break;

      case 'collectors':
        openCollectorsSheet();
        break;

      case 'pick-collector':
        state.activeId = el.dataset.id;
        undoStack = [];
        save();
        closeSheetIfAny();
        render();
        break;

      case 'add-collector':
        openNameSheet('add');
        break;

      case 'rename-collector':
        openNameSheet('edit', el.dataset.id);
        break;

      case 'pick-color': {
        var chosen = el.dataset.color;
        if (!hexRgb(chosen)) break;
        sheetColor = chosen;
        var swatches = el.parentNode;
        if (swatches) {
          Array.prototype.forEach.call(swatches.children, function (b) {
            b.setAttribute('aria-pressed', b === el ? 'true' : 'false');
          });
        }
        var preview = document.getElementById('name-preview');
        if (preview) {
          preview.style.background = chosen;
          preview.style.color = contrastInk(chosen);
        }
        break;
      }

      case 'theme': {
        var wanted = el.dataset.theme === 'dark' ? 'dark' : 'light';
        if (state.theme === wanted) break;
        state.theme = wanted;
        save();
        applyTheme();
        var seg = el.closest ? el.closest('.seg') : null;
        if (seg) {
          Array.prototype.forEach.call(seg.querySelectorAll('[data-act="theme"]'), function (b) {
            b.setAttribute('aria-pressed', b.dataset.theme === wanted ? 'true' : 'false');
          });
        }
        break;
      }

      case 'page-prev':
        stepPage(-1);
        break;

      case 'page-next':
        stepPage(1);
        break;

      case 'save-name': {
        var input = document.getElementById('name-input');
        var name = input ? input.value.trim() : '';
        if (!name) { if (input) input.focus(); break; }
        if (el.dataset.mode === 'edit') {
          var target = state.collectors.filter(function (c) { return c.id === el.dataset.id; })[0];
          if (target) {
            target.name = name;
            target.color = sheetColor;
          }
          lastTone = null;
          save();
          closeSheetIfAny();
          render();
        } else {
          var c = { id: uid('c'), name: name, color: sheetColor };
          state.collectors.push(c);
          state.collections[c.id] = {};
          state.activeId = c.id;
          undoStack = [];
          lastTone = null;
          save();
          closeSheetIfAny();
          render();
        }
        break;
      }

      case 'delete-collector':
        var del = el.dataset.id;
        var who = state.collectors.filter(function (c) { return c.id === del; })[0];
        if (state.collectors.length <= 1) {
          confirmSheet('Este é o único álbum. Se o borras, quedas sen nada. Continuar?', 'do-delete-collector', 'Borrar', true);
          window.__pendingDelete = del;
          break;
        }
        confirmSheet('Borrar o álbum de ' + (who ? who.name : '') + '? Non se pode desfacer.', 'do-delete-collector', 'Borrar', true);
        window.__pendingDelete = del;
        break;

      case 'do-delete-collector': {
        var id = window.__pendingDelete;
        window.__pendingDelete = null;
        state.collectors = state.collectors.filter(function (c) { return c.id !== id; });
        delete state.collections[id];
        state.activeId = state.collectors[0] ? state.collectors[0].id : null;
        undoStack = [];
        save();
        closeSheetIfAny();
        render();
        break;
      }

      case 'settings':
        openSettings();
        break;

      case 'sheet-close':
        closeSheetIfAny();
        if (!state.collectors.length) render();
        break;

      case 'backup-export':
        exportBackup();
        break;

      case 'backup-import':
        var picker = document.getElementById('backup-file');
        if (picker) picker.click();
        break;

      case 'do-merge':
        if (pendingMerge) applyMerge(pendingMerge);
        pendingMerge = null;
        break;

      case 'share-dups':
        shareText('dups');
        break;

      case 'share-missing':
        shareText('missing');
        break;

      case 'trade-qr':
        openTradeSheet(el.dataset.mode || 'my');
        break;

      case 'trade-mode':
        openTradeSheet(el.dataset.mode || 'my');
        break;

      case 'trade-copy-link':
        copyText(tradeURL(), L.linkCopied);
        break;

      case 'trade-share-link': {
        var u = tradeURL();
        if (navigator.share) {
          navigator.share({ url: u, title: 'Troco de cromos · U.D. Barbadás' }).catch(function () {
            copyText(u, L.linkCopied);
          });
        } else {
          copyText(u, L.linkCopied);
        }
        break;
      }

      case 'trade-scan':
        startQrCamera();
        break;

      case 'trade-stop':
        openTradeSheet('compare');
        break;

      case 'trade-compare-paste': {
        var pasteEl = document.getElementById('trade-paste');
        var dec = decodeTradeCode(pasteEl ? pasteEl.value : '');
        if (dec.error) {
          toast(dec.error, true, 2800);
        } else {
          openMatchResult(dec);
        }
        break;
      }

      case 'trade-copy-match':
        if (lastMatch) {
          copyText(buildMatchText(lastMatch), L.tradeCopied);
        }
        break;

      case 'clean-orphans':
        orphansOf(state.activeId).forEach(function (id) {
          delete state.collections[state.activeId][id];
        });
        save();
        render();
        break;

      case 'reset-collector':
        confirmSheet('Baleirar o álbum de ' + (activeCollector() ? activeCollector().name : '') +
          '? Perderás todos os cromos marcados.', 'do-reset', 'Baleirar', true);
        break;

      case 'apply-seed': {
        var seedMap = seedCounts();
        if (!seedMap) { toast('Non hai datos do Excel dispoñibles.', true); break; }
        var seedTotal = Object.keys(seedMap).length;
        confirmSheet('Substituír o álbum de ' + (activeCollector() ? activeCollector().name : '') +
          ' polo estado do Excel (' + seedTotal + ' cromos pegados)? Perderás as marcas actuais.',
          'do-apply-seed', 'Substituír', false);
        break;
      }

      case 'do-apply-seed':
        state.collections[state.activeId] = cloneCounts(seedCounts() || {});
        undoStack = [];
        save();
        closeSheetIfAny();
        render();
        toast('Cromos do Excel cargados', false, 2500);
        break;

      case 'do-reset':
        state.collections[state.activeId] = {};
        undoStack = [];
        save();
        closeSheetIfAny();
        render();
        break;

      case 'wipe':
        confirmSheet('Borrar TODOS os datos deste dispositivo (todos os álbums)?', 'do-wipe', 'Borrar todo', true);
        break;

      case 'do-wipe':
        state = freshState();
        undoStack = [];
        ui.compact = false;
        lastTone = null;
        try {
          localStorage.removeItem(TONE_KEY);
          localStorage.removeItem(CAT_KEY);
          localStorage.removeItem(STORE_KEY);
        } catch (e) { /* noop */ }
        initCatalog(null);
        closeSheetIfAny();
        render();
        break;

      case 'create-collector': {
        var field = document.getElementById('new-name');
        var value = field ? field.value.trim() : '';
        if (!value) { if (field) field.focus(); break; }
        var nc = { id: uid('c'), name: value, color: paletteColor(state.collectors.length) };
        state.collectors.push(nc);
        state.collections[nc.id] = {};
        state.activeId = nc.id;
        lastTone = null;
        save();
        closeSheetIfAny();
        render();
        break;
      }
    }
  }

  /* ---------------------------------------------------------------------------
     Eventos
     --------------------------------------------------------------------------- */

  function boot() {
    viewEl = document.getElementById('view');
    topbarEl = document.getElementById('topbar');
    tabsEl = document.getElementById('tabs');
    toastEl = document.getElementById('toast');
    sheetRoot = document.getElementById('sheet-root');

    state = loadState();
    save();

    document.addEventListener('click', function (ev) {
      var el = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!el) return;
      ev.preventDefault();
      handleAction(el.dataset.act, el);
    });

    document.addEventListener('input', function (ev) {
      if (ev.target && ev.target.id === 'search-input') {
        ui.query = ev.target.value;
        var scroll = 0;
        renderView();
        viewEl.scrollTop = scroll;
        return;
      }
      if (ev.target && ev.target.id === 'name-input') {
        var preview = document.getElementById('name-preview');
        if (preview) {
          var initial = ev.target.value.trim().charAt(0).toUpperCase();
          preview.textContent = initial || '?';
        }
      }
    });

    document.addEventListener('change', function (ev) {
      if (ev.target && ev.target.id === 'backup-file') {
        var file = ev.target.files && ev.target.files[0];
        if (file) importBackup(file);
        ev.target.value = '';
        return;
      }
      if (ev.target && ev.target.id === 'collector-select') {
        state.activeId = ev.target.value;
        undoStack = [];
        save();
        render();
      }
    });

    /* Se os chips non collen, select. Se cambia o ancho, volve probar. */
    window.addEventListener('resize', function () {
      if (ui.compact) {
        ui.compact = false;
        renderTopbar();
      } else {
        measureChips();
      }
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (sheetRoot.innerHTML.trim()) { closeSheetIfAny(); return; }
        if (ui.searchOpen) { ui.searchOpen = false; ui.query = ''; render(); }
      }
      if (ev.key === 'Enter' && ev.target) {
        if (ev.target.id === 'name-input') {
          var btn = document.querySelector('[data-act="save-name"]');
          if (btn) btn.click();
        } else if (ev.target.id === 'new-name') {
          var b2 = document.querySelector('[data-act="create-collector"]');
          if (b2) b2.click();
        }
      }
    });

    window.addEventListener('popstate', function (ev) {
      var st = ev.state;
      if (st && st.catId) {
        ui.catId = st.catId;
        ui.searchOpen = false;
      } else {
        ui.catId = null;
      }
      ui.pageIdx = null;
      render();
    });

    // input de ficheiro para restaurar copia
    var hidden = document.createElement('input');
    hidden.type = 'file';
    hidden.id = 'backup-file';
    hidden.accept = 'application/json,.json';
    hidden.style.display = 'none';
    document.body.appendChild(hidden);

    try { history.replaceState({ catId: null }, ''); } catch (e) { /* noop */ }

    render();
    checkHashTrade();
    window.addEventListener('hashchange', checkHashTrade);

    // Swipe horizontal discreto entre páxinas (evita o bordo esquerdo de iOS e .chips)
    var swX = 0, swY = 0, swT = 0, swOk = false;
    viewEl.addEventListener('touchstart', function (ev) {
      swOk = false;
      if (ui.tab !== 'album' || !ui.catId || ui.searchOpen) return;
      if (sheetRoot && sheetRoot.innerHTML.trim()) return;
      if (!ev.touches || ev.touches.length !== 1) return;
      if (ev.target && ev.target.closest && ev.target.closest('.chips')) return;
      var t = ev.touches[0];
      if (t.clientX < 24) return;
      swX = t.clientX;
      swY = t.clientY;
      swT = Date.now();
      swOk = true;
    }, { passive: true });

    viewEl.addEventListener('touchend', function (ev) {
      if (!swOk || !ev.changedTouches || !ev.changedTouches.length) return;
      swOk = false;
      var t = ev.changedTouches[0];
      var dx = t.clientX - swX;
      var dy = t.clientY - swY;
      if (Date.now() - swT > 600) return;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        stepPage(dx < 0 ? 1 : -1);
      }
    }, { passive: true });

    // service worker (só con http/https)
    if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* noop */ });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
