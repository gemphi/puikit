#!/usr/bin/env python3
"""Draw the Phiegg robot on the proportions of the Phi font.

The figure is built from the measures of Phi-Pill Open Light, the face Phiegg is set in, read from the font file:
    head            the capital O: its width and the cap height, a pill
    chin to arms    the x-height
    arm             one stem thick at the hand, with the round end a stem has, and half a stem more at the shoulder;
                    it reaches two ems and a descender from the middle
    neck, ankle     as wide as the O's counter
    shoulders       an O's advance to each side
    thigh           as wide as the O; the legs as far apart as two letters stand
    knee            the dot of the i
    waist           one em under the chin; the hem three quarters of an em to each side
What the font cannot say (the canvas, how many heads tall, the colours, the folds of the dress) is art/robot.tsv.

Writes art/robot.svg, and art/robot-grid.svg: the same drawing with the font's measures ruled over it.
    python scripts/robot.py [font.otf]
"""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen

ROOT = os.path.join(os.path.dirname(__file__), '..')
ART = os.path.join(ROOT, 'art')
FONT = os.path.join(ROOT, '..', '..', '..', 'phikit', 'crates', 'appkit', 'asset', 'font', 'PhiPillOpen-Light.otf')


def table(path):
    """The rows of a table: kind, name, value, between tabs."""
    rows = {}
    for line in open(path, encoding='utf-8'):
        cell = line.rstrip('\n').split('\t')
        if len(cell) == 3 and not line.startswith('#'):
            rows.setdefault(cell[0], {})[cell[1]] = cell[2]
    return rows


def measure(path):
    """The measures of a font the figure is built from, in the font's units."""
    font = TTFont(path)
    glyph, name = font.getGlyphSet(), font.getBestCmap()

    def bounds(letter):
        pen = BoundsPen(glyph)
        glyph[name[ord(letter)]].draw(pen)
        return pen.bounds

    def contours(letter):
        pen = DecomposingRecordingPen(glyph)
        glyph[name[ord(letter)]].draw(pen)
        found, now = [], []
        for verb, points in pen.value:
            now.extend(points)
            if verb in ('closePath', 'endPath'):
                found.append(now)
                now = []
        return found

    bowl, stem, low, dot = bounds('O'), bounds('I'), bounds('o'), bounds('.')
    # The counter is the O's inner contour: the narrower of the two.
    counter = min(max(x for x, _ in c) - min(x for x, _ in c) for c in contours('O'))
    return {
        'em': font['head'].unitsPerEm,
        'cap': bowl[3] - bowl[1],
        'x': low[3] - low[1],
        'bowl': bowl[2] - bowl[0],
        'stem': stem[2] - stem[0],
        'counter': counter,
        'dot': dot[2] - dot[0],
        'advance': glyph[name[ord('O')]].width,
        'descender': -font['hhea'].descent,
    }


def draw(m, t, grid):
    size = {k: float(v) for k, v in t['size'].items()}
    head = {k: float(v) for k, v in t['head'].items()}
    ink = t['color']
    k = size['head'] / m['cap']                     # pixels to a unit of the font
    X = lambda x: round(size['centre'] + x * k, 1)  # across, from the figure's middle
    Y = lambda y: round(size['top'] + y * k, 1)     # down, from the top of the head
    P = lambda x, y: f'{X(x)},{Y(y)}'

    cap, xh, bowl, stem, counter, em = m['cap'], m['x'], m['bowl'], m['stem'], m['counter'], m['em']
    gap = m['advance'] - bowl                       # what stands between two letters
    arm = cap + xh                                  # the middle of the arm
    top, under = arm - stem / 2, arm + stem / 2
    reach = 2 * em + m['descender']                 # the tip of the hand, from the middle
    shoulder, neck = m['advance'], counter / 2
    waist, hem = cap + em, head['hem'] * cap
    knee, ankle, sole = head['knee'] * cap, head['ankle'] * cap, head['sole'] * cap
    leg = (bowl + gap) / 2                          # the middle of a leg, from the middle
    foot = m['advance'] / 4                         # half a foot's width

    def half(side):
        """One side of the body: the neck, the shoulder, the arm with its round end, the trunk under the dress."""
        s = side
        return (f'M{P(0, cap - stem)} L{P(s * neck, cap - stem)} L{P(s * neck, cap + xh * 0.3)} '
                f'C{P(s * neck, cap + xh * 0.5)} {P(s * shoulder * 0.45, arm - stem * 1.15)} {P(s * shoulder, arm - stem)} '
                f'L{P(s * (reach - stem / 2), top)} '
                f'A{round(stem / 2 * k, 1)},{round(stem / 2 * k, 1)} 0 0 {1 if s > 0 else 0} {P(s * (reach - stem / 2), under)} '
                f'L{P(s * shoulder, under)} '
                f'C{P(s * shoulder * 0.86, under + xh * 0.4)} {P(s * counter * 1.7, waist - xh * 0.5)} {P(s * counter * 1.7, waist)} '
                f'L{P(s * (leg + bowl / 2), hem - stem)} L{P(0, hem - stem)} Z')

    def limb(side):
        """A leg: as wide as the O under the hem, as wide as its counter at the ankle, and a foot with a stem's round."""
        c, r = side * leg, round(stem / 2 * k, 1)
        return (f'M{P(c - bowl / 2, hem - stem)} L{P(c - counter / 2, ankle)} '
                f'C{P(c - counter / 2, ankle + stem)} {P(c - foot, sole - stem * 1.4)} {P(c - foot, sole - stem / 2)} '
                f'A{r},{r} 0 0 0 {P(c - foot + stem / 2, sole)} L{P(c + foot - stem / 2, sole)} '
                f'A{r},{r} 0 0 0 {P(c + foot, sole - stem / 2)} '
                f'C{P(c + foot, sole - stem * 1.4)} {P(c + counter / 2, ankle + stem)} {P(c + counter / 2, ankle)} '
                f'L{P(c + bowl / 2, hem - stem)} Z')

    def pill(inset, fill):
        w, h = (bowl - inset * 2) * k, (cap - inset * 2) * k
        return f'<rect x="{X(-bowl / 2 + inset)}" y="{Y(inset)}" width="{round(w, 1)}" height="{round(h, 1)}" rx="{round(w / 2, 1)}" fill="{fill}"/>'

    # The dress: its top an O's advance to each side and an em down, the left corner a quarter of a stem higher and
    # the right as much lower; the waist two counters to each side, the hem three quarters of an em. Its lines are
    # the sketch's.
    wide, sway = 2 * counter, 0.75 * em
    dress = (f'M{P(-shoulder, em - stem / 4)} Q{P(0, em + stem / 8)} {P(shoulder, em + stem / 4)} '
             f'C{P(shoulder - stem / 4, em + xh * 0.6)} {P(wide, waist - xh * 0.5)} {P(wide, waist)} '
             f'C{P(wide, waist + xh * 0.7)} {P(sway * 0.84, hem - xh)} {P(sway, hem)} '
             f'C{P(sway * 0.62, hem + stem * 0.3)} {P(sway * 0.5, hem + stem * 0.6)} {P(sway * 0.24, hem + stem * 0.5)} '
             f'C{P(sway * 0.06, hem + stem * 0.4)} {P(-sway * 0.04, hem + stem * 0.1)} {P(-sway * 0.2, hem + stem * 0.3)} '
             f'C{P(-sway * 0.42, hem + stem * 0.6)} {P(-sway * 0.74, hem + stem * 0.5)} {P(-sway, hem)} '
             f'C{P(-sway * 0.84, hem - xh)} {P(-wide, waist + xh * 0.7)} {P(-wide, waist)} '
             f'C{P(-wide, waist - xh * 0.5)} {P(-shoulder + stem / 4, em + xh * 0.6)} {P(-shoulder, em - stem / 4)} Z')

    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size["width"]:g} {size["height"]:g}" width="{size["width"]:g}" height="{size["height"]:g}" role="img">',
           '<title>Phiegg robot</title>',
           '<desc>The Phiegg robot standing with its arms out, on the proportions of Phi-Pill Open Light: its head the capital O with a pink face, a grey body with arms one stem thick, a draped mini dress drawn in line, and pale lilac legs, on a green ground.</desc>',
           f'<rect width="{size["width"]:g}" height="{size["height"]:g}" fill="{ink["ground"]}"/>',
           f'<g fill="{ink["body"]}"><path d="{half(-1)}"/><path d="{half(1)}"/></g>',
           f'<g fill="{ink["leg"]}"><path d="{limb(-1)}"/><path d="{limb(1)}"/></g>',
           f'<g fill="{ink["knee"]}">' + ''.join(f'<circle cx="{X(s * leg)}" cy="{Y(knee)}" r="{round(m["dot"] / 2 * k, 1)}"/>' for s in (-1, 1)) + '</g>',
           pill(0, ink['body']), pill(stem / 4, ink['face']),
           f'<g stroke="{ink["line"]}" stroke-linecap="round" stroke-linejoin="round">',
           f'<path d="{dress}" fill="{ink["dress"]}" stroke-width="3"/>',
           '<g fill="none" stroke-width="2.2">' + ''.join(f'<path d="{d}"/>' for d in t.get('fold', {}).values()) + '</g>',
           '<g fill="none" stroke-width="1.4">' + ''.join(f'<path d="{d}"/>' for d in t.get('seam', {}).values()) + '</g>',
           '</g>']
    if grid:
        rule = [(0, 'top of the O'), (cap, f'cap height {cap:g}: the chin'), (arm, f'x-height {xh:g} under the chin: the arm, one stem ({stem:g}) thick at the hand'),
                (waist, f'one em ({em:g}) under the chin: the waist, two counters ({counter:g}) to each side'),
                (hem, f'{head["hem"]:g} heads: the hem, three quarters of an em to each side'), (knee, f'{head["knee"]:g} heads: the knee, the dot of the i ({m["dot"]:g})'),
                (ankle, f'{head["ankle"]:g} heads: the ankle, as wide as the counter'), (sole, f'{head["sole"]:g} heads: the sole')]
        left, right = 60, size['width'] - 60
        out.append(f'<g stroke="{ink["guide"]}" stroke-width="1" stroke-dasharray="6 6" fill="none">' + ''.join(f'<path d="M{left},{Y(y)} H{right}"/>' for y, _ in rule) +
                   ''.join(f'<path d="M{X(x)},{Y(0) - 14} V{Y(sole) + 14}"/>' for x in (-bowl / 2, bowl / 2, -shoulder, shoulder)) + '</g>')
        out.append(f'<g fill="{ink["guide"]}" font-family="Phi-Pill Open, sans-serif" font-size="19">' + ''.join(f'<text x="{left}" y="{Y(y) - 7}">{label}</text>' for y, label in rule) +
                   f'<text x="{left}" y="{Y(sole) + 60}">head: the capital O, {bowl:g} wide and {cap:g} high. shoulders: an O\'s advance ({m["advance"]:g}) to each side.</text>'
                   f'<text x="{left}" y="{Y(sole) + 88}">hands: two ems and a descender ({m["descender"]:g}) from the middle. thigh: as wide as the O. legs: {gap:g} apart, as two letters stand. one unit of the font is {k:.4f} pixels here.</text></g>')
    out.append('</svg>')
    return '\n'.join(out) + '\n'


def main():
    font = sys.argv[1] if len(sys.argv) > 1 else FONT
    m, t = measure(font), table(os.path.join(ART, 'robot.tsv'))
    for name, grid in (('robot.svg', False), ('robot-grid.svg', True)):
        with open(os.path.join(ART, name), 'w', encoding='utf-8', newline='\n') as out:
            out.write(draw(m, t, grid))
    print('measures', m)


if __name__ == '__main__':
    main()
