"""Build a logo face from scripts/media/logo-font.json: each letter is a few contours of corners [x, y, radius], each
corner rounded by a quadratic curve through it. Writes media/phi-media/fonts/<file>.woff2 (served at /cdn/fonts/).
    python scripts/media/logo-font.py [scripts/media/logo-font.json]
"""
import json
import sys
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = Path(__file__).resolve().parents[2]


def contour(pen, corners):
    """One closed contour: straight edges between corners, each corner rounded by its radius (0: sharp)."""
    n = len(corners)

    def toward(a, b, r):
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = (dx * dx + dy * dy) ** 0.5
        t = min(r, d / 2) / d if d else 0
        return (round(a[0] + dx * t), round(a[1] + dy * t))

    pts = []
    for i, (x, y, r) in enumerate(corners):
        prev, nxt = corners[i - 1], corners[(i + 1) % n]
        if r:
            pts.append(('line', toward((x, y), prev, r)))
            pts.append(('curve', (x, y), toward((x, y), nxt, r)))
        else:
            pts.append(('line', (x, y)))
    start = pts[0][1]
    pen.moveTo(start)
    for p in pts[1:]:
        if p[0] == 'line':
            pen.lineTo(p[1])
        else:
            pen.qCurveTo(p[1], p[2])
    pen.closePath()


def build(spec_path):
    spec = json.loads(Path(spec_path).read_text(encoding='utf-8'))
    side = spec['side']
    order = ['.notdef', 'space'] + list(spec['glyphs'])
    glyphs, metrics, cmap = {}, {}, {32: 'space'}

    glyphs['.notdef'] = TTGlyphPen(None).glyph(); metrics['.notdef'] = (spec['space'], 0)
    glyphs['space'] = TTGlyphPen(None).glyph(); metrics['space'] = (spec['space'], 0)
    for name, g in spec['glyphs'].items():
        pen = TTGlyphPen(None)
        for c in g['contours']:
            corners = c['hole'] if isinstance(c, dict) else c
            contour(pen, [(x + side, y, r) for x, y, r in corners])
        glyphs[name] = pen.glyph()
        metrics[name] = (g['width'] + 2 * side, side)
        cmap[ord(name)] = name
        cmap[ord(name.lower())] = name

    fb = FontBuilder(spec['upm'], isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=spec['ascent'], descent=-spec['descent'])
    family = spec['family']
    fb.setupNameTable({'familyName': family, 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=spec['ascent'], sTypoDescender=-spec['descent'], usWinAscent=spec['ascent'],
                usWinDescent=spec['descent'], usWeightClass=900)
    fb.setupPost()
    fb.font.flavor = 'woff2'
    out = ROOT / 'media' / 'phi-media' / 'fonts' / (spec['file'] + '.woff2')
    fb.save(str(out))
    print(f'{family}: {len(spec["glyphs"])} letters -> {out.relative_to(ROOT)} ({out.stat().st_size} bytes)')


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'scripts' / 'media' / 'logo-font.json')
