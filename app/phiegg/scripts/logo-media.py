"""Media icons (avatars, posts, stores) and the EGG token sign, from site.json brand.media, into public/<media.out>.

    python scripts/logo-media.py src/data/site.json      then   node scripts/logo-merch.mjs media   (colours, PNGs)

Frames (media.frame), each the bird inside a shape the brand already draws, in the 0-100 box with media.room round it:
  - "eye": the bird's own eye (rings 1 and 2 of media.bird, the outline logo-bird.py --px traced): its outer edge and
    its diamond make the frame, and the bird sits where the diamond was;
  - "glyph": a Phifing 4 digit's lower bowl (the 8's square): the outside's bottom, mirrored to close the top, and the
    bowl's own inside;
  - "file": a mark already drawn (the egg with the bird), copied as it is.
The bird is set in the frame's inside as large as it goes with media.gap of the inside's width clear all round, its
box centred on the inside's box. Everything is drawn even-odd, so the frame's inside and the bird's eye stay open.

The token sign (media.token.sign): a Phifing 4 letter made as the pound is made. "bar": the pound's bar put through
the letter's stem, its thickness and round ends the pound's own, running past the stem's back and front by what the
pound's does; "arm" sets it at the letter's floating bar (the E's middle arm, which it runs on into), "crossbar" at
the bar under the letter's counter, "pound" at the pound bar's own height as a share of the letter's. "foot": the
pound's lower part set under the letter's stem (the stems line up; the cut is where both are plain stem): "back" adds
the pound's curl and foot behind the stem and keeps the letter's own bottom arm, "whole" puts the pound's whole lower
part (stem, curl and foot, both ends as the pound draws them) under the letter's top. The pound is drawn beside them on the sheet (index.html) for comparison."""
import json, os, re, subprocess, sys, types
from pathlib import Path
import numpy as np

try:
    import brotli  # noqa: F401
except ImportError:                       # fontTools reads .woff2 through brotli; Node has it built in
    def _decompress(data):
        js = ("const z=require('zlib');const c=[];process.stdin.on('data',d=>c.push(d))"
              ".on('end',()=>process.stdout.write(z.brotliDecompressSync(Buffer.concat(c))))")
        return subprocess.run(['node', '-e', js], input=data, capture_output=True, check=True).stdout
    sys.modules['brotli'] = types.SimpleNamespace(decompress=_decompress)
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

site_path = Path(sys.argv[1]); ROOT = site_path.resolve().parents[2]
site = json.load(open(site_path, encoding='utf-8')); B = site['brand']; M = B['media']
OUT = ROOT / 'public' / M['out']; OUT.mkdir(parents=True, exist_ok=True)
INK, ROOM = M['ink'], M['room']
num = lambda v: ('%.2f' % v).rstrip('0').rstrip('.') if abs(v) >= 0.005 else '0'


# ---- shapes: a ring is a list of segments, each a 2-point line or a 4-point cubic ----
def parse(d):
    """An M/C/L/Z path as rings of segments."""
    rings = []
    for sp in re.findall(r'M[^M]*', d):
        toks = re.findall(r'[MCLZ]|-?[\d.]+', sp); i = 0; ring = []; cur = None; op = None
        while i < len(toks):
            if toks[i] in 'MCLZ': op = toks[i]; i += 1; continue
            if op == 'M': cur = np.array([float(toks[i]), float(toks[i + 1])]); i += 2
            elif op == 'L': nxt = np.array([float(toks[i]), float(toks[i + 1])]); ring.append(np.array([cur, nxt])); cur = nxt; i += 2
            elif op == 'C':
                q = np.array([float(v) for v in toks[i:i + 6]]).reshape(3, 2); ring.append(np.vstack([cur, q])); cur = q[-1]; i += 6
        rings.append(ring)
    return rings

def points(ring, n=24):
    """A ring sampled as a polygon."""
    out = []
    for s in ring:
        if len(s) == 2: out.append(s[:1])
        else:
            t = np.linspace(0, 1, n, endpoint=False)[:, None]; m = 1 - t
            out.append(m ** 3 * s[0] + 3 * m * m * t * s[1] + 3 * m * t * t * s[2] + t ** 3 * s[3])
    return np.vstack(out)

def poly_ring(P):
    """A polygon as a ring of lines."""
    return [np.array([P[i], P[(i + 1) % len(P)]]) for i in range(len(P))]

def moved(rings, f):
    return [[np.array([f(p) for p in s]) for s in r] for r in rings]

def d_of(rings, f=lambda p: p):
    out = ''
    for r in rings:
        out += 'M' + ' '.join(num(v) for v in f(r[0][0]))
        for s in r:
            out += ('L' if len(s) == 2 else 'C') + ' '.join(' '.join(num(v) for v in f(q)) for q in s[1:])
        out += 'Z'
    return out

def inside(P, H):
    """Which points of P lie inside polygon H."""
    x, y = P[:, 0:1], P[:, 1:2]; a, b = H, np.roll(H, -1, 0)
    cross = ((a[:, 1] > y) != (b[:, 1] > y)) & (x < a[:, 0] + (y - a[:, 1]) * (b[:, 0] - a[:, 0]) / (b[:, 1] - a[:, 1] + 1e-12))
    return cross.sum(1) % 2 == 1

def clearance(P, H):
    """Each point's distance to polygon H's edges."""
    a, b = H, np.roll(H, -1, 0); ab = b - a
    t = np.clip(((P[:, None] - a) * ab).sum(-1) / (ab * ab).sum(-1).clip(1e-12), 0, 1)
    return np.linalg.norm(P[:, None] - (a + t[..., None] * ab), axis=-1).min(1)

def square_box(rings, extra=None):
    """The map from the shapes' own units onto the 0-100 box, ROOM clear round their extent."""
    P = np.vstack([points(r) for r in rings] + ([extra] if extra is not None else []))
    (x0, y0), (x1, y1) = P.min(0), P.max(0); k = (100 - 2 * ROOM) / max(x1 - x0, y1 - y0)
    return lambda p: np.array([50 + (p[0] - (x0 + x1) / 2) * k, 50 + (p[1] - (y0 + y1) / 2) * k])

def svg(d, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="{label}">'
            f'<path fill="{INK}" fill-rule="evenodd" d="{d}"/></svg>\n')


# ---- the bird and the font ----
bird_svg = (ROOT / 'public' / M['bird']).read_text(encoding='utf-8')
BIRD = parse(re.search(r' d="([^"]+)"', bird_svg).group(1))     # body, eye's outer edge, eye's diamond (pixels)
font = TTFont(str((ROOT / M['font']).resolve())); CMAP = font.getBestCmap(); GLYPHS = font.getGlyphSet()

def glyph(ch):
    """A glyph's outlines as polygons, y down (as an SVG draws), in font units."""
    pen = DecomposingRecordingPen(GLYPHS); GLYPHS[CMAP[ord(ch)]].draw(pen); rings, cur = [], []
    for op, a in pen.value:
        if op == 'closePath': rings.append(np.array(cur) * [1, -1]); cur = []
        elif op in ('moveTo', 'lineTo'): cur += list(a)
        else: raise ValueError(f'{ch}: {op} — the Phi fonts are drawn in lines')
    return rings

def runs(rings, y):
    """Where the ink is along the line at height y: (start, end) pairs."""
    xs = []
    for R in rings:
        a, b = R, np.roll(R, -1, 0); hit = (a[:, 1] > y) != (b[:, 1] > y)
        xs += list(a[hit, 0] + (y - a[hit, 1]) * (b[hit, 0] - a[hit, 0]) / (b[hit, 1] - a[hit, 1]))
    xs = sorted(xs); return list(zip(xs[::2], xs[1::2]))


def place_bird(hole):
    """The bird's rings set in polygon `hole`: as large as goes with the gap clear, box centred on the hole's box."""
    body = points(BIRD[0]); (bx0, by0), (bx1, by1) = body.min(0), body.max(0); bc = np.array([(bx0 + bx1) / 2, (by0 + by1) / 2])
    hc = (hole.min(0) + hole.max(0)) / 2; gap = M['gap'] * (hole[:, 0].max() - hole[:, 0].min())
    fit = lambda s: (lambda Q: inside(Q, hole).all() and clearance(Q, hole).min() >= gap)(hc + (body - bc) * s)
    lo, hi = 0.0, 4 * (hole.max(0) - hole.min(0)).max() / (body.max(0) - body.min(0)).max()
    for _ in range(40):
        mid = (lo + hi) / 2; lo, hi = (mid, hi) if fit(mid) else (lo, mid)
    return moved(BIRD, lambda p: hc + (p - bc) * lo), lo


made = {}
for name, f in M['frame'].items():
    if f['from'] == 'file':
        src = (ROOT / 'public' / f['file']).read_text(encoding='utf-8'); (OUT / f'{name}.svg').write_text(src, encoding='utf-8')
        made[name] = f['note']; print(name, '| copied', f['file']); continue
    if f['from'] == 'eye':
        frame = [BIRD[1], BIRD[2]]; hole = points(BIRD[2])
    elif f['from'] == 'glyph':
        R = glyph(f['glyph']); outer = R[0]
        holes = sorted(R[1:], key=lambda h: -h[:, 1].mean())          # the lower bowl's inside: lowest on the page
        low = holes[0]; top_wall = holes[1][:, 1].max()               # the bar between the insides is the bowl's top
        mid = (outer[:, 1].max() + top_wall) / 2                      # (y down: the lowest inside has the largest y)
        n = len(outer); keep = outer[:, 1] >= mid
        start = next(i for i in range(n) if keep[i] and not keep[i - 1]); order = [(start + i) % n for i in range(n)]
        run = np.array([outer[i] for i in order if keep[i]])           # the outside's bottom, in drawing order
        mirror = run[::-1] * [1, -1] + [0, 2 * mid]                    # mirrored above the bowl's middle
        frame = [poly_ring(np.vstack([run, mirror])), poly_ring(low)]; hole = low
        print(name, f'| {f["glyph"]}: bowl', np.vstack([run, mirror]).min(0).round(), np.vstack([run, mirror]).max(0).round(),
              '| inside', low.min(0).round(), low.max(0).round())
    bird, s = place_bird(hole)
    to = square_box(frame)
    d = d_of(frame, to) + d_of(bird, to)
    (OUT / f'{name}.svg').write_text(svg(d, 'phiegg'), encoding='utf-8'); made[name] = f['note']
    print(name, '| bird scale', round(s, 4), '| wrote', OUT.name + f'/{name}.svg')


# ---- the token sign ----
T = M['token']; P = glyph(T['pound'])[0]
ys = np.arange(P[:, 1].min() + 0.5, P[:, 1].max(), 1.0); R_ = [runs([P], y) for y in ys]
foot = ys > P[:, 1].max() - (P[:, 1].max() - P[:, 1].min()) * 0.15      # the foot: the bottom of the sign
first = np.array([r[0] for r in R_])
stem_left = np.median(first[~foot, 0])                                  # most rows are the stem alone
reach = first[~foot, 0].min()                                           # the bar's far end
is_bar = (first[:, 0] < (reach + stem_left) / 2) & ~foot                # rows out past half way: the bar, not its fillets
bt, bb = ys[is_bar].min() - 0.5, ys[is_bar].max() + 0.5; yb = (bt + bb) / 2
bar_x0, bar_x1 = R_[int(np.argmin(np.abs(ys - yb)))][0][0], R_[int(np.argmin(np.abs(ys - yb)))][-1][1]
below = (ys > bb + 5) & ~foot
stem = (np.median(first[below, 0]), np.median(first[below, 1]))
over_out, over_in = stem[0] - bar_x0, bar_x1 - stem[1]; THICK = bb - bt; HALF = THICK / 2
near = (P[:, 1] >= bt - 1) & (P[:, 1] <= bb + 1)
cap_l = P[near & (P[:, 0] <= bar_x0 + HALF)] - [bar_x0 + HALF, yb]     # the round ends, about their own centres
cap_r = P[near & (P[:, 0] >= bar_x1 - HALF)] - [bar_x1 - HALF, yb]
cap_r = cap_r[np.argsort(np.arctan2(cap_r[:, 1], cap_r[:, 0]))]                       # top, right, bottom
cap_l = cap_l[np.argsort(np.arctan2(cap_l[:, 1], cap_l[:, 0]) % (2 * np.pi))]         # bottom, left, top
print('pound bar', round(THICK), 'thick, at', round(-bb), 'to', round(-bt), '| stem', [round(v) for v in stem],
      '| past the stem: outside', round(over_out), 'inside', round(over_in))

def bar(x0, x1, yc):
    """The pound's bar from x0 to x1 centred on yc: its own round ends, straight between."""
    return np.vstack([cap_r + [x1 - HALF, yc], cap_l + [x0 + HALF, yc]])

sarea = lambda R: 0.5 * np.sum(R[:, 0] * np.roll(R[:, 1], -1) - np.roll(R[:, 0], -1) * R[:, 1])
def clip(R, axis, at, keep_below):
    """Polygon R cut by the line where coordinate `axis` is `at` (Sutherland-Hodgman), the side below or above kept."""
    inside_ = (lambda q: q[axis] <= at) if keep_below else (lambda q: q[axis] >= at); out = []
    for i in range(len(R)):
        p, q = R[i - 1], R[i]
        if inside_(q):
            if not inside_(p): out.append(p + (q - p) * (at - p[axis]) / (q[axis] - p[axis]))
            out.append(q)
        elif inside_(p): out.append(p + (q - p) * (at - p[axis]) / (q[axis] - p[axis]))
    return np.array(out)

signs = {}
for name, sg in T['sign'].items():
    L = sorted(glyph(sg['letter']), key=lambda R: -abs(sarea(R))); top, base = L[0][:, 1].min(), L[0][:, 1].max(); thick = THICK
    at, foot_ = sg.get('bar'), sg.get('foot')
    shapes = list(L); said = []
    if foot_:
        # The pound's lower part under the letter's stem: shifted so the stems line up, cut where both are plain stem
        # (the middle of the longest stretch where their two edges agree), so nothing of either is bent.
        r0 = runs(L, -thick * 4)[0]; dx = r0[0] - stem[0]; Ps = P + [dx, 0]
        rows = [y for y in np.arange(bb + 1, -1, 1.0) if runs(L, y) and runs([Ps], y)
                and abs(runs(L, y)[0][0] - runs([Ps], y)[0][0]) < 1.5 and abs(runs(L, y)[0][1] - runs([Ps], y)[0][1]) < 1.5]
        stretch, best = [], []
        for y in rows:
            stretch = stretch + [y] if stretch and y - stretch[-1] <= 1.01 else [y]; best = max(best, stretch, key=len)
        cut = (best[0] + best[-1]) / 2
        piece = clip(Ps, 1, cut - 0.5, False)                           # the pound below the cut (y down: larger y)
        if foot_ == 'back':                                             # only the back of the stem: the curl and the foot
            piece = clip(piece, 0, r0[1], True)
            # Under the letter's round bottom corner, past the stem, the pound's flat foot runs on to where the
            # letter's bottom reaches the baseline, so the two bottoms meet with no step.
            low = max(b_ for _, b_ in runs([R[:, ::-1] for R in L], r0[1] - 0.5))      # the letter's bottom there
            flat = runs(L, -0.5)[0][0]
            if flat > r0[1]:
                shapes.append(clip(clip(clip(Ps, 1, low - 1, False), 0, r0[1] - 1, False), 0, flat + 1, True))
        else:                                                           # the whole lower part: the letter stops at the cut
            shapes[0] = clip(L[0], 1, cut + 0.5, True)
        shapes.append(piece); said.append(f'foot {foot_}, cut at {round(-cut)}, pound moved {round(dx)}')
    if at:
        if at == 'arm':                                                 # the letter's floating bar: its second outline
            yc = (L[1][:, 1].min() + L[1][:, 1].max()) / 2
        elif at == 'crossbar':                                          # the bar under the letter's (top) counter
            yc = min(L[1:], key=lambda R: R[:, 1].mean())[:, 1].max() + thick / 2
        else:                                                           # the pound bar's height, as a share of the letter
            yc = yb / P[:, 1].min() * top                               # from the baseline (y 0), tails left out
        r = runs(L, yc + thick)                                         # the stem just under the bar
        s0, s1 = (r[0] if sg['stem'] == 'left' else r[-1])
        x0, x1 = (s0 - over_out, s1 + over_in) if sg['stem'] == 'left' else (s0 - over_in, s1 + over_out)
        if at == 'arm': x1 = max(x1, L[1][:, 0].max())                 # the bar runs on to the arm's own end: one bar
        Bp = bar(x0, x1, yc)
        if np.sign(sarea(Bp)) != np.sign(sarea(L[0])): Bp = Bp[::-1]  # the bar turns the way the letter's outside does
        shapes.append(Bp); said.append(f'bar at {round(-yc)}, {round(x0)} to {round(x1)}')
    rings = [poly_ring(R) for R in shapes]; to = square_box(rings)
    # Nonzero, every outline the way the font turns its outsides, so the parts join and the counters stay open.
    (OUT / f'{name}.svg').write_text(svg(d_of(rings, to), 'EGG').replace(' fill-rule="evenodd"', ''), encoding='utf-8')
    signs[name] = sg['note']; print(name, '|', ' | '.join(said))
pound = [poly_ring(R) for R in glyph(T['pound'])]
(OUT / 'pound.svg').write_text(svg(d_of(pound, square_box(pound)), 'pound').replace(' fill-rule="evenodd"', ''), encoding='utf-8')


# ---- the sheet ----
cs = M['colours']
cell = lambda n, note: (f'<figure><img src="{n}.svg" alt="{n}"/><figcaption>{n}<br/><small>{note}</small></figcaption></figure>')
html = ('<!doctype html><meta charset="utf-8"><title>Phiegg media</title>'
        f'<style>body{{margin:24px;font:14px/1.4 system-ui;background:{cs["white"]};color:{cs["black"]}}}'
        'section{display:flex;flex-wrap:wrap;gap:24px}figure{margin:0;width:220px}'
        f'img{{width:220px;height:220px;display:block;border:1px solid {cs["black"]}22}}small{{opacity:.7}}</style>'
        '<h2>Media icons</h2><section>' + ''.join(cell(n, t) for n, t in made.items()) + '</section>'
        '<h2>EGG sign, made like the pound</h2><section>' + cell('pound', 'Phifing 4 £, for comparison')
        + ''.join(cell(n, t) for n, t in signs.items()) + '</section>')
(OUT / 'index.html').write_text(html, encoding='utf-8')
print('sheet | wrote', OUT.name + '/index.html')
