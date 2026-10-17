#!/usr/bin/env python3
# Usage: python3 scripts/portraits.py <sheet 0..N> … then python3 scripts/portraits.py -1 to write the index (npm run data:portraits).
# Beta portraits (Bold Pups Space Club) → sprite sheets for the web + their colours.
# Reads art/clubs/<SET>/*.png (2048² each; kept out of public/ so builds stay small), writes public/portraits/sheet-NN.webp (8×8 cells of 192px) and
# src/data/portraits.json: { cell, cols, sheets: [file], portraits: [{ id, n, sheet, index, bg, outfit }] }.
import json, os, sys, colorsys
from PIL import Image
APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); SRC = os.path.join(APP, 'art', 'clubs'); OUT = os.path.join(APP, 'public', 'portraits')
CELL, COLS = 192, 8; PER = COLS * COLS
os.makedirs(OUT, exist_ok=True)
files = sorted({f: os.path.join(d, f) for d, _, fs in os.walk(SRC) for f in fs if f.lower().endswith('.png')}.items())
set_of = lambda path: os.path.basename(os.path.dirname(path)).replace('-', ' ').title().replace(' Bpsc', ' (BPSC)')
hexof = lambda c: '#%02x%02x%02x' % tuple(int(x) for x in c[:3])
def avg(px):
    px = [p for p in px if p[3] > 200] or px
    return tuple(sum(p[i] for p in px) / len(px) for i in range(3))
only = int(sys.argv[1]) if len(sys.argv) > 1 else None
if only == -1:
    meta = []; sheets = []
    for k in range((len(files) + PER - 1) // PER):
        part = json.load(open(os.path.join(OUT, 'meta-%02d.json' % k))); meta += part; sheets.append('sheet-%02d.webp' % k)
    json.dump({ 'cell': CELL, 'cols': COLS, 'sheets': sheets, 'portraits': meta }, open(os.path.join(APP, 'src', 'data', 'portraits.json'), 'w'))
    print('done', len(meta), 'portraits in', len(sheets), 'sheets'); sys.exit(0)
meta = []; sheets = []
for s in range(0, len(files), PER):
    if only is not None and s // PER != only: continue
    meta = []
    k = s // PER; sheet = Image.new('RGBA', (CELL * COLS, CELL * COLS), (0, 0, 0, 0))
    for i, (name, path) in enumerate(files[s:s + PER]):
        im = Image.open(path).convert('RGBA'); small = im.resize((CELL, CELL), Image.LANCZOS)
        sheet.paste(small, ((i % COLS) * CELL, (i // COLS) * CELL))
        w = small.width; probe = small.resize((48, 48))
        edge = [probe.getpixel((x, y)) for x in range(48) for y in (0, 1, 2)] + [probe.getpixel((x, y)) for y in range(48) for x in (0, 1, 46, 47)]
        outfit = [probe.getpixel((x, y)) for x in range(12, 36) for y in range(42, 48)]
        n = int(''.join(ch for ch in name if ch.isdigit()) or 0)
        meta.append({ 'id': 'bpsc-%d' % n, 'n': n, 'set': set_of(path), 'sheet': k, 'index': i, 'bg': hexof(avg(edge)), 'outfit': hexof(avg(outfit)) })
    f = 'sheet-%02d.webp' % k; sheet.save(os.path.join(OUT, f), 'WEBP', quality=78, method=4); sheets.append(f)
    json.dump(meta, open(os.path.join(OUT, 'meta-%02d.json' % k), 'w'))
    print('sheet', k, flush=True)
print('files', len(files))
