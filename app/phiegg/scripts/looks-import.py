#!/usr/bin/env python3
"""New flagship renders into the shop, seeded and idempotent.

  python3 scripts/looks-import.py        # then python3 scripts/item-colors.py && node scripts/items.mjs

Reads the full-size renders dropped in art/looks/ (LS-STYLE-NN-LOOK-MM-FRONT.png, LS-STYLE-NN-LOOK-ORIGINAL-FRONT.png;
kept out of public/ so builds stay small), crops each to the figure, squares and shrinks it to the shop size (480 x 480
webp, like items/ls/sm) in public/items/ls/sm/LS-STYLE-NN/, and adds the looks and their pool to src/data/ls.json
(Lora's Spark). Style 05 is the Gilded Zip line: sculpted saffron-gold dresses with a front zip and thigh boots.
"""
import glob, json, os, re
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'art', 'looks'); PUB = os.path.join(ROOT, 'public'); DATA = os.path.join(ROOT, 'src', 'data')
STYLES = {'05': {'name': 'Style 05 · The Gilded Zip', 'season': 'Summer Show 2027', 'desc': 'Sculpted saffron-gold dresses with a front zip and thigh boots, from a mini to a pleated train. Cut for avatar and street.',
  'looks': {
    '00': ('Gilded Zip Original', ['Sculpted halter bodice', 'Front zip', 'Hourglass skirt', 'Thigh boots'], 'Legendary'),
    '01': ('Gilded Zip Mini', ['Sculpted halter bodice', 'Front zip', 'Bubble mini skirt', 'Ankle boots'], 'Rare'),
    '02': ('Gilded Hourglass', ['Sculpted halter bodice', 'Front zip', 'Hourglass skirt', 'Knee boots'], 'Rare'),
    '03': ('Gilded Bell', ['Sculpted halter bodice', 'Front zip', 'Bell skirt', 'Ankle boots'], 'Epic'),
    '04': ('Gilded Cocoon', ['Sculpted halter bodice', 'Front zip', 'Cocoon skirt', 'Ankle boots'], 'Epic'),
    '05': ('Gilded Thigh-High', ['Sculpted halter bodice', 'Front zip', 'Mini skirt', 'Thigh boots'], 'Common'),
    '06': ('Gilded Ruffle', ['Sculpted halter bodice', 'Front zip', 'Ruffle mini skirt', 'Knee boots'], 'Common'),
    '07': ('Gilded Fan', ['Sculpted halter bodice', 'Front zip', 'Fan pleat skirt', 'Ankle boots'], 'Epic'),
    '08': ('Gilded Pleated Train', ['Sculpted halter bodice', 'Front zip', 'Pleated train skirt', 'Ankle boots'], 'Legendary'),
  }}}
PRICE = {'Common': (6900, 250), 'Rare': (21500, 100), 'Epic': (64800, 25), 'Legendary': (188000, 5)}

def render(src, dst):
  im = Image.open(src).convert('RGBA'); box = im.split()[-1].getbbox() or (0, 0, *im.size)
  im = im.crop(box); w, h = im.size; side = int(max(w, h) * 1.08)
  canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0)); canvas.paste(im, ((side - w) // 2, (side - h) // 2))
  os.makedirs(os.path.dirname(dst), exist_ok=True); canvas.resize((480, 480), Image.LANCZOS).save(dst, 'WEBP', quality=82)

def main():
  ls_f = os.path.join(DATA, 'ls.json'); ls = json.load(open(ls_f, encoding='utf8')); pretty = '\n  "' in open(ls_f, encoding='utf8').read(300)
  added = 0
  for f in sorted(glob.glob(os.path.join(SRC, 'LS-STYLE-*-FRONT.png'))):
    m = re.match(r'LS-STYLE-(\d+)-LOOK-(\d+|ORIGINAL)-FRONT\.png$', os.path.basename(f))
    if not m or m.group(1) not in STYLES: continue
    st, n = m.group(1), ('00' if m.group(2) == 'ORIGINAL' else m.group(2).zfill(2)); S = STYLES[st]
    if n not in S['looks']: continue
    rel = 'items/ls/sm/LS-STYLE-%s/LOOK-%s-FRONT.webp' % (st, n); dst = os.path.join(PUB, rel)
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(f): render(f, dst)
    name, garments, rarity = S['looks'][n]; usd, edition = PRICE[rarity]; k = int(n)
    look = {'id': 'ls-s%s-%s' % (st, n), 'n': n, 'storeId': ls['store']['id'], 'name': name, 'colour': 'Gold', 'hex': '#d4a017', 'garments': garments, 'rarity': rarity,
            'edition': edition, 'minted': max(1, edition // (3 + k % 4)), 'owners': max(1, edition // (4 + k % 5)), 'usd': usd + k * 450, 'floor': int((usd + k * 450) * 0.92),
            'lastSale': int((usd + k * 450) * 1.02), 'change7d': round(4.5 + (k % 5) * 2.1, 1), 'mintDate': '2026-10-%02d' % (1 + k), 'views': {'FRONT': rel}}
    ls['looks'] = [x for x in ls['looks'] if x['id'] != look['id']] + [look]; added += 1
  for st, S in STYLES.items():
    ids = [x['id'] for x in ls['looks'] if x['id'].startswith('ls-s%s-' % st)]
    if ids:
      pool = {'id': 'style-%s' % st, 'storeId': ls['store']['id'], 'name': S['name'], 'season': S['season'], 'desc': S['desc'], 'lookIds': sorted(ids)}
      ls['pools'] = [p for p in ls['pools'] if p['id'] != pool['id']] + [pool]
  json.dump(ls, open(ls_f, 'w', encoding='utf8'), ensure_ascii=False, **({'indent': 2} if pretty else {'separators': (',', ':')}))
  print('looks-import: %d looks from art/looks into the flagship' % added)

if __name__ == '__main__': main()
