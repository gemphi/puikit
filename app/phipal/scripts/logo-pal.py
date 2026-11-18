"""Draw Phipal's mark as sketched: the P with a quarter circle for its hole and its foot cut short, and its mirror,
the q (two pals facing).

    python scripts/logo-pal.py public/logo/pal.json

The walls come from the font's p (Phi-Soft Light): the stem, the right wall, the top and the bottom are as thick as
the font draws them around its counter, and the shoulder that runs from the bowl's bottom into the stem is the
font's own round. The rest is the sketch, in pal.json:
  - hole: the radius of the quarter circle; its corner is the counter's bottom-left, flat up the stem and flat
    along the bottom, round towards the top right;
  - round: the outer corners, top right, bottom right, and the small ones at the stem's top and foot;
  - the foot is cut short where the shoulder ends: the stem stops as deep as the shoulder is.
This writes pal-p.svg and pal-q.svg (one colour, the 100 box, `fill` across its longer side), a sheet of the two
on tiles, and the registry's icon for Phipal."""
import json, os, sys

from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont

spec_path = sys.argv[1]
base = os.path.dirname(os.path.abspath(spec_path))
spec = json.load(open(spec_path, encoding='utf-8'))

# The font's p, as point lists.
font = TTFont(os.path.normpath(os.path.join(base, spec['font'])))
glyphs = font.getGlyphSet()
pen = DecomposingRecordingPen(glyphs)
glyphs[font.getBestCmap()[ord(spec['letter'])]].draw(pen)
rings = []
for op, args in pen.value:
    match op:
        case 'moveTo':
            rings.append([args[0]])
        case 'lineTo':
            rings[-1].append(args[0])
        case _:
            pass
area = lambda q: abs(sum(q[i][0] * q[i - 1][1] - q[i - 1][0] * q[i][1] for i in range(len(q))) / 2)
outer, counter = sorted(rings, key=area, reverse=True)[:2]
box = lambda q: (min(x for x, _ in q), max(x for x, _ in q), min(y for _, y in q), max(y for _, y in q))
ox0, ox1, oy0, oy1 = box(outer)
cx0, cx1, cy0, cy1 = box(counter)
stem, right, top, bottom = cx0 - ox0, ox1 - cx1, oy1 - cy1, cy0  # the bowl sits on the baseline, y = 0
# The shoulder: the stem's inner edge is straight below it; how deep it reaches under the baseline is its round.
shoulder = -max(y for x, y in outer if y < 0 and abs(x - (ox0 + stem)) < 2)

r, rd = spec['hole'], spec['round']
W, H = stem + r + right, top + r + bottom          # the bowl, on screen (y down) from its top-left
F = shoulder                                        # the foot ends where the shoulder does
a, t, b = rd['foot'], rd['top'], rd['bottom']
num = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
s = spec['fill'] / max(W, H + F)
ox, oy = 50 - s * W / 2, 50 - s * (H + F) / 2


def mark(mirror):
    """The letter in the 100 box as M/H/V/A commands; mirrored across its middle for the q."""
    X = (lambda x: num(ox + s * (W - x))) if mirror else (lambda x: num(ox + s * x))
    Y = lambda y: num(oy + s * y)
    R = lambda v: num(s * v)
    cw, ccw = ('0', '1') if mirror else ('1', '0')   # a mirror turns every arc the other way
    return (f'M{X(a)} {Y(0)}H{X(W - t)}A{R(t)} {R(t)} 0 0 {cw} {X(W)} {Y(t)}V{Y(H - b)}'
            f'A{R(b)} {R(b)} 0 0 {cw} {X(W - b)} {Y(H)}H{X(stem + F)}A{R(F)} {R(F)} 0 0 {ccw} {X(stem)} {Y(H + F)}'
            f'H{X(a)}A{R(a)} {R(a)} 0 0 {cw} {X(0)} {Y(H + F - a)}V{Y(a)}A{R(a)} {R(a)} 0 0 {cw} {X(a)} {Y(0)}Z'
            f'M{X(stem)} {Y(top)}A{R(r)} {R(r)} 0 0 {cw} {X(stem + r)} {Y(top + r)}H{X(stem)}Z')


marks = {'p': mark(False), 'q': mark(True)}
for name, d in marks.items():
    open(os.path.join(base, spec['out'][name]), 'w', encoding='utf-8', newline='\n').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="phipal">'
        f'<path d="{d}" fill="currentColor" fill-rule="evenodd"/></svg>\n')

# A sheet: the q and the p on two tiles, as the sketch has them; the tile's pad, corner and colours are pal.json's.
tl = spec['tile']
inner = 1 - 2 * tl['pad']
tiles = ''.join(f'<g transform="translate({10 + 120 * i} 10)"><rect width="100" height="100" rx="{tl["radius"]}" fill="{tl["back"]}"/>'
                f'<path d="{marks[n]}" transform="translate(50 50) scale({inner:g}) translate(-50 -50)" fill="{tl["ink"]}" fill-rule="evenodd"/></g>'
                for i, n in enumerate(tl['order']))
open(os.path.join(base, spec['out']['sheet']), 'w', encoding='utf-8', newline='\n').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {120 * len(tl["order"])} 120">{tiles}</svg>\n')

reg = spec['registry']
reg_path = os.path.normpath(os.path.join(base, reg['file']))
registry = json.load(open(reg_path, encoding='utf-8'))
app = next(x for x in registry if x['key'] == reg['key'])
app['icon'] = [{'d': marks[reg['letter']], 'fill': 'currentColor', 'stroke': 'none'}]
open(reg_path, 'w', encoding='utf-8', newline='\n').write(json.dumps(registry, indent=2, ensure_ascii=False) + '\n')
print(f'walls: stem {stem:g}, right {right:g}, top {top:g}, bottom {bottom:g}, shoulder {F:g} | letter {W:g} x {H + F:g}')
