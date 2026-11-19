"""The home page's finished renders (scripts/media/home-pictures.json): each render with a clear ground is set whole
on a card of the given ratio and written as webp under public/. Writes pictures only; no data file is touched."""
import json
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[1]
SPEC = json.loads((APP.parents[1] / 'scripts' / 'media' / 'home-pictures.json').read_text(encoding='utf8'))
ROOTS = {'{DL}': str(Path.home() / 'Downloads')}


def real(path):
    for k, v in ROOTS.items():
        path = path.replace(k, v)
    return Path(path)


source = real(SPEC['source']); out = APP / 'public' / SPEC['out']; out.mkdir(parents=True, exist_ok=True)
rw, rh = SPEC['ratio']; height = SPEC['height']; width = round(height * rw / rh)
for p in SPEC['picture']:
    im = Image.open(source / p['file']).convert('RGBA')
    figure = im.crop(im.getchannel('A').getbbox())
    # The whole figure on the card: as tall as the card less its margins, or as wide as the card, whichever is smaller.
    room = height * (1 - 2 * SPEC['margin'])
    k = min(room / figure.height, width * (1 - 2 * SPEC['margin']) / figure.width)
    figure = figure.resize((round(figure.width * k), round(figure.height * k)), Image.LANCZOS)
    card = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    card.paste(figure, ((width - figure.width) // 2, (height - figure.height) // 2), figure)
    card.save(out / f"{p['name']}.webp", 'WEBP', quality=SPEC['quality'], method=6)
    print(p['name'], card.size, (out / f"{p['name']}.webp").stat().st_size)
