#!/usr/bin/env python3
"""
Cambia a frase de acceso da app.

Uso:
    python tools/gate.py "a miña frase"
    python tools/gate.py --off        # quita a porta de acceso

Que é isto: un filtro, NON seguridade. O repositorio é público, así que o
código (e o hash) son visibles. Serve para que non entre calquera que teña
o link, e para que os buscadores non o indexen (hai robots.txt + noindex).
Os datos dos nenos non están no servidor: viven no localStorage de cada
dispositivo.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"


def gate_hash(text):
    """Mesmo algoritmo que o navegador (djb2 xor, 32 bits sen signo)."""
    h = 5381
    for ch in text.strip():
        h = ((h * 33) ^ ord(ch)) & 0xFFFFFFFF
    return str(h)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)

    phrase = sys.argv[1]
    value = "" if phrase in ("--off", "-off", "off", "") else gate_hash(phrase)

    html = INDEX.read_text(encoding="utf-8")
    new, count = re.subn(r"var GATE = '[^']*';", "var GATE = '%s';" % value, html, count=1)
    if count != 1:
        sys.exit("Non atopei a liña 'var GATE = ...' en index.html")

    INDEX.write_text(new, encoding="utf-8")
    print("OK  %s" % ("porta de acceso desactivada" if not value else "frase de acceso actualizada"))
    if value:
        print("    hash: %s" % value)
        print("    Cando cambies o ficheiro, sube o cambio (o hash vai en index.html).")


if __name__ == "__main__":
    main()
