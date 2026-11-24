"""Phiegg's 64 cities and the house's brands, from scripts/media/cities.json and brands.json.

Cities: a world is a city. The 16 Bold Cities are the main ones; 48 more are worlds Phiegg has (the original site's
names first, then its own, a name never twice, the generated names left out). Each gets a `city` field: its number
(1-64), `main` or `city`, and the set's name. A rerun clears every `city` field first.

Brands: core.json `brands`, a record a brand: its name, its logo (copied from its folder on the D drive to
public/brand/<slug>/, kept out of git), and for a shopping brand a shop in a zone of each main city (the zones turn
from brand to brand and city to city, so every zone has some). A rerun replaces exactly the records of origin brands.

Run from puikit/app/phiegg: py -3.13 scripts/cities.py"""
import re
import shutil
from pathlib import Path

from data_file import APP, dump, load, spec


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def cities(worlds, rule):
    """The 64 worlds that are cities, the main ones first."""
    for w in worlds:
        w.pop('city', None)
    main = [w for w in worlds if all(w.get(k) == v for k, v in rule['main'].items())]
    taken = {w['name'] for w in main}
    skip = re.compile(rule['skip'])
    named = {w['name']: w for w in reversed(worlds)}  # the first of a name wins
    other = [named[n] for n in rule['first'] if n in named and n not in taken]
    taken |= {w['name'] for w in other}
    for w in worlds:
        if len(main) + len(other) >= rule['count']:
            break
        if w['name'] not in taken and not skip.match(w['name']) and w.get('origin') != 'bold-cities':
            other.append(w)
            taken.add(w['name'])
    out = main + other[:rule['count'] - len(main)]
    for n, w in enumerate(out):
        w['city'] = {'n': n + 1, 'rank': 'main' if n < len(main) else 'city', 'set': rule['set']}
    return out, main


def brands(rule, main):
    """The brands, each with its logo and, for a shopping brand, its shops."""
    root, out = Path(rule['root']), []
    shoppers = [b for b in rule['brands'] if b.get('shop')]
    for b in rule['brands']:
        s = slug(b['name'])
        source = root / b['folder'] / b['logo']
        logo = f"brand/{s}/logo{source.suffix.lower()}"
        target = APP / 'public' / logo
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.exists():
            shutil.copyfile(source, target)
        shops = []
        if b.get('shop'):
            k = shoppers.index(b)
            for c, w in enumerate(main):
                zone = w['cities'][(k + c) % len(w['cities'])]
                shops.append({'id': f"sh_{s}_{slug(w['name'])}", 'brandId': f'b_{s}', 'name': f"{b['name']} {zone['name']}",
                              'worldId': w['id'], 'cityId': zone['id'], 'image': logo})
        line = f"{b['name']}: a shop in each of the {len(main)} main cities." if shops else f"{b['name']}, one of the house's brands."
        out.append({'id': f'b_{s}', 'origin': rule['origin'], 'name': b['name'], 'slug': s, 'image': logo, 'logo': logo,
                    'description': line, 'shop': bool(b.get('shop')), 'shopCount': len(shops),
                    'worldIds': [x['worldId'] for x in shops], 'shops': shops})
    return out


def main():
    path, text, core = load('core.json')
    picked, first = cities(core['worlds'], spec('cities'))
    rule = spec('brands')
    core['brands'] = [b for b in core.get('brands', []) if b.get('origin') != rule['origin']] + brands(rule, first)
    dump(path, text, core)
    print(len(picked), 'cities,', len(first), 'main:', ', '.join(w['name'] for w in picked))
    print(len(core['brands']), 'brands,', sum(b['shopCount'] for b in core['brands']), 'shops')


if __name__ == '__main__':
    main()
