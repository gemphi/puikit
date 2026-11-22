"""Build the local media store: the same keys the S3 bucket will hold, so moving it is one sync.

    pip install -r scripts/media/requirements.txt
    python scripts/media/build_media.py [--skip-avatars]

Writes media/phi-media/ (not in git):
    worlds/<slug>/       world.json, logo.svg, logo-original.webp, icon.webp, hero.webp, gallery/, zones/<slug>/zone.json
    lands/<slug>/        land renders
    feeds/               all/page-NNNN.json, moments.json, worlds/<slug>.json
    posts/<id>/          post.json
    profiles/<id>/       profile.json, avatar.webp
    assets/              items, rides, jewels, portraits, welcome, landing, scenes, brand
Also writes app/phiegg/src/data/media.json (what the app reads), app/phiegg/public/logos/ (3D logos for local work
without a bucket), and scripts/media/old-worlds.json with the old world names set against today's. Sources are only read.
"""
import json
import re
import shutil
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from PIL import Image

HERE = Path(__file__).parent
ROOT = HERE.parents[1]
APP = ROOT / 'app/phiegg'
DATA = APP / 'src/data'
PUBLIC = APP / 'public'
OUT = ROOT / 'media/phi-media'
FONT = ROOT / 'src/tokens/fonts/phi/Phifing/Phifing4-Bold.woff2'
ROOTS = {'{DL}': str(Path.home() / 'Downloads'), '{D}': 'D:/Dowloads'}
PALETTE = ['#5b8def', '#f4a84a', '#ef6f8e', '#8ad06a', '#b08cf2', '#4cc9c0']
PAGE = 50
missing = []


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower().replace('’', '').replace("'", '')).strip('-')


def real(path):
    for k, v in ROOTS.items():
        path = path.replace(k, v)
    return Path(path)


def write_json(key, value):
    path = OUT / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1), encoding='utf8')
    return key


def picture(source, key, side, quality=82):
    """A sized webp from a source file; returns its key, or None when the source is gone."""
    src = real(source) if isinstance(source, str) else source
    if not src.exists():
        missing.append(str(src))
        return None
    path = OUT / key
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        im = Image.open(src).convert('RGBA')
        im.thumbnail((side, side), Image.LANCZOS)
        im.save(path, 'WEBP', quality=quality, method=4)
    return key


def mix(hex_color, other, t):
    a = [int(hex_color[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(other[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(a, b))


class Logos:
    """A name as a soft 3D logo in Phifing: each letter its own colour, lit from above, with depth beneath it."""

    def __init__(self):
        font = TTFont(FONT)
        self.glyphs = font.getGlyphSet()
        self.cmap = font.getBestCmap()
        self.hmtx = font['hmtx']

    def svg(self, name, colors=None):
        colors = [c for c in (colors or []) if re.fullmatch(r'#[0-9a-fA-F]{6}', c)] or PALETTE
        if len(colors) < 3:
            colors = colors + PALETTE
        x, shapes, defs = 0, [], []
        for i, ch in enumerate(name):
            glyph = self.cmap.get(ord(ch))
            if not glyph:
                x += 300
                continue
            pen = SVGPathPen(self.glyphs)
            self.glyphs[glyph].draw(pen)
            d = pen.getCommands()
            if d:
                c = colors[i % len(colors)]
                defs.append(f'<linearGradient id="g{i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{mix(c, "#ffffff", .52)}"/><stop offset=".55" stop-color="{c}"/><stop offset="1" stop-color="{mix(c, "#000000", .16)}"/></linearGradient>')
                depth = ''.join(f'<path d="{d}" transform="translate({x + 3 * k} {-12 * k})" fill="{mix(c, "#0a1317", .34 + .06 * k)}"/>' for k in range(5, 0, -1))
                shapes.append(f'{depth}<path d="{d}" transform="translate({x} 0)" fill="url(#g{i})"/>')
            x += self.hmtx[glyph][0]
        # Font units run up; the logo's box holds the tallest letter, the tails and the depth.
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -700 {x + 30} 980" role="img" aria-label="{name.replace(chr(34), "")}">'
                f'<defs>{"".join(defs)}</defs><g transform="scale(1 -1) translate(0 -0)">{"".join(shapes)}</g></svg>')


def walk_looks(node, found):
    match node:
        case {'id': str(i), 'views': {'FRONT': str(front)}}:
            found[i] = front
        case dict():
            for v in node.values():
                walk_looks(v, found)
        case list():
            for v in node:
                walk_looks(v, found)
        case _:
            pass


def fnv(text):
    h = 2166136261
    for ch in text:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h


def old_worlds(catalog, current):
    """The old workspace's worlds and cities, set against today's names. Only names survive: its pictures are gone."""
    source = real(catalog['oldWorldData'])
    if not source.exists():
        missing.append(str(source))
        return
    text = source.read_text(encoding='utf8', errors='replace')
    blocks = re.split(r"\n  \{\s*\n\s*id: '", text)[1:]
    rows = []
    today = {slug(n) for n in current}
    for block in blocks:
        world = re.search(r"name: '([^']+)'", block)
        theme = re.search(r"theme: '([^']+)'", block)
        names = re.findall(r"name: '([^']+)'", block)[1:]
        if world:
            title = world.group(1).title()
            rows.append({'name': title, 'theme': theme.group(1) if theme else '', 'cities': [n.title() for n in names], 'inAppToday': slug(title) in today})
    (HERE / 'old-worlds.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf8')
    print('old worlds', len(rows), 'already in the app', sum(r['inAppToday'] for r in rows))


def main():
    catalog = json.loads((HERE / 'catalog.json').read_text(encoding='utf8'))
    core = json.loads((DATA / 'core.json').read_text(encoding='utf8'))
    feed = json.loads((DATA / 'feed.json').read_text(encoding='utf8'))
    logos = Logos()
    OUT.mkdir(parents=True, exist_ok=True)
    # Rebuilt from the catalog each run, so art taken off it goes too. collections/ is import_collections.py's.
    for top in ('worlds', 'lands', 'assets', 'feeds', 'posts', 'profiles'):
        shutil.rmtree(OUT / top, ignore_errors=True)
    (PUBLIC / 'logos').mkdir(exist_ok=True)

    # Everything the app already ships, under its bucket key.
    for folder, key in (('items', 'items'), ('rides', 'rides'), ('jewels', 'jewels'), ('portraits', 'portraits'), ('welcome', 'welcome'), ('assets/landing', 'landing'), ('worlds', 'scenes'), ('logo', 'logo')):
        src = PUBLIC / folder
        if src.exists():
            shutil.copytree(src, OUT / 'assets' / key, dirs_exist_ok=True)
    # A world's own files (public/world/<slug>/: its mark and views) go under that world's key.
    if (PUBLIC / 'world').exists():
        shutil.copytree(PUBLIC / 'world', OUT / 'worlds', dirs_exist_ok=True)
    for name, source in catalog['brand'].items():
        picture(source, f'assets/brand/{name}.webp', 1024)

    # Lands.
    lands = {}
    for key, land in catalog['lands'].items():
        pattern = real(land['glob'])
        shots = []
        for i, path in enumerate(sorted(pattern.parent.glob(pattern.name))):
            done = picture(path, f'lands/{key}/{slug(path.stem)}.webp', 1600)
            shots.append(done)
        if not shots:
            missing.append(str(pattern))
        lands[key] = {'name': land['name'], 'renders': shots}
        write_json(f'lands/{key}/land.json', lands[key])

    # Worlds: what you call a city at the top level, with the app's cities as its zones.
    manifest = {'worlds': {}, 'lands': lands}
    for world in core['worlds']:
        name, s = world['name'], slug(world['name'])
        art = catalog['worlds'].get(name, {})
        svg = logos.svg(name, world.get('colors'))
        (OUT / f'worlds/{s}').mkdir(parents=True, exist_ok=True)
        (OUT / f'worlds/{s}/logo.svg').write_text(svg, encoding='utf8')
        (PUBLIC / f'logos/{s}.svg').write_text(svg, encoding='utf8')
        entry = {'slug': s, 'logo': f'worlds/{s}/logo.svg'}
        for field, side in (('logo', 1200), ('icon', 512), ('hero', 1920)):
            if field in art:
                done = picture(art[field], f'worlds/{s}/{"logo-original" if field == "logo" else field}.webp', side)
                if done:
                    entry['logoOriginal' if field == 'logo' else field] = done
        gallery = [picture(p, f'worlds/{s}/gallery/{i:02}.webp', 1400) for i, p in enumerate(art.get('gallery', []))]
        if any(gallery):
            entry['gallery'] = [g for g in gallery if g]
        if art.get('land'):
            entry['land'] = art['land']
        scene = world.get('image', '')
        if scene:
            entry['scene'] = 'assets/scenes/' + scene.removeprefix('assets/worlds/')
        zones = []
        for city in world.get('cities', []):
            z = slug(city['name'])
            zones.append(z)
            write_json(f'worlds/{s}/zones/{z}/zone.json', {**city, 'slug': z, 'world': s})
        write_json(f'worlds/{s}/world.json', {k: world.get(k) for k in ('id', 'name', 'kind', 'tone', 'description', 'clubId', 'hostId', 'poolId', 'colors', 'tags')} | {'media': entry, 'zones': zones})
        manifest['worlds'][name] = entry

    # The app's own mark.
    mark = logos.svg('phiegg', ['#0457cb', '#5b8def', '#f4a84a', '#ef6f8e', '#8ad06a', '#b08cf2'])
    (PUBLIC / 'logo/phiegg-3d.svg').write_text(mark, encoding='utf8')
    (OUT / 'assets/logo/phiegg-3d.svg').write_text(mark, encoding='utf8')

    # Posts, and the feeds that list them.
    looks = {}
    for path in DATA.glob('*.json'):
        if path.name not in ('feed.json', 'core.json', 'kinds.json', 'site.json', 'media.json'):
            walk_looks(json.loads(path.read_text(encoding='utf8')), looks)
    by_id = {w['id']: slug(w['name']) for w in core['worlds']}
    entries, per_world = [], {}
    for shot in feed['shots']:
        media = shot.get('media') or {}
        front = looks.get(media.get('lookId'))
        world = by_id.get(shot.get('worldId'))
        write_json(f'posts/{shot["id"]}/post.json', {**shot, 'mediaKeys': {'look': 'assets/' + front if front else None, 'world': f'worlds/{world}/world.json' if world else None}})
        row = {'id': shot['id'], 'post': f'posts/{shot["id"]}/post.json', 'createdAt': shot.get('createdAt')}
        entries.append(row)
        if world:
            per_world.setdefault(world, []).append(row)
    entries.sort(key=lambda r: r['createdAt'] or '', reverse=True)
    pages = [entries[i:i + PAGE] for i in range(0, len(entries), PAGE)]
    for i, page in enumerate(pages):
        write_json(f'feeds/all/page-{i + 1:04}.json', {'page': i + 1, 'pages': len(pages), 'items': page})
    for world, rows in per_world.items():
        write_json(f'feeds/worlds/{world}.json', {'items': rows})
    write_json('feeds/moments.json', {'items': feed['moments']})

    # Profiles, each with the portrait the app deals it, cut from its sheet.
    portraits = json.loads((DATA / 'portraits.json').read_text(encoding='utf8'))
    agents = json.loads((DATA / 'agents.json').read_text(encoding='utf8')).get('agents', [])
    hosts = json.loads((DATA / 'hosts.json').read_text(encoding='utf8')).get('hosts', [])
    owners = sorted([u['id'] for u in core['users']] + [a['id'] for a in agents] + [h['id'] for h in hosts], key=fnv)
    dealt = {o: portraits['portraits'][i % len(portraits['portraits'])] for i, o in enumerate(owners)}
    sheets = {}
    cell, cols = portraits['cell'], portraits['cols']
    for user in core['users']:
        keys = {'avatar': None}
        p = dealt.get(user['id'])
        if p and '--skip-avatars' not in sys.argv:
            sheet = sheets.setdefault(p['sheet'], Image.open(PUBLIC / 'portraits' / portraits['sheets'][p['sheet']]).convert('RGB'))
            row, col = divmod(p['index'], cols)
            size = sheet.width // cols
            avatar = OUT / f'profiles/{user["id"]}/avatar.webp'
            avatar.parent.mkdir(parents=True, exist_ok=True)
            sheet.crop((col * size, row * size, (col + 1) * size, (row + 1) * size)).save(avatar, 'WEBP', quality=80)
            keys['avatar'] = f'profiles/{user["id"]}/avatar.webp'
        write_json(f'profiles/{user["id"]}/profile.json', {k: user.get(k) for k in ('id', 'handle', 'name', 'bio', 'tone', 'verified', 'clubIds', 'badges')} | {'media': keys})

    old_worlds(catalog, [w['name'] for w in core['worlds']])
    (DATA / 'media.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf8')
    write_json('manifest.json', manifest)

    files = [p for p in OUT.rglob('*') if p.is_file()]
    tops = {}
    for p in files:
        top = p.relative_to(OUT).parts[0]
        tops.setdefault(top, [0, 0])
        tops[top][0] += 1
        tops[top][1] += p.stat().st_size
    for top, (n, size) in sorted(tops.items()):
        print(f'{top:10} {n:6} files {size / 1e6:8.1f} MB')
    print('worlds', len(manifest['worlds']), 'with real art', sum(1 for w in manifest['worlds'].values() if len(w) > 3))
    print('missing sources', missing or 'none')


if __name__ == '__main__':
    main()
