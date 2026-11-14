"""Open a Phi font: the space inside each letter wider, and nothing else changed.

    python scripts/phiopen.py SRC.otf DST.otf [GROW [FAMILY]]

GROW    font units every space inside a letter grows by, across (64 by default)
FAMILY  the name of the family that is made ("Phi-Pill Open" by default)

A letter is opened by sliding, never by stretching. Every outline is cut where it turns: at its tops and its
bottoms, where it runs level. Each piece between two turns moves right as a whole, by GROW for every space that
is to its left, so every stroke, round, fillet and height is exactly as the source draws it. The only thing that
changes is the level run at a top or a bottom, which gets longer. A piece is never scaled, and no point moves
"by its share": that is what bends a round out of true.

A space is the white between two runs of ink on one level, where it goes on for TALL units up or down; two
spaces one above the other (the eye of an e and the gap under its bar) are one column, and open once.

Every glyph is checked after it is opened: no outline may cross itself or another. One that would is left as the
source has it, and named at the end. The font that is made is one colour: the letter alone, so text takes the
colour it is set in. It needs only fontTools; the sliding itself is slide.py.
"""
import sys

from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.ttLib import TTFont

from slide import opened, polygons


def main():
    src, dst = sys.argv[1], sys.argv[2]
    grow = float(sys.argv[3]) if len(sys.argv) > 3 else 64.0
    family = sys.argv[4] if len(sys.argv) > 4 else 'Phi-Pill Open'
    font = TTFont(src)
    glyphs, cff = font.getGlyphSet(), font['CFF '].cff
    top = cff.topDictIndex[0]
    strings, metrics = top.CharStrings, font['hmtx'].metrics
    layers = font['COLR'].ColorLayers if 'COLR' in font else {}
    body = {base: next(layer.name for layer in stack if layer.name.endswith('.body')) for base, stack in layers.items()}
    stem = polygons(glyphs, body.get(font.getBestCmap()[ord('I')], font.getBestCmap()[ord('I')]))
    # A level run half a stem long is a stroke, which may grow; shorter, it is the turn of a round end.
    long = (max(x for p in stem for x, _ in p) - min(x for p in stem for x, _ in p)) / 2
    kept, wider = [], 0
    for name in font.getGlyphOrder():
        if '.' in name and name.rsplit('.', 1)[-1] in ('side', 'body', 'pill'):
            continue
        polys = polygons(glyphs, body.get(name, name))
        if not polys:
            continue
        new = opened(polys, grow, long)
        if new is None:
            kept.append(name)
            new = polys
        advance, lsb = metrics[name]
        gain = max(x for p in new for x, _ in p) - max(x for p in polys for x, _ in p)
        wider += gain > 0
        original = strings[name]
        pen = T2CharStringPen(width=round(advance + gain) - original.private.nominalWidthX, glyphSet=None)
        for p in new:
            pen.moveTo(p[0])
            for pt in p[1:]:
                pen.lineTo(pt)
            pen.closePath()
        strings[name] = pen.getCharString(private=original.private, globalSubrs=original.globalSubrs)
        metrics[name] = (round(advance + gain), lsb)
    for table in ('COLR', 'CPAL'):
        if table in font:
            del font[table]
    font['hhea'].advanceWidthMax = max(advance for advance, _ in metrics.values())
    font['OS/2'].recalcAvgCharWidth(font)
    style = font['name'].getDebugName(17) or font['name'].getDebugName(2) or 'Regular'
    style = {300: 'Light', 400: 'Regular', 600: 'SemiBold', 700: 'Bold'}.get(font['OS/2'].usWeightClass, style)
    postscript = f'{family}-{style}'.replace(' ', '')
    names = {1: f'{family} {style}', 2: 'Regular', 3: f'{postscript};phiopen {grow:g}', 4: f'{family} {style}', 6: postscript, 16: family, 17: style}
    table = font['name']
    for record in list(table.names):
        if record.nameID in names:
            table.removeNames(nameID=record.nameID)
    for name_id, text in names.items():
        table.setName(text, name_id, 3, 1, 0x409)
        table.setName(text, name_id, 1, 0, 0)
    cff.fontNames = [postscript]
    top.FullName, top.FamilyName = names[4], family
    font.save(dst)
    print(f"{dst}: '{names[4]}', the space inside +{grow:g}; {wider} glyphs wider; left as the source has them: {len(kept)} {kept[:40]}")


if __name__ == '__main__':
    main()
