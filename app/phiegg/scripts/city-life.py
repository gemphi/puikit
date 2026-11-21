#!/usr/bin/env python3
"""Life in the 16 Bold Cities: residents, hosts, located posts, comments and chat. Idempotent; run after bold-cities.py.

    py -3 scripts/city-life.py

Reads ../../scripts/media/city-life.json (names, roles, hosts, texts, the @POSTS characters) and the Bold City worlds
in src/data/core.json. For every city it writes:
  * 64 residents (core.json users), named from classic-film first names and surnames paired anew, each with a role,
    a bio, the city's club and one of its hosts;
  * 6 hosts (hosts.json), one per gathering place (shops, runway, stage, arcade, cafe, plaza), each with a lobby and a
    topic nest and a few lines of chat between its residents;
  * 16 posts (feed.json), each pinned to the city and one of its zones (cityId): the @POSTS character's renders as one
    carousel post (files standardised to world/<slug>/post/character-<nn>-<k>.webp), then the city's own views, the
    fourth of each run a reel; comments under each post (threads/NN.json, the shard the app reads for that post, and
    their number in threadCounts.json). Run it after threads.mjs, which rewrites the shards from its own list;
  * 16 events (events.json), each held at one of its hosts' places.
How many comments and likes a post has, how many go to an event and how many follow a resident is a rung of the
ladder in the data file (16, 32, 64, 128, 256), spread so that every city has lists of every size.
Every record carries origin city-life and is replaced on a rerun. Texts are templates from the data file.
"""
import json, re
from datetime import datetime, timedelta
from pathlib import Path
from PIL import Image

APP = Path(__file__).resolve().parents[1]
DATA, PUBLIC = APP / 'src' / 'data', APP / 'public'
SPEC = json.loads((APP.parents[1] / 'scripts' / 'media' / 'city-life.json').read_text(encoding='utf8'))
CITIES = json.loads((APP.parents[1] / 'scripts' / 'media' / 'bold-cities.json').read_text(encoding='utf8'))
ORIGIN = SPEC['origin']
ROOTS = {'{DL}': str(Path.home() / 'Downloads'), '{D}': 'D:/Dowloads'}
TONES = ['accent', 'sage', 'neutral', 'ink']


def real(path):
    for k, v in ROOTS.items():
        path = path.replace(k, v)
    return Path(path)


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def shard(record_id):
    """The comment shard the app reads for a post (lib/lazy.ts shardOf)."""
    h = 7
    for c in record_id:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h % 16


EOL = {}  # each file keeps the line ends it had


def load(name):
    p = DATA / name; raw = p.read_bytes(); EOL[p] = '\r\n' if b'\r\n' in raw else '\n'
    text = raw.decode('utf8').replace('\r\n', '\n'); return p, text, json.loads(text)


def dump(path, text, value):
    match text[:3]:
        case '{\n ' if text[3] != ' ': out = json.dumps(value, ensure_ascii=False, indent=1)
        case '{\n ': out = json.dumps(value, ensure_ascii=False, indent=2)
        case _: out = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    path.write_text(out + ('\n' if text.endswith('\n') else ''), encoding='utf8', newline=EOL.get(path, '\n'))


def picture(src, out):
    """A character render cropped to the figure, at the render's own full size (never shrunk: a post is shown full
    screen), with its clear background, for a post."""
    if out.exists():
        return
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if box and box != (0, 0, im.width, im.height):
        im = im.crop(box)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, 'WEBP', quality=SPEC.get('quality', 92), method=6)


core_p, core_t, core = load('core.json')
hosts_p, hosts_t, hosts = load('hosts.json')
feed_p, feed_t, feed = load('feed.json')
ours = lambda r: r.get('origin') == ORIGIN
worlds = {w['name']: w for w in core['worlds'] if w.get('origin') == CITIES['origin']}
looks = json.loads((DATA / 'ls.json').read_text(encoding='utf8'))['looks']
users, host_rows, nests, messages, shots, comments, events = [], [], [], {}, [], [], []
LADDER, SPREAD = SPEC['ladder'], SPEC['spread']


def rung(k, step, shift):
    """The ladder's figure for the k-th record of a run: `step` (odd) walks the spread in a different order per use."""
    return LADDER[SPREAD[(k * step + shift) % len(SPREAD)]]


first, last = SPEC['first'], SPEC['last']
pair = 0  # one running pairing across every city, so no two residents share a name

for ci, city in enumerate(CITIES['cities']):
    w = worlds.get(city['name'])
    if not w:
        continue
    name, key, zones = w['name'], w['id'][2:], w['cities']
    zone_of = {z['id'].rsplit('_', 1)[-1]: z for z in zones}
    fill = lambda t, z=zones[0], place='plaza': t.format(city=name, zone=z['name'], place=place)
    # ── residents ──
    people = []
    for i in range(SPEC['residentsPerCity']):
        f, l = first[pair % len(first)], last[(pair // len(first) + pair) % len(last)]; pair += 1
        role = SPEC['roles'][i % len(SPEC['roles'])]; z = zones[i % len(zones)]
        uid = f'u_{key}_{i + 1:02}'
        people.append({'id': uid, 'origin': ORIGIN, 'handle': f'{f}.{l}'.lower().replace("'", ''), 'name': f'{f} {l}', 'tone': TONES[i % 4],
                       'bio': fill(role['bio'], z), 'verified': i < 6, 'followers': rung(i, 5, ci), 'following': rung(i, 3, ci + 4), 'clubIds': [w['clubId']],
                       'badges': [role['role']], 'hostIds': [], 'worldId': w['id'], 'cityId': z['id']})
    # ── hosts: one per gathering place, residents shared round them ──
    for hi, h in enumerate(SPEC['hosts']):
        hid = f'h_{key}_{h["key"]}'; z = zone_of.get(h['zone'], zones[0])
        members = [p for k, p in enumerate(people) if k % len(SPEC['hosts']) == hi]
        for p in members:
            p['hostIds'].append(hid)
        owner = members[0]['id']
        host_rows.append({'id': hid, 'origin': ORIGIN, 'name': fill(h['name']), 'clubId': w['clubId'], 'worldId': w['id'], 'cityId': z['id'],
                          'tone': TONES[hi % 4], 'members': len(members), 'online': round(len(members) * SPEC['onlineShare']), 'gated': 'Hold 1 BPUP',
                          'roles': ['Founder', 'Model', 'Resident', 'Guest'], 'ownerId': owner, 'rules': [fill(r) for r in SPEC['rules']]})
        for ni, (nest_key, topic) in enumerate((('lobby', fill(h['about'], z)), (h['topic'], fill(h['about'], z)))):
            nid = f'n_{key}_{h["key"]}_{nest_key}'.replace('-', '_')
            nests.append({'id': nid, 'origin': ORIGIN, 'hostId': hid, 'parentId': None, 'kind': 'channel', 'name': nest_key, 'topic': topic,
                          'unread': 0, 'createdBy': owner})
            lines = SPEC['chat'][ni:] + SPEC['chat'][:ni]
            messages[nid] = [{'id': f'{nid}_m{k + 1}', 'authorId': members[k % len(members)]['id'], 'at': f'{9 + k // 2:02}:{(k * 7) % 60:02}',
                              'text': fill(lines[k % len(lines)], z, h['place'])} for k in range(SPEC['linesPerNest'])]
    users += people
    # ── posts, each pinned to the city and a zone ──
    posts = []
    # The showcase pose for this city first: a finished render with its background, so it is shown as it is.
    show = (SPEC.get('showcase') or {})
    for pose in show.get('poses', []):
        src = real(pose['file'])
        if pose['city'] == name and src.exists() and not pose.get('off'):
            rel = f'world/{slug(name)}/post/showcase.webp'
            picture(src, PUBLIC / rel)
            posts.append({'author': people[10], 'src': rel, 'views': [], 'kind': 'image',
                          'caption': show['caption'].format(city=name, tag=re.sub(r'[^A-Za-z0-9]', '', name))})
    for ch in SPEC['characters']:
        if ch['city'] != name or ch.get('off'):
            continue
        if ch.get('picture'):
            # A finished picture named in the data stands in for the folder's renders.
            posts.append({'author': people[ch['n'] - 1], 'src': ch['picture'], 'views': [], 'caption': fill(ch['caption'], zones[0]), 'kind': 'image'})
            continue
        folder = real(ch['folder'])
        files = [f for f in sorted(folder.iterdir()) if f.suffix.lower() in ('.png', '.jpg', '.jpeg') and f.name not in ch.get('skip', [])] if folder.exists() else []
        srcs = []
        for k, f in enumerate(files):
            rel = f'world/{slug(name)}/post/character-{ch["n"]:02}-{k + 1}.webp'
            picture(f, PUBLIC / rel); srcs.append(rel)
        if srcs:
            posts.append({'author': people[ch['n'] - 1], 'src': srcs[0], 'views': srcs[1:], 'caption': fill(ch['caption'], zones[0]), 'kind': 'image'})
    for g in w.get('gallery', []):
        if len(posts) >= SPEC['postsPerCity']:
            break
        posts.append({'src': g['lg'], 'views': [], 'kind': 'world-capture'})
    while len(posts) < SPEC['postsPerCity']:
        look = looks[(ci * 7 + len(posts)) % len(looks)]
        posts.append({'src': look['views']['FRONT'], 'views': [], 'kind': 'look', 'lookId': look['id']})
    for k, p in enumerate(posts):
        sid = f's_{key}_{k + 1:02}'; z = zones[k % len(zones)]; author = p.get('author') or people[(k * 5 + 7) % len(people)]
        place = SPEC['hosts'][k % len(SPEC['hosts'])]['place']
        kind = 'reel' if k % 4 == 3 else p['kind']
        caption = p.get('caption') or fill(SPEC['captions'][k % len(SPEC['captions'])], z, place)
        said = rung(k, 5, ci)  # how many comments this post has
        shot = {'id': sid, 'origin': ORIGIN, 'authorId': author['id'], 'clubId': w['clubId'], 'worldId': w['id'], 'cityId': z['id'],
                'media': {'kind': kind, 'tone': TONES[k % 4], 'ratio': '4/5', 'title': name, 'src': p['src'],
                          **({'views': [{'view': f'{n + 2}', 'src': v} for n, v in enumerate(p['views'])]} if p['views'] else {}),
                          **({'lookId': p['lookId']} if p.get('lookId') else {})},
                'caption': caption, 'likes': max(rung(k, 3, ci + 7), said), 'comments': said, 'reshares': rung(k, 7, ci) // 16,
                'createdAt': f'2026-11-{1 + (k % 17):02}T{8 + k % 12:02}:00:00Z', 'tags': ['#' + re.sub(r'[^A-Za-z0-9]', '', name), '#BoldCity'], 'lookItems': []}
        shots.append(shot)
        top = None
        for c in range(said):
            cid = f'tc_{sid}_{c + 1}'; parent = top if c % 3 == 2 else None
            comments.append({'id': cid, 'origin': ORIGIN, 'targetId': sid, 'parentId': parent, 'depth': 1 if parent else 0,
                             'authorId': people[(k * 3 + c * 11 + 1) % len(people)]['id'],
                             'text': fill(SPEC['comments'][(k * 11 + c) % len(SPEC['comments'])], z, place), 'likes': (k * 7 + c * 13) % 33,
                             'at': f'{c + 1}h' if c < 24 else f'{c // 24}d'})
            if parent is None:
                top = cid
    # ── events, each at one of the hosts' places ──
    place_zone = {h['place']: zone_of.get(h['zone'], zones[0]) for h in SPEC['hosts']}
    for n in range(SPEC['eventsPerCity']):
        e = SPEC['events'][n % len(SPEC['events'])]; z = place_zone.get(e['place'], zones[0])
        hour, minute = (int(x) for x in e['time'].split(':'))
        when = datetime.fromisoformat(SPEC['eventsFrom']) + timedelta(days=e['day'] + (n // len(SPEC['events'])) * 28, hours=hour, minutes=minute)
        events.append({'id': f'e_{key}_{n + 1:02}', 'origin': ORIGIN, 'kind': e['kind'], 'title': fill(e['title'], z, e['place']), 'clubId': w['clubId'], 'worldId': w['id'],
                       'cityId': z['id'], 'startsAt': when.strftime('%Y-%m-%dT%H:%M:%SZ'), 'rsvps': rung(n, 5, ci + 2),
                       **{f: e[f] for f in ('price', 'supply', 'genre', 'recurring') if f in e}})

core['users'] = [u for u in core['users'] if not ours(u)] + users
dump(core_p, core_t, core)
hosts['hosts'] = [h for h in hosts['hosts'] if not ours(h)] + host_rows
old_nests = {n['id'] for n in hosts['nests'] if ours(n)}
hosts['nests'] = [n for n in hosts['nests'] if not ours(n)] + nests
hosts['messages'] = {k: v for k, v in hosts['messages'].items() if k not in old_nests} | messages
dump(hosts_p, hosts_t, hosts)
old_shots = {x['id'] for x in feed['shots'] if ours(x)}
feed['shots'] = [x for x in feed['shots'] if not ours(x)] + shots
dump(feed_p, feed_t, feed)
events_p, events_t, events_doc = load('events.json')
events_doc['events'] = [e for e in events_doc['events'] if not ours(e)] + events
dump(events_p, events_t, events_doc)
by_shard = {}
for c in comments:
    by_shard.setdefault(shard(c['targetId']), []).append(c)
for n in range(16):
    p, text, doc = load(f'threads/{n:02}.json')
    doc['comments'] = [c for c in doc['comments'] if not ours(c)] + by_shard.get(n, [])
    dump(p, text, doc)
# How many comments each post has, read up front by the cards (the threads themselves load when a post opens).
counts_p, counts_t, counts = load('threadCounts.json')
for sid in old_shots | {x['id'] for x in shots}:
    counts.pop(sid, None)
for c in comments:
    counts[c['targetId']] = counts.get(c['targetId'], 0) + 1
dump(counts_p, counts_t, counts)
print(f'{len(users)} residents, {len(host_rows)} hosts, {len(nests)} nests, {len(shots)} posts, {len(comments)} comments, {len(events)} events in {len(worlds)} cities')
