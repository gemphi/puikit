"""Build Phifing, the shorter web face, from Phi-Soft, into src/tokens/fonts/phi/Phifing.

    pip install fonttools brotli
    python scripts/phifing.py [OUT]

Phifing is Phi-Soft made short, and nothing in a letter is ever bent to get there. Every height scales by one
number (130/152): an even scale, so every round stays smooth. Everything after that slides (scripts/slide.py): an
outline is cut where it turns and each piece moves whole, so every stroke, round and fillet stays as Phi-Soft draws
it, and only the straight runs at the cuts grow or shrink.

- No inside is pushed square: the white inside each letter keeps the width Phi-Soft gives it, and the stems
  stay as thick as Phi-Soft's: nothing is thinned. (Narrowing the insides back to Phi-Soft's proportion after the
  scale cannot be done by sliding: o, n, b and the rest have no straight run in their rounds to shorten.)
- Phifing 1 to 5 are the same face wider, every letter and digit by the same amount: an eighth, a quarter, three
  eighths, a half and all of the n's inside. A letter's insides share it (m grows no more than n); one with none
  grows at its side or along its bars; one that can do neither (a V, a lone stem) keeps its shape and takes the
  same amount as room beside it. So letters drawn alike stay alike, and the digits keep agreeing. A letter open at one side, as c, s or E, grows between its side
  strokes; the floating bar of E and F keeps its gap from the back and grows with the arms. z and Z grow along
  their bars, half the growth at an end, so the diagonal keeps its slant: z at its top bar's left end, Z at its
  foot's right end. (Z has no top bar to the left of its diagonal, and Regular's z no straight foot to the right:
  those ends would bend.) Any other letter that would part through a stem (T, 1, and l r in some weight)
  is left as drawn in every weight. A space that is a V,
  as in v V A K X Y k x, is left as Phi-Soft draws it: widened, its point would be drawn out flat.
- The bars of the capitals stay where Phi-Soft draws them, high, with more white under them than over. Moving
  one to the middle means cutting the strokes around it, and only H and F have nothing but straight stems there:
  B E G R would have their soft inner corners cut and A and R their slanted strokes. So no bar moves, and E and F
  stay alike.
- Where Phi-Soft's capital V or M is broken and its small letter is whole (the Regular V, in two pieces), it is
  rebuilt from its v or m as the other weights draw it: the small letter cut where its strokes stand upright, and
  everything above lifted straight to cap height. Phi-Soft's SemiBold and Bold m and M are both drawn as a block
  with bumps along its foot; with no whole m to make M from, they stay as Phi-Soft draws them until Phi-Soft's own
  m is redrawn.
- The tails of g j p q y stay as long as Phi-Soft's, squashed as the rest: g and y have no straight stretch under
  the bowl to shorten, so none is shortened, and they all stay one length.

Letter spacing comes from Barlow, a conventional text face: each letter keeps Phifing's shape and takes the space
Barlow leaves either side of that same letter, weight for weight. A glyph a slide would cross over itself is left as
the scale made it, and named.
"""
import sys
from collections import Counter
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.ttLib import TTFont

from slide import STEP, columns, crossing, opened, polygons, runs, slid, stretch, tapered, widest

NEARLY = 10  # an edge ten times longer across than up is nearly level: where a round may grow (slide.slid)

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'phikit/crates/phiber/assets/phi-fonts/Phi-Soft'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'src/tokens/fonts/phi/Phifing'
BARLOW = ROOT / 'src/tokens/fonts/phi/Barlow'
WEIGHTS = ('Light', 'Regular', 'SemiBold', 'Bold')
X_HEIGHT, CAP = 495, 635  # Phi-Soft's
SCALE = 130 / 152  # Regular's a is 130 wide and 152 tall inside
BOTTOM = 208  # how far below the baseline the line keeps room for, under the squashed tails
FAMILIES = {'Phifing': 0.0, 'Phifing 1': 0.125, 'Phifing 2': 0.25, 'Phifing 3': 0.375, 'Phifing 4': 0.5, 'Phifing 5': 1.0}  # share of the white added
LETTER_SPACE = {'Light': 16, 'Regular': 24, 'SemiBold': 32, 'Bold': 32}  # added to every letter's width, split both sides


def edges(shapes):
    return [line for pts in shapes for line in zip(pts, pts[1:] + pts[:1])]


def cut(lines, axis, at):
    """The runs of ink a straight cut meets. axis 0 cuts along x = at and returns y runs."""
    other = 1 - axis
    hits = sorted(a[other] + (at - a[axis]) / (b[axis] - a[axis]) * (b[other] - a[other])
                  for a, b in lines if min(a[axis], b[axis]) <= at < max(a[axis], b[axis]))
    return list(zip(hits[0::2], hits[1::2]))


def area(pts):
    return sum(pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1] for i in range(len(pts))) / 2


def hole_of(shapes):
    """Width and height of the lowest hole in a glyph."""
    main = max(shapes, key=lambda p: abs(area(p)))
    holes = [p for p in shapes if p is not main and area(p) * area(main) < 0]
    low = min(holes, key=lambda p: min(q[1] for q in p))
    xs, ys = [q[0] for q in low], [q[1] for q in low]
    return max(xs) - min(xs), max(ys) - min(ys)


def side_open(shapes, stem, grow, long):
    """A letter with no space closed inside it, as c, s or E, opened between its side strokes: each outline
    parts at its own middle, its left half staying and its right half moving out by what the white between the
    side strokes grows. So the floating bar of E and F keeps its gap from the back and grows as much as the arms
    do, staying as long beside them as Phi-Soft draws it. Too narrow a letter (i, l) is left as drawn; None where
    an outline would cross."""
    xs = [x for pts in shapes for x, _ in pts]
    white = max(xs) - min(xs) - 2 * stem
    if white < 40:
        return shapes
    # Where a letter parts, the parting line may cross only level strokes (the arms and bar of E, the top and foot
    # of c), never run down an upright one: T, with its stem in the middle, would have the stem split and thickened.
    standing = lambda contour, x: any(b - a > 2 * stem for a, b in runs([[(py, px) for px, py in c] for c in shapes], x))
    out = []
    for contour in shapes:
        cx, cy = [x for x, _ in contour], [y for _, y in contour]
        middle = (min(cx) + max(cx)) / 2
        if standing(contour, middle):
            return shapes
        col = {k: [(middle - 0.5, middle + 0.5, 1)] for k in range(int(min(cy)) // STEP * STEP, int(max(cy)) + STEP, STEP)}
        out.append(slid(contour, [col], [grow(white)], long, NEARLY))
    return None if crossing(out) else out


def held():
    """The letters with no space inside that some weight cannot open at its side without parting a stem: they
    stay as drawn in every weight, so a letter is alike in all four (l, r, z in Phi-Soft)."""
    out = set()
    for weight in WEIGHTS:
        font = TTFont(SRC / f'PhiSoft-{weight}.otf')
        glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
        squash = lambda name: [[(x, y * SCALE) for x, y in part] for part in polygons(glyphs, name)]
        letter_h = squash(cmap[ord('H')])
        stem_run = cut(edges(letter_h), 1, 150 * SCALE)[0]
        stem = stem_run[1] - stem_run[0]
        for code, name in cmap.items():
            shapes = squash(name)
            if chr(code).isalnum() and shapes and not columns(shapes) and side_open(shapes, stem, lambda white: 40.0, stem / 2) is shapes:
                out.add(chr(code))
    return out


TALL = {'V': 'v', 'M': 'm'}  # capitals Phi-Soft draws as its small letter made tall
# Letters that grow along their bars, not through a stem or a diagonal (bar_end): each end that slides, as the bar
# it is on (top or foot) and its side (left or right).
BARS = {'z': [('top', 'left')], 'Z': [('foot', 'right')], 'T': [('top', 'left'), ('top', 'right')], 'r': [('top', 'right')]}


def bar_end(shapes, top, left, dx):
    """One end of a level bar slid along itself: of the top bar or the foot, the left end or the right, cut off where
    the bar runs straight and moved across by dx, so the bar grows and nothing else changes. None where no such cut
    leaves the end joined to the rest by the bar's two level edges alone."""
    ys = [y for pts in shapes for _, y in pts]
    edge = max(ys) if top else min(ys)
    xs = [x for pts in shapes for x, y in pts if abs(y - edge) < 0.01]
    if not xs:
        return None
    ends = sorted(xs) if left else sorted(xs, reverse=True)
    inward = 1 if left else -1
    # How thick the bar is: the run of ink straight down (or up) just in from the end that slides, clear of where a
    # stem or a diagonal joins the bar further along.
    down = runs([[(y, x) for x, y in pts] for pts in shapes], ends[0] + 8 * inward)
    if not down:
        return None
    near = max(down, key=lambda run: run[1]) if top else min(down, key=lambda run: run[0])
    thick = near[1] - near[0]
    band = (edge - thick - 0.5, edge + 0.5) if top else (edge - 0.5, edge + thick + 0.5)
    inside = lambda y: band[0] <= y <= band[1]
    for step in range(1, 40):
        cut = ends[0] + (step * thick / 4) * inward
        moving = lambda x, y: inside(y) and (x < cut if left else x > cut)
        joined, out = True, []
        for pts in shapes:
            n = len(pts)
            for i in range(n):
                a, b = pts[i], pts[(i + 1) % n]
                if moving(*a) != moving(*b) and abs(a[1] - b[1]) > 0.01:
                    joined = False
            out.append([(x + dx, y) if moving(x, y) else (x, y) for x, y in pts])
        if joined and any(moving(x, y) for pts in shapes for x, y in pts):
            return None if crossing(out) else out
    return None


def bar_ends(shapes, grow, ends):
    """A letter grown along its bars by `grow` in all, shared between the ends that slide, each outward."""
    out = shapes
    for bar, side in ends:
        if out is not None:
            out = bar_end(out, bar == 'top', side == 'left', (-grow if side == 'left' else grow) / len(ends))
    return out


def bar_room():
    """Which ends of each bar letter slide in every weight: an end whose bar has no straight underside in some weight
    (the top-left of Phi-Soft's Z, where the round runs straight on into the diagonal) slides in none, so a letter is
    alike in all four."""
    room = {ch: list(ends) for ch, ends in BARS.items()}
    for weight in WEIGHTS:
        font = TTFont(SRC / f'PhiSoft-{weight}.otf')
        glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
        for ch, ends in BARS.items():
            shapes = [[(x, y * SCALE) for x, y in part] for part in polygons(glyphs, cmap[ord(ch)])]
            for bar, side in ends:
                if bar_end(shapes, bar == 'top', side == 'left', -40 if side == 'left' else 40) is None and (bar, side) in room[ch]:
                    room[ch].remove((bar, side))
    # A letter that grows from both ends of one bar (T) grows from both or not at all: from one, its bar would sit
    # off the stem.
    return {ch: ends if len(ends) == len(BARS[ch]) or len({bar for bar, _ in BARS[ch]}) > 1 or len(BARS[ch]) == 1 else []
            for ch, ends in room.items()}


def weight_of(col):
    """How many spaces a column is at its widest: the two of a W where they meet count two."""
    return max(sum(w for _, _, w in whites) for whites in col.values())


def broken(glyphs, cmap, capital):
    """Whether Phi-Soft's capital is broken in this weight, where its small letter is whole: in two pieces (the
    Regular V) or with its spaces filled in (the SemiBold and Bold M, a block with bumps along its foot)."""
    big, small = polygons(glyphs, cmap[ord(capital)]), polygons(glyphs, cmap[ord(TALL[capital])])
    return len(big) > len(small) or len(columns(big)) < len(columns(small))


def tall(glyphs, cmap, capital):
    """A capital from its whole small letter, as Phi-Soft's other weights draw it: the strokes of v and m stand
    upright at the top, so it is cut across where they do and everything above goes straight up to cap height.
    The highest such cut first."""
    shapes = polygons(glyphs, cmap[ord(TALL[capital])])
    lines = edges(shapes)

    def upright(y):
        crossed = [(a, b) for a, b in lines if min(a[1], b[1]) < y < max(a[1], b[1])]
        return crossed and all(abs(b[0] - a[0]) < 0.01 for a, b in crossed)

    for y in range(int(X_HEIGHT * 0.9), int(X_HEIGHT * 0.3), -STEP):
        if upright(y + 0.5) and (out := stretch(shapes, y + 0.5, CAP - X_HEIGHT, 'above')) is not None:
            return out
    return None


def bearings_of(weight):
    """The space Barlow leaves either side of each character, in this weight."""
    font = TTFont(BARLOW / f'Barlow-{weight}.woff2')
    glyphs, hmtx, scale = font.getGlyphSet(), font['hmtx'], 1000 / font['head'].unitsPerEm
    out = {}
    for code, name in font.getBestCmap().items():
        pen = BoundsPen(glyphs)
        glyphs[name].draw(pen)
        if pen.bounds:
            out[chr(code)] = (pen.bounds[0] * scale, (hmtx[name][0] - pen.bounds[2]) * scale)
    return out


def rename(font, weight, family):
    ribbi = weight in ('Regular', 'Bold')
    postscript = f'{family}-{weight}'.replace(' ', '')
    names = {1: family if ribbi else f'{family} {weight}', 2: weight if ribbi else 'Regular',
             3: f'{postscript};phifing', 4: f'{family} {weight}', 6: postscript, 16: family, 17: weight}
    table = font['name']
    for record in list(table.names):
        if record.nameID in names:
            table.removeNames(nameID=record.nameID)
    for name_id, text in names.items():
        table.setName(text, name_id, 3, 1, 0x409)
        table.setName(text, name_id, 1, 0, 0)
    cff = font['CFF '].cff
    cff.fontNames = [postscript]
    cff.topDictIndex[0].FullName = names[4]
    cff.topDictIndex[0].FamilyName = family
    return postscript


def build(weight, family, share):
    font = TTFont(SRC / f'PhiSoft-{weight}.otf', recalcBBoxes=True)
    top = font['CFF '].cff.topDictIndex[0]
    strings = top.CharStrings
    glyphs = font.getGlyphSet()
    metrics = font['hmtx'].metrics
    cmap = font.getBestCmap()
    chars = {name: chr(code) for code, name in cmap.items()}

    squash = lambda parts: [[(x, y * SCALE) for x, y in part] for part in parts]
    letter_h = squash(polygons(glyphs, cmap[ord('H')]))
    stem_run = cut(edges(letter_h), 1, 150 * SCALE)[0]
    stem = stem_run[1] - stem_run[0]
    # One growth for every letter and digit of this face and weight: the face's share of the n's inside, at its
    # usual width. Every glyph comes out exactly that much wider, whatever it is drawn like, so letters drawn alike
    # stay alike (r beside n, y beside x) and the digits keep agreeing.
    letter_n = squash(polygons(glyphs, cmap[ord('n')]))
    growth = share * widest(columns(letter_n)[0])

    spacing = bearings_of(weight)
    redrawn, kept = {}, Counter()
    for name in font.getGlyphOrder():
        advance, _ = metrics[name]
        original = strings[name]
        private = original.private
        parts = polygons(glyphs, name)
        ch = chars.get(name, '')
        if ch in TALL and broken(glyphs, cmap, ch):
            small = polygons(glyphs, cmap[ord(TALL[ch])])
            rebuilt = tall(glyphs, cmap, ch)
            match rebuilt:
                case None:
                    kept[f'{ch} from {TALL[ch]}'] += 1
                case _:
                    gain = max(x for p in rebuilt for x, _ in p) - max(x for p in small for x, _ in p)
                    shift = min(x for p in small for x, _ in p) - min(x for p in rebuilt for x, _ in p)
                    parts = [[(x + shift, y) for x, y in p] for p in rebuilt]
                    advance = metrics[cmap[ord(TALL[ch])]][0] + round(gain + shift)
                    kept[f'{ch} made from {TALL[ch]}'] += 1
        pen = T2CharStringPen(width=advance - private.nominalWidthX, glyphSet=glyphs)
        if not parts:
            redrawn[name] = pen.getCharString(private=private, globalSubrs=original.globalSubrs)
            continue
        shapes = squash(parts)
        air = 0.0  # what the letter takes beside it, where its shape cannot take the growth
        if ch.isalnum() and growth:
            left_was = min(x for pts in shapes for x, _ in pts)
            right_was = max(x for pts in shapes for x, _ in pts)
            # Its insides share the growth (all but a V's); with none, it grows at its side or along its bars; a
            # letter that can do neither keeps its shape and takes the growth as room beside it.
            spaces = columns(shapes)
            open_ = [col for col in spaces if not tapered(col, shapes)]
            match (bool(spaces), bool(open_), ch in HELD, bool(ROOM.get(ch))):
                case (True, True, _, _):
                    found = opened(shapes, growth / sum(weight_of(col) for col in open_), stem / 2, open_, NEARLY)
                case (False, _, _, True):
                    found = bar_ends(shapes, growth, ROOM[ch])
                case (False, _, False, _):
                    found = side_open(shapes, stem, lambda white: growth, stem / 2)
                case _:
                    found = shapes
            match found:
                case None:
                    kept[f'{ch} took the growth as room'] += 1
                case _:
                    shapes = found
            grown = (max(x for pts in shapes for x, _ in pts) - min(x for pts in shapes for x, _ in pts)) - (right_was - left_was)
            air = max(0.0, growth - grown)
            advance += round(grown)
        # A little more room between the letters, for reading.
        advance += LETTER_SPACE[weight]
        shapes = [[(x + LETTER_SPACE[weight] / 2, y) for x, y in pts] for pts in shapes]
        if ch in spacing:
            xs = [x for pts in shapes for x, _ in pts]
            left, right_side = spacing[ch]
            shapes = [[(x - min(xs) + left, y) for x, y in pts] for pts in shapes]
            advance = round(left + max(xs) - min(xs) + right_side)
        # Room it could not grow into goes evenly either side of it.
        advance += round(air)
        shapes = [[(x + air / 2, y) for x, y in pts] for pts in shapes]
        pen = T2CharStringPen(width=advance - private.nominalWidthX, glyphSet=glyphs)
        for pts in shapes:
            pen.moveTo(pts[0])
            for p in pts[1:]:
                pen.lineTo(p)
            pen.closePath()
        redrawn[name] = pen.getCharString(private=private, globalSubrs=original.globalSubrs)
        metrics[name] = (advance, round(min(x for pts in shapes for x, _ in pts)))
    for name, charstring in redrawn.items():
        strings[name] = charstring

    top.Private.BlueValues = []
    top.Private.OtherBlues = []
    font['hhea'].advanceWidthMax = max(a for a, _ in metrics.values())
    font['OS/2'].recalcAvgCharWidth(font)

    high = round(CAP * SCALE)
    ascent, descent = high + 70, BOTTOM + 70
    hhea, os2 = font['hhea'], font['OS/2']
    hhea.ascent, hhea.descent, hhea.lineGap = ascent, -descent, 0
    os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = ascent, -descent, 0
    os2.usWinAscent, os2.usWinDescent = ascent + 60, descent + 60
    os2.sxHeight, os2.sCapHeight = round(X_HEIGHT * SCALE), high

    postscript = rename(font, weight, family)
    OUT.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(OUT / f'{postscript}.woff2')

    check = TTFont(OUT / f'{postscript}.woff2')
    gs, cm = check.getGlyphSet(), check.getBestCmap()
    a = hole_of(polygons(gs, cm[ord('a')]))
    print(family, weight, 'a inside', round(a[0]), 'x', round(a[1]), 'stem', round(stem),
          'left as the scale made them:', dict(kept) or 'none')


if __name__ == '__main__':
    HELD, ROOM = held(), bar_room()
    print('left as drawn in every weight, having no space inside and a stem where they would part:', ''.join(sorted(HELD)))
    print('bar ends that slide, by letter:', {ch: sorted(ends) for ch, ends in ROOM.items()})
    for family, share in FAMILIES.items():
        for weight in WEIGHTS:
            build(weight, family, share)
