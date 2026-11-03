#!/usr/bin/env python3
"""Measure the garment colour of every look render (public/items/**.webp) so cards, sheets and backgrounds use the
colour the dress actually is. Writes src/data/itemColors.json: { "items/ls/sm/…webp": { hex, palette, share, light } }.

Pixels that are transparent, near-grey (the mannequin) or near-black/near-white shadow are ignored; the rest are
clustered (k-means, k=4) and the largest cluster is the garment colour. Deterministic, safe to re-run.
    python3 scripts/item-colors.py
"""
import colorsys, json, os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public')
OUT = os.path.join(ROOT, 'src', 'data', 'itemColors.json')

def pixels(path):
    im = Image.open(path).convert('RGBA'); im.thumbnail((112, 112))
    out = []
    for r, g, b, a in im.getdata():
        if a < 200: continue
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s < 0.16 or v < 0.14: continue          # mannequin grey, deep shadow
        if v > 0.97 and s < 0.25: continue         # specular highlights
        out.append((r, g, b))
    return out

def kmeans(px, k=4, rounds=12):
    if not px: return []
    px_sorted = sorted(px, key=lambda p: colorsys.rgb_to_hsv(*[c / 255 for c in p])[0])
    cents = [px_sorted[int(i * (len(px_sorted) - 1) / max(1, k - 1))] for i in range(k)]
    for _ in range(rounds):
        groups = [[] for _ in cents]
        for p in px:
            j = min(range(len(cents)), key=lambda i: sum((p[c] - cents[i][c]) ** 2 for c in range(3)))
            groups[j].append(p)
        cents = [tuple(sum(p[c] for p in g) // len(g) for c in range(3)) if g else cents[i] for i, g in enumerate(groups)]
    sized = sorted(((len(g), cents[i]) for i, g in enumerate(groups) if g), reverse=True)
    return [(n / len(px), c) for n, c in sized]

hexof = lambda c: '#%02x%02x%02x' % c
result = {}
for base, _, files in os.walk(os.path.join(PUB, 'items')):
    for f in sorted(files):
        if not f.lower().endswith(('.webp', '.png', '.jpg')): continue
        full = os.path.join(base, f); rel = os.path.relpath(full, PUB).replace(os.sep, '/')
        px = pixels(full); cl = kmeans(px)
        if not cl: continue
        share, main = cl[0]
        result[rel] = { 'hex': hexof(main), 'palette': [hexof(c) for _, c in cl[:3]], 'share': round(share, 2),
                        'light': round(colorsys.rgb_to_hls(*[c / 255 for c in main])[1], 2) }
json.dump(dict(sorted(result.items())), open(OUT, 'w'), indent=1)
print(f'item colours: {len(result)} renders measured → src/data/itemColors.json')
