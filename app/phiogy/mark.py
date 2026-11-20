"""Phiogy's mark, drawn on Phi-Soft Light's own measures: nothing in it is freehand.

    python app/phiogy/mark.py

The body is the font's letter o as it is drawn (tall, heavy at its sides, light at its head and foot): a voice. The
tail is a stroke as thick as the font's stem, leaving the bowl's foot at the left and reaching down by the share of
the o's height that the font gives its descender (g's tail against its bowl), so the letter becomes a speech mark.
Prints the `icon` entry for app/phi-kit/src/registry.json (a 100 by 100 box).
"""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONT = Path(__file__).resolve().parents[3] / 'phikit/crates/phiber/assets/phi-fonts/Phi-Soft/PhiSoft-Light.otf'
BOX = 100.0
BODY = 66.0  # the o's height in the box; the rest is the tail's room

font = TTFont(FONT); glyph = font.getGlyphSet(); name = font.getBestCmap()


def bound(ch):
    pen = BoundsPen(glyph); glyph[name[ord(ch)]].draw(pen); return pen.bounds


ox0, oy0, ox1, oy1 = bound('o')
ix0, _, ix1, _ = bound('i')
_, gy0, _, _ = bound('g')
stem = ix1 - ix0                 # the font's stem
drop = -gy0 / (oy1 - oy0)        # the descender as a share of the bowl
s = BODY / (oy1 - oy0)
width = (ox1 - ox0) * s
left = (BOX - width) / 2
top = (BOX - BODY * (1 + drop * 0.5)) / 2
# Font units to the box: scaled, moved, and turned over (a font's y runs up).
pen = SVGPathPen(glyph, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
glyph[name[ord('o')]].draw(TransformPen(pen, (s, 0, 0, -s, left - ox0 * s, top + oy1 * s)))
sw = stem * s
foot = top + BODY
# The tail starts inside the bowl's left side, half a stem in, and leans out by half a stem as it drops.
x = left + sw / 2
tail = f'M{x:.2f} {foot - sw / 2:.2f} L{x - sw / 2:.2f} {foot + BODY * drop * 0.5 - sw / 2:.2f}'
print(json.dumps([
    {'d': pen.getCommands(), 'fill': 'currentColor', 'stroke': 'none', 'sw': 0},
    {'d': tail, 'fill': 'none', 'stroke': 'currentColor', 'sw': round(sw, 2)},
], indent=2))
