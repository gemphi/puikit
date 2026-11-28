"""Phiegg's collections and clubs, and their items, as Phiogy's asset library.

A collection of Phiegg (`collections.json`) is a family of clubs; a club (`core.json`) is a set of items a creator
made, Bold Pups' 10,000 pups the largest; an item here is a club's profile (`assets.json`: a portrait cell and the
traits it was made of). This step writes them into `public/data/shelf.json`, which the native Phiogy's library reads:
the collections with their clubs, every club with what it is (the attributes Phiegg's `kinds.json` lists for a club,
in Phiegg's own words) and its items, each with its picture and its traits.

    python app/phiogy/library.py

Nothing is decided here: which kinds, which fields, how many items a club brings, and the words for a trait are in
`library.json` beside it.
"""
import io
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(path):
    with io.open(path, encoding='utf-8') as f:
        return json.load(f)


def get(record, path):
    """A field of a record by a dotted path (`worldIds.0`)."""
    for step in path.split('.'):
        if isinstance(record, list):
            record = record[int(step)] if step.isdigit() and int(step) < len(record) else None
        elif isinstance(record, dict):
            record = record.get(step)
        else:
            return None
    return record


def main():
    cfg = read(os.path.join(HERE, 'library.json'))
    src = os.path.normpath(os.path.join(HERE, cfg['source']))
    core, collections, kinds, assets, portraits, site = (read(os.path.join(src, n + '.json')) for n in ('core', 'collections', 'kinds', 'assets', 'portraits', 'site'))
    copy = site.get('copy', {})
    word = lambda key: copy.get(key, key)
    world = lambda wid: cfg['world'].replace('{id}', wid) if wid else ''
    # What a club is: the fields Phiegg's kind lists, in its words, with each club's value.
    fields = [f for f in kinds[cfg['kind']]['fields'] if f['id'] not in cfg['leave']]
    def attribute(record, field_list):
        out = []
        for f in field_list:
            value = get(record, f['id'])
            if value in (None, '', []):
                continue
            out.append([word(f['label']), ', '.join(map(str, value)) if isinstance(value, list) else str(value)])
        return out
    sheets = portraits['sheets']
    by_club = {}
    for p in assets['profiles']:
        by_club.setdefault(p['clubId'], []).append(p)
    clubs = []
    for c in core['clubs']:
        items = []
        for p in by_club.get(c['id'], [])[:cfg['most']]:
            trait = [[cfg['trait'].get(k, k), str(v)] for k, v in p.get('traits', {}).items()]
            items.append({'id': p['id'], 'name': p['name'], 'cell': [cfg['sheet'] + sheets[p['sheet']], portraits['cols'], p['index']], 'attribute': trait})
        clubs.append({'id': c['id'], 'name': c['name'], 'tagline': c.get('tagline', ''), 'collection': c.get('nestId', ''), 'world': world((c.get('worldIds') or [''])[0]),
                      'supply': c.get('supply', 0), 'attribute': attribute(c, fields), 'item': items})
    named = {c['id'] for c in clubs}
    cols = [{'id': n['id'], 'name': n['name'], 'topic': n.get('topic', ''), 'world': world(n.get('worldId')),
             'club': [c['id'] for c in clubs if c['collection'] == n['id']]} for n in collections['collections']]
    out = {'about': cfg['about'], 'collection': cols, 'club': clubs}
    path = os.path.join(HERE, 'public', 'data', 'shelf.json')
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(out, separators=(',', ':'), ensure_ascii=False) + '\n')
    items = sum(len(c['item']) for c in clubs)
    print('collections %d, clubs %d (%d in a collection), items %d' % (len(cols), len(clubs), sum(1 for c in clubs if c['collection']), items))
    assert named, 'no clubs'


if __name__ == '__main__':
    main()
