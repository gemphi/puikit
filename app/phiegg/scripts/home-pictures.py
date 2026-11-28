"""The home and About pages' finished renders (scripts/media/home-pictures.json): each set of renders is written as
webp under public/. A set that is `cut` (the default) has each render with a clear ground cropped to its figure and set
whole on a card of the set's ratio; a `whole` set keeps each picture as it is, made no taller than `height`. A name
given on the command line writes only that set. Writes pictures only; no data file is touched."""
import json
import sys
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[1]
SPEC = json.loads((APP.parents[1] / 'scripts' / 'media' / 'home-pictures.json').read_text(encoding='utf8'))
ROOTS = {'{DL}': str(Path.home() / 'Downloads')}


def real(path):
    for k, v in ROOTS.items():
        path = path.replace(k, v)
    return Path(path)


def write(group):
    """One set: its own values, the file's for whatever it leaves unsaid."""
    g = {**{k: SPEC[k] for k in ('ratio', 'height', 'margin', 'quality')}, **group}
    source = real(g['source']); out = APP / 'public' / g['out']; out.mkdir(parents=True, exist_ok=True)
    height = g['height']
    for p in g['picture']:
        im = Image.open(source / p['file']).convert('RGBA')
        if g.get('fit') == 'whole':
            k = min(1, height / im.height)
            card = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        else:
            rw, rh = g['ratio']; width = round(height * rw / rh)
            figure = im.crop(im.getchannel('A').getbbox())
            # The whole figure on the card: as tall as the card less its margins, or as wide as the card, whichever is smaller.
            k = min(height * (1 - 2 * g['margin']) / figure.height, width * (1 - 2 * g['margin']) / figure.width)
            figure = figure.resize((round(figure.width * k), round(figure.height * k)), Image.LANCZOS)
            card = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            card.paste(figure, ((width - figure.width) // 2, (height - figure.height) // 2), figure)
        card.save(out / f"{p['name']}.webp", 'WEBP', quality=g['quality'], method=6)
        print(g['out'], p['name'], card.size, (out / f"{p['name']}.webp").stat().st_size)


only = set(sys.argv[1:])
for group in [{'id': 'dress', **{k: SPEC[k] for k in ('source', 'out', 'picture')}}, *SPEC.get('group', [])]:
    if not only or group['id'] in only:
        write(group)
