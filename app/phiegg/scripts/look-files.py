#!/usr/bin/env python3
"""Lora's Spark look pictures on the standard layout, with the finished renders in place of the temporary ones.

    py -3 scripts/look-files.py

Reads ../../scripts/media/look-pictures.json, and ../../scripts/media/ls-looks.json for the products made from
finished single renders: their pictures, and their records in ls.json (and their pools) when not there yet. For every look in src/data/ls.json, every view (and opaque layer) goes
to public/look/<look-id>/<view>.webp (<view>-opaque.webp), a square on a clear background; a view listed under
`replace` is made from its finished render instead (cropped to the figure, centred). Every old path in src/data
(ls.json, stores.json, itemColors.json) is rewritten to the new one, so other stores that reuse the flagship's renders
follow. The old files are left where they are for the caller to move aside. Idempotent: a second run finds the new
paths and changes nothing.
"""
import colorsys, json, re
from copy import deepcopy
from pathlib import Path
from PIL import Image

APP = Path(__file__).resolve().parents[1]
DATA, PUBLIC = APP / 'src' / 'data', APP / 'public'
SPEC = json.loads((APP.parents[1] / 'scripts' / 'media' / 'look-pictures.json').read_text(encoding='utf8'))
SIDE, WORD = SPEC['side'], SPEC['views']
ROOTS = {'{DL}': str(Path.home() / 'Downloads'), '{D}': 'D:/Dowloads'}


def real(path):
    for k, v in ROOTS.items():
        path = path.replace(k, v)
    return Path(path)


def square(src, side=SIDE):
    """The figure cropped to what is drawn, centred on a clear square of `side` px."""
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox() or (0, 0, im.width, im.height)
    im = im.crop(box); im.thumbnail((round(side * 0.94), round(side * 0.94)), Image.LANCZOS)
    out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    out.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
    return out


def measured(src):
    """A render's own colour: the middle of its coloured pixels (the grey mannequin left out), as #rrggbb."""
    im = Image.open(src).convert('RGBA'); im.thumbnail((160, 160))
    raw = im.tobytes(); px = [tuple(raw[i:i + 3]) for i in range(0, len(raw), 4) if raw[i + 3] > 200]
    lit = [c for c in px if colorsys.rgb_to_hsv(*(v / 255 for v in c))[1] > 0.3] or px
    mid = [sorted(c[i] for c in lit)[len(lit) // 2] for i in range(3)]
    return '#%02x%02x%02x' % tuple(mid)


def family(hex_):
    """The colour family a hue belongs to (the shop's colour filter)."""
    h, s, v = colorsys.rgb_to_hsv(*(int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)))
    if s < 0.18:
        return 'neutral'
    for top, name in ((15, 'red'), (45, 'orange'), (70, 'yellow'), (160, 'green'), (200, 'teal'), (255, 'blue'), (290, 'violet'), (345, 'pink'), (361, 'red')):
        if h * 360 < top:
            return name


def dump(path, text, value):
    match text[:3]:
        case '{\n ' if text[3] != ' ': out = json.dumps(value, ensure_ascii=False, indent=1)
        case '{\n ': out = json.dumps(value, ensure_ascii=False, indent=2)
        case _: out = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    path.write_text(out + ('\n' if text.endswith('\n') else ''), encoding='utf8')


ls_path = DATA / 'ls.json'; ls_text = ls_path.read_text(encoding='utf8'); ls = json.loads(ls_text)

# ── Products made from finished single renders (scripts/media/ls-looks.json) ──
NEW = json.loads((APP.parents[1] / 'scripts' / 'media' / 'ls-looks.json').read_text(encoding='utf8'))


def add_looks(ls):
    """Each product's pictures (when missing) and, when it is not in the shop yet, its record and its pool's entry."""
    pools = {p['id']: p for p in ls['pools']}; have = {l['id'] for l in ls['looks']}; drawn = added = 0
    for p in NEW['pools']:
        if p['id'] not in pools:
            pools[p['id']] = {'id': p['id'], 'storeId': ls['store']['id'], 'name': p['name'], 'season': p['season'], 'desc': p['desc'], 'lookIds': []}
            ls['pools'].append(pools[p['id']])
    for e in NEW['looks']:
        views = {}
        for view, word in WORD.items():
            token = e.get('views', {}).get(view, view)
            src = real(NEW['root'] + '/' + e['files'].replace('{VIEW}', token)) if token else None
            if src is None or not src.exists():
                continue
            rel = f"look/{e['id']}/{word}.webp"; dst = PUBLIC / rel
            if not dst.exists():
                dst.parent.mkdir(parents=True, exist_ok=True); square(src, NEW['side']).save(dst, 'WEBP', quality=90, method=6); drawn += 1
            views[view] = rel
        if e['id'] in have:
            continue
        base = next(l for l in ls['looks'] if l['id'] == e['base']); pool = next(p for p in NEW['pools'] if p['id'] == e['pool'])
        hex_ = e.get('hex') or measured(real(NEW['root'] + '/' + e['files'].replace('{VIEW}', 'FRONT')))
        minted = round(e['edition'] * 0.6); owners = round(minted * 0.8)
        floor, last = round(e['usd'] * 0.92 / 50) * 50, round(e['usd'] * 1.03 / 50) * 50
        specs = deepcopy(base['specs'])
        specs.update({
            'colour': {'name': e['colour'], 'hex': hex_, 'family': family(hex_), 'palette': [hex_], 'measured': hex_, 'source': 'render'},
            'theme': {'kinds': [], 'mood': None, 'story': None, 'source': 'pending'},
            'garments': e['garments'], 'season': pool['season'], 'collection': pool['name'], 'finish': 'as rendered',
            'renders': {'angles': list(views), 'opaque': False, 'front': views['FRONT'], 'from': e['id']},
            'provenance': {**base['specs'].get('provenance', {}), 'poolId': e['pool'], 'mintDate': pool['mintDate']},
            'supply': {'edition': e['edition'], 'minted': minted, 'owners': owners},
            'tags': [e['rarity'], pool['season']] + base['specs'].get('tags', [])[2:],
            'price': {**base['specs'].get('price', {}), 'list': e['usd'], 'floor': floor, 'lastSale': last, 'change7d': 0.0},
            'appearsIn': {'castIds': [], 'showIds': [], 'seriesIds': [], 'episodes': 0},
        })
        for k, v in e.get('specs', {}).items():
            if v is None:
                specs.pop(k, None)
            else:
                specs[k] = v
        ls['looks'].append({
            'id': e['id'], 'n': f"{len(ls['looks']) + 1:02}", 'storeId': ls['store']['id'], 'name': e['name'], 'colour': e['colour'], 'hex': hex_,
            'garments': e['garments'], 'rarity': e['rarity'], 'edition': e['edition'], 'minted': minted, 'owners': owners,
            'usd': e['usd'], 'floor': floor, 'lastSale': last, 'change7d': 0.0, 'mintDate': pool['mintDate'],
            'views': views, 'poolId': e['pool'], 'specs': specs, **({'nestId': base['nestId']} if base.get('nestId') else {}),
        })
        pools[e['pool']]['lookIds'].append(e['id']); added += 1
    print(f'{added} products added from finished renders, {drawn} pictures drawn at {NEW["side"]} px')


add_looks(ls)
swap = {(r['look'], r['view']): real(r['source']) for r in SPEC['replace']}
moves, made, replaced = {}, 0, 0
for look in ls['looks']:
    for layer, suffix in (('views', ''), ('opaque', '-opaque')):
        for view, path in (look.get(layer) or {}).items():
            new = f"look/{look['id']}/{WORD[view]}{suffix}.webp"
            dst = PUBLIC / new
            if path != new:
                moves[path] = new
            src = swap.get((look['id'], view)) if layer == 'views' else None
            if src is not None:
                dst.parent.mkdir(parents=True, exist_ok=True); square(src).save(dst, 'WEBP', quality=82, method=4); replaced += 1
            elif not dst.exists() and (PUBLIC / path).exists():
                dst.parent.mkdir(parents=True, exist_ok=True); Image.open(PUBLIC / path).save(dst, 'WEBP', quality=82, method=4); made += 1
            look[layer][view] = new
    # The specs' render list names the same pictures by view word (front, back…): point it at the look's own views.
    renders = (look.get('specs') or {}).get('renders') or {}
    by_word = {w: k for k, w in WORD.items()}
    for word, path in list(renders.items()):
        key = by_word.get(word)
        if key and key in look['views'] and path != look['views'][key]:
            moves.setdefault(path, look['views'][key]); renders[word] = look['views'][key]

# Every old path in the data, rewritten in one pass (other stores reuse these renders; colours are keyed by path).
pattern = re.compile('|'.join(re.escape(k) for k in sorted(moves, key=len, reverse=True))) if moves else None
changed = []
for name in ('ls.json', 'stores.json', 'itemColors.json'):
    p = DATA / name
    text = json.dumps(ls, ensure_ascii=False) if name == 'ls.json' else p.read_text(encoding='utf8')
    if name == 'ls.json':
        dump(p, ls_text, ls); continue
    if pattern:
        new_text = pattern.sub(lambda m: moves[m.group(0)], text)
        if new_text != text:
            p.write_text(new_text, encoding='utf8'); changed.append(name)
print(f'{made} pictures moved to look/<id>/, {replaced} replaced with finished renders, {len(moves)} paths rewritten in ls.json {" ".join(changed)}')
