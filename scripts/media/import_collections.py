"""Import the finished NFT collections into the local media store, each token as metadata plus a sized image.

    python scripts/media/import_collections.py [--images]

Writes media/phi-media/collections/<slug>/:
    collection.json             name, counts, where it came from, and how many tokens still lack an image
    items/<token>.json          name, image key, attributes as { trait_type, value }
    index/page-NNNN.json        tokens in order, 100 a page
    images/<token>.webp         only with --images, read from the collection's zips
and media/phi-media/lands/types.json, the 16 official land types in their numbered order.
The finals live on Google Drive (drive-map.json). Download those folders as zips into Downloads or media/incoming, or sync
them there; images and attribute sheets are found by file name, in zips or folders alike. Until EPAC's finals arrive, Bold
Ape Epic Club holds its old images, which Drive files under BAEC-NFTS-OLD.
Only collections made here are imported. The old seed's third-party clubs (Pudgy Penguins and the like) and their
hotlinked pictures are left out. Sources are only read.
"""
import io
import json
import os
import re
import sys
import zipfile
from pathlib import Path

import openpyxl
from PIL import Image

ROOT = Path(__file__).parents[2]
OUT = Path(os.environ.get('PHI_MEDIA_OUT', ROOT / 'media/phi-media'))
DOWN = Path.home() / 'Downloads'
OLD = Path('D:/Dowloads/Workspace/gemrepo/gemphi/phiadk/phiadk-js/web/data/seeds')
PAGE = 100
SIDE = 768


def write(key, value):
    path = OUT / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1), encoding='utf8')


def publish(slug, name, source, tokens, note=''):
    """tokens: { id: { name, attributes } }."""
    images = OUT / f'collections/{slug}/images'
    have = {p.stem for p in images.glob('*.webp')} if images.exists() else set()
    rows = []
    for token, item in sorted(tokens.items()):
        image = f'collections/{slug}/images/{token}.webp' if token in have else None
        write(f'collections/{slug}/items/{token}.json', {'id': token, **item, 'image': image})
        rows.append({'id': token, 'name': item['name'], 'item': f'collections/{slug}/items/{token}.json', 'image': image})
    for i in range(0, len(rows), PAGE):
        write(f'collections/{slug}/index/page-{i // PAGE + 1:04}.json', {'page': i // PAGE + 1, 'items': rows[i:i + PAGE]})
    missing = sum(1 for r in rows if not r['image'])
    extra = len(have - set(tokens))
    write(f'collections/{slug}/collection.json', {'slug': slug, 'name': name, 'source': source, 'tokens': len(rows), 'imagesMissing': missing, 'imagesWithoutRecord': extra, 'note': note})
    print(f'{name:22} tokens {len(rows):6}  images missing {missing:6}  images without a record {extra}')


def from_old_seed(slug, name):
    assets = json.loads((OLD / f'assets/{slug}.json').read_text(encoding='utf8'))
    attributes = json.loads((OLD / f'asset_attributes/{slug}.json').read_text(encoding='utf8'))
    traits = {}
    for a in attributes:
        traits.setdefault(a['asset_slug'], []).append({'trait_type': a['key'].removeprefix('trait_'), 'value': a['value']})
    tokens = {}
    for asset in assets:
        token = asset['slug'].rsplit('-', 1)[-1]
        tokens[token] = {'name': asset['name'], 'type': asset.get('asset_type'), 'priceUsd': asset.get('price_usd'), 'attributes': traits.get(asset['slug'], [])}
    publish(slug, name, f'old seed: assets/{slug}.json, asset_attributes/{slug}.json', tokens, 'Images were at /worlds/CLUBS/' + slug.upper() + '/ in the old project and are not on these drives.')


def bbpc():
    book = Path('D:/Dowloads/OLD-FEB-2026/_BBPC_ASSETS_V1.xlsx')
    sheet = openpyxl.load_workbook(book, read_only=True, data_only=True)['Assets']
    rows = sheet.iter_rows(values_only=True)
    head = [str(c).strip() if c else '' for c in next(rows)]
    tokens = {}
    for row in rows:
        cell = dict(zip(head, row))
        item = str(cell.get('Item #') or '').strip()
        if not re.fullmatch(r'\d+', item):
            continue
        attrs = [{'trait_type': k, 'value': str(v).strip()} for k, v in cell.items() if k and k != 'Item #' and v not in (None, '', 'TBC')]
        tokens[item.zfill(5)] = {'name': f'BBPC #{item.zfill(5)}', 'description': cell.get('Item Description'), 'attributes': attrs}
    publish('bbpc', 'BBPC', book.name, tokens, 'Role, Scene, Series and Edition are mostly TBC in the sheet and are left out where they are.')


def zipped(slug, name, zips, pattern):
    """Tokens taken from numbered files in a set of zips; with --images each is sized into the store."""
    images = OUT / f'collections/{slug}/images'
    tokens = {}
    made = 0
    for zip_path in zips:
        with zipfile.ZipFile(zip_path) as zf:
            for entry in zf.namelist():
                m = re.fullmatch(pattern, entry)
                if not m:
                    continue
                token = m.group(1).zfill(5)
                tokens[token] = {'name': f'{name} #{token}', 'attributes': []}
                target = images / f'{token}.webp'
                if '--images' in sys.argv and not target.exists():
                    images.mkdir(parents=True, exist_ok=True)
                    im = Image.open(io.BytesIO(zf.read(entry))).convert('RGBA')
                    im.thumbnail((SIDE, SIDE), Image.LANCZOS)
                    im.save(target, 'WEBP', quality=80, method=4)
                    made += 1
    if '--images' in sys.argv:
        print(name, 'images made', made)
    publish(slug, name, ', '.join(z.name for z in zips), tokens, 'No attribute sheet found yet: tokens carry numbers and images only.')


def incoming():
    """Everything downloaded so far: (name, reader) for each file, from zips and plain folders in the incoming places."""
    places = [DOWN, ROOT / 'media/incoming']
    for place in places:
        if not place.exists():
            continue
        for path in place.rglob('*'):
            if path.suffix.lower() == '.zip' and re.search(r'(?i)drive-download|epac|bpsc|bpwc|bold-nfts|final-nfts', path.name):
                try:
                    with zipfile.ZipFile(path) as zf:
                        for entry in zf.namelist():
                            yield entry.rsplit('/', 1)[-1], (lambda z=path, e=entry: zipfile.ZipFile(z).read(e))
                except zipfile.BadZipFile:
                    print('bad zip', path)
            elif path.is_file() and path.suffix.lower() in ('.png', '.xlsx') and place.name == 'incoming':
                yield path.name, path.read_bytes


def sheet_rows(data, key):
    """Rows of every tab whose header has `key`, as dicts."""
    book = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    for ws in book.worksheets:
        rows = ws.iter_rows(values_only=True)
        head = next(rows, None)
        if not head or key not in [str(c).strip() for c in head if c]:
            continue
        names = [str(c).strip() if c else '' for c in head]
        for row in rows:
            yield ws.title, dict(zip(names, row))


def final(slug, name, image, sheet, key, source, club=None):
    """A collection from Drive's finals. image: the file name pattern with the token. sheet: the attribute sheet's name."""
    images = OUT / f'collections/{slug}/images'
    tokens, made = {}, 0
    for file_name, read in incoming():
        m = re.fullmatch(image, file_name, re.I)
        if m:
            token = m.group(1).zfill(5)
            tokens.setdefault(token, {'name': f'{name} #{token}', 'attributes': []})
            target = images / f'{token}.webp'
            if '--images' in sys.argv and not target.exists():
                images.mkdir(parents=True, exist_ok=True)
                im = Image.open(io.BytesIO(read())).convert('RGBA')
                im.thumbnail((SIDE, SIDE), Image.LANCZOS)
                im.save(target, 'WEBP', quality=80, method=4)
                made += 1
        elif file_name.lower() == sheet.lower():
            for tab, row in sheet_rows(read(), key):
                number = str(row.get(key) or '').strip()
                if not re.fullmatch(r'\d+', number):
                    continue
                token = number.zfill(5)
                attrs = [{'trait_type': k, 'value': str(v).strip()} for k, v in row.items() if k and k != key and k != 'ng' and v not in (None, '')]
                item = tokens.setdefault(token, {'name': f'{name} #{token}', 'attributes': []})
                item['attributes'] = attrs
    if not tokens:
        print(f'{name:22} nothing downloaded yet ({image})')
        return
    if made:
        print(name, 'images made', made)
    publish(slug, name, source, tokens)
    if club:
        clubs = {}
        for token, item in tokens.items():
            value = next((a['value'] for a in item['attributes'] if a['trait_type'] == club), None)
            if value:
                clubs.setdefault(value, []).append(token)
        for value, members in clubs.items():
            write(f'collections/{slug}/clubs/{value.lower()}.json', {'club': value, 'tokens': sorted(members)})
        print(name, 'clubs', {k: len(v) for k, v in clubs.items()})


def land_types():
    types = json.loads((OLD / 'land_types.json').read_text(encoding='utf8'))
    groups = ['Natural Environments', 'Aquatic & Submerged Zones', 'Fantasy & Extreme Terrains', 'Urban & City Zones']
    write('lands/types.json', [{'number': i + 1, 'group': groups[i // 4], **t} for i, t in enumerate(types)])
    print('land types', len(types))


def main():
    land_types()
    if not any(re.fullmatch(r'BPSC-\d+\.png', n, re.I) for n, _ in incoming()):
        from_old_seed('bold-pups', 'Bold Pups')
    from_old_seed('epic-pods', 'Epic Pods')
    bbpc()
    zipped('bold-ape-epic-club', 'Bold Ape Epic Club', sorted(Path('D:/Dowloads/Documents/BOLDLAND/Bold_NFTs').glob('BOLD_APE-*.zip')), r'BOLD_APE/BAEC_FINAL/(\d+)\.png')
    final('epac', 'EPAC', r'EPAC-(\d+)\.png', 'FINAL-NFT-NONPIXEL.xlsx', 'NUMBER', 'Drive: BOLD-NFTS-FINAL')
    final('bold-pups', 'Bold Pups', r'BPSC-(\d+)\.png', 'BPWC-1-1000.xlsx', 'Number', 'Drive: FINAL-NFTS/BPSC-NFTS-8000, BPWC-1-1000', club='Club')
    zipped('hhoc', 'HHOC', sorted(DOWN.glob('HHOC-NFTS-2000-*.zip')), r'HHOC-NFTS-2000/HHOC-(\d+)\.png')


if __name__ == '__main__':
    main()
