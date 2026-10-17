#!/usr/bin/env python3
"""Renders for the colours the flagship never rendered, seeded and idempotent.

  python3 scripts/recolour-renders.py          # then node scripts/items.mjs
  python3 scripts/recolour-renders.py --force

Store looks whose colour has no render near it (plum, sage, ink, moss, pearl, silver, graphite, chocolate, ivory,
onyx) used to show a swatch. This recolours two flagship dresses into each of those colours, every angle, by moving
only the garment pixels (the mannequin is grey and stays): hue to the target, saturation and value scaled so the
folds and shadows keep their shape. Writes public/items/gen/<colour>-<base>/<VIEW>.webp and src/data/recolours.json
({ looks: [{ id, name, hex, base, views }] }), which items.mjs adds to the renders it deals to looks by colour.
"""
import colorsys, json, os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PUB = os.path.join(ROOT, 'public'); DATA = os.path.join(ROOT, 'src', 'data')
FORCE = '--force' in sys.argv
TARGETS = {'Plum': '#6e2a5e', 'Sage': '#7a8a5e', 'Ink': '#1f2a44', 'Moss': '#5b6b3a', 'Pearl': '#e6e0d4', 'Silver': '#a8a9ad',
           'Graphite': '#4a4a4f', 'Chocolate': '#5a3a26', 'Ivory': '#efe9df', 'Onyx': '#24211f'}
BASES = ['ls-tutu-07', 'ls-tutu-04']  # Crimson Plunge, Lagoon Petal: saturated, one colour, clean folds

def hsv_arrays(rgb):
  r, g, b = [rgb[..., i] for i in range(3)]; mx = np.max(rgb, -1); mn = np.min(rgb, -1); d = mx - mn
  h = np.zeros_like(mx); nz = d > 1e-6
  rc = np.where(nz, (mx - r) / np.where(nz, d, 1), 0); gc = np.where(nz, (mx - g) / np.where(nz, d, 1), 0); bc = np.where(nz, (mx - b) / np.where(nz, d, 1), 0)
  h = np.where(r == mx, bc - gc, np.where(g == mx, 2 + rc - bc, 4 + gc - rc)); h = (h / 6) % 1
  s = np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0)
  return h, s, mx

def hsv_to_rgb(h, s, v):
  i = np.floor(h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6); p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f))
  r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
  return np.stack([r, g, b], -1)

def recolour(src, target):
  im = Image.open(src).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255; rgb, alpha = a[..., :3], a[..., 3]
  h, s, v = hsv_arrays(rgb)
  mask = (alpha > 0.5) & (s > 0.16) & (v > 0.12)
  if mask.sum() < 50: return im
  soft = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
  th, ts, tv = colorsys.rgb_to_hsv(*[int(target[i:i + 2], 16) / 255 for i in (1, 3, 5)])
  ms, mv = float(s[mask].mean()), float(v[mask].mean())
  ns = np.clip(s / max(ms, 1e-3) * ts, 0, 1)
  # keep the folds: value relative to the garment mean, centred on the target value (a narrower swing for pale colours)
  swing = 0.55 if tv > 0.8 else 1.0
  nv = np.clip(tv + (v - mv) * swing * (tv / max(mv, 1e-3) if tv < 0.5 else 1), 0, 1)
  out = hsv_to_rgb(np.full_like(h, th), ns, nv)
  mixed = rgb * (1 - soft[..., None]) + out * soft[..., None]
  res = np.concatenate([mixed, alpha[..., None]], -1)
  return Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8), 'RGBA')

def main():
  ls = json.load(open(os.path.join(DATA, 'ls.json'), encoding='utf8')); looks = {l['id']: l for l in ls['looks']}
  out = []
  for name, hexv in TARGETS.items():
    for base in BASES:
      l = looks.get(base)
      if not l or not l.get('views'): continue
      key = '%s-%s' % (name.lower(), base.replace('ls-', '')); views = {}
      for view, path in l['views'].items():
        rel = 'items/gen/%s/%s.webp' % (key, view); dst = os.path.join(PUB, rel)
        if FORCE or not os.path.exists(dst):
          os.makedirs(os.path.dirname(dst), exist_ok=True); recolour(os.path.join(PUB, path), hexv).save(dst, 'WEBP', quality=82)
        views[view] = rel
      out.append({'id': 'rc_' + key.replace('-', '_'), 'name': name, 'hex': hexv, 'base': base, 'views': views})
  json.dump({'looks': out}, open(os.path.join(DATA, 'recolours.json'), 'w', encoding='utf8'), indent=1)
  print('recolour-renders: %d renders in %d colours, %d views' % (len(out), len(TARGETS), sum(len(x['views']) for x in out)))

if __name__ == '__main__': main()
