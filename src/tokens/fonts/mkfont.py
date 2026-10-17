#!/usr/bin/env python3
"""Phiegg Square — a monoline geometric display font derived from the phiegg wordmark.
Skeletons (lines + arcs) are stroked into filled outlines with shapely, then compiled to TTF/WOFF2.
Round terminals (the wordmark uses strokeLinecap=round), constant stroke, geometric bowls."""
import math
from shapely.geometry import LineString, Point
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

UPM = 1000
SW = 92              # monoline stroke width
BASE = 0
CAP = 700           # cap height
ASC_LINE = 740
DESC = -210
R = 300             # round cap bowl radius
CY = 350            # round letters centered here (0..700)
X0 = 72             # left stem
X1 = 528            # right stem (round letters span wider via radius)
CXR = 300           # round letter center x

def arc(cx, cy, r, a0, a1, n=28):
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def line(*pts):
    return list(pts)

# Each glyph: (advance, [stroke, ...]); stroke = list of (x,y) points (a polyline; a ring if closed).
G = {}

def rnd(cx=CXR, cy=CY, r=R):   # full circle ring (O, 0)
    return arc(cx, cy, r, 0, 360)

# ---- UPPERCASE (cap height, monoline geometric) ----
G['O'] = (640, [rnd()])
G['Q'] = (650, [rnd(), line((CXR+150, CY-150), (CXR+320, CY-320))])
G['C'] = (620, [arc(CXR, CY, R, 48, 312)])
G['G'] = (650, [arc(CXR, CY, R, 55, 305), line((CXR+R*math.cos(math.radians(305)), CY+R*math.sin(math.radians(305))), (CXR+R, CY), (CXR-30, CY))])
G['D'] = (640, [line((X0, 0), (X0, CAP)), arc(X0, CY, CY, 90, -90), line((X0, CAP), (X0+40, CAP)), line((X0, 0), (X0+40, 0))])
G['I'] = (240, [line((120, 0), (120, CAP))])
G['H'] = (620, [line((X0, 0), (X0, CAP)), line((X1, 0), (X1, CAP)), line((X0, CY), (X1, CY))])
G['L'] = (520, [line((X0, CAP), (X0, 0), (470, 0))])
G['T'] = (560, [line((40, CAP), (520, CAP)), line((280, CAP), (280, 0))])
G['E'] = (540, [line((470, CAP), (X0, CAP), (X0, 0), (470, 0)), line((X0, CY), (420, CY))])
G['F'] = (520, [line((470, CAP), (X0, CAP), (X0, 0)), line((X0, CY), (410, CY))])
G['P'] = (600, [line((X0, 0), (X0, CAP), (CXR+40, CAP)), arc(CXR+40, (CAP+CY+40)/2 + 20, (CAP-(CY+60))/2 + 20, 90, -90), line((CXR+40, CY+60), (X0, CY+60))])
G['B'] = (610, [line((X0, 0), (X0, CAP), (CXR, CAP)), arc(CXR, (CAP+CY)/2+30, (CAP-CY)/2-10, 90, -90), line((CXR, CY+70), (X0, CY+70)), line((X0, CY+70), (CXR+20, CY+70)), arc(CXR+20, (CY)/2+35, (CY)/2+35-10, 90, -90), line((CXR+20, 0), (X0, 0))])
G['R'] = (610, [line((X0, 0), (X0, CAP), (CXR+30, CAP)), arc(CXR+30, (CAP+CY+60)/2, (CAP-CY-60)/2, 90, -90), line((CXR+30, CY+60), (X0, CY+60)), line((X0+170, CY+60), (490, 0))])
G['N'] = (640, [line((X0, 0), (X0, CAP)), line((X0, CAP), (X1+40, 0)), line((X1+40, CAP), (X1+40, 0))])
G['M'] = (720, [line((X0, 0), (X0, CAP)), line((X0, CAP), (360, 120)), line((360, 120), (648, CAP)), line((648, CAP), (648, 0))])
G['A'] = (640, [line((40, 0), (320, CAP), (600, 0)), line((150, 250), (490, 250))])
G['V'] = (640, [line((40, CAP), (320, 0), (600, CAP))])
G['W'] = (760, [line((30, CAP), (210, 0), (380, CAP), (550, 0), (730, CAP))])
G['X'] = (620, [line((50, 0), (560, CAP)), line((50, CAP), (560, 0))])
G['Y'] = (600, [line((40, CAP), (300, 330), (560, CAP)), line((300, 330), (300, 0))])
G['K'] = (600, [line((X0, 0), (X0, CAP)), line((X0, 300), (500, CAP)), line((X0+110, 360), (510, 0))])
# S as an explicit spine: top-right terminal, over the top-left, down to the waist, out to the right, around to the
# bottom-left terminal — a standard forward S.
G['S'] = (560, [[(360, 690), (270, 692), (190, 665), (152, 600), (150, 545), (170, 490), (230, 455),
                 (300, 420), (372, 388), (430, 345), (452, 285), (450, 225), (425, 160), (360, 120),
                 (280, 110), (205, 118)]])
G['U'] = (640, [line((X0, CAP), (X0, 230)), arc(CXR, 230, R-8, 180, 360), line((X0+2*(R-8), 230), (X0+2*(R-8), CAP))])
G['J'] = (480, [line((360, CAP), (360, 190)), arc(200, 190, 160, 0, -180)])
G['Z'] = (580, [line((60, CAP), (520, CAP), (60, 0), (520, 0))])

# ---- DIGITS ----
G['0'] = (600, [rnd(CXR, CY, 270), line((CXR-120, CY-150), (CXR+120, CY+150))])
G['1'] = (360, [line((110, CAP-150), (230, CAP), (230, 0)), line((110, 0), (350, 0))])
G['2'] = (580, [arc(CXR, CAP-200, 200, 170, -70)[::-1], line((CXR+200*math.cos(math.radians(-70)), CAP-200+200*math.sin(math.radians(-70))), (70, 0), (510, 0))])
G['3'] = (570, [arc(290, CAP-180, 180, 160, -120)[::-1], arc(290, 180, 180, 120, -160)[::-1]])
G['4'] = (600, [line((420, 0), (420, CAP), (70, 190), (560, 190))])
G['5'] = (570, [line((470, CAP), (150, CAP), (120, 360)), arc(300, 220, 220, 110, -180)[::-1]])
G['6'] = (590, [arc(CXR, 230, 230, -40, 300), line((CXR+230*math.cos(math.radians(300)), 230+230*math.sin(math.radians(300))), (CXR-40, CAP))])
G['7'] = (560, [line((70, CAP), (520, CAP), (250, 0))])
G['8'] = (590, [arc(CXR, CAP-185, 185, 0, 360), arc(CXR, 190, 215, 0, 360)])
G['9'] = (590, [arc(CXR, CAP-230, 230, 140, 480), line((CXR+230*math.cos(math.radians(140)), CAP-230+230*math.sin(math.radians(140))), (CXR+40, 0))])

# ---- PUNCTUATION ----
G['.'] = (260, [line((130, 20), (130, 20))])
G[','] = (260, [line((140, 30), (90, -140))])
G[':'] = (260, [line((130, 20), (130, 20)), line((130, 330), (130, 330))])
G[';'] = (260, [line((140, 30), (90, -140)), line((130, 330), (130, 330))])
G['!'] = (260, [line((130, CAP), (130, 220)), line((130, 20), (130, 20))])
G['?'] = (520, [arc(250, CAP-190, 190, 200, -30)[::-1], line((250+190*math.cos(math.radians(-30))-40, CAP-190+190*math.sin(math.radians(-30))-10), (250, 240), (250, 220)), line((250, 20), (250, 20))])
G['-'] = (460, [line((90, 360), (370, 360))])
G['–'] = (520, [line((80, 360), (440, 360))])
G['—'] = (760, [line((80, 360), (680, 360))])
G['/'] = (440, [line((70, -120), (370, CAP+40))])
G['\\'] = (440, [line((70, CAP+40), (370, -120))])
G['('] = (320, [arc(330, CY, 380, 150, 210)])
G[')'] = (320, [arc(-30, CY, 380, -30, 30)])
G['·'] = (260, [line((130, 360), (130, 360))])
G['…'] = (640, [line((110, 20), (110, 20)), line((320, 20), (320, 20)), line((530, 20), (530, 20))])
G["'"] = (220, [line((110, CAP), (110, CAP-170))])
G['"'] = (360, [line((110, CAP), (110, CAP-170)), line((250, CAP), (250, CAP-170))])
G['&'] = (660, [arc(230, CAP-150, 150, 300, 560)[::-1] + arc(250, 200, 200, 150, -120)[::-1] + [(560, 120)]])
G['@'] = (760, [arc(360, CY, 320, 0, 360), arc(360, CY, 150, 0, 300)[::-1] + [(360+150, CY+60)]])
G['%'] = (720, [line((120, 0), (600, CAP)), arc(190, CAP-130, 130, 0, 360), arc(530, 130, 130, 0, 360)])
G['+'] = (560, [line((90, 350), (470, 350)), line((280, 160), (280, 540))])
G['='] = (560, [line((90, 430), (470, 430)), line((90, 250), (470, 250))])
G['#'] = (640, [line((200, 0), (280, CAP)), line((400, 0), (480, CAP)), line((90, 230), (560, 230)), line((110, 470), (580, 470))])

SPACE_ADV = 300

def stroke_to_polys(strokes):
    geoms = []
    for pts in strokes:
        if len(pts) == 1 or (len(pts) == 2 and pts[0] == pts[1]):
            geoms.append(Point(pts[0]).buffer(SW / 2, resolution=16))
        else:
            ls = LineString(pts)
            geoms.append(ls.buffer(SW / 2, cap_style=1, join_style=1, resolution=16))
    return unary_union(geoms)

def poly_to_glyph(poly, advance):
    pen = TTGlyphPen(None)
    polys = poly.geoms if poly.geom_type == 'MultiPolygon' else [poly]
    for pg in polys:
        pg = orient(pg, sign=-1.0)  # exterior CW, holes CCW for TrueType
        ext = list(pg.exterior.coords)[:-1]
        pen.moveTo((round(ext[0][0]), round(ext[0][1])))
        for x, y in ext[1:]:
            pen.lineTo((round(x), round(y)))
        pen.closePath()
        for ring in pg.interiors:
            r = list(ring.coords)[:-1]
            pen.moveTo((round(r[0][0]), round(r[0][1])))
            for x, y in r[1:]:
                pen.lineTo((round(x), round(y)))
            pen.closePath()
    return pen.glyph()

glyph_order = ['.notdef', 'space']
glyphs = {}
advances = {}
cmap = {}

# notdef
pen = TTGlyphPen(None); glyphs['.notdef'] = pen.glyph(); advances['.notdef'] = 600
# space
pen = TTGlyphPen(None); glyphs['space'] = pen.glyph(); advances['space'] = SPACE_ADV; cmap[0x20] = 'space'

NAMES = {'.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon', '!': 'exclam', '?': 'question',
         '-': 'hyphen', '/': 'slash', '\\': 'backslash', '(': 'parenleft', ')': 'parenright',
         "'": 'quotesingle', '"': 'quotedbl', '&': 'ampersand', '@': 'at', '%': 'percent',
         '+': 'plus', '=': 'equal', '#': 'numbersign', '–': 'endash', '—': 'emdash',
         '·': 'periodcentered', '…': 'ellipsis'}

def gname(ch):
    if ch.isalnum():
        return ch if ch.isalpha() else 'num' + ch  # digits -> num0..num9 glyph names
    return NAMES[ch]

for ch, (adv, strokes) in G.items():
    name = gname(ch)
    poly = stroke_to_polys(strokes)
    glyphs[name] = poly_to_glyph(poly, adv)
    advances[name] = adv
    glyph_order.append(name)
    cp = ord(ch)
    cmap[cp] = name
    # map lowercase codepoints to the same (uppercase) glyph — a display face; headings are uppercased anyway
    if ch.isupper():
        cmap[ord(ch.lower())] = name

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(glyph_order)
fb.setupCharacterMap(cmap)
fb.setupGlyf(glyphs)
metrics = {g: (advances.get(g, 600), glyphs[g].xMin if hasattr(glyphs[g], 'xMin') and glyphs[g].numberOfContours else 0) for g in glyph_order}
# recompute bounds
fb.setupHorizontalMetrics({g: (advances.get(g, 600), 0) for g in glyph_order})
fb.setupHorizontalHeader(ascent=ASC_LINE, descent=DESC)
fb.setupNameTable({'familyName': 'Phiegg Square', 'styleName': 'Regular', 'psName': 'PhieggSquare-Regular',
                   'version': '1.0', 'fullName': 'Phiegg Square'})
fb.setupOS2(sTypoAscender=ASC_LINE, sTypoDescender=DESC, usWinAscent=ASC_LINE, usWinDescent=-DESC, sCapHeight=CAP, sxHeight=500)
fb.setupPost()
fb.font.recalcBBoxes = True
out_ttf = '/tmp/claude-0/-home-claude/0be509d4-4daa-51e4-a3e9-d4c12ae0c457/scratchpad/PhieggSquare.ttf'
fb.save(out_ttf)

# woff2
f = TTFont(out_ttf)
f.flavor = 'woff2'
f.save('/tmp/claude-0/-home-claude/0be509d4-4daa-51e4-a3e9-d4c12ae0c457/scratchpad/PhieggSquare.woff2')
print('glyphs:', len(glyph_order), 'cmap entries:', len(cmap))
import os
print('ttf', os.path.getsize(out_ttf), 'woff2', os.path.getsize('/tmp/claude-0/-home-claude/0be509d4-4daa-51e4-a3e9-d4c12ae0c457/scratchpad/PhieggSquare.woff2'))
