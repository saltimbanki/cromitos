#!/usr/bin/env python3
"""
Converte o Excel mestre do album (U.D. Barbadas) en data/catalog.json + data/catalog.js.

O Excel e a FONTE DE VERDADE: este script non modifica nin reescribe o .xlsx.
So le e xera o catalogo que consume a app.

Uso:
    python tools/generate_catalog.py
    python tools/generate_catalog.py --xlsx data/outro-album.xlsx

Regras (acordadas co cliente):
  - Non hai numeracion de cromos nin de paxinas no album fisico.
  - A identidade dun cromo e: categoria + paxina + nome.
  - A columna A ("N") do Excel e so orde interno: gárdase como referencia, nunca se mostra.
  - As columnas F ("Estado") e G ("Repetidos") son o estado REAL do album de Thiago
    no momento de xerar: van a data/seed.js para que a app arranque con eses cromos
    xa pegados. Non se escriben nunca no Excel.
"""

import argparse
import json
import re
import sys
import unicodedata
import zipfile
from datetime import date, datetime, timezone
from pathlib import Path
import xml.etree.ElementTree as ET

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
RELNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XLSX = ROOT / "data" / "control-coleccion-cromos-v2.xlsx"
OUT_JSON = ROOT / "data" / "catalog.json"
OUT_JS = ROOT / "data" / "catalog.js"
OUT_SEED = ROOT / "data" / "seed.js"
PRIVATE_DIR = ROOT / "private"
OUT_BACKUP = PRIVATE_DIR / "cromos-thiago.json"

# Album fisico ao que corresponde o estado do Excel.
SEED_ALBUM = "Thiago"
SEED_COLORS = {"Thiago": "#0f7b5f", "Enzo": "#0d9488"}

JS_HEADER = "/* Xerado automaticamente por tools/generate_catalog.py. NON editar a man. */\n"


def col_of(ref):
    return re.match(r"([A-Z]+)", ref).group(1)


def read_cells(row):
    out = {}
    for c in row.findall("{%s}c" % NS):
        col = col_of(c.get("r"))
        t = c.get("t")
        v = c.find("{%s}v" % NS)
        inline = c.find("{%s}is" % NS)
        if t == "inlineStr" and inline is not None:
            out[col] = "".join(x.text or "" for x in inline.iter("{%s}t" % NS))
        elif t == "s" and v is not None:
            out[col] = SHARED[int(v.text)]
        else:
            out[col] = v.text if v is not None else None
    return out


def first_sheet(z):
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    relmap = {r.get("Id"): r.get("Target") for r in rels}
    sheet = wb.find("{%s}sheets" % NS)[0]
    target = relmap[sheet.get(RELNS)].lstrip("/")
    if not target.startswith("xl/"):
        target = "xl/" + target
    return sheet.get("name"), target


def slug(text):
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "sen-nome"


def parse_page(label):
    """'Pag. 2 (Derecha)' -> (2, 'Derecha'). Tolerante a variantes."""
    if not label:
        return 1, ""
    m = re.search(r"(\d+)", label)
    idx = int(m.group(1)) if m else 1
    side = ""
    for known in ("Izquierda", "Derecha", "Esquerda", "Dereita"):
        if known.lower() in label.lower():
            side = known
            break
    return idx, side


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", default=str(DEFAULT_XLSX))
    ap.add_argument(
        "--with-seed",
        action="store_true",
        help="Inclúe o estado real do Excel (datos persoais de Thiago) en data/seed.js "
        "e xera private/cromos-thiago.json para importar na app. "
        "NUNCA se debe subir isto a GitHub.",
    )
    args = ap.parse_args()

    xlsx = Path(args.xlsx)
    if not xlsx.exists():
        sys.exit("Non existe o ficheiro: %s" % xlsx)

    z = zipfile.ZipFile(xlsx)
    global SHARED
    SHARED = []
    if "xl/sharedStrings.xml" in z.namelist():
        ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
        SHARED = [
            "".join(t.text or "" for t in si.iter("{%s}t" % NS))
            for si in ss.findall("{%s}si" % NS)
        ]

    sheet_name, sheet_path = first_sheet(z)
    sh = ET.fromstring(z.read(sheet_path))

    rows = []
    for row in sh.iter("{%s}row" % NS):
        rn = int(row.get("r"))
        if rn < 3:
            continue
        c = read_cells(row)
        numero = (c.get("A") or "").strip()
        cat = (c.get("B") or "").strip()
        name = (c.get("D") or "").strip()
        if not numero and not name:
            continue
        if not cat or not name:
            sys.exit("Fila %d incompleta (categoria=%r nome=%r)" % (rn, cat, name))
        page_idx, side = parse_page((c.get("C") or "").strip())
        estado = (c.get("F") or "").strip()
        try:
            repetidos = int((c.get("G") or "0").strip() or 0)
        except ValueError:
            sys.exit("Fila %d: 'Repetidos' non é un número (%r)" % (rn, c.get("G")))
        if repetidos < 0:
            sys.exit("Fila %d: 'Repetidos' non pode ser negativo" % rn)
        rows.append(
            {
                "n": int(numero) if numero.isdigit() else None,
                "row": rn,
                "cat": cat,
                "page": page_idx,
                "side": side,
                "pageLabel": (c.get("C") or "").strip(),
                "name": name,
                "role": (c.get("E") or "").strip(),
                "estado": estado,
                "repetidos": repetidos,
            }
        )

    # ---- validación: a identidade ten que ser única ----
    seen = {}
    for r in rows:
        key = (r["cat"], r["page"], r["name"])
        if key in seen:
            sys.exit(
                "Identidade duplicada: %r aparece nas filas %d e %d. "
                "O album non se pode construir con ambigüidade." % (key, seen[key], r["row"])
            )
        seen[key] = r["row"]

    # ---- categorias na orde de aparición ----
    cats = []
    by_cat = {}
    for r in rows:
        if r["cat"] not in by_cat:
            by_cat[r["cat"]] = []
            cats.append({"id": slug(r["cat"]), "name": r["cat"], "count": 0, "pages": []})
        by_cat[r["cat"]].append(r)

    stickers = []
    cat_by_name = {c["name"]: c for c in cats}
    used_ids = {}

    # Estado real do album tal e como está no Excel (columna F + G).
    seed_counts = {}
    seed_owned = 0
    seed_reps = 0
    bad_estado = set()

    for r in rows:
        c = cat_by_name[r["cat"]]
        base = "%s|p%d|%s" % (c["id"], r["page"], slug(r["name"]))
        sid = base
        if sid in used_ids:
            used_ids[sid] += 1
            sid = "%s~%d" % (base, used_ids[sid])
        else:
            used_ids[sid] = 1

        est = r["estado"].strip().lower()
        if est.startswith("pegad"):
            seed_counts[sid] = 1 + r["repetidos"]
            seed_owned += 1
            seed_reps += r["repetidos"]
        elif est not in ("falta", "falta.", "", "non", "no"):
            bad_estado.add(r["estado"])

        sticker = {
            "id": sid,
            "name": r["name"],
            "cat": c["id"],
            "page": r["page"],
            "side": r["side"],
            "role": r["role"],
            "n": r["n"],  # referencia interna; a app non a mostra
        }
        stickers.append(sticker)

        page = next((p for p in c["pages"] if p["index"] == r["page"]), None)
        if page is None:
            page = {
                "index": r["page"],
                "label": r["pageLabel"],
                "side": r["side"],
                "stickers": [],
            }
            c["pages"].append(page)
        page["stickers"].append(sid)
        c["count"] += 1

    if bad_estado:
        sys.exit(
            "Valores descoñecidos na columna Estado: %s. "
            "Só se admiten 'Pegado' e 'Falta'." % ", ".join(sorted(repr(v) for v in bad_estado))
        )

    page_label = "Control de Colección"
    total_pages = sum(len(c["pages"]) for c in cats)

    catalog = {
        "meta": {
            "album": "Álbum de Cromos EDB / U.D. Barbadás",
            "source": xlsx.name,
            "sheet": sheet_name,
            "generated": date.today().isoformat(),
            "schema": 1,
            "stickers": len(stickers),
            "categories": len(cats),
            "pages": total_pages,
            "pagesLabel": page_label,
        },
        "categories": cats,
        "stickers": stickers,
    }

    OUT_JSON.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_JS.write_text(
        JS_HEADER
        + "window.__CATALOG__ = "
        + json.dumps(catalog, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )

    signature = "%d|%d|%s" % (len(stickers), len(cats), catalog["meta"]["generated"])
    seed = {
        "album": SEED_ALBUM,
        "source": xlsx.name,
        "generated": catalog["meta"]["generated"],
        "signature": signature,
        "counts": seed_counts,
    }

    PRIVATE_DIR.mkdir(parents=True, exist_ok=True)
    public_album = {
        "app": "cromos",
        "schema": 1,
        "catalog": signature,
        "exported": datetime.now(timezone.utc).isoformat(),
        "album": catalog["meta"]["album"],
        "catalogData": catalog,
        "data": {"collectors": [], "activeId": None, "collections": {}},
    }
    (PRIVATE_DIR / "album-barbadas.json").write_text(
        json.dumps(public_album, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    if args.with_seed:
        OUT_SEED.write_text(
            JS_HEADER
            + "window.__SEED__ = "
            + json.dumps(seed, ensure_ascii=False, separators=(",", ":"))
            + ";\n",
            encoding="utf-8",
        )
        backup = {
            "app": "cromos",
            "schema": 1,
            "catalog": signature,
            "exported": datetime.now(timezone.utc).isoformat(),
            "album": catalog["meta"]["album"],
            "catalogData": catalog,
            "data": {
                "collectors": [
                    {
                        "id": "c_thiago",
                        "name": SEED_ALBUM,
                        "color": SEED_COLORS.get(SEED_ALBUM, "#0f7b5f"),
                    },
                    {"id": "c_enzo", "name": "Enzo", "color": SEED_COLORS.get("Enzo", "#0d9488")},
                ],
                "activeId": "c_thiago",
                "collections": {"c_thiago": seed_counts, "c_enzo": {}},
            },
        }
        OUT_BACKUP.write_text(
            json.dumps(backup, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    else:
        OUT_SEED.write_text(JS_HEADER + "window.__SEED__ = null;\n", encoding="utf-8")

    print("OK  %s" % OUT_JSON)
    print("OK  %s" % OUT_JS)
    print("OK  %s" % OUT_SEED)
    print("    %d cromos · %d categorias · %d paxinas" % (len(stickers), len(cats), total_pages))
    print(
        "    Estado do Excel -> %s: %d pegados - %d repetidos"
        % (SEED_ALBUM, seed_owned, seed_reps)
    )

    if args.with_seed:
        print("OK  %s" % OUT_BACKUP)
        print()
        print("  !! DATOS PERSOAIS !!  data/seed.js e private/cromos-thiago.json")
        print("     conteñen a coleccion real. NON os subas a GitHub.")
        print("     Para o build publico: python tools/generate_catalog.py")
    else:
        print("    Build publico: sen datos persoais (todos arrancan baleiros).")
        print("    Os teus cromos: importa private/cromos-thiago.json na app.")

    print("\n    Categorias:")
    for c in cats:
        pages = ", ".join("p%d (%d)" % (p["index"], len(p["stickers"])) for p in c["pages"])
        print("      %-18s %3d  [%s]" % (c["name"], c["count"], pages))


if __name__ == "__main__":
    main()
