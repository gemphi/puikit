#!/usr/bin/env python3
"""Draw Phiegg's glasses on the shape of the squarest Phi font.

The frames are built on the capital O of Phi-Hard Light, the squarest Phi font, read from the font file: each frame
as thick as the O's stroke, its corners cut as the O's are, and the lens inside it cut the same way. Two of them
stand as far apart as two letters do, a bridge between them as thick as a stroke with an arch over the nose, and a hinge at each frame's outer top
corner. What the font cannot say (the canvas, how much wider than the letter a frame stands, the bridge's arch, the
hinges, the colours of the pair photographed on 25 November 2026) is art/glasses.tsv.

Writes art/glasses.svg, art/glasses-grid.svg (the same with the font's measures ruled over it) and art/glasses.png.
    python scripts/glasses.py [font.otf]
"""
import math, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.basePen import decomposeQuadraticSegment, decomposeSuperBezierSegment

ROOT = os.path.join(os.path.dirname(__file__), '..')
ART = os.path.join(ROOT, 'art')
FONT = os.path.join(ROOT, '..', '..', '..', 'phikit', 'crates', 'phiber', 'assets', 'phi-fonts', 'Phi-Hard', 'PhiHard-Light.otf')
STEPS = 12


def table(path):
    """The rows of a table: kind, name, value, between tabs."""
    rows = {}
    for line in open(path, encoding='utf-8'):
        cell = line.rstrip('\n').split('\t')
        if len(cell) == 3 and not line.startswith('#'):
            rows.setdefault(cell[0], {})[cell[1]] = cell[2]
    return rows


def flat(letter, font):
    """A letter's contours as lines of points, its curves cut into short steps, in the font's units (y up)."""
    glyph, name = font.getGlyphSet(), font.getBestCmap()
    pen = DecomposingRecordingPen(glyph)
    glyph[name[ord(letter)]].draw(pen)
    found, now, at = [], [], (0, 0)

    def cubic(p0, p1, p2, p3):
        for i in range(1, STEPS + 1):
            t = i / STEPS
            u = 1 - t
            now.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
                        u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))

    def quad(p0, p1, p2):
        for i in range(1, STEPS + 1):
            t = i / STEPS
            u = 1 - t
            now.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))

    for verb, points in pen.value:
        if verb == 'moveTo':
            now, at = [points[0]], points[0]
        elif verb == 'lineTo':
            now.append(points[0])
            at = points[0]
        elif verb == 'curveTo':
            for p1, p2, p3 in decomposeSuperBezierSegment(points) if len(points) > 3 else [points]:
                cubic(at, p1, p2, p3)
                at = p3
        elif verb == 'qCurveTo':
            for p1, p2 in decomposeQuadraticSegment(points):
                quad(at, p1, p2)
                at = p2
        elif verb in ('closePath', 'endPath'):
            found.append(now)
            now = []
    return found, glyph[name[ord(letter)]].width


def box(points):
    xs, ys = [x for x, _ in points], [y for _, y in points]
    return min(xs), min(ys), max(xs), max(ys)


def cut(x0, y0, x1, y1, c):
    """A rectangle with its corners cut as Phi-Hard cuts its own: eight sides, each corner cut c across."""
    return [(x0 + c, y0), (x1 - c, y0), (x1, y0 + c), (x1, y1 - c), (x1 - c, y1), (x0 + c, y1), (x0, y1 - c), (x0, y0 + c)]


def build(font_path):
    """The glasses in pixels: the frames' outlines and lenses, the bridge, the hinges, and the measures they came from.

    Phi-Hard's O is tall and its counter a slit (its strokes are heavy down the sides, light across), so a lens is not
    the counter as it stands: what the frames take from the letter is its stroke, as thick as the frame, and its cut
    corners, as large as the O's, at the proportion of the photographed pair (art/glasses.tsv)."""
    t = table(os.path.join(ART, 'glasses.tsv'))
    size = {k: float(v) for k, v in t['size'].items()}
    font = TTFont(font_path)
    contours, advance = flat('O', font)
    contours.sort(key=lambda c: box(c)[2] - box(c)[0], reverse=True)
    outer, counter = contours[0], contours[1]
    ox0, oy0, ox1, oy1 = box(outer)
    cx0, cy0, cx1, cy1 = box(counter)
    cap, bowl = oy1 - oy0, ox1 - ox0
    stem = cx0 - ox0
    gap = advance - bowl
    # How far along its top the O's corner is cut: where its top edge begins.
    chamfer = min(x for x, y in outer if abs(y - oy1) < 1) - ox0
    k = size['frame'] / cap                          # pixels to a unit of the font
    high, s = size['frame'], stem * k                # a frame's height, its stroke
    frame_w = high * size['wide']
    c = chamfer * k
    bridge = gap * size['bridge'] * k
    left = (size['width'] - (frame_w * 2 + bridge)) / 2
    top = (size['height'] - high) / 2
    frames = []
    for x in (left, left + frame_w + bridge):
        frames.append((cut(x, top, x + frame_w, top + high, c), cut(x + s, top + s, x + frame_w - s, top + high - s, max(c - s * 0.4, s * 0.25))))
    # The bridge: across the frames' cut corners at their top, a stroke
    # thick, down to the arch over the nose, as wide as the frames are apart.
    bx0, bx1 = left + frame_w - c, left + frame_w + bridge + c
    middle, arch = (bx0 + bx1) / 2, size['arch'] * high
    half = bridge / 2 + s * 0.15
    shape = [(bx0, top), (bx1, top), (bx1, top + arch), (middle + half, top + arch)]
    for n in range(25):
        a = math.pi * n / 24
        shape.append((middle + half * math.cos(a), top + arch - (arch - s) * math.sin(a)))
    shape += [(middle - half, top + arch), (bx0, top + arch)]
    # The hinges: out from each frame's outer top corner.
    hw, hh = size['hinge'] * s, size['hinge.high'] * s
    hinges = [(left - hw, top + c * 0.6, hw + s * 0.5, hh, 'left'), (left + frame_w * 2 + bridge - s * 0.5, top + c * 0.6, hw + s * 0.5, hh, 'right')]
    measures = {'cap': cap, 'bowl': bowl, 'stem': stem, 'counter': cx1 - cx0, 'chamfer': chamfer, 'gap': gap, 'advance': advance, 'k': k, 'top': top, 'left': left, 'frame_w': frame_w, 'bridge': bridge, 's': s}
    return t, size, frames, shape, hinges, measures


def path(points):
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in points) + ' Z'


def svg(t, size, frames, bridge, hinges, m, grid):
    ink = t['color']
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(size["width"])}" height="{int(size["height"])}" viewBox="0 0 {int(size["width"])} {int(size["height"])}">',
           '<defs><linearGradient id="shine" x1="0" y1="0" x2="0.35" y2="1">'
           f'<stop offset="0" stop-color="{ink["shine"]}" stop-opacity="0.85"/><stop offset="{size["shine"]}" stop-color="{ink["lens"]}" stop-opacity="0.55"/>'
           f'<stop offset="1" stop-color="{ink["lens"]}" stop-opacity="0.25"/></linearGradient></defs>',
           f'<rect width="100%" height="100%" fill="{ink["ground"]}"/>']
    for x, y, w, h, side in hinges:
        gold = x + w * 0.12 if side == 'left' else x + w * 0.56
        out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{h / 3:.1f}" fill="{ink["frame"]}"/>')
        out.append(f'<rect x="{gold:.1f}" y="{y + h * 0.28:.1f}" width="{w * 0.32:.1f}" height="{h * 0.44:.1f}" rx="{h * 0.1:.1f}" fill="{ink["gold"]}"/>')
    out.append(f'<path d="{path(bridge)}" fill="{ink["frame"]}"/>')
    for outer, counter in frames:
        out.append(f'<path d="{path(outer)} {path(counter)}" fill="{ink["frame"]}" fill-rule="evenodd"/>')
        out.append(f'<path d="{path(counter)}" fill="url(#shine)"/>')
        out.append(f'<path d="{path(outer)}" fill="none" stroke="{ink["edge"]}" stroke-width="2"/>')
    if grid:
        g = ink['guide']
        top, left, fw, s = m['top'], m['left'], m['frame_w'], m['s']
        for y, said in ((top, 'cap height'), (top + size['frame'], 'baseline'), (top + s, 'stroke')):
            out.append(f'<line x1="0" y1="{y:.1f}" x2="{size["width"]}" y2="{y:.1f}" stroke="{g}" stroke-width="1" stroke-dasharray="6 6"/>')
            out.append(f'<text x="8" y="{y - 4:.1f}" font-family="monospace" font-size="14" fill="{g}">{said}</text>')
        for x, said in ((left, 'O'), (left + fw, 'O + gap'), (left + fw + m['bridge'], 'O')):
            out.append(f'<line x1="{x:.1f}" y1="0" x2="{x:.1f}" y2="{size["height"]}" stroke="{g}" stroke-width="1" stroke-dasharray="6 6"/>')
            out.append(f'<text x="{x + 4:.1f}" y="20" font-family="monospace" font-size="14" fill="{g}">{said}</text>')
        out.append(f'<text x="8" y="{size["height"] - 10}" font-family="monospace" font-size="14" fill="{g}">Phi-Hard O: cap {m["cap"]:.0f}, stroke {m["stem"]:.0f}, corner cut {m["chamfer"]:.0f}, letters apart {m["gap"]:.0f} units</text>')
    out.append('</svg>')
    return '\n'.join(out)


def png(t, size, frames, bridge, hinges, path_out):
    """The same drawing as a picture: three times as large, then made smaller so its edges are smooth."""
    from PIL import Image, ImageDraw
    n = 3
    ink = t['color']
    hexed = lambda c, a=255: tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (a,)
    w, h = int(size['width']) * n, int(size['height']) * n
    im = Image.new('RGBA', (w, h), hexed(ink['ground']))
    d = ImageDraw.Draw(im)
    S = lambda pts: [(x * n, y * n) for x, y in pts]
    for x, y, hw, hh, side in hinges:
        gold = x + hw * 0.12 if side == 'left' else x + hw * 0.56
        d.rounded_rectangle([x * n, y * n, (x + hw) * n, (y + hh) * n], radius=hh * n / 3, fill=hexed(ink['frame']))
        d.rounded_rectangle([gold * n, (y + hh * 0.28) * n, (gold + hw * 0.32) * n, (y + hh * 0.72) * n], radius=hh * n * 0.1, fill=hexed(ink['gold']))
    d.polygon(S(bridge), fill=hexed(ink['frame']))
    for outer, counter in frames:
        d.polygon(S(outer), fill=hexed(ink['frame']))
        # The lens: the glass, lighter toward its top, where the lamp is.
        lens = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        mask = Image.new('L', (w, h), 0)
        ImageDraw.Draw(mask).polygon(S(counter), fill=255)
        x0, y0, x1, y1 = box(S(counter))
        shade = Image.new('RGBA', (w, h), hexed(ink['ground']))
        sd = ImageDraw.Draw(shade)
        for row in range(int(y0), int(y1) + 1):
            f = (row - y0) / max(y1 - y0, 1)
            light = max(0.0, 1 - f / size['shine'])
            base = hexed(ink['lens'])
            c = tuple(int(base[i] + (255 - base[i]) * light * 0.8) for i in range(3)) + (255,)
            sd.line([(x0, row), (x1, row)], fill=c)
        lens.paste(shade, (0, 0), mask)
        im.alpha_composite(lens)
    im = im.resize((int(size['width']), int(size['height'])), Image.LANCZOS)
    im.convert('RGB').save(path_out)


def main():
    font = sys.argv[1] if len(sys.argv) > 1 else FONT
    t, size, frames, bridge, hinges, m = build(font)
    for name, grid in (('glasses.svg', False), ('glasses-grid.svg', True)):
        open(os.path.join(ART, name), 'w', encoding='utf-8', newline='\n').write(svg(t, size, frames, bridge, hinges, m, grid))
    png(t, size, frames, bridge, hinges, os.path.join(ART, 'glasses.png'))
    print('cap %.0f, stroke %.0f, corner cut %.0f, gap %.0f (units)' % (m['cap'], m['stem'], m['chamfer'], m['gap']))


if __name__ == '__main__':
    main()
