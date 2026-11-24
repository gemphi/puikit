"""The village: spaces for collections Phiegg has no host for (server.json `village`).

Each its first room, empty, with where the collection is on X; the rooms of the template `village.template`
names after it, under their headings, as every collection's space has them; a room to call in; and a mark from the
portraits, so no place stands on the rail as a bare letter. Called by server.py.
"""


def build(app, rooms, cfg, icons, face, cols, ORIGIN):
    village = cfg.get('village', {'space': []})
    for v in village['space']:
        r = village['room']; rid = v['id'] + '-' + r['id']
        rooms['room'][rid] = {'label': r['label'], 'space': v['label'], 'origin': ORIGIN, 'topic': r['topic'], 'link': v.get('x'), 'member': [], 'message': []}
        app['views'][rid] = {'title': '', 'origin': ORIGIN, 'blocks': [{'kind': 'chat', 'variant': 'room', 'app': app['app'], 'source': 'data/room.json', 'room': rid}]}
        c = cfg['call']; cid = v['id'] + '-' + c['id']
        rooms['room'][cid] = {'label': c['label'], 'space': v['label'], 'origin': ORIGIN, 'kind': 'voice', 'topic': c['topic'], 'member': [], 'message': []}
        # Its first room, then the template's rooms under their headings (as every collection's space has them), then
        # the room to call in; and its mark from the portraits, so no host stands on the rail as a letter.
        items = [{'id': rid, 'label': r['label'], 'icon': icons['text']}]
        plan = next((t for t in cfg['template'] if t['id'] == village.get('template')), {'room': []})
        heads = {}
        for i, t in enumerate(x for x in plan['room'] if x.get('kind', 'text') == 'text'):
            tid = '%s-%s' % (v['id'], i)
            rooms['room'][tid] = {'label': t['label'], 'space': v['label'], 'origin': ORIGIN, 'member': [], 'message': []}
            app['views'][tid] = {'title': '', 'origin': ORIGIN, 'blocks': [{'kind': 'chat', 'variant': 'room', 'app': app['app'], 'source': 'data/room.json', 'room': tid}]}
            head = heads.get(t['head'])
            if head is None:
                head = heads[t['head']] = {'id': '%s-h%d' % (v['id'], len(heads)), 'label': t['head'], 'icon': icons['text'], 'head': True, 'items': []}
                items.append(head)
            head['items'].append({'id': tid, 'label': t['label'], 'icon': icons['text']})
        items.append({'id': cid, 'label': c['label'], 'icon': icons['voice'], 'crowd': cid})
        sheet, cell = face(v['id'])
        app['nav'].append({'id': v['id'], 'label': v['label'], 'icon': icons['host'], 'origin': ORIGIN,
                           'mark': {'sheet': sheet, 'cols': cols, 'index': cell}, 'items': items})
