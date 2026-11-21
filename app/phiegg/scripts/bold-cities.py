#!/usr/bin/env python3
"""The 16 Bold Cities, each a world with its zones, places, post and land. Idempotent.

    py -3 scripts/bold-cities.py            # size what is missing, rewrite the Bold City records
    py -3 scripts/bold-cities.py --force    # size every picture again

Reads ../../scripts/media/bold-cities.json and the downloaded folders it names (Downloads/BOLD-CITIES/NN-NAME/RENDERS
and LOGOS, as on the shared drive). A city is a world (World = City -> Zones -> Places, and Lands), so it writes:
  * public/world/<slug>/view/<view>-<width>.webp   every render cropped to the city (they are drawn on a clear
    background, so they stand as objects) in two widths, the small for cards and strips, the large for the page;
    public/world/<slug>/mark.webp, its mark. The slug is the world's name; drive file and folder names are never used;
  * src/data/core.json     one world per city (zones in `cities`, its views in `gallery`), on its club;
  * src/data/places.json   each zone's description and its places;
  * src/data/feed.json     one post per city: the hero, then every other view as a slide;
  * src/data/assets.json   a land plot (EGG) in every zone.
Ids are w_<slug>, ct_<slug>_<zone>, s_<slug>, egg_<slug>_<zone>_land, and every record carries origin bold-cities, so a
rerun replaces exactly its own records (and the older bc_ ids). A view with no render is left out; nothing is drawn or
guessed.
"""
import json, re, sys
from pathlib import Path
from PIL import Image

APP = Path(__file__).resolve().parents[1]
DATA = APP / 'src' / 'data'
PUBLIC = APP / 'public'
SPEC = json.loads((APP.parents[1] / 'scripts' / 'media' / 'bold-cities.json').read_text(encoding='utf8'))
ROOTS = {'{DL}': str(Path.home() / 'Downloads'), '{D}': 'D:/Dowloads'}
FORCE = '--force' in sys.argv
SIZES = SPEC['sizes']
ORIGIN = SPEC['origin']
LEGACY = ('w_bold_city', 'w_bc_', 'ct_bc_', 's_bc_', 'egg_bc_')


def real(path, **kw):
    for k, v in ROOTS.items():
        path = path.replace(k, v)
    return Path(path.format(**kw))


def slug(city):
    """The world's own name as its folder: forest, water-scene, city-ruins."""
    return re.sub(r'[^a-z0-9]+', '-', city['name'].lower()).strip('-')


def key(city):
    return slug(city).replace('-', '_')


def ours(record):
    """A record this script wrote: marked with its origin, or under the older bc_ ids."""
    return record.get('origin') == ORIGIN or str(record.get('id', '')).startswith(LEGACY)


def view_of(name):
    """The view a render shows, from its file name (BC-01-3Q, RENDER-3Q-02, BC-03-CU-01, RENDER-CLOSE-UP-04 ...)."""
    n = name.upper()
    match True:
        case _ if re.search(r'(^|-)3Q(-|\.|$)', n): return 'three-quarter'
        case _ if 'FRONT' in n: return 'front'
        case _ if 'SIDE' in n: return 'side'
        case _ if 'TOP' in n: return 'top'
        case _:
            m = re.search(r'(?:CU|CLOSE-UP)-0?(\d)', n)
            return f'close-up-{m.group(1)}' if m else None


def folder(src, sub):
    """`sub` under the city folder, or under its BC-/BCL- folder when the download kept Drive's nesting."""
    direct = src / sub
    match sub:
        case 'RENDERS' if not direct.exists(): return next(iter(sorted(src.glob('BC-*/RENDERS'))), direct)
        case 'LOGOS' if not direct.exists(): return next(iter(sorted(src.glob('BCL-*'))), direct)
        case _: return direct


def cropped(src):
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        return im
    pad = round(max(box[2] - box[0], box[3] - box[1]) * 0.03)
    return im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))


def save(im, out, side):
    im = im.copy()
    im.thumbnail((side, side), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, 'WEBP', quality=SIZES['quality'], method=4)


def sized(src, base):
    """<base>-sm.webp and <base>-lg.webp from one render, cropped once."""
    outs = {k: base.with_name(f'{base.name}-{SIZES[k]}.webp') for k in ('sm', 'lg')}
    if FORCE or not all(o.exists() for o in outs.values()):
        im = cropped(src)
        for k, o in outs.items():
            save(im, o, SIZES[k])
    return {k: o.relative_to(PUBLIC).as_posix() for k, o in outs.items()}


def load(name):
    p = DATA / name
    return p, p.read_text(encoding='utf8')


def dump(path, text, value):
    """Write JSON in the layout the file already has: indent 1, indent 2 or one line, with its trailing newline."""
    match text[:3]:
        case '{\n ' if text[3] != ' ': out = json.dumps(value, ensure_ascii=False, indent=1)
        case '{\n ': out = json.dumps(value, ensure_ascii=False, indent=2)
        case _: out = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    path.write_text(out + ('\n' if text.endswith('\n') else ''), encoding='utf8')


def fill(template, **kw):
    return template.format(**kw)


worlds, zones_meta, districts, shots, eggs, missing = [], {}, {}, [], [], []
spec = SPEC['world']
for city in SPEC['cities']:
    src = real(city.get('source', SPEC['source']), folder=city['folder'])
    name, n = slug(city), city['n']
    group = SPEC['groups'][city['group']]
    renders = {}
    for png in sorted(folder(src, city.get('renders', 'RENDERS')).glob('*.png')):
        view = view_of(png.name)
        if view and view not in renders:
            renders[view] = png
    gallery = []
    for view in SPEC['views']:
        match renders.get(view):
            case None: missing.append(f"{city['folder']} {view}")
            case png: gallery.append({'view': view} | sized(png, PUBLIC / 'world' / name / 'view' / view))
    logos = sorted(folder(src, 'LOGOS').glob(city.get('logo', '*.png')))
    logo = None
    if logos:
        out = PUBLIC / 'world' / name / 'mark.webp'
        if FORCE or not out.exists():
            im = Image.open(logos[0]).convert('RGBA'); save(im, out, SIZES['logo'])
        logo = out.relative_to(PUBLIC).as_posix()
    else:
        missing.append(f"{city['folder']} logo")

    wid, k = f'w_{key(city)}', key(city)
    hero = next((g for g in gallery if g['view'] == SPEC['hero']), gallery[0] if gallery else None)
    zones = []
    for z in SPEC['zones']:
        zid = f"ct_{k}_{z['key']}"
        zones.append({'id': zid, 'name': z['name'], 'population': round(city['population'] * z['share']), 'vibe': z['vibe']})
        zones_meta[zid] = {'worldId': wid, 'tone': group['tone'], 'desc': z['desc']}
        districts[zid] = [{'id': f'{zid}_d1', 'name': z['name'], 'vibe': z['vibe'], 'tone': group['tone'], 'places': [
            {'id': f"{zid}_{p['key']}", 'name': p['name'], 'kind': p['kind'], 'clubId': spec['clubId'], 'tone': group['tone'],
             'hours': p['hours'], 'visitors': p['visitors'], 'rating': p['rating'], 'desc': p['desc']} for p in z['places']]}]
        land = SPEC['land']
        eggs.append({'id': f"egg_{k}_{z['key']}_land", 'origin': ORIGIN, 'type': 'egg', 'kind': 'land',
                     'name': fill(land['name'], zone=z['name'], city=city['name']), 'hostId': spec['hostId'], 'ownerId': spec['creatorId'],
                     'clubId': spec['clubId'], 'worldId': wid, 'cityId': zid, 'priceEgg': land['priceEgg'], 'supply': 1, 'sold': 0,
                     'sizeM2': land['sizeM2'], 'yieldDay': land['yieldDay'], 'desc': fill(land['desc'], zone=z['name'], city=city['name'])})
    world = {'id': wid, 'origin': ORIGIN, 'name': city['name'], 'clubId': spec['clubId'], 'kind': spec['kind'], 'tone': group['tone'],
             'visitorsNow': city['visitorsNow'], 'description': city['desc'], 'tags': spec['tags'] + [group['name'].lower()],
             'cities': zones, 'creatorId': spec['creatorId'], 'hostId': spec['hostId'], 'land': n, 'landName': city.get('land', city['name']), 'landGroup': group['name'],
             'gallery': gallery}
    if hero:
        world['image'] = 'assets/' + hero['lg']
    if logo:
        world['logo'] = logo
    worlds.append(world)
    if hero:
        post = SPEC['post']
        shots.append({'id': f's_{k}', 'origin': ORIGIN, 'authorId': spec['creatorId'], 'clubId': spec['clubId'], 'worldId': wid,
                      'media': {'kind': 'world-capture', 'tone': group['tone'], 'ratio': '4/5', 'title': city['name'], 'src': hero['sm'],
                                'views': [{'view': g['view'], 'src': g['sm']} for g in gallery if g is not hero]},
                      'caption': fill(post['caption'], city=city['name'], desc=city['desc']), 'likes': 0, 'comments': 0, 'reshares': 0,
                      'createdAt': post['createdAt'], 'tags': [fill(t, tag=re.sub(r'[^A-Za-z0-9]', '', city['name'])) for t in post['tags']],
                      'lookItems': []})

core_path, core_text = load('core.json'); core = json.loads(core_text)
gone = [w for w in core['worlds'] if ours(w)]
old_zones = {c['id'] for w in gone for c in w['cities']}
core['worlds'] = [w for w in core['worlds'] if not ours(w)] + worlds
club = next((c for c in core['clubs'] if c['id'] == spec['clubId']), None)
if club is not None:
    old = {w['id'] for w in gone}
    club['worldIds'] = [x for x in club.get('worldIds', []) if x not in old] + [w['id'] for w in worlds]
dump(core_path, core_text, core)

places_path, places_text = load('places.json'); places = json.loads(places_text)
places['cities'] = {z: v for z, v in places['cities'].items() if z not in old_zones} | zones_meta
places['districts'] = {z: v for z, v in places['districts'].items() if z not in old_zones} | districts
dump(places_path, places_text, places)

feed_path, feed_text = load('feed.json'); feed = json.loads(feed_text)
feed['shots'] = [x for x in feed['shots'] if not ours(x)] + shots
dump(feed_path, feed_text, feed)

assets_path, assets_text = load('assets.json'); assets = json.loads(assets_text)
for e in eggs:
    e['priceUsd'] = round(e['priceEgg'] * assets['eggUsd'], 2)
assets['eggs'] = [e for e in assets['eggs'] if not ours(e)] + eggs
dump(assets_path, assets_text, assets)

print(f'{len(worlds)} Bold City worlds, {len(zones_meta)} zones, {sum(len(d[0]["places"]) for d in districts.values())} places, {len(shots)} posts, {len(eggs)} land plots')
for w in worlds:
    print(f"  {w['id']}  {w['name']:<16} {len(w['gallery'])} views  logo={'yes' if 'logo' in w else 'no'}")
if missing:
    print('missing:', ', '.join(missing))
