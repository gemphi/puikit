#!/usr/bin/env python3
"""The ladder for every world without a generator of its own. Idempotent; run after threads.mjs and city-life.py.

    py -3 scripts/ladder.py

Reads ../../scripts/media/ladder.json (the rungs, the rule for each count, the words) and brings up to a rung of the
ladder (16, 32, 64, 128, 256):
  * the posts of each world (feed.json): new posts by people of the world's club, each wearing a look from its shop;
  * the events of each world (events.json);
  * the comments under every post, agent post, show and pose (threads/NN.json, the shard the app reads for it, and
    their number in threadCounts.json).
Records already there are never changed. Every record added carries the data file's origin and is replaced on a rerun.
Worlds and records of the origins the data file names (the Bold Cities, city-life) are left to their own generator.
"""
from datetime import datetime, timedelta

from data_file import dump, load, shard, spec

SPEC = spec('ladder')
ORIGIN, LADDER, SPREAD, RULE = SPEC['origin'], SPEC['ladder'], SPEC['spread'], SPEC['rule']
TONES = ['accent', 'sage', 'neutral', 'ink']
ours = lambda r: r.get('origin') == ORIGIN


def seed(*parts):
    """A steady number from words (FNV-1a), so every run draws the same."""
    h = 2166136261
    for c in '|'.join(str(p) for p in parts):
        h = ((h ^ ord(c)) * 16777619) & 0xFFFFFFFF
    return h


def wanted(kind, have, *key):
    """How many a record should have: the lowest rung that holds what is there, and under `spread` also the rung drawn
    for it. Never fewer than it has, never more than the top rung adds."""
    fit = next((r for r in LADDER if r >= have), have)
    return max(fit, LADDER[SPREAD[seed(kind, *key) % len(SPREAD)]]) if RULE[kind] == 'spread' else fit


def words(template, world, club, n):
    """A template's words for a world: {world}, {zone} (one of its zones, by turn) and {club}."""
    zones = world.get('cities') or [{'name': world['name']}]
    return template.format(world=world['name'], zone=zones[n % len(zones)]['name'], club=club.get('name', world['name']))


core_p, core_t, core = load('core.json')
feed_p, feed_t, feed = load('feed.json')
events_p, events_t, events = load('events.json')
counts_p, counts_t, counts = load('threadCounts.json')
stores = load('stores.json')[2]['stores'] + [{**load('ls.json')[2]['store'], 'looks': load('ls.json')[2]['looks']}]
agents = load('agents.json')[2]

leave = SPEC['leave']
worlds = [w for w in core['worlds'] if w.get('origin') not in leave['worldOrigin']]
clubs = {c['id']: c for c in core['clubs']}
people = [u for u in core['users'] if u.get('origin') not in leave['recordOrigin']]
people_of = {}
for u in people:
    for c in u.get('clubIds') or []:
        people_of.setdefault(c, []).append(u)
looks_of = {}; named = {c['name']: c['id'] for c in core['clubs']}
for s in stores:
    # A shop says its club by id, or by name (the flagship).
    looks_of.setdefault(s.get('clubId') or named.get(s.get('club')), []).extend(l for l in s.get('looks', []) if l.get('hex'))

# ── posts: each world up to its rung ──
feed['shots'] = [x for x in feed['shots'] if not ours(x)]
P = SPEC['post']; start = datetime.fromisoformat(P['from']); shots = []
for w in worlds:
    key = w['id'][2:]; club = clubs.get(w.get('clubId'), {}); have = sum(1 for x in feed['shots'] if x.get('worldId') == w['id'])
    writers = people_of.get(w.get('clubId')) or people; looks = looks_of.get(w.get('clubId')) or []
    for n in range(wanted('post', have, w['id']) - have):
        h = seed('post', w['id'], n); look = looks[h % len(looks)] if looks else None
        when = start - timedelta(hours=P['everyHours'] * n + h % P['everyHours'])
        likes = LADDER[SPREAD[(n * 5 + h) % len(SPREAD)]] * P['likesPer']
        shots.append({'id': f'lp_{key}_{n + 1:02}', 'origin': ORIGIN, 'authorId': writers[h % len(writers)]['id'], 'clubId': w.get('clubId'), 'worldId': w['id'],
                      'media': {'kind': P['kind'][(n + h) % len(P['kind'])], 'tone': TONES[(n + h) % 4], 'ratio': P['ratio'][(n + h // 7) % len(P['ratio'])],
                                'title': words(P['title'][(n * 3 + h) % len(P['title'])], w, club, n + h),
                                **({'hex': look['hex'], 'lookId': look['id']} if look else {})},
                      'caption': words(P['caption'][(n * 7 + h) % len(P['caption'])], w, club, n + h // 3), 'likes': likes, 'comments': 0, 'reshares': likes // 16,
                      'createdAt': when.strftime('%Y-%m-%dT%H:%M:%S.000Z'), 'tags': list(w.get('tags') or []), 'lookItems': list((look or {}).get('garments') or [])[:3]})
feed['shots'] += shots

# ── events: each world up to its rung ──
events['events'] = [e for e in events['events'] if not ours(e)]
E = SPEC['event']; first = datetime.fromisoformat(E['from']); added = []
for w in worlds:
    key = w['id'][2:]; club = clubs.get(w.get('clubId'), {}); zones = w.get('cities') or []
    have = sum(1 for e in events['events'] if e.get('worldId') == w['id']); h = seed('event', w['id'])
    for n in range(wanted('event', have, w['id']) - have):
        e = E['template'][(h + n) % len(E['template'])]; lap = (h % len(E['template']) + n) // len(E['template'])
        hour, minute = (int(x) for x in e['time'].split(':'))
        when = first + timedelta(days=e['day'] + h % (E['shift'] + 1) + lap * 42, hours=hour, minutes=minute)
        added.append({'id': f'le_{key}_{n + 1:02}', 'origin': ORIGIN, 'kind': e['kind'], 'title': words(e['title'], w, club, h + n), 'clubId': w.get('clubId'), 'worldId': w['id'],
                      **({'cityId': zones[(h + n) % len(zones)]['id']} if zones else {}), 'startsAt': when.strftime('%Y-%m-%dT%H:%M:%SZ'),
                      'rsvps': LADDER[SPREAD[(n * 5 + h) % len(SPREAD)]] * E['rsvpsPer'], **{f: e[f] for f in ('price', 'supply', 'genre', 'recurring') if f in e}})
events['events'] += added

# ── comments: every thread up to its rung ──
docs = [load(f'threads/{n:02}.json') for n in range(16)]
for _, _, doc in docs:
    doc['comments'] = [c for c in doc['comments'] if not ours(c)]
theirs = {x['id'] for x in feed['shots'] if x.get('origin') in leave['recordOrigin']}
held = {}
for _, _, doc in docs:
    for c in doc['comments']:
        held[c['targetId']] = held.get(c['targetId'], 0) + 1
# What a thread hangs under and the world it belongs to: every post, every agent post, and whatever already has a thread.
world_of = {w['id']: w for w in core['worlds']}
targets = {t: None for t in held}
targets |= {x['id']: x for x in feed['shots']} | {x['id']: x for x in agents['posts']}
C = SPEC['comment']; plain = [l for l in C['line'] if '{' not in l]; comments = []
for target, record in targets.items():
    if target in theirs:
        continue
    have = held.get(target, 0); w = world_of.get((record or {}).get('worldId')); club = clubs.get((record or {}).get('clubId'), {})
    writers = people_of.get((record or {}).get('clubId')) or people; lines = C['line'] if w else plain; top = None
    for n in range(wanted('comment', have, target) - have):
        h = seed('comment', target, n); cid = f'lc_{target}_{n + 1}'; parent = top if top and n % C['replyEvery'] == C['replyEvery'] - 1 else None
        line = lines[(n * 11 + h) % len(lines)]
        comments.append({'id': cid, 'origin': ORIGIN, 'targetId': target, 'parentId': parent, 'depth': 1 if parent else 0, 'authorId': writers[h % len(writers)]['id'],
                         'text': words(line, w, club, h) if w else line, 'likes': h % 97, 'at': f'{n + 1}h' if n < 24 else f'{n // 24}d'})
        if parent is None:
            top = cid
for c in comments:
    docs[shard(c['targetId'])][2]['comments'].append(c)
    held[c['targetId']] = held.get(c['targetId'], 0) + 1
for x in shots:
    x['comments'] = held.get(x['id'], 0)
for target in targets:
    if target not in theirs and held.get(target):
        counts[target] = held[target]

dump(feed_p, feed_t, feed)
dump(events_p, events_t, events)
for p, text, doc in docs:
    dump(p, text, doc)
dump(counts_p, counts_t, counts)
print(f'{len(shots)} posts, {len(added)} events, {len(comments)} comments added in {len(worlds)} worlds')
