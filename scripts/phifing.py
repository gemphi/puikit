"""Build Phifing, the shorter web face, from Phi-Soft, into src/tokens/fonts/phi/Phifing.

    pip install fonttools brotli
    python scripts/phifing.py

Every letter's height scales by one number, the one that makes Regular's a square inside.
Light would then still be taller than wide inside, so its upright stems get thinner until the
a is square; horizontal strokes and letter widths stay. Regular's stems lose a little too, with
the a still square, and that room goes between the letters. Every weight gets a little more
space between letters. In capitals with straight stems the
middle bar moves whole to the centre, so the white above it equals the white below. The tails
of g j p q y move up whole until the white under g's bowl is the a's square; only straight
stems change length. Where Phi-Soft's V comes in two pieces it is rebuilt from its v.

Phifing 1 to 5 are the same face wider: the white inside each letter or digit grows by an
eighth, a quarter, three eighths, a half and all of itself. Stems and heights stay.

Letter spacing comes from Barlow, a conventional text face: each letter keeps Phifing's shape and
takes the space Barlow leaves either side of that same letter, weight for weight.
"""
from collections import Counter
from pathlib import Path
from statistics import median

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT.parent / 'phikit/crates/phiber/assets/phi-fonts/Phi-Soft'
OUT = ROOT / 'src/tokens/fonts/phi/Phifing'
BARLOW = ROOT / 'src/tokens/fonts/phi/Barlow'
WEIGHTS = ('Light', 'Regular', 'SemiBold', 'Bold')
X_HEIGHT, CAP, DESCENT = 495, 635, 272  # Phi-Soft's
SCALE = 130 / 152  # Regular's a is 130 wide and 152 tall inside
BOTTOM = 208  # Regular's g: the a's inside, 130, plus the tail's own thickness
RISE = DESCENT * SCALE - BOTTOM
BARRED, TAILED = set('HABEFGR'), set('gjpqy')
REACH = 25  # points this close together belong to one curve
EASE = 12  # how far the sideways map blends across a stem's edge
BLEND_LOSS = 1.13  # that blend takes a little off the gain, so the cut asks for this much more
STEM_TRIM = {'Regular': 20}  # Regular reads lighter: stems 170 to 150, the a stays square
FAMILIES = {'Phifing': 0.0, 'Phifing 1': 0.125, 'Phifing 2': 0.25, 'Phifing 3': 0.375, 'Phifing 4': 0.5, 'Phifing 5': 1.0}  # share of the white added
LETTER_SPACE = {'Light': 16, 'Regular': 24, 'SemiBold': 32, 'Bold': 32}  # added to every letter's width, split both sides


def polygons(glyphs, name):
    """A glyph as point lists, one per contour. Phi-Soft's outlines are all straight segments."""
    pen = DecomposingRecordingPen(glyphs)
    glyphs[name].draw(pen)
    out = []
    for op, args in pen.value:
        match op:
            case 'moveTo':
                out.append([args[0]])
            case 'lineTo':
                out[-1].append(args[0])
            case _:
                pass
    return [pts[:-1] if pts[0] == pts[-1] else pts for pts in out]


def edges(shapes):
    return [line for pts in shapes for line in zip(pts, pts[1:] + pts[:1])]


def runs(lines, axis, at):
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
    return round(max(xs) - min(xs)), round(max(ys) - min(ys))


def stem_spans(shapes, stem):
    """The x spans of a letter's thick upright strokes, found by cutting across it at many heights."""
    lines = edges(shapes)
    ys = [y for pts in shapes for _, y in pts]
    low, high = min(ys), max(ys)
    found = []
    for i in range(1, 30):
        for a, b in runs(lines, 1, low + (high - low) * i / 30):
            if 0.75 * stem <= b - a <= 1.25 * stem:
                found.append((a, b))
    groups = []
    for a, b in sorted(found):
        match groups:
            case [*_, last] if a < max(q for _, q in last):
                last.append((a, b))
            case _:
                groups.append([(a, b)])
    return [(median(p for p, _ in g), median(q for _, q in g)) for g in groups if len(g) >= 3]


def thin_strokes(shapes, stem, cut):
    """Each stem loses cut from both sides and the white between takes it, so the letter's
    heights and bars stay and the sideways map has no corners."""
    spans = stem_spans(shapes, stem)
    if not spans:
        return shapes
    knots = [knot for a, b in spans for knot in ((a, cut), (b, -cut))]

    def shift(x):
        if x <= knots[0][0]:
            return knots[0][1]
        for (a, da), (b, db) in zip(knots, knots[1:]):
            if x <= b:
                return da + (db - da) * (x - a) / (b - a)
        return knots[-1][1]

    def eased(x):
        return sum(shift(x + i) for i in range(-EASE, EASE + 1)) / (2 * EASE + 1)

    return [[(x + eased(x), y) for x, y in pts] for pts in shapes]


def trim_stems(shapes, stem, trim):
    """Each stem loses trim and the letter closes up behind it, so the white inside and the
    side bearings stay. Returns the shapes and how much narrower the letter came out."""
    spans = stem_spans(shapes, stem)
    if not spans:
        return shapes, 0.0

    def shift(x):
        total = 0.0
        for a, b in spans:
            total -= trim * min(max(x - a, 0.0) / (b - a), 1.0)
        return total

    def eased(x):
        return sum(shift(x + i) for i in range(-EASE, EASE + 1)) / (2 * EASE + 1)

    return [[(x + eased(x), y) for x, y in pts] for pts in shapes], trim * len(spans)


def widen_white(shapes, stem, share):
    """The white between a letter's stems grows by share of itself and the stems stay as drawn.
    A letter without two stems takes it between its side strokes. Returns the shapes and the added width."""
    spans = stem_spans(shapes, stem)
    xs = [x for pts in shapes for x, _ in pts]
    match spans:
        case [_, _, *_]:
            gaps = [(left[1], right[0]) for left, right in zip(spans, spans[1:])]
        case _:
            gaps = [(min(xs) + stem, max(xs) - stem)]
    gaps = [(lo, hi) for lo, hi in gaps if hi - lo >= 40]
    if not gaps:
        return shapes, 0.0

    def shift(x):
        return sum(share * (hi - lo) * min(max(x - lo, 0.0) / (hi - lo), 1.0) for lo, hi in gaps)

    def eased(x):
        return sum(shift(x + i) for i in range(-EASE, EASE + 1)) / (2 * EASE + 1)

    return [[(x + eased(x), y) for x, y in pts] for pts in shapes], sum(share * (hi - lo) for lo, hi in gaps)


def lift_tail(shapes):
    """Everything below the long straight stretch under the baseline moves up as one piece."""
    ys = sorted({0.0, *(y for pts in shapes for _, y in pts if y < 0)})
    low, _ = max(zip(ys, ys[1:]), key=lambda pair: pair[1] - pair[0])
    return [[(x, y + RISE if y <= low else y) for x, y in pts] for pts in shapes]


def find_bar(shapes, bar):
    """The middle bar, and the strokes above and below it, read from columns through the letter."""
    lines = edges(shapes)
    xs = [x for pts in shapes for x, _ in pts]
    x0, x1 = min(xs), max(xs)
    high = max(y for pts in shapes for _, y in pts)
    seen = Counter()
    for i in range(1, 40):
        cut = runs(lines, 0, x0 + (x1 - x0) * i / 40)
        for k, (lo, hi) in enumerate(cut):
            if 0.6 * bar <= hi - lo <= 1.5 * bar and lo > 100 and hi < 480:
                floor = cut[k - 1][1] if k else 0.0
                ceiling = cut[k + 1][0] if k + 1 < len(cut) else high
                seen[(round(lo), round(hi), round(floor), round(ceiling))] += 1
    return seen.most_common(1)[0][0] if seen else None


def center_bar(shapes, bar):
    """The bar and the curves that join it move together; the straight stems take the change."""
    found = find_bar(shapes, bar)
    if not found:
        return shapes
    lo, hi, floor, ceiling = found
    ys = sorted({y for pts in shapes for _, y in pts})
    below = [y for y in ys if y < lo]
    above = [y for y in ys if y > hi]
    for y in reversed(below):
        if lo - y > REACH:
            break
        lo = y
    for y in above:
        if y - hi > REACH:
            break
        hi = y
    room_down = lo - max((y for y in below if y < lo), default=lo - 999) - REACH
    room_up = min((y for y in above if y > hi), default=hi + 999) - hi - REACH
    shift = (floor + ceiling) / 2 - (found[0] + found[1]) / 2
    shift = max(-room_down, min(room_up, shift))
    return [[(x, y + shift if lo <= y <= hi else y) for x, y in pts] for pts in shapes]


def tall_v(glyphs):
    """V from the whole v: its arms, above the long stretch in their upper half, go up to cap height."""
    shapes = polygons(glyphs, 'v')
    ys = sorted({y for pts in shapes for _, y in pts})
    _, arm = max(zip(ys, ys[1:]), key=lambda pair: pair[1] - pair[0])
    return [[(x, y + CAP - X_HEIGHT if y >= arm else y) for x, y in pts] for pts in shapes]


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

    stem_run = runs(edges(polygons(glyphs, 'H')), 1, 150)[0]
    stem = stem_run[1] - stem_run[0]
    letter_e = polygons(glyphs, 'E')
    xs = [x for pts in letter_e for x, _ in pts]
    bar_run = runs(edges(letter_e), 0, max(xs) - (max(xs) - min(xs)) * 0.15)[0]
    bar = (bar_run[1] - bar_run[0]) * SCALE
    width, height = hole_of(polygons(glyphs, cmap[ord('a')]))
    add = max(0.0, height * SCALE - width)

    spacing = bearings_of(weight)
    redrawn = {}
    for name in font.getGlyphOrder():
        advance, _ = metrics[name]
        original = strings[name]
        private = original.private
        parts = polygons(glyphs, name)
        ch = chars.get(name, '')
        if ch == 'V' and len(parts) > 1:
            parts = tall_v(glyphs)
            advance = metrics[cmap[ord('v')]][0]
        pen = T2CharStringPen(width=advance - private.nominalWidthX, glyphSet=glyphs)
        if not parts:
            redrawn[name] = pen.getCharString(private=private, globalSubrs=original.globalSubrs)
            continue
        shapes = [[(x, y * SCALE) for x, y in part] for part in parts]
        if add:
            shapes = thin_strokes(shapes, stem, add / 2 * BLEND_LOSS)
        narrower = 0.0
        if weight in STEM_TRIM:
            shapes, narrower = trim_stems(shapes, stem, STEM_TRIM[weight])
        if share and ch.isalnum():
            shapes, wider = widen_white(shapes, stem - add * BLEND_LOSS - STEM_TRIM.get(weight, 0), share)
            advance += round(wider)
        # What the stems gave up goes back between the letters, with a little more for reading.
        advance += LETTER_SPACE[weight]
        side = (narrower + LETTER_SPACE[weight]) / 2
        shapes = [[(x + side, y) for x, y in pts] for pts in shapes]
        pen = T2CharStringPen(width=advance - private.nominalWidthX, glyphSet=glyphs)
        match ch:
            case c if c in TAILED:
                shapes = lift_tail(shapes)
            case c if c in BARRED:
                shapes = center_bar(shapes, bar)
            case _:
                pass
        if ch in spacing:
            xs = [x for pts in shapes for x, _ in pts]
            left, right = spacing[ch]
            shapes = [[(x - min(xs) + left, y) for x, y in pts] for pts in shapes]
            advance = round(left + max(xs) - min(xs) + right)
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
    print(family, weight, 'a inside', hole_of(polygons(gs, cm[ord('a')])), 'V pieces', len(polygons(gs, cm[ord('V')])),
          'H', round(max(y for pts in polygons(gs, cm[ord('H')]) for _, y in pts)),
          'g', round(min(y for pts in polygons(gs, cm[ord('g')]) for _, y in pts)))


if __name__ == '__main__':
    for family, share in FAMILIES.items():
        for weight in WEIGHTS:
            build(weight, family, share)
