"""Trace a bird drawn on its own (one colour, any size) into a bird-alone SVG in the 0-100 box, every ring kept:
the body, and its holes and islands (an eye drawn as a ring is a hole with an island in it), filled even-odd.

    python scripts/logo-bird.py public/logo/phiegg-bird-wing-alone-wing-eye.png public/logo/phiegg-bird-eye-alone.svg
        [--tol 0.75] [--corner 30] [--even 2] [--check overlay.svg] [--eye-even 120] [--cut 14 --tip 55 540 --tip 39 634]
        [--px bird-px.svg]

The drawing is kept as drawn: outlines at half alpha, the body cut at its sharp corners (the feather hooks, the
beak, the tail's joins), and each run fitted with cubic curves within --tol pixels of the pixels' own outline. Evening out is
light (--even points either side), because a wide average pulls every curve in towards its middle: small shapes
shrink, and a ring drawn as two outlines (the gem eye) changes thickness. Each ring's distance from the drawing and
its area against the drawing's are printed, and for a ring in a ring, the width of the band between them.
Rings smaller than --min of the body's area are specks and drop out. The box is the body's, square, with the same
room round it as logo-trace.py --bird gives. --tip x y names a point of the drawing (the tail's tips) to cut soft,
like a trimmed nail: the outline is cut across where it is --cut pixels wide, and the cut is drawn as a short flat end
with round corners that leaves each side along its own line; every other point stays as drawn. --check writes the drawing with the traced outline over it, in red. --px writes the
traced path in the picture's own pixels, for logo-trace.py --path to put in the egg marks."""
import os, sys
import numpy as np
args = sys.argv[1:]
opt = lambda k, d: float(args[args.index(k) + 1]) if k in args else d
src, out = args[0], args[1]
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import trace_lib
from trace_lib import *
trace_lib.TOL, trace_lib.CORNER, trace_lib.EVEN = opt('--tol', 0.75), opt('--corner', 30), int(opt('--even', 2))

im = read_png(src).astype(float)
alpha = im[..., 3] / 255 if im.shape[2] == 4 else np.ones(im.shape[:2])
rgb = im[..., :3]
ink = np.median(rgb[alpha > 0.99], axis=0)
# Ink is near the picture's own colour; paper (white, or clear) is not.
near = np.linalg.norm(rgb - ink, axis=2) < 120
found = sorted(rings(np.pad(np.where(near, alpha, 0.0), 1)), key=lambda r: -abs(area(r)))
body = abs(area(found[0])); keep = [r for r in found if abs(area(r)) > opt('--min', 0.002) * body]
print('rings', len(found), '| kept', [round(abs(area(r))) for r in keep])

tips = [(float(args[i + 1]), float(args[i + 2])) for i, a in enumerate(args) if a == '--tip']
CUT = opt('--cut', 14)


def soften(I, j):
    """The ring with its point j cut soft: out from j along both sides to where the outline is CUT wide, the end between
    drawn as one cubic that leaves each side along its own line; returns the ring and the cut's middle."""
    n, a, b = len(I), 1, 1
    while np.linalg.norm(I[(j + b) % n] - I[(j - a) % n]) < CUT and a < n // 4:
        if np.linalg.norm(I[(j + b + 1) % n] - I[(j - a) % n]) < np.linalg.norm(I[(j + b) % n] - I[(j - a - 1) % n]): b += 1
        else: a += 1
    A, B = I[(j - a) % n], I[(j + b) % n]
    tA, tB = unit(A - I[(j - a - 4) % n]), unit(B - I[(j + b + 4) % n])
    h = 0.5 * np.linalg.norm(B - A)
    cap = bez(np.array([A, A + tA * h, B + tB * h, B]), np.linspace(0, 1, max(4, int(2 * h))))[1:-1]
    keep_ = [I[(j + b + k) % n] for k in range(n - a - b + 1)]       # B round to A, the long way
    ring = np.vstack([keep_, cap])
    return resample(ring, 1.0), (A + B) / 2


def taubin(I, n, lam=0.5, mu=-0.53):
    """Hand wobbles evened out without the shape shrinking: each pass moves the points towards their neighbours'
    middle, then a little further back out (Taubin), so the size and the band between two rings stay as drawn."""
    for _ in range(n):
        for f in (lam, mu):
            I = I + f * ((np.roll(I, 1, axis=0) + np.roll(I, -1, axis=0)) / 2 - I)
    return I


def trace(ring, body):
    """The body is cut at its sharp points (each tail tip cut soft first); a ring inside it (the eye's) is drawn soft,
    its hand wobbles evened out (--eye-even passes, none shrinking), as one smooth run from its top, so its points stay as rounded as drawn and nothing is assumed of its shape."""
    I = smooth(resample(ring, 1.0), 1)
    if not body:
        I = taubin(I, int(opt('--eye-even', 120)))
        top = int(np.argmin(I[:, 1])); return fit_run(np.vstack([np.roll(I, -top, axis=0), I[top:top + 1]])), 0
    cs = corners(I, True); at = [I[q] for q in cs]; cuts = []
    for t in tips:
        if not cs: break
        j = min(cs, key=lambda q: np.linalg.norm(I[q] - t))
        if np.linalg.norm(I[j] - t) > 20: continue
        I, mid = soften(I, j); cuts.append(mid); cs = []
        print('cut soft at', tuple(int(v) for v in t), '| width', CUT, 'px')
        cs = [int(np.argmin(np.linalg.norm(I - q, axis=1))) for q in at]   # the drawing's own corners, found again
    cs = sorted({q for q in cs if all(np.linalg.norm(I[q] - m) > CUT for m in cuts)}) or [int(np.argmin(I[:, 0]))]
    curves = []
    for a, b in zip(cs, cs[1:] + [cs[0] + len(I)]):
        run = np.array([I[i % len(I)] for i in range(a, b + 1)])
        if trace_lib.EVEN: run = smooth(run, trace_lib.EVEN, closed=False)
        curves += fit_run(run)
    return curves, len(cs)

traced = [trace(r, i == 0) for i, r in enumerate(keep)]
dense = lambda cs: np.vstack([bez(cv, np.linspace(0, 1, 200)) for cv in cs])
for i, (r, (cs, n)) in enumerate(zip(keep, traced)):
    R, F = resample(r, 1.0), dense(cs)
    dist = np.concatenate([np.sqrt(((R[j:j + 200, None] - F[None]) ** 2).sum(-1)).min(1) for j in range(0, len(R), 200)])
    print(f'ring {i}: corners {n} | curves {len(cs)} | off the drawing max {dist.max():.2f} px | area {abs(area(F)) / abs(area(r)):.4f} of the drawing')
inside = lambda p, r: np.sum(((r[:, 1] > p[1]) != (np.roll(r, -1, 0)[:, 1] > p[1])) &
    (p[0] < r[:, 0] + (p[1] - r[:, 1]) * (np.roll(r, -1, 0)[:, 0] - r[:, 0]) / (np.roll(r, -1, 0)[:, 1] - r[:, 1] + 1e-12))) % 2 == 1
for i in range(1, len(keep)):
    for j in range(i + 1, len(keep)):
        if inside(keep[j][0], keep[i]):
            band = lambda a, b: (abs(area(a)) - abs(area(b))) / ((np.linalg.norm(np.diff(a, axis=0), axis=1).sum() + np.linalg.norm(np.diff(b, axis=0), axis=1).sum()) / 2)
            Fi, Fj = dense(traced[i][0]), dense(traced[j][0])
            print(f'band between rings {i} and {j}: drawn {band(keep[i], keep[j]):.2f} px, traced {band(Fi, Fj):.2f} px')
pts = np.vstack([bez(cv, np.linspace(0, 1, 8)) for cv in traced[0][0]])
(x0, y0), (x1, y1) = pts.min(0), pts.max(0)
side = max(x1 - x0, y1 - y0) * 1.08; s = 100 / side
ox, oy = (x0 + x1) / 2 - side / 2, (y0 + y1) / 2 - side / 2
num = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
pt = lambda q: f'{num((q[0] - ox) * s)} {num((q[1] - oy) * s)}'
d = ''.join('M' + pt(cs[0][0]) + ''.join('C' + ' '.join(pt(q) for q in cv[1:]) for cv in cs) + 'Z' for cs, _ in traced)
fill = '#%02x%02x%02x' % tuple(int(v) for v in ink.round())
open(out, 'w', encoding='utf-8', newline='\n').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="phiegg bird">'
    f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/></svg>\n')
print('path', len(d), 'chars | wrote', out)
h, w = im.shape[:2]; px = lambda q: f'{num(q[0])} {num(q[1])}'
dp = ''.join('M' + px(cs[0][0]) + ''.join('C' + ' '.join(px(q) for q in cv[1:]) for cv in cs) + 'Z' for cs, _ in traced)
if '--px' in args:
    pxo = args[args.index('--px') + 1]
    open(pxo, 'w', encoding='utf-8', newline=chr(10)).write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><path fill="{fill}" fill-rule="evenodd" d="{dp}"/></svg>' + chr(10))
    print('pixels | wrote', pxo)
if '--check' in args:
    from pathlib import Path
    chk, NL = args[args.index('--check') + 1], chr(10)
    open(chk, 'w', encoding='utf-8', newline=NL).write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><image href="{Path(src).resolve().as_uri()}" width="{w}" height="{h}"/>'
        f'<path d="{dp}" fill="none" stroke="#ff0000" stroke-width="0.6"/></svg>' + NL)
    print('check | wrote', chk)
