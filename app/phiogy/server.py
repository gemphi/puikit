"""Phiegg's hosts as Phiogy's servers.

A host of Phiegg (`app/phiegg/src/data/hosts.json`) is a community with nests (channels, voice rooms, stages, under
categories) and what was said in each. This step brings every host into Phiogy's catalogue (`catalogue`, with the
templates a new host starts from), where a person joins and leaves them; the ones `server.json` names are joined from
the start. A joined host is a space
on the rail, its nests the space's rooms as Phiegg keeps them, as Discord shows a server: its categories headings over
their channels, a channel's own nests (a world's cities) its sub-channels, the rest at the top under no heading; its messages the rooms' streams, and everyone who
wrote in them a person of the app with the portrait Phiegg deals them. Every person and agent of Phiegg comes with
them, each linked to between `link.least` and `link.most` others: first those who share a host or a club with them,
then the rest, in an order their ids decide, every link held by both ends. The links go to their own file
(`link.file`), since a profile reads them only when its connections are opened. A space `village.space` names, which
Phiegg has no host for, is made with one empty room and the address its collection keeps on X. The collections
`collection.space` names join the catalogue the same way, each begun from one of its templates. The people of
`cast.json` (the old site's, and made-up heroes) come as well, and every space has between `space.least` and
`space.most` people in it (`space` in `room.json`, as places in `member`).

    python app/phiogy/server.py

It writes `public/data/phiogy.json` (menu and pages) and `public/data/room.json` (people and rooms). What it made
before is marked `"origin": "phiegg"` and is replaced on a rerun; everything else in the two files is left as it is.
The viewer's friends, and who has asked to be one, are named there too (`friend` in `room.json`).
Nothing is decided here: which hosts, which nest kinds, the words and the presence shares are all in `server.json`.
"""
import io
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ORIGIN = 'phiegg'


def read(path):
    with io.open(path, encoding='utf-8') as f:
        return json.load(f)


def write(path, data):
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


def fnv(text):
    """The hash Phiegg deals portraits by (`app/phiegg/src/lib/portraits.ts`), so a face here is the face there."""
    h = 2166136261
    for c in text:
        h = ((h ^ ord(c)) * 16777619) & 0xFFFFFFFF
    return h


def main():
    cfg = read(os.path.join(HERE, 'server.json'))
    src = os.path.normpath(os.path.join(HERE, cfg['source']))
    hosts, core, agents, portraits = (read(os.path.join(src, n + '.json')) for n in ('hosts', 'core', 'agents', 'portraits'))
    app_path = os.path.join(HERE, 'public', 'data', 'phiogy.json')
    room_path = os.path.join(HERE, 'public', 'data', 'room.json')
    app, rooms = read(app_path), read(room_path)
    cast = read(os.path.join(HERE, cfg['cast']))

    # Portraits, dealt as Phiegg deals them: every person, agent and host in the order of their hash.
    owners = sorted([u['id'] for u in core['users']] + [a['id'] for a in agents['agents']] + [h['id'] for h in hosts['hosts']], key=fnv)
    cells = portraits['portraits']
    dealt = {owner: cells[i % len(cells)] for i, owner in enumerate(owners)}
    def face(owner):
        cell = dealt.get(owner) or cells[fnv(owner) % len(cells)]
        return cfg['sheet'] + portraits['sheets'][cell['sheet']], cell['index']

    # Which hosts: the ones named first, then the biggest of the rest.
    by_id = {h['id']: h for h in hosts['hosts']}
    first = [by_id[i] for i in cfg['host']['first'] if i in by_id]
    rest = sorted((h for h in hosts['hosts'] if h not in first), key=lambda h: -h.get(cfg['host']['by'], 0))
    chosen = first + rest[:cfg['host']['more']]

    people = {u['id']: u for u in core['users']}
    people.update({a['id']: a for a in agents['agents']})
    # The people Phiogy adds (cast.json): the old site's, and made-up heroes named by the part they play.
    people.update({o['id']: o for o in cast['origin']})
    for role, names in cast['hero'].items():
        for name in names:
            slug = ''.join(c if c.isalnum() else '_' for c in name.lower())
            people['x_' + slug] = {'name': name, 'handle': slug, 'role': role, 'bio': cast['about'].replace('{role}', role.lower())}
    shares = [(p, label) for p, label, weight in cfg['presence'] for _ in range(weight)]
    def member(owner):
        u = people.get(owner, {})
        sheet, cell = face(owner)
        presence, state = shares[fnv(owner + '/presence') % len(shares)]
        out = {'id': owner, 'name': u.get('name', owner), 'origin': ORIGIN}
        if u.get('handle'): out['handle'] = u['handle']
        out['role'] = u.get('role') or (cfg['agent'] if owner.startswith('ag_') else cfg['role'])
        if u.get('bio') or u.get('status'): out['bio'] = u.get('bio') or u.get('status')
        out.update({'state': state, 'presence': presence, 'sheet': sheet, 'face': cell})
        if u.get('since'): out['since'] = u['since']
        if u.get('badges'): out['tag'] = u['badges'][:3]
        out['link'] = len(held[owner]) if owner in held else 0
        return out

    # Everyone of Phiegg, linked: a person's own share of links is decided by their id, between the least and the most.
    link = cfg['link']
    everyone = sorted(people, key=fnv)
    mark = {p: fnv(p) for p in everyone}
    want = {p: link['least'] + fnv(p + '/link') % (link['most'] - link['least'] + 1) for p in everyone}
    circle = {}
    for p in everyone:
        for g in people[p].get('hostIds', []) + people[p].get('clubIds', []):
            circle.setdefault(g, []).append(p)
    held = {p: set() for p in everyone}
    for p in everyone:
        near = {q for g in people[p].get('hostIds', []) + people[p].get('clubIds', []) for q in circle[g]}
        order = sorted(near, key=lambda q: mark[q] ^ mark[p]) + sorted((q for q in everyone if q not in near), key=lambda q: mark[q] ^ mark[p])
        for q in order:
            if len(held[p]) >= want[p]: break
            if q != p and q not in held[p] and len(held[q]) < link['most']:
                held[p].add(q); held[q].add(p)

    # Take away what an earlier run made.
    app['nav'] = [g for g in app['nav'] if g.get('origin') != ORIGIN]
    app['views'] = {k: v for k, v in app['views'].items() if v.get('origin') != ORIGIN}
    rooms['member'] = [m for m in rooms['member'] if m.get('origin') != ORIGIN]
    rooms['room'] = {k: r for k, r in rooms['room'].items() if r.get('origin') != ORIGIN}
    known = {m['id'] for m in rooms['member']}
    kinds, heads, icons = cfg['nest'], cfg['head'], cfg['icon']
    made = {'host': 0, 'room': 0, 'message': 0, 'person': 0, 'left': 0}
    catalogue = []

    for h in hosts['hosts']:
        nests = [n for n in hosts['nests'] if n['hostId'] == h['id']]
        # The host's tree as Phiegg keeps it, as Discord shows a server: a category is a heading over its channels; a
        # nest inside a channel (a world's cities) is that channel's sub-channel; a nest under neither stands at the
        # top, under no heading. Parents before children, in Phiegg's order.
        top, groups, entry_of = [], {}, {}   # the host's items in order; heading id -> its entry; nest id -> its entry
        def under(head_id, label):
            if head_id not in groups:
                groups[head_id] = {'id': head_id, 'label': label, 'icon': icons['text'], 'head': True, 'items': []}
                top.append(groups[head_id])
            return groups[head_id]['items']
        by_id = {n['id']: n for n in nests}
        def depth(n):
            d = 0
            while n.get('parentId') in by_id and d < 8: n = by_id[n['parentId']]; d += 1
            return d
        category = {n['id']: n for n in nests if kinds.get(n['kind']) == 'head'}
        for n in sorted(nests, key=depth):
            kind = kinds.get(n['kind'])
            if kind not in ('text', 'voice'):
                made['left'] += kind is None
                continue
            said = hosts['messages'].get(n['id'], [])
            authors = list(dict.fromkeys([h['ownerId']] * (kind == 'text') + [m['authorId'] for m in said]))
            for a in authors:
                if a not in known:
                    rooms['member'].append(member(a)); known.add(a); made['person'] += 1
            room = {'label': n['name'], 'space': h['name'], 'origin': ORIGIN}
            if kind == 'voice': room['kind'] = 'voice'
            if n.get('topic'): room['topic'] = n['topic']
            room['member'] = [a for a in authors if kind == 'text' or a != h['ownerId']]
            if kind == 'text' and n.get('unread'): room['unread'] = n['unread']
            room['message'] = [] if kind == 'voice' else [
                {'id': m['id'], 'by': m['authorId'], 'day': cfg['day'], 'at': m['at'], 'text': m['text']} for m in said if m.get('text')]
            rooms['room'][n['id']] = room
            made['room'] += 1; made['message'] += len(room['message'])
            entry = {'id': n['id'], 'label': n['name'], 'icon': icons.get(n['kind'], icons[kind])}
            if kind == 'voice': entry['crowd'] = n['id']
            entry_of[n['id']] = entry
            parent = n.get('parentId')
            if parent in category: under(parent, category[parent]['name']).append(entry)
            elif parent in entry_of: entry_of[parent].setdefault('items', []).append(entry); made['sub'] = made.get('sub', 0) + 1
            else: top.append(entry)
        # A host Phiegg gave no voice nest gets one room to call in (`call`), at its top, so every host has a place for
        # a call.
        def calls(items):
            return any(e.get('crowd') or calls(e.get('items', [])) for e in items)
        if top and not calls(top):
            c = cfg['call']; rid = h['id'] + '-' + c['id']
            rooms['room'][rid] = {'label': c['label'], 'space': h['name'], 'origin': ORIGIN, 'kind': 'voice', 'topic': c['topic'], 'member': [], 'message': []}
            top.append({'id': rid, 'label': c['label'], 'icon': icons['voice'], 'crowd': rid})
            made['room'] += 1
        sheet, cell = face(h['id'])
        if not top: continue
        catalogue.append({'id': h['id'], 'label': h['name'], 'icon': icons['host'], 'members': h.get('members', 0), 'online': h.get('online', 0),
                          'mark': {'sheet': sheet, 'cols': portraits['cols'], 'index': cell}, 'items': top})
        made['host'] += 1

    # The village: spaces for collections Phiegg has no host for. One room each, empty, and where the collection is on X.
    village = cfg.get('village', {'space': []})
    for v in village['space']:
        r = village['room']; rid = v['id'] + '-' + r['id']
        rooms['room'][rid] = {'label': r['label'], 'space': v['label'], 'origin': ORIGIN, 'topic': r['topic'], 'link': v.get('x'), 'member': [], 'message': []}
        app['views'][rid] = {'title': '', 'origin': ORIGIN, 'blocks': [{'kind': 'chat', 'variant': 'room', 'app': app['app'], 'source': 'data/room.json', 'room': rid}]}
        c = cfg['call']; cid = v['id'] + '-' + c['id']
        rooms['room'][cid] = {'label': c['label'], 'space': v['label'], 'origin': ORIGIN, 'kind': 'voice', 'topic': c['topic'], 'member': [], 'message': []}
        # One room and one to call in, under no heading: a space of one group, as a small Discord server is.
        app['nav'].append({'id': v['id'], 'label': v['label'], 'icon': icons['host'], 'origin': ORIGIN, 'items': [
            {'id': rid, 'label': r['label'], 'icon': icons['text']}, {'id': cid, 'label': c['label'], 'icon': icons['voice'], 'crowd': cid}]})

    # Collections: spaces of the catalogue, each begun from the template `collection.template` names, with the address
    # the collection keeps on X on its first room. Nobody is in one before they join it.
    col = cfg.get('collection', {'space': []})
    start = next((t for t in cfg['template'] if t['id'] == col.get('template')), None)
    for c in col['space']:
        groups = {}
        for i, r in enumerate(start['room']):
            rid = '%s-%d' % (c['id'], i); kind = r.get('kind', 'text')
            room = {'label': r['label'], 'space': c['label'], 'origin': ORIGIN, 'member': [], 'message': []}
            if kind == 'voice': room['kind'] = 'voice'
            if i == 0: room.update({'topic': col['topic']}, **({'link': c['x']} if c.get('x') else {}))
            rooms['room'][rid] = room; made['room'] += 1
            head = groups.setdefault(r['head'], {'id': '%s-h%d' % (c['id'], len(groups)), 'label': r['head'], 'icon': icons['text'], 'head': True, 'items': []})
            head['items'].append(dict({'id': rid, 'label': r['label'], 'icon': icons[kind]}, **({'crowd': rid} if kind == 'voice' else {})))
        sheet, cell = face(c['id'])
        catalogue.append({'id': c['id'], 'label': c['label'], 'icon': start['icon'], 'members': 0, 'online': 0,
                          'mark': {'sheet': sheet, 'cols': portraits['cols'], 'index': cell}, 'items': list(groups.values())})
        made['host'] += 1

    # Everyone else of Phiegg, so every link leads to a person.
    for p in everyone:
        if p not in known:
            rooms['member'].append(member(p)); known.add(p); made['person'] += 1
    rooms['link'] = link['file'].split('public/', 1)[-1]
    # Friends: the ones named, then people who write in the hosts the viewer is in, in an order their ids decide; the
    # next few of those have asked and wait for an answer.
    fr = cfg['friend']
    near = {m['authorId'] for h in chosen for n in hosts['nests'] if n['hostId'] == h['id'] for m in hosts['messages'].get(n['id'], [])}
    near = sorted(near - set(fr['with']), key=lambda q: fnv(q + '/friend'))
    rooms['friend'] = {'with': fr['with'] + near[:fr['more']], 'asked': near[fr['more']:fr['more'] + fr['asked']]}
    # Everyone in a space: between `space.least` and `space.most` people, a number the space's name decides. First
    # those who wrote in its rooms, then those Phiegg says are in the host, then the rest, in an order the two names
    # decide. Kept once a space, as places in `member`; a voice room's own `member` stays who is in it now.
    span = cfg['space']
    seat = {m['id']: i for i, m in enumerate(rooms['member'])}
    host_of = {h['name']: h for h in hosts['hosts']}
    wrote = {}
    for r in rooms['room'].values():
        if r.get('space'): wrote.setdefault(r['space'], []).extend([] if r.get('kind') == 'voice' else r.get('member', []))
    rooms['space'] = {}
    def looks(m):
        """What a person is told apart by in a space: their face (a cell of a sheet), their name and their handle."""
        return {('face', m.get('sheet') or rooms['sheet']['src'], m.get('face')), ('name', m.get('name')), ('handle', m.get('handle'))}
    for label, first in wrote.items():
        size = span['least'] + fnv(label + '/space') % (span['most'] - span['least'] + 1)
        salt = fnv(label); near = circle.get(host_of[label]['id'], []) if label in host_of else []
        order = list(dict.fromkeys(first + sorted(near, key=lambda q: mark[q] ^ salt) + sorted(everyone, key=lambda q: mark[q] ^ salt)))
        # No two people of one space share a face, a name or a handle: those who wrote are seated first, and anyone
        # after them who looks or is called like somebody seated is passed over. Nobody's face or name is changed.
        taken, chosen_here = set(), []
        for q in (q for q in order if q in seat):
            mark_of = looks(rooms['member'][seat[q]])
            if len(chosen_here) >= max(size, len(set(first))): break
            if q not in first and taken & mark_of: continue
            taken |= mark_of; chosen_here.append(q)
        rooms['space'][label] = sorted(seat[q] for q in chosen_here)
    for c in catalogue:
        at = rooms['space'].get(c['label'], [])
        c['members'] = max(c['members'], len(at))
        c['online'] = c['online'] or sum(rooms['member'][i].get('presence') != 'off' for i in at)
    # The catalogue: every host with its rooms' menu, and the templates a new one starts from. The app says where it is
    # and which hosts a person is in before they choose.
    app['host'] = cfg['catalogue'].split('public/', 1)[-1]
    app['joined'] = [h['id'] for h in chosen]
    with io.open(os.path.join(HERE, *cfg['catalogue'].split('/')), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps({'template': cfg['template'], 'host': catalogue}, separators=(',', ':'), ensure_ascii=False) + '\n')
    write(app_path, app); write(room_path, rooms)
    # The links, small: everyone once, in order, and for each the places in that order of those they are linked to.
    place = {p: i for i, p in enumerate(everyone)}
    with io.open(os.path.join(HERE, *link['file'].split('/')), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps({'id': everyone, 'link': [sorted(place[q] for q in held[p]) for p in everyone]}, separators=(',', ':')) + '\n')
    sizes = sorted(len(v) for v in held.values())
    print('hosts %(host)d, rooms %(room)d, messages %(message)d, people %(person)d; nests of a kind not brought: %(left)d' % made)
    print('links a person: least %d, middle %d, most %d' % (sizes[0], sizes[len(sizes) // 2], sizes[-1]))
    sizes = sorted(len(v) for v in rooms['space'].values())
    print('spaces %d; people in a space: least %d, middle %d, most %d' % (len(sizes), sizes[0], sizes[len(sizes) // 2], sizes[-1]))


if __name__ == '__main__':
    main()
