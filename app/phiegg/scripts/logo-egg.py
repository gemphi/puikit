"""The Phiegg egg as one filled shape, thinner on one side: the original mark (site.json brand.egg) is drawn as a stroke
whose width changes along it, its inner edge kept where the stroke always had it (the triangle's opening and the
oval, with the bird in it, do not move) and its outer edge drawn in where the outline faces brand.egg.thin.toward as
the mark is shown (turned brand.egg.rotate degrees): there the wall is brand.egg.thin.share of the stroke, easing to
the full stroke between brand.egg.thin.from and .to (how squarely it faces that way, 0 to 1), the change spread
over brand.egg.thin.ease units along the outline so the wall never steps. The parting between
the cone and the egg is drawn as logo-trace.py made it. Chrome draws the lot, the outline is traced back to smooth
curves (trace_lib), and this writes
  - site.json brand.egg.shape: the egg as one path in the 100 box, upright (the marks turn it);
  - the file brand.eggFile names: the egg and the bird, turned, in a square box round them.

With --oval it draws the egg alone, no cone: the oval (brand.egg.oval) with the same wall, thinned the same way, and
the bird (the chick) in it; that goes to brand.egg.ovalShape and the file brand.ovalFile names.

    python scripts/logo-egg.py src/data/site.json [--oval]   (after logo-trace.py --egg, which writes the bird and parting)"""
import json, math, os, re, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import trace_lib
from trace_lib import read_png, rings, area, resample, smooth, corners, fit, fit_run, unit, ends, bez

site_path = sys.argv[1]; OVAL = '--oval' in sys.argv
site = json.load(open(site_path, encoding='utf-8')); brand = site['brand']; E = brand['egg']; T = E['thin']
SIZE, SW, HALF = 4096, E['stroke'], E['stroke'] / 2
PX = SIZE / 100                                                        # pixels per unit of the 100 box
trace_lib.TOL, trace_lib.CORNER, trace_lib.EVEN = 2.0, 30, 3


def centreline(d, step=0.2):
    """Points every `step` along an absolute M/L/Q/C/A/Z path (one closed subpath)."""
    toks = re.findall(r'[MLQCAZ]|-?[\d.]+', d); i = 0; pts = []; cur = start = None
    def take(n):
        nonlocal i
        v = [float(t) for t in toks[i:i + n]]; i += n; return v
    def run(fn, length):
        n = max(2, int(length / step)); pts.extend(fn(k / n) for k in range(1, n + 1))
    cmd = None
    while i < len(toks):
        if re.match(r'[MLQCAZ]', toks[i]): cmd = toks[i]; i += 1
        if cmd == 'M':
            cur = start = tuple(take(2)); pts.append(cur); cmd = 'L'
        elif cmd == 'L':
            p = tuple(take(2)); a = cur; run(lambda t: (a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t), math.dist(a, p)); cur = p
        elif cmd == 'Q':
            q, p = tuple(take(2)), tuple(take(2)); a = cur
            run(lambda t: tuple((1 - t) ** 2 * a[j] + 2 * (1 - t) * t * q[j] + t * t * p[j] for j in (0, 1)), math.dist(a, q) + math.dist(q, p)); cur = p
        elif cmd == 'C':
            c1, c2, p = tuple(take(2)), tuple(take(2)), tuple(take(2)); a = cur
            run(lambda t: tuple((1 - t) ** 3 * a[j] + 3 * (1 - t) ** 2 * t * c1[j] + 3 * (1 - t) * t * t * c2[j] + t ** 3 * p[j] for j in (0, 1)),
                math.dist(a, c1) + math.dist(c1, c2) + math.dist(c2, p)); cur = p
        elif cmd == 'A':
            rx, ry, rot, large, sweep, x, y = take(7); a = cur; p = (x, y)
            # SVG arc, endpoints to centre (the spec's F.6.5), then sampled by angle.
            ph = math.radians(rot); cp, sp = math.cos(ph), math.sin(ph)
            dx, dy = (a[0] - p[0]) / 2, (a[1] - p[1]) / 2; x1, y1 = cp * dx + sp * dy, -sp * dx + cp * dy
            lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry)
            if lam > 1: rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
            num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
            co = math.sqrt(max(0, num / (rx * rx * y1 * y1 + ry * ry * x1 * x1))) * (-1 if large == sweep else 1)
            cx1, cy1 = co * rx * y1 / ry, -co * ry * x1 / rx
            cx, cy = cp * cx1 - sp * cy1 + (a[0] + p[0]) / 2, sp * cx1 + cp * cy1 + (a[1] + p[1]) / 2
            ang = lambda ux, uy, vx, vy: math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
            t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry); dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
            if not sweep and dt > 0: dt -= 2 * math.pi
            if sweep and dt < 0: dt += 2 * math.pi
            run(lambda t: (cx + rx * math.cos(t1 + dt * t) * cp - ry * math.sin(t1 + dt * t) * sp,
                           cy + rx * math.cos(t1 + dt * t) * sp + ry * math.sin(t1 + dt * t) * cp), abs(dt) * max(rx, ry)); cur = p
        elif cmd == 'Z':
            a = cur; p = start
            if math.dist(a, p) > 1e-6: run(lambda t: (a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t), math.dist(a, p))
            cur = p
    out = np.array(pts)
    return out[np.r_[True, np.linalg.norm(np.diff(out, axis=0), axis=1) > 1e-6]]


# ---- the walls: how thick at each point ----
# The egg alone is the mark's own egg, not a plain ellipse: from where the cone met it, its squared right side (the
# nail-tip curve), its bottom and left as drawn, then back over the top along the parting's arc.
O_ = E['oval']
meet = re.search(r'L(-?[\d.]+) (-?[\d.]+)', E['outline']); mx, my = meet.group(1), meet.group(2)
body = E['outline'][meet.end():].rstrip('Z').strip()
ring_d = f"M{mx} {my}{body}A{O_['rx']} {O_['ry']} 0 0 1 {mx} {my}Z"
C = centreline(ring_d if OVAL else E['outline'])
if np.linalg.norm(C[0] - C[-1]) < 1e-6: C = C[:-1]
tan = np.roll(C, -1, axis=0) - np.roll(C, 1, axis=0); tan /= np.linalg.norm(tan, axis=1)[:, None]
out_n = np.c_[tan[:, 1], -tan[:, 0]] * (1 if area(C) > 0 else -1)   # pointing out of the shape (y down)
tr = math.radians(E['rotate']); ct, st = math.cos(tr), math.sin(tr)
seen = np.c_[ct * out_n[:, 0] - st * out_n[:, 1], st * out_n[:, 0] + ct * out_n[:, 1]]   # as the turned mark shows it
d = np.array(T['toward'], float); d /= np.linalg.norm(d)
x = np.clip((seen @ d - T['from']) / (T['to'] - T['from']), 0, 1); f = x * x * (3 - 2 * x)
loss = (1 - T['share']) * f                                           # the share of the stroke each point gives up
if OVAL:
    # The egg as it is in the whole mark, cone taken away: its top arc (above where the cone met it) is the parting,
    # so it keeps the parting's width there.
    top_y = [float(v) for v in re.findall(r'-?[\d.]+', re.findall(r'M[^M]*', E['path'])[1])][1]
    loss = np.maximum(loss, (1 - E['parting']) * (C[:, 1] < top_y))
k = int(T.get('ease', 5) / 0.2 / 2)                                   # eased over brand.egg.thin.ease units of the outline
for _ in range(2): loss = np.convolve(np.r_[loss[-k:], loss, loss[:k]], np.ones(2 * k + 1) / (2 * k + 1), 'valid')
w = SW * (1 - loss)
reach = w - HALF                                                      # how far out the wall's outer edge reaches
# The wall as a run of round dabs: each one from the fixed inner edge (HALF in) out to `reach`.
mid = C + out_n * ((reach - HALF) / 2)[:, None]
dabs = ''.join(f'<path d="M{mid[i - 1][0]:.3f} {mid[i - 1][1]:.3f}L{mid[i][0]:.3f} {mid[i][1]:.3f}" stroke-width="{w[i]:.3f}"/>' for i in range(len(C)))
drawing = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="#000" stroke-linecap="round">{dabs}'
           + ('' if OVAL else f'<path d="{E["partingPath"]}" stroke-width="{E["partingWidth"]}" stroke-linecap="butt"/>') + '</g></svg>')
tmp = tempfile.mkdtemp(); svg_in, png_out = os.path.join(tmp, 'egg.svg'), os.path.join(tmp, 'egg.png')
open(svg_in, 'w', encoding='utf-8').write(drawing)
subprocess.run(['node', os.path.join(HERE, 'raster.mjs'), svg_in, png_out, str(SIZE)], check=True)

# ---- trace it back to curves ----
im = read_png(png_out).astype(float); field = np.pad(im[..., 3] / 255, 1)
found = sorted(rings(field), key=lambda r: -abs(area(r)))
found = [r for r in found if abs(area(r)) > 0.002 * abs(area(found[0]))]
num = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
pt = lambda q: f'{num(q[0] / PX)} {num(q[1] / PX)}'
parts = []
for r in found:
    R = smooth(resample(r, 1.0), 2); cut = corners(R, True)
    if cut:
        cs = []
        for a, b in zip(cut, cut[1:] + [cut[0] + len(R)]):
            cs += fit_run(np.array([R[i % len(R)] for i in range(a, b + 1)]))
    else:
        s = int(np.argmin(R[:, 0])); Q = np.roll(R, -s, axis=0); t = unit(Q[1] - Q[-1])
        cs = fit(np.vstack([Q, Q[:1]]), t, -t, trace_lib.TOL)
    parts.append('M' + pt(cs[0][0]) + ''.join('C' + ' '.join(pt(q) for q in cv[1:]) for cv in cs) + 'Z')
    print('ring', len(parts), '| curves', len(cs), '| corners', len(cut))
E['ovalShape' if OVAL else 'shape'] = shape = ''.join(parts)

# ---- the icon file: egg and bird, turned, in a square box round them ----
ink = brand['merch']['ink']
P = np.array([[float(a), float(b)] for a, b in re.findall(r'(-?[\d.]+) (-?[\d.]+)', parts[0])])
P = np.c_[50 + ct * (P[:, 0] - 50) - st * (P[:, 1] - 50), 50 + st * (P[:, 0] - 50) + ct * (P[:, 1] - 50)]
room = 3; x0, y0 = P.min(0) - room; x1, y1 = P.max(0) + room; side = max(x1 - x0, y1 - y0)
vb = f'{num((x0 + x1 - side) / 2)} {num((y0 + y1 - side) / 2)} {num(side)} {num(side)}'
icon = os.path.join(os.path.dirname(site_path), '..', '..', 'public', brand['ovalFile' if OVAL else 'eggFile'])
open(icon, 'w', encoding='utf-8', newline='\n').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="phiegg">'
    f'<path transform="rotate({E["rotate"]} 50 50)" fill="{ink}" d="{shape}{E["bird"]}"/></svg>\n')
open(site_path, 'w', encoding='utf-8', newline='\n').write(json.dumps(site, indent=1, ensure_ascii=False) + '\n')
print('thin wall', round(float(w.min()), 2), 'to', round(float(w.max()), 2), '| wrote', os.path.normpath(icon),
      'and brand.egg.' + ('ovalShape' if OVAL else 'shape'))
