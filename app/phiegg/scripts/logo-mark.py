"""Draw Phiegg's mark from its measures (scripts/logo-mark.tsv): a Phi-Pill stem
with round ends and its pill cut out, and two wings, each a quarter of
a ring closed by a thin bar, the whole leant. Lines and true arcs only
(scripts/logo_arc.py), one colour, the colour of the text round it.

    python scripts/logo-mark.py                   writes the mark's files and the site's data
    python scripts/logo-mark.py --check out.png   lays it over public/logo/phiegg-icon-drawing.png
    python scripts/logo-mark.py --sheet out.png   the mark in the sheet's colours

Nothing here is a size: every measure is a row of scripts/logo-mark.tsv, a share
of the stem's width, as the picture given has it. It writes the mark
(public/logo/phiegg-mark.svg), the mark for a browser's tab, and one
line of the site's data (`brand.pillMark` in src/data/site.json), which
the header's icon is drawn from."""
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import logo_arc as arc
from logo_arc import Arc, Line

BOX = 100.0


def table(path):
    rows = {}
    for line in open(path, encoding='utf-8'):
        part = line.rstrip('\n').split('\t')
        if len(part) >= 2 and not line.startswith('#'):
            rows[part[0]] = part[1]
    return rows


def measure(rows):
    return {name: float(value) for name, value in rows.items() if value.replace('.', '').replace('-', '').isdigit()}


def mark(m):
    """The mark's loops, upright, the stem one wide and the middle at
    (0, 0): the outline, the pill, and the two openings."""
    R, d, a = m['ring'], m['aside'], 0.5
    low, top, inner = m['bar.low'], m['bar.top'], m['inner']
    # The outline, clockwise from the stem's top: a flat to the wing's
    # top, the wing's arc, the bar's lower edge, the stem's free side,
    # the stem's round foot; and the same turned about the middle.
    half = [
        (Line((0, -R), (d, -R)), (0, 1, (d, -R))),
        (Arc((d, 0), R, 1), (m['round.tip'], 1, (d + R, low))),
        (Line((d + R, low), (a, low)), (m['round.notch'], -1, (a, low))),
        (Line((a, low), (a, R - a)), (0, 1, (a, R - a))),
        (Arc((0, R - a), a, 1), (0, 1, (0, R))),
    ]
    whole = half + [(arc.turn(piece), (r, way, (-near[0], -near[1]))) for piece, (r, way, near) in half]
    outline = arc.loop([piece for piece, _ in whole], [corner for _, corner in whole])
    # A wing's opening: the ring's inner arc, the bar's upper edge, the
    # stem's side. The arc has its own middle, so the ring thins.
    ri, k = R - m['band'], (d + m['band.aside'], m['band.down'])
    opening = arc.loop(
        [Arc(k, ri, 1), Line((k[0] + ri, top), (inner, top)), Line((inner, top), (inner, -ri))],
        [(m['round.point'], 1, (k[0] + ri, top)), (m['round.bar'], 1, (inner, top)), (m['round.stem'], 1, (inner, k[1] - ri))],
    )
    s, h = m['pill'] / 2, m['pill.long'] / 2
    pill = [('M', (-s, -(h - s))), ('A', (0, -(h - s)), s, (s, -(h - s)), 1), ('L', (s, h - s)), ('A', (0, h - s), s, (-s, h - s), 1), ('L', (-s, -(h - s)))]
    return [outline, pill, opening, arc.about(opening)]


def placed(m, box=BOX):
    """The loops leant and set in a square box with the room left."""
    leant = [arc.place(path, -m['lean'], 1, (0, 0)) for path in mark(m)]
    dot = arc.dots(leant[0], 0.002)
    left, right = min(x for x, _ in dot), max(x for x, _ in dot)
    high, foot = min(y for _, y in dot), max(y for _, y in dot)
    scale = box * (1 - 2 * m['room']) / max(right - left, foot - high)
    mid = (box / 2 - scale * (left + right) / 2, box / 2 - scale * (high + foot) / 2)
    return [arc.place(path, 0, scale, mid) for path in leant]


def svg(m, colour='currentColor', box=BOX):
    path = ' '.join(arc.svg(loop) for loop in placed(m, box))
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g"><path fill="%s" fill-rule="evenodd" d="%s"/></svg>\n' % (box, box, colour, path)


def raster(loops, size, fine=4):
    from PIL import Image, ImageDraw
    im = Image.new('L', (size[0] * fine, size[1] * fine), 0)
    pen = ImageDraw.Draw(im)
    for number, path in enumerate(loops):
        pen.polygon([(x * fine, y * fine) for x, y in arc.dots(path, 0.5 / fine)], fill=255 if number == 0 else 0)
    return im.resize(size, Image.LANCZOS)


def check(rows, out):
    """Lay the drawing over the picture, at the picture's own size."""
    import numpy as np
    from PIL import Image
    given = Image.open(os.path.join(APP, 'public', 'logo', 'phiegg-icon-drawing.png')).convert('RGBA')
    alpha = np.asarray(given)[:, :, 3] / 255.0
    green = np.asarray(given)[:, :, 1] / 255.0
    ink = np.clip(alpha * (1 - green), 0, 1) > 0.5 * (alpha * (1 - green)).max()
    ys, xs = np.nonzero(ink)
    m = measure(rows)
    leant = [arc.place(path, -m['lean'], 1, (0, 0)) for path in mark(m)]
    dot = arc.dots(leant[0], 0.002)
    scale = (ys.max() + 1 - ys.min()) / (max(y for _, y in dot) - min(y for _, y in dot))
    mid = ((xs.min() + xs.max() + 1) / 2, (ys.min() + ys.max() + 1) / 2)
    loops = [arc.place(path, 0, scale, mid) for path in leant]
    mine = np.asarray(raster(loops, given.size, 8)) > 127
    print('dots that differ: %d of %d inked' % (int((mine != ink).sum()), int(ink.sum())))
    big = 12
    over = Image.new('RGB', (given.width * big, given.height * big), 'white')
    over.paste(given.resize(over.size, Image.NEAREST), (0, 0), given.resize(over.size, Image.NEAREST))
    from PIL import ImageDraw
    pen = ImageDraw.Draw(over)
    for path in loops:
        dots = [(x * big, y * big) for x, y in arc.dots(path, 0.05)]
        pen.line(dots + dots[:1], fill=(0, 0, 0), width=2)
    over.save(out)


def sheet(rows, out):
    """The mark in the picture's ink, in black and in white."""
    from PIL import Image
    cell, tone = 360, [(rows['ink'], '#ffffff'), ('#111111', '#e9e9e4'), ('#f4f4f0', '#141414')]
    page = Image.new('RGB', (cell * len(tone), cell), 'white')
    mask = raster(placed(measure(rows), cell), (cell, cell))
    for column, (ink, ground) in enumerate(tone):
        tile = Image.new('RGB', (cell, cell), ground)
        tile.paste(Image.new('RGB', (cell, cell), ink), (0, 0), mask)
        page.paste(tile, (column * cell, 0))
    page.save(out)


def tab(rows, m, box=BOX):
    """The mark for a browser's tab: its own ink, light or dark."""
    path = ' '.join(arc.svg(loop) for loop in placed(dict(m, room=m['tab.room']), box))
    style = 'path{fill:%s}@media(prefers-color-scheme:dark){path{fill:%s}}' % (rows['tab.ink'], rows['tab.ink.dark'])
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g"><style>%s</style><path fill-rule="evenodd" d="%s"/></svg>\n' % (box, box, style, path)


def site(rows, m):
    """Keep the mark in the site's data, under `brand`, as one line of
    its own: the rest of the file is left exactly as it is."""
    import json
    target, key = os.path.join(APP, rows['site']), rows['site.key']
    path = ' '.join(arc.svg(loop) for loop in placed(m))
    note = "Phiegg's mark: a Phi-Pill stem with its pill cut out and two wings, leant; one flat shape, filled even-odd in the text's colour. Drawn by scripts/logo-mark.py from scripts/logo-mark.tsv, which also writes the files."
    line = '  %s: %s,' % (json.dumps(key), json.dumps({'note': note, 'path': path, 'file': rows['site.file'], 'tab': rows['site.tab']}))
    text = io.open(target, encoding='utf-8', newline='').read()
    end = '\r\n' if '\r\n' in text else '\n'
    row = text.split(end)
    start = '  %s: ' % json.dumps(key)
    held = [at for at, one in enumerate(row) if one.startswith(start)]
    brand = next(at for at, one in enumerate(row) if one.strip() == '"brand": {')
    row[held[0] if held else brand + 1:(held[0] + 1) if held else brand + 1] = [line]
    json.loads(end.join(row))
    io.open(target, 'w', encoding='utf-8', newline='').write(end.join(row))
    return rows['site']


def write(place, text):
    target = os.path.join(APP, 'public', *place.split('/'))
    with open(target, 'w', encoding='utf-8', newline='\n') as out:
        out.write(text)
    return os.path.relpath(target, APP)


if __name__ == '__main__':
    rows = table(os.path.join(HERE, 'logo-mark.tsv'))
    args = sys.argv[1:]
    todo = {'--check': check, '--sheet': sheet}
    ran = [todo[name](rows, args[at + 1]) for at, name in enumerate(args) if name in todo]
    m = measure(rows)
    print('wrote', write(rows['site.file'], svg(m)), write(rows['site.tab'], tab(rows, m)), site(rows, m))
