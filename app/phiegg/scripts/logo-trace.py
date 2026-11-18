"""Trace a one-colour logo picture into smooth SVG paths: the shape's outline as fitted cubic curves, its hole as an
exact ellipse, and whatever sits inside the hole (the bird) as its own fitted outline.

    python scripts/logo-trace.py public/logo/phiegg-3d-with-bird.png public/logo/phiegg-bird.svg [--tol 1.5] [--corner 30]
        [--egg src/data/site.json public/logo/phiegg-egg-bird.svg] [--bird bird-alone.svg]
        [--frame public/logo/phiegg-3d-with-bird-no-touch.png [--mirror] [--place bird-on-frame.png] [--path bird-px.svg]]

How it reads the picture:
  - ink is the picture's own colour at full alpha; faint marks of another colour (a smudge) drop out;
  - outlines are found to a fraction of a pixel (marching squares on alpha at 50%), so the edge smoothing is kept;
  - each outline is evened out, cut at its sharp corners (a turn over --corner degrees within a few pixels: the beak,
    the tail), and each run between corners is fitted with as few cubic curves as stay within --tol pixels;
  - the hole: an ellipse is fitted to the part of the hole's outline that is not the bird, and drawn as two arcs;
  - the bird: an island of its own inside the hole (when it does not touch), or else the rest of the hole's outline,
    closed a little way inside the body so it joins the body cleanly (when it does).
With --egg, the bird alone also goes into the original Phiegg mark (site.json brand.egg): the picture's hole is mapped
onto the mark's oval inside its stroke, so the bird sits where the picture puts it, and the mark is drawn as it always
was (stroked, turned brand.egg.rotate degrees) with the bird filled inside it.
With --frame, the picture holds the bird alone (no egg) on the same canvas as the frame picture; the egg and its hole
are read from the frame. --mirror turns the bird to face the other way, in the frame's own bird's place. --place takes a
bird drawn at its own size and sets it on the box of the bird in another picture drawn on the frame's canvas. --path
takes the bird's outline from an SVG traced from the picture in its own pixels (scripts/logo-bird.py --px: the eye
and the soft tail kept), placed the same way, instead of tracing the picture here.
One path, nonzero fill: body one way round, the ellipse the other (the hole), the bird the body's way (back in)."""
import math, struct, sys, zlib
import numpy as np

args = sys.argv[1:]
def opt(k, d):
    return float(args[args.index(k) + 1]) if k in args else d
src, out = args[0], args[1]
TOL, CORNER, EVEN = opt('--tol', 1.5), opt('--corner', 30), int(opt('--even', 7))
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import trace_lib
from trace_lib import *
trace_lib.TOL, trace_lib.CORNER, trace_lib.EVEN = TOL, CORNER, EVEN


def outlines(path):
    """The picture's ink colour and its outlines at half alpha, biggest first."""
    im = read_png(path).astype(float)
    alpha = im[..., 3] / 255 if im.shape[2] == 4 else np.ones(im.shape[:2])
    rgb = im[..., :3]
    ink = np.median(rgb[alpha > 0.99], axis=0)
    near = np.linalg.norm(rgb - ink, axis=2) < 120
    return ink, sorted(rings(np.pad(np.where(near, alpha, 0.0), 1)), key=lambda r: -abs(area(r)))


# --frame: the picture is the bird alone, drawn on the same canvas as the frame picture, whose egg and hole it goes in.
frame = args[args.index('--frame') + 1] if '--frame' in args else None
ink, found = outlines(frame or src)
print('outlines', len(found), 'areas', [round(abs(area(r))) for r in found[:5]])
outer, hole = found[0], found[1]


# ---- the hole: an ellipse, and the bird inside it ----


H = resample(hole, 1.0)
# The bird only cuts into the hole, so the hole's own ellipse is what lies on its convex hull: start there.
on = off_hull(H, hull(H)) < 1.5
for _ in range(8):
    c, ax, ang = ellipse_fit(H[on]); dist = ellipse_dist(H, c, ax, ang)
    on = np.abs(dist) < 2.0
print('ellipse centre', c.round(1), 'half axes', ax.round(1), 'tilt', round(math.degrees(ang), 2), 'deg; on it', on.sum(), 'of', len(H),
      '; off by', round(float(np.abs(dist[on]).mean()), 2), 'px')
# The bird: an island of ink inside the hole (it does not touch), or a bite out of the hole's edge (it does).
island = next((r for r in found[2:] if abs(area(r)) > 0.01 * abs(area(outer))), None)
if frame:
    was = island
    island = outlines(src)[1][0].copy()
    if '--mirror' in args:
        # Turned to face the other way, in the frame bird's place: its box centred where the frame's bird was.
        island[:, 0] = -island[:, 0]; island = island[::-1]
        if was is not None: island[:, 0] += (was[:, 0].min() + was[:, 0].max() - island[:, 0].min() - island[:, 0].max()) / 2
    place = lambda x, y: (x, y)
    if '--place' in args:
        # Drawn at its own size: scaled and moved so its box lands on the box of the bird in the --place picture
        # (drawn on the frame's canvas), keeping its proportions.
        ref = outlines(args[args.index('--place') + 1])[1][0]
        r0, r1, i0_, i1_ = ref.min(0), ref.max(0), island.min(0), island.max(0)
        k_ = float(np.sqrt(np.prod((r1 - r0) / (i1_ - i0_))))
        island = (island - (i0_ + i1_) / 2) * k_ + (r0 + r1) / 2
        place = lambda x, y, m=(i0_ + i1_) / 2, r=(r0 + r1) / 2, k=k_: ((x - m[0]) * k + r[0], (y - m[1]) * k + r[1])
        print('placed on', args[args.index('--place') + 1], '| scale', round(k_, 4))
    gap = -ellipse_dist(resample(island, 1.0), c, ax, ang).max()
    print('bird from', src, '| box', island.min(0).round(1), island.max(0).round(1), '| nearest the hole', round(float(gap), 1), 'px')
if island is None:
    inside = dist < -2.0; n = len(H)
    start = next(i for i in range(n) if inside[i] and not inside[i - 1])
    H, inside, dist = np.roll(H, -start, axis=0), np.roll(inside, -start), np.roll(dist, -start)
    runs, i = [], 0
    while i < n:
        if inside[i]:
            j = i
            while j < n and inside[j]: j += 1
            runs.append((i, j)); i = j
        else: i += 1
    i0, i1 = max(runs, key=lambda r: r[1] - r[0])
    while i0 > 0 and dist[i0 - 1] < -1.0: i0 -= 1                  # out to just short of where the bird meets the ellipse
    while i1 < n - 1 and dist[i1] < -1.0: i1 += 1
    edge = H[i0:i1 + 1]
    print('bird edge', len(edge), 'points, from', edge[0].round(1), 'to', edge[-1].round(1))

# ---- fit ----
O = smooth(resample(outer, 1.0), 2)
oc = corners(O, True)
if oc:
    outer_curves = []
    for a, b in zip(oc, oc[1:] + [oc[0] + len(O)]):
        outer_curves += fit_run(np.array([O[i % len(O)] for i in range(a, b + 1)]))
else:
    s = int(np.argmin(O[:, 0])); R = np.roll(O, -s, axis=0); t = unit(R[1] - R[-1])
    outer_curves = fit(np.vstack([R, R[:1]]), t, -t, TOL)

if island is not None:
    # A closed outline of its own: cut at its corners, each run evened out and fitted, like the edge below.
    I = smooth(resample(island, 1.0), 2); bc = corners(I, True)
    print('outer corners', len(oc), '| bird corners', [tuple(int(v) for v in I[i]) for i in bc])
    if not bc: bc = [int(np.argmin(I[:, 0]))]
    bird_curves = []
    for a, b in zip(bc, bc[1:] + [bc[0] + len(I)]):
        run = np.array([I[i % len(I)] for i in range(a, b + 1)])
        for _ in range(2): run = smooth(run, EVEN, closed=False)
        bird_curves += fit_run(run)
else:
    B = smooth(edge, 2, closed=False)
    bc = [i for i in corners(B, False) if 15 < i < len(B) - 15]       # a turn at the very ends is the join's lip
    print('outer corners', len(oc), '| bird corners', [tuple(int(v) for v in B[i]) for i in bc])
    cuts = [0] + bc + [len(B) - 1]
    bird_curves = []
    for a, b in zip(cuts, cuts[1:]):
        # Each run between corners evened out on its own (twice), so the hand-drawn wobbles go and the corners stay sharp.
        run = B[a:b + 1]
        for _ in range(2): run = smooth(run, EVEN, closed=False)
        bird_curves += fit_run(run)
    first, last = B[0], B[-1]
    # The bird's two ends run on along their own direction into the body, so it joins the body with no lip.
    t_first, t_last = ends(B, 14)
    into = {id(first): first + t_first * -12, id(last): last + t_last * -12}
    push = lambda q: into[id(q)]

# ---- write ----
num = lambda v: ('%.1f' % v).rstrip('0').rstrip('.') if abs(v) >= 0.05 else '0'
pt = lambda q: f'{num(q[0])} {num(q[1])}'
def curves_d(cs):
    return ''.join('C' + ' '.join(pt(q) for q in cv[1:]) for cv in cs)
def sample(cs):
    return np.vstack([bez(cv, np.linspace(0, 1, 8)) for cv in cs])
body_sign = np.sign(area(sample(outer_curves)))
d_body = 'M' + pt(outer_curves[0][0]) + curves_d(outer_curves) + 'Z'
deg = math.degrees(ang); u_ = np.array([math.cos(ang), math.sin(ang)])
e0, e1 = c + u_ * ax[0], c - u_ * ax[0]
sweep = 0 if body_sign > 0 else 1                                # the hole runs against the body
arc = lambda to: f'A{num(ax[0])} {num(ax[1])} {num(deg)} 1 {sweep} {pt(to)}'
d_hole = 'M' + pt(e0) + arc(e1) + arc(e0) + 'Z'
import re as _re
def subpaths(d_):
    """An M/C/Z path as a list of rings, each a list of cubics (4 points)."""
    out_ = []
    for sp in _re.findall(r'M[^M]*', d_):
        v = np.array([float(x) for x in _re.findall(r'-?[\d.]+', sp)]).reshape(-1, 2)
        out_.append([v[i:i + 4] for i in range(0, len(v) - 1, 3)])
    return out_
if '--path' in args:
    svg_ = open(args[args.index('--path') + 1], encoding='utf-8').read()
    rings_ = [[np.array([place(*q) for q in cv]) for cv in r_] for r_ in subpaths(_re.search(r' d="([^"]+)"', svg_).group(1))]
    if np.sign(area(sample(rings_[0]))) != body_sign:               # the bird runs the body's way, its holes the other
        rings_ = [[cv[::-1] for cv in r_[::-1]] for r_ in rings_]
    bird_curves = rings_[0]
    d_bird = ''.join('M' + pt(r_[0][0]) + curves_d(r_) + 'Z' for r_ in rings_)
    print('bird from', args[args.index('--path') + 1], '|', len(rings_), 'rings')
elif island is not None:
    cs = bird_curves if np.sign(area(sample(bird_curves))) == body_sign else [cv[::-1] for cv in bird_curves[::-1]]
    d_bird = 'M' + pt(cs[0][0]) + curves_d(cs) + 'Z'
else:
    bird_ring = np.vstack([sample(bird_curves), [push(last), push(first)]])
    if np.sign(area(bird_ring)) == body_sign:
        d_bird = 'M' + pt(first) + curves_d(bird_curves) + 'L' + pt(push(last)) + 'L' + pt(push(first)) + 'Z'
    else:
        rev = [cv[::-1] for cv in bird_curves[::-1]]
        d_bird = 'M' + pt(first) + 'L' + pt(push(first)) + 'L' + pt(push(last)) + 'L' + pt(last) + curves_d(rev) + 'Z'
d = d_body + d_hole + d_bird
pad = 8
x0, x1, y0, y1 = O[:, 0].min() - pad, O[:, 0].max() + pad, O[:, 1].min() - pad, O[:, 1].max() + pad
side = max(x1 - x0, y1 - y0); vx, vy = (x0 + x1 - side) / 2, (y0 + y1 - side) / 2
fill = '#%02x%02x%02x' % tuple(int(v) for v in ink.round())
open(out, 'w', encoding='utf-8', newline='\n').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(vx)} {num(vy)} {num(side)} {num(side)}" role="img" aria-label="phiegg">'
    f'<path fill="{fill}" d="{d}"/></svg>\n')
print('curves: body', len(outer_curves), '| bird', len(bird_curves), '| path', len(d), 'chars | wrote', out)

import json, re
num2 = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
def mapped(d_, fn):
    """A path of M/C/L/Z coordinate pairs with every point put through fn."""
    return re.sub(r'(-?[\d.]+) (-?[\d.]+)', lambda m: ' '.join(num2(v) for v in fn(float(m.group(1)), float(m.group(2)))), d_)

if '--bird' in args:
    # The bird on its own (merchandise, the mascot): upright as drawn, in a square box with a little room round it.
    bird_out = args[args.index('--bird') + 1]
    bp = sample(bird_curves); bx0, by0 = bp.min(0); bx1, by1 = bp.max(0)
    side_ = max(bx1 - bx0, by1 - by0) * 1.08; s_ = 100 / side_
    ox, oy = (bx0 + bx1) / 2 - side_ / 2, (by0 + by1) / 2 - side_ / 2
    alone = 'M' + pt(bird_curves[0][0]) + curves_d(bird_curves) + 'Z' if island is not None and '--path' not in args else d_bird
    alone_d = mapped(alone, lambda x, y: ((x - ox) * s_, (y - oy) * s_))
    open(bird_out, 'w', encoding='utf-8', newline='\n').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="phiegg bird">'
        f'<path fill="{fill}" d="{alone_d}"/></svg>\n')
    print('bird alone | wrote', bird_out)

if '--egg' in args:
    site_path, egg_out = args[args.index('--egg') + 1], args[args.index('--egg') + 2]
    site = json.load(open(site_path, encoding='utf-8')); egg = site['brand']['egg']; ov = egg['oval']; sw = egg['stroke']
    # The picture's hole onto the mark's oval inside its stroke: same centre, same size, the hole's slight tilt undone.
    k = (ov['rx'] - sw / 2) / ax[0]; ca, sa = math.cos(-ang), math.sin(-ang)
    def to_egg(x, y):
        X, Y = x - c[0], y - c[1]
        return ov['cx'] + k * (ca * X - sa * Y), ov['cy'] + k * (sa * X + ca * Y)
    bird_d = mapped(d_bird, to_egg)
    # The mark's path is the outline, then the parting between the cone and the egg (the oval's top arc). The parting
    # is drawn thinner (egg.parting of the stroke), its lower edge kept on the oval's inner edge, so it thins from the
    # cone's side and the cone's opening grows: its middle line is the oval drawn in by the half of what it loses.
    outline, part = re.findall(r'M[^M]*', egg['path'])
    n_ = [float(v) for v in re.findall(r'-?[\d.]+', part)]          # M x y A rx ry turn large sweep x y
    (px1, py1), (px2, py2) = n_[0:2], n_[7:9]
    width = sw * egg['parting']; inset = (sw - width) / 2
    rx_, ry_ = ov['rx'] - inset, ov['ry'] - inset
    end = lambda x, y: (ov['cx'] + (x - ov['cx']) * rx_ / ov['rx'], ov['cy'] + (y - ov['cy']) * ry_ / ov['ry'])
    a_, b_ = end(px1, py1), end(px2, py2)
    parting = f'M{num2(a_[0])} {num2(a_[1])}A{num2(rx_)} {num2(ry_)} 0 0 0 {num2(b_[0])} {num2(b_[1])}'
    # The box: the turned drawing's own extent (the oval and the cone's tip, plus half the stroke), square, with the
    # same room on every side, so a print of it is centred.
    tr = math.radians(egg['rotate']); ct, st = math.cos(tr), math.sin(tr)
    turn_ = lambda x, y: (50 + ct * (x - 50) - st * (y - 50), 50 + st * (x - 50) + ct * (y - 50))
    head = re.split(r'[CA]', outline)[0]                               # the cone (M, Q, L); the oval bounds the rest
    pts_ = [tuple(map(float, q)) for q in re.findall(r'(-?[\d.]+) (-?[\d.]+)', head)]
    if 'Q' in head and len(pts_) >= 3:                                  # the tip's control point is off the curve:
        p0, q_, p1 = pts_[0], pts_[1], pts_[2]                          # use the curve's own middle
        pts_[1] = (0.25 * p0[0] + 0.5 * q_[0] + 0.25 * p1[0], 0.25 * p0[1] + 0.5 * q_[1] + 0.25 * p1[1])
    tips = [turn_(*q) for q in pts_]
    hx = math.hypot(ov['rx'] * ct, ov['ry'] * st); hy = math.hypot(ov['rx'] * st, ov['ry'] * ct)
    oc_ = turn_(ov['cx'], ov['cy'])
    xs_ = [p[0] for p in tips] + [oc_[0] - hx, oc_[0] + hx]; ys_ = [p[1] for p in tips] + [oc_[1] - hy, oc_[1] + hy]
    room = sw / 2 + 3
    bx0_, bx1_, by0_, by1_ = min(xs_) - room, max(xs_) + room, min(ys_) - room, max(ys_) + room
    side2 = max(bx1_ - bx0_, by1_ - by0_); vb = f'{num2((bx0_ + bx1_ - side2) / 2)} {num2((by0_ + by1_ - side2) / 2)} {num2(side2)} {num2(side2)}'
    open(egg_out, 'w', encoding='utf-8', newline='\n').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="phiegg">'
        f'<g transform="rotate({egg["rotate"]} 50 50)" fill="none" stroke="{fill}">'
        f'<path d="{outline.strip()}" stroke-width="{sw}" stroke-linejoin="round"/>'
        f'<path d="{parting}" stroke-width="{num2(width)}"/>'
        f'<path d="{bird_d}" fill="{fill}" stroke="none"/></g></svg>\n')
    # The egg file's own run (brand.eggFile) also writes the parts for the marks drawn in the page (PhieggMark, the app switcher).
    if site['brand'].get('eggFile', '').endswith(egg_out.replace('\\', '/').split('/')[-1]):
        egg['outline'], egg['partingPath'], egg['partingWidth'], egg['bird'] = outline.strip(), parting, round(width, 2), bird_d
        # The bird alone, when it is the header's icon, also goes in as a path, so the page draws it in the text's colour.
        if '--bird' in args and site['brand'].get('iconFile', '').endswith(bird_out.replace('\\', '/').split('/')[-1]):
            site['brand']['iconPath'] = alone_d
        open(site_path, 'w', encoding='utf-8', newline='\n').write(json.dumps(site, indent=1, ensure_ascii=False) + '\n')
    print('egg: hole scale', round(k, 4), '| parting', round(width, 2), 'of', sw, '| wrote', egg_out)
