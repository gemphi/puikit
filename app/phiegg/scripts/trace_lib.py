"""Tracing tools shared by the logo scripts (logo-trace.py, logo-egg.py): read a PNG, find its outlines to a fraction
of a pixel, even them out, find their corners, fit them with as few cubic curves as stay within a tolerance, and fit
ellipses. TOL (pixels), CORNER (degrees) and EVEN (points) are set by the script that imports this."""
import math, struct, zlib
import numpy as np

TOL, CORNER, EVEN = 1.5, 30, 7

def read_png(path):
    """8-bit, non-interlaced PNG to an (h, w, channels) array."""
    b = open(path, 'rb').read(); i = 8; idat = b''
    while i < len(b):
        n, = struct.unpack('>I', b[i:i + 4]); t = b[i + 4:i + 8]; d = b[i + 8:i + 8 + n]; i += 12 + n
        if t == b'IHDR': w, h, bd, ct, _, _, il = struct.unpack('>IIBBBBB', d)
        elif t == b'IDAT': idat += d
    assert bd == 8 and il == 0, 'only 8-bit, not interlaced'
    ch = {0: 1, 2: 3, 4: 2, 6: 4}[ct]; raw = zlib.decompress(idat); st = w * ch
    rows = np.zeros((h, st), np.uint8); prev = np.zeros(st, np.int32); p = 0
    for y in range(h):
        f = raw[p]; line = np.frombuffer(raw[p + 1:p + 1 + st], np.uint8).astype(np.int32); p += 1 + st
        if f == 0: cur = line
        elif f == 2: cur = (line + prev) & 255
        else:
            cur = np.zeros(st, np.int32)
            for x in range(st):
                a = cur[x - ch] if x >= ch else 0; c = prev[x - ch] if x >= ch else 0; u = prev[x]
                if f == 1: pr = a
                elif f == 3: pr = (a + u) // 2
                else:
                    pa, pb, pc = abs(u - c), abs(a - c), abs(a + u - 2 * c)
                    pr = a if pa <= pb and pa <= pc else (u if pb <= pc else c)
                cur[x] = (line[x] + pr) & 255
        rows[y] = cur; prev = cur
    return rows.reshape(h, w, ch)


def rings(f, lv=0.5):
    """Closed outlines of f at level lv (marching squares), as (x, y) point arrays."""
    nxt, at = {}, {}
    a, b, c, d = f[:-1, :-1], f[:-1, 1:], f[1:, 1:], f[1:, :-1]
    code = (a > lv) * 8 + (b > lv) * 4 + (c > lv) * 2 + (d > lv) * 1
    lerp = lambda p, q: float(np.clip((lv - p) / (q - p if q != p else 1e-9), 0, 1))
    table = {1: [('b', 'l')], 2: [('r', 'b')], 3: [('r', 'l')], 4: [('t', 'r')], 5: [('t', 'l'), ('b', 'r')],
             6: [('t', 'b')], 7: [('t', 'l')], 8: [('l', 't')], 9: [('b', 't')], 10: [('l', 'b'), ('r', 't')],
             11: [('r', 't')], 12: [('l', 'r')], 13: [('b', 'r')], 14: [('l', 'b')]}
    ys, xs = np.nonzero((code > 0) & (code < 15))
    for y, x in zip(ys, xs):
        A, B, C, D = a[y, x], b[y, x], c[y, x], d[y, x]
        key = {'t': ('h', y, x), 'b': ('h', y + 1, x), 'l': ('v', y, x), 'r': ('v', y, x + 1)}
        pos = {'t': (x + lerp(A, B), y), 'b': (x + lerp(D, C), y + 1), 'l': (x, y + lerp(A, D)), 'r': (x + 1, y + lerp(B, C))}
        for s, e in table[code[y, x]]:
            nxt[key[s]] = key[e]; at[key[s]] = pos[s]; at[key[e]] = pos[e]
    out = []
    while nxt:
        k = next(iter(nxt)); ring = []
        while k in nxt:
            ring.append(at[k]); k = nxt.pop(k)
        if len(ring) > 20: out.append(np.array(ring) - 1)      # undo the pad
    return out


area = lambda r: 0.5 * np.sum(r[:, 0] * np.roll(r[:, 1], -1) - np.roll(r[:, 0], -1) * r[:, 1])


def resample(r, step=1.0, closed=True):
    """Evenly spaced points along a ring (or an open run)."""
    p = np.vstack([r, r[:1]]) if closed else r
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))]
    s = np.arange(0, d[-1], step) if closed else np.linspace(0, d[-1], max(2, int(d[-1] / step) + 1))
    return np.c_[np.interp(s, d, p[:, 0]), np.interp(s, d, p[:, 1])]


def smooth(r, k=2, closed=True):
    """Even out the pixel steps: a small moving average along the points."""
    w = np.ones(2 * k + 1) / (2 * k + 1)
    if closed:
        pad = np.vstack([r[-k:], r, r[:k]])
        return np.c_[np.convolve(pad[:, 0], w, 'valid'), np.convolve(pad[:, 1], w, 'valid')]
    out = r.copy()
    for i in range(1, len(r) - 1):                              # the window narrows at the ends, which stay put
        j = min(k, i, len(r) - 1 - i); out[i] = r[i - j:i + j + 1].mean(axis=0)
    return out


def corners(p, closed, k=5):
    """Indices where the outline turns more than CORNER degrees between the chords k points back and k on."""
    n = len(p)
    if closed:
        a = p - np.roll(p, k, axis=0); b = np.roll(p, -k, axis=0) - p; base = 0
    else:
        a = p[k:-k] - p[:-2 * k]; b = p[2 * k:] - p[k:-k]; base = k
    t = np.abs(np.degrees(np.arctan2(a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0], (a * b).sum(1))))
    out = []
    for i in np.argsort(-t):
        if t[i] < CORNER: break
        j = int(i) + base
        gap = (lambda q: min(abs(j - q), n - abs(j - q))) if closed else (lambda q: abs(j - q))
        if all(gap(q) > 3 * k for q in out): out.append(j)
    return sorted(out)


# ---- cubic fitting (Schneider, Graphics Gems) ----
def bez(c, t):
    t = np.asarray(t, float)[:, None]; m = 1 - t
    return m ** 3 * c[0] + 3 * m * m * t * c[1] + 3 * m * t * t * c[2] + t ** 3 * c[3]


def bez1(c, t):
    t = np.asarray(t, float)[:, None]; m = 1 - t
    return 3 * m * m * (c[1] - c[0]) + 6 * m * t * (c[2] - c[1]) + 3 * t * t * (c[3] - c[2])


def bez2(c, t):
    t = np.asarray(t, float)[:, None]
    return 6 * (1 - t) * (c[2] - 2 * c[1] + c[0]) + 6 * t * (c[3] - 2 * c[2] + c[1])


def unit(v):
    n = np.linalg.norm(v); return v / n if n else v


def chord_params(p):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))]; return d / d[-1]


def generate(p, u, t1, t2):
    A1 = np.outer(3 * (1 - u) ** 2 * u, t1); A2 = np.outer(3 * (1 - u) * u * u, t2)
    C = np.array([[(A1 * A1).sum(), (A1 * A2).sum()], [(A1 * A2).sum(), (A2 * A2).sum()]])
    tmp = p - bez(np.array([p[0], p[0], p[-1], p[-1]]), u)
    X = np.array([(A1 * tmp).sum(), (A2 * tmp).sum()])
    seg = np.linalg.norm(p[-1] - p[0])
    a1, a2 = np.linalg.solve(C, X) if abs(np.linalg.det(C)) > 1e-12 else (seg / 3, seg / 3)
    if a1 < 1e-6 * seg or a2 < 1e-6 * seg: a1 = a2 = seg / 3
    return np.array([p[0], p[0] + t1 * a1, p[-1] + t2 * a2, p[-1]])


def newton(c, p, u):
    d = bez(c, u) - p; d1 = bez1(c, u); d2 = bez2(c, u)
    num = (d * d1).sum(1); den = (d1 * d1).sum(1) + (d * d2).sum(1)
    return np.clip(u - num / np.where(den == 0, 1, den), 0, 1)


def fit(p, t1, t2, tol):
    """As few cubics as follow the points p within tol, leaving along t1 and arriving against t2."""
    if len(p) <= 3:
        L = np.linalg.norm(p[-1] - p[0]) / 3; return [np.array([p[0], p[0] + t1 * L, p[-1] + t2 * L, p[-1]])]
    u = chord_params(p); c = generate(p, u, t1, t2)
    for _ in range(20):
        e = np.linalg.norm(bez(c, u) - p, axis=1)
        if e.max() < tol: return [c]
        u = newton(c, p, u); c = generate(p, u, t1, t2)
    e = np.linalg.norm(bez(c, u) - p, axis=1)
    if e.max() < tol: return [c]
    w = int(np.clip(np.argmax(e), 2, len(p) - 3))
    mid = unit(p[w - 2] - p[w + 2])
    return fit(p[:w + 1], t1, mid, tol) + fit(p[w:], -mid, t2, tol)


def ends(p, step=4):
    """The run's leaving and arriving directions, read over a few points."""
    j = min(len(p) - 1, step)
    return unit(p[j] - p[0]), unit(p[-1 - j] - p[-1])


def fit_run(p):
    return fit(p, *ends(p), TOL)


def ellipse_fit(p):
    """Least-squares ellipse (Fitzgibbon): centre, half axes, tilt in radians."""
    x, y = p[:, 0], p[:, 1]
    D = np.c_[x * x, x * y, y * y, x, y, np.ones_like(x)]; S = D.T @ D
    Cm = np.zeros((6, 6)); Cm[0, 2] = Cm[2, 0] = 2; Cm[1, 1] = -1
    w, v = np.linalg.eig(np.linalg.solve(S, Cm))
    w = np.real(w); v = np.real(v)
    ok = [i for i in range(6) if np.isfinite(w[i]) and w[i] > 0]
    A, B, C, Dd, E, F = v[:, ok[0]]
    M = np.array([[A, B / 2], [B / 2, C]]); c = np.linalg.solve(2 * M, [-Dd, -E])
    Fc = F + 0.5 * (Dd * c[0] + E * c[1])
    ev, evec = np.linalg.eigh(M); ax = np.sqrt(-Fc / ev)
    i = int(np.argmax(ax)); ang = math.atan2(evec[1, i], evec[0, i])
    if ang > math.pi / 2: ang -= math.pi
    if ang < -math.pi / 2: ang += math.pi
    return c, np.array([ax[i], ax[1 - i]]), ang


def ellipse_dist(p, c, ax, ang):
    """Approximate signed distance of points from the ellipse (negative inside)."""
    ca, sa = math.cos(ang), math.sin(ang); q = p - c
    X = q[:, 0] * ca + q[:, 1] * sa; Y = -q[:, 0] * sa + q[:, 1] * ca
    rho = np.sqrt((X / ax[0]) ** 2 + (Y / ax[1]) ** 2)
    return (rho - 1) * np.hypot(X, Y) / np.maximum(rho, 1e-9)


def hull(p):
    """Convex hull (monotone chain), anticlockwise in image coordinates."""
    q = sorted(map(tuple, p)); lo, up = [], []
    cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    for x in q:
        while len(lo) > 1 and cr(lo[-2], lo[-1], x) <= 0: lo.pop()
        lo.append(x)
    for x in reversed(q):
        while len(up) > 1 and cr(up[-2], up[-1], x) <= 0: up.pop()
        up.append(x)
    return np.array(lo[:-1] + up[:-1])


def off_hull(p, h):
    """Distance of each point from the hull's edges."""
    a, b = h, np.roll(h, -1, axis=0); ab = b - a; L = (ab * ab).sum(1)
    t = np.clip((((p[:, None, :] - a[None]) * ab[None]).sum(2)) / L[None], 0, 1)
    return np.linalg.norm(p[:, None, :] - (a[None] + t[..., None] * ab[None]), axis=2).min(1)
