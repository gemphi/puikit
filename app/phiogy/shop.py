"""Phiegg's stores as Phiogy's shops.

A store of Phiegg (`app/phiegg/src/data/stores.json`) sells looks; the one taxonomy every fashion shop is laid out by
(`catalog.json`: departments, then categories) says where each look sits, by the same rules Phiegg's own menu follows
(`app/phiegg/src/lib/catalog.js`). This step writes every store as a shop a person can open in Phiogy: its landing (a
wide picture of its world, what is new), its menu (the departments as headings, their categories as pages) and its
products, once, with each page naming its products by their place in that list. A store whose club mints PFTs sells
them too. A PFT's picture is its cell of Phiegg's portrait sheets (`sprite`); a theme's is its own colours (`swatch`:
its ground, then its accents). Each product carries what its own page shows (`page`): a look's views, its story, its
facts and what it gives; `page` in `shop.json` names the facts by their label and where they are in the record.
The house shop `shop.json` names sells the themes, every PFT and one look from each of the first stores.

    python app/phiogy/shop.py

It writes `public/data/shop.json` (the shops there are, and the ones open from the start), one file a shop under
`public/data/shop/`, and where the index is into `public/data/phiogy.json` (`shop`). Nothing is decided here: the
words, the icons, the prices of themes and the house shop are all in `shop.json`.
"""
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))


def read(path):
    with io.open(path, encoding='utf-8') as f:
        return json.load(f)


def write(path, data, wide=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write((json.dumps(data, indent=2, ensure_ascii=False) if wide else json.dumps(data, separators=(',', ':'), ensure_ascii=False)) + '\n')


def at(o, path):
    for k in path.split('.'):
        o = o.get(k) if isinstance(o, dict) else None
    return o


def words(v):
    return [str(x).lower() for x in ([] if v is None else v if isinstance(v, list) else [v])]


def meets(product, rule):
    """A product meets a node's rule as in Phiegg's catalog.js: every field named holds one of its values, and one of
    its garments carries one of the garment words."""
    return (all(any(v in words(want) for v in words(at(product, path))) for path, want in rule.get('match', {}).items())
            and (not rule.get('garment') or any(w in g for g in words(product.get('garments')) for w in words(rule['garment']))))


def main():
    cfg = read(os.path.join(HERE, 'shop.json'))
    src = os.path.normpath(os.path.join(HERE, cfg['source']))
    art = os.path.normpath(os.path.join(HERE, cfg['art']))
    stores, catalog = read(os.path.join(src, 'stores.json'))['stores'], read(os.path.join(src, 'catalog.json'))
    themes, pfts = read(os.path.join(src, 'themes.json'))['themes'], read(os.path.join(src, 'assets.json'))['profiles']
    portraits = read(os.path.join(src, 'portraits.json'))
    angles = read(os.path.join(src, 'ls.json'))['views']
    page = cfg['page']
    icon, word, pic = cfg['icon'], cfg['word'], cfg['picture']
    money = lambda usd: cfg['money'].replace('{n}', format(round(usd), ','))

    def said(v):
        return ', '.join(said(x) for x in v) if isinstance(v, list) else format(v, ',') if isinstance(v, int) and not isinstance(v, bool) else str(v)

    def facts(record, rows):
        """The facts of a record its page lists: each label with what the record holds there, when it holds anything."""
        return [[label, said(at(record, path))] for label, path in rows if at(record, path) not in (None, '', [], False, True)]

    def look(l):
        specs = l.get('specs', {})
        # `look` says Phiora knows this product and prices it itself when it is bought (its shop routes).
        out = {'id': l['id'], 'title': l['name'], 'sub': money(l['usd']), 'cost': l['usd'], 'tag': l.get('rarity'), 'look': True}
        if l.get('views', {}).get(cfg['view']): out['image'] = pic + l['views'][cfg['view']]
        if specs.get('category'): out['kind'] = specs['category'].capitalize()
        out['meta'] = ' · '.join(x for x in (l.get('colour'), specs.get('season')) if x)
        views = [{'label': a['label'], 'image': pic + l['views'][a['id']]} for a in angles
                 if l.get('views', {}).get(a['id']) and os.path.exists(os.path.join(art, *l['views'][a['id']].split('/')))]
        out['page'] = {'viewList': views, 'fieldList': facts(l, page['look'])}
        if at(l, page['body']): out['page']['body'] = at(l, page['body'])
        if at(l, page['point']): out['page']['pointList'] = at(l, page['point'])
        return out
    hsl = lambda c: cfg['hsl'].replace('{h}', format(c[0], 'g')).replace('{s}', format(c[1], 'g')).replace('{l}', format(c[2], 'g'))
    theme = lambda t: {'id': 'theme_' + t['id'], 'title': t['name'], 'sub': money(cfg['theme']['usd']), 'cost': cfg['theme']['usd'], 'kind': cfg['theme']['kind'],
                       'swatch': [t['seed']] + [hsl(t[k]) for k in ('accent', 'accent2') if t.get(k)], 'wear': {'palette': t['id']}, 'page': {'fieldList': facts(t, page['theme'])}}
    # A ground (Ripple) is a theme too: worn, it lays itself under the whole window; one the house gives is everybody's.
    ground = lambda g: {'id': 'ground_' + g['id'], 'title': g['name'], 'sub': money(g['usd']), 'cost': g['usd'], 'kind': cfg['theme']['kind'],
                        'swatch': g['swatch'], 'wear': {'ground': g['id']}, 'given': bool(g.get('given')), 'page': {'body': g['story']}}
    pft = lambda p: {'id': p['id'], 'title': p['name'], 'sub': money(p['priceUsd']), 'cost': p['priceUsd'], 'kind': cfg['pft']['kind'], 'meta': p.get('set'),
                     'sprite': {'sheet': pic + cfg['portrait'] + portraits['sheets'][p['sheet']], 'cols': portraits['cols'], 'index': p['index']},
                     'page': {'fieldList': facts(p, page['pft'])}}

    def shop(sid, label, sub, image, looks, extra):
        """One shop's file: its products once, its menu (each page the places of its products), and its landing."""
        product = [look(l) for l in looks]
        menu = []
        for d in catalog['departments']:
            inside = [i for i, l in enumerate(looks) if meets(l, d)]
            pages = []
            for c in catalog['categories']:
                here = [i for i in inside if (at(looks[i], c['from']) if c.get('from') else any(meets(looks[i], it) for it in c['items']))]
                if here: pages.append({'id': '%s.%s.%s' % (sid, d['id'], c['id']), 'label': c['label'], 'icon': icon['node'], 'count': len(here), 'at': here})
            if pages: menu.append({'id': '%s.%s' % (sid, d['id']), 'label': d['label'], 'icon': icon['node'], 'head': True, 'items': pages})
        for key, label_, records in extra:
            if not records: continue
            first = len(product); product.extend(records)
            menu.append({'id': '%s.%s' % (sid, key), 'label': label_, 'icon': icon[key], 'count': len(records), 'at': list(range(first, len(product)))})
        doors = [{'label': m['label'], 'view': (m.get('items') or [m])[0]['id']} for m in menu]
        hero = {'kind': 'hero', 'variant': 'wide', 'heading': label, 'subtitle': sub, 'actions': doors}
        if image and os.path.exists(os.path.join(art, *image.split('/'))): hero['image'] = pic + image
        landing = [hero, {'kind': 'grid', 'title': word['new'], 'at': list(range(min(cfg['new'], len(product))))}]
        return {'id': sid, 'label': label, 'sub': sub, 'icon': icon['shop'], 'count': len(product), 'menu': menu, 'product': product, 'landing': landing}

    made = []
    house = cfg['house']
    best = [s['looks'][0] for s in stores[:house['look']] if s['looks']]
    made.append(shop(house['id'], house['label'], house['tagline'], house['image'], best,
                     [('theme', cfg['theme']['label'], [ground(g) for g in cfg.get('ground', {}).get('list', [])] + [theme(t) for t in themes]), ('pft', cfg['pft']['label'], [pft(p) for p in pfts])]))
    for s in stores:
        sid = 's_' + re.sub(r'^g_st_', '', s['id'])
        world = at(s['looks'][0], 'specs.provenance.worldId') if s['looks'] else None
        made.append(shop(sid, s['name'], s.get('tagline'), cfg['world'].replace('{id}', world) if world else None, s['looks'],
                         [('pft', cfg['pft']['label'], [pft(p) for p in pfts if p.get('clubId') == s.get('clubId')])]))
    assert len({m['id'] for m in made}) == len(made)
    for m in made:
        write(os.path.join(HERE, *cfg['folder'].split('/'), m['id'] + '.json'), m)
    rel = lambda p: p.split('public/', 1)[-1]
    write(os.path.join(HERE, *cfg['index'].split('/')), {'folder': rel(cfg['folder']), 'open': cfg['open'],
          'shop': [{k: m[k] for k in ('id', 'label', 'sub', 'icon', 'count') if m.get(k) is not None} for m in made]})
    app_path = os.path.join(HERE, 'public', 'data', 'phiogy.json')
    app = read(app_path); app['shop'] = rel(cfg['index']); write(app_path, app, wide=True)
    sizes = sorted(m['count'] for m in made)
    print('shops %d; products a shop: least %d, middle %d, most %d; with a picture of its world: %d' % (
        len(made), sizes[0], sizes[len(sizes) // 2], sizes[-1], sum('image' in m['landing'][0] for m in made)))


if __name__ == '__main__':
    main()
