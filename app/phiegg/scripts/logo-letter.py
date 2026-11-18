"""Cut the first letter (the p) out of the phiegg wordmark: the brand's icon is the letter already in the logo, set in
the shape site.json brand.icon gives it.

    python scripts/logo-letter.py public/logo/phiegg-3d.svg public/logo/phiegg-p.svg src/data/site.json ../phi-kit/src/registry.json

The wordmark draws each letter as five side layers stepping down and right, then the face; the first six paths are
the p. brand.icon shapes it:
  - turn: degrees the letter is turned clockwise, so its stem's top-left corner becomes the tip;
  - tip: the radius that corner is rounded to;
  - hole: the radius of the corners of its own hole, rebuilt as its box with those corners; null keeps the letter's
    own hole exactly as the font draws it (its original rounded square);
  - sharp: the hole's corners left sharp ('tl', 'tr', 'br', 'bl', as the letter stands upright), so once turned 45
    degrees right the top-right corner is the hole's point towards the right.
Every layer gets the same shape, and the layers keep their step down and right, so the depth still falls the same way.
This writes
  - phiegg-p.svg: the shaped p with its layers and gradient, in a square box (an icon on its own);
  - site.json brand.mark: the p's face in the 100 box, one colour (PhieggMark, PhipadMark);
  - site.json brand.wordmarkLead: the share of the wordmark's width the p takes, up to halfway to the h, so the header
    can show the wordmark cut to its p at the same size and place when the sidebar is closed;
  - site.json brand.wordmarkAspect: the wordmark's width over its height;
  - (not the app switcher's icon any more: that is the egg with the bird, scripts/logo-trace.py --egg)."""
import json, math, re, sys

src, out, site_path, reg_path = sys.argv[1:5]
t = open(src, encoding='utf-8').read()
view = [float(v) for v in re.search(r'viewBox="([^"]*)"', t).group(1).split()]
every = re.findall(r'<path d="([^"]*)" transform="translate\(([-\d.]+) ([-\d.]+)\)" fill="([^"]*)"/>', t)
paths, after = every[:6], every[6:12]
grads = set(re.findall(r'url\(#(\w+)\)', ''.join(p[3] for p in paths)))
defs = ''.join(re.findall(r'<linearGradient id="(?:%s)".*?</linearGradient>' % '|'.join(grads), t, re.S))

def walk(d, fn):
    """Each point of an M/L/H/V/Z path through fn(x, y) -> (x, y); returns the rewritten path."""
    x = y = 0.0; parts = []
    for cmd, args in re.findall(r'([MLHVZ])([^MLHVZ]*)', d):
        n = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', args)]
        f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
        if cmd in 'ML':
            pts = []
            for i in range(0, len(n) - 1, 2):
                x, y = n[i], n[i + 1]; X, Y = fn(x, y); pts.append(f'{f(X)} {f(Y)}')
            parts.append(cmd + ' '.join(pts))
        elif cmd == 'H':
            vals = []
            for v in n: x = v; vals.append(f(fn(x, y)[0]))
            parts.append('H' + ' '.join(vals))
        elif cmd == 'V':
            vals = []
            for v in n: y = v; vals.append(f(fn(x, y)[1]))
            parts.append('V' + ' '.join(vals))
        else:
            parts.append('Z')
    return ''.join(parts)

def bounds(group):
    xs, ys = [], []
    for d, tx, ty, _ in group:
        walk(d, lambda x, y: (xs.append(x + float(tx)), ys.append(-(y + float(ty))), (x, y))[2])
    return min(xs), max(xs), min(ys), max(ys)

site = json.load(open(site_path, encoding='utf-8'))
shape = site['brand']['icon']

def rings(d):
    """The subpaths of an M/L/H/V/Z path as point lists."""
    out, x, y = [], 0.0, 0.0
    for cmd, args in re.findall(r'([MLHVZ])([^MLHVZ]*)', d):
        n = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', args)]
        if cmd == 'M': out.append([])
        if cmd in 'ML':
            for i in range(0, len(n) - 1, 2): x, y = n[i], n[i + 1]; out[-1].append((x, y))
        elif cmd == 'H':
            for v in n: x = v; out[-1].append((x, y))
        elif cmd == 'V':
            for v in n: y = v; out[-1].append((x, y))
    return out

area = lambda s: sum(s[i][0] * s[i - 1][1] - s[i - 1][0] * s[i][1] for i in range(len(s))) / 2

def arc(c, r, a0, a1, n=16):
    return [(c[0] + r * math.cos(a0 + (a1 - a0) * k / n), c[1] + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]

def rounded_box(x0_, y0_, x1_, y1_, r, sharp=()):
    """A box with its corners rounded to r except the ones named in sharp, anticlockwise (y up)."""
    r = min(r, (x1_ - x0_) / 2 - 0.01, (y1_ - y0_) / 2 - 0.01); h = math.pi / 2
    corners = [('br', (x1_, y0_), (x1_ - r, y0_ + r), -h), ('tr', (x1_, y1_), (x1_ - r, y1_ - r), 0),
               ('tl', (x0_, y1_), (x0_ + r, y1_ - r), h), ('bl', (x0_, y0_), (x0_ + r, y0_ + r), 2 * h)]
    out = []
    for name, p, c, a0 in corners:
        out += [p] if name in sharp else arc(c, r, a0, a0 + h)
    return out

def round_tip(ring, r):
    """Round the ring's top-left corner (its stem's top-left) to r: the points inside the corner's r square give way
    to a quarter circle, in the ring's own direction."""
    xs = [p[0] for p in ring]; ys = [p[1] for p in ring]; cx_, cy_ = min(xs) + r, max(ys) - r
    inside = [i for i, (x, y) in enumerate(ring) if x < cx_ and y > cy_]
    n = len(ring); start = next(i for i in inside if (i - 1) % n not in inside)
    q = arc((cx_, cy_), r, math.pi, math.pi / 2)            # from the left side up round to the top
    if math.dist(ring[(start - 1) % n], q[0]) > math.dist(ring[(start - 1) % n], q[-1]): q = q[::-1]
    rest = [ring[(start + len(inside) + k) % n] for k in range(n - len(inside))]
    return q + rest

face = paths[-1][0]
outer, counter = sorted(rings(face), key=lambda s: -abs(area(s)))
outer = round_tip(outer, shape['tip'])
cxs = [p[0] for p in counter]; cys = [p[1] for p in counter]
if shape.get('hole') is None:
    hole = counter
else:
    hole = rounded_box(min(cxs), min(cys), max(cxs), max(cys), shape['hole'], shape.get('sharp', ()))
    if (area(hole) < 0) != (area(counter) < 0): hole = hole[::-1]
oxs = [p[0] for p in outer]; oys = [p[1] for p in outer]
mid = ((min(oxs) + max(oxs)) / 2, -(min(oys) + max(oys)) / 2)   # the turn's centre, on screen (y down)
a = math.radians(shape['turn']); ca, sa = math.cos(a), math.sin(a)

def turn(x, y):
    X, Y = x - mid[0], -y - mid[1]
    return mid[0] + ca * X - sa * Y, -(mid[1] + sa * X + ca * Y)

shaped = [[turn(x, y) for x, y in s] for s in (outer, hole)]
num = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
d_all = ''.join('M' + ' '.join(f'{num(x)} {num(y)}' for x, y in s) + 'Z' for s in shaped)

# The square icon, layers and all.
xs = [x + float(tx) for _, tx, ty, _ in paths for s in shaped for x, _ in s]
ys = [-(y + float(ty)) for _, tx, ty, _ in paths for s in shaped for _, y in s]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
side = max(x1 - x0, y1 - y0); vx, vy = (x0 + x1 - side) / 2, (y0 + y1 - side) / 2
body = ''.join(f'<path d="{d_all}" transform="translate({tx} {ty})" fill="{fill}"/>' for _, tx, ty, fill in paths)
open(out, 'w', encoding='utf-8', newline='\n').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:g} {vy:g} {side:g} {side:g}" role="img" aria-label="phiegg">'
    f'<defs>{defs}</defs><g transform="scale(1 -1)">{body}</g></svg>')

# The face alone in the 100 box, one colour, height 88 like every mark.
fxs = [x for s in shaped for x, _ in s]; fys = [-y for s in shaped for _, y in s]
s = 88 / max(max(fxs) - min(fxs), max(fys) - min(fys))
cx, cy = (min(fxs) + max(fxs)) / 2, (min(fys) + max(fys)) / 2
mark = ''.join('M' + ' '.join(f'{num(50 + s * (x - cx))} {num(50 + s * (-y - cy))}' for x, y in sub) + 'Z' for sub in shaped)
x1 = max(x + float(tx) for _, tx, _, _ in paths for x, _ in outer)   # the upright p's right edge, layers and all

# The p's share of the wordmark, cut halfway between the p and the h.
hx0 = bounds(after)[0]
lead = round(((x1 + hx0) / 2 - view[0]) / view[2], 4)

b = site['brand']
b['mark'] = mark
b['markSource'] = 'the p of the phiegg wordmark (public/logo/phiegg-3d.svg) shaped by brand.icon, its face, height 88 of the 100 box'
b['wordmarkLead'] = lead
b['wordmarkAspect'] = round(view[2] / view[3], 4)
open(site_path, 'w', encoding='utf-8', newline='\n').write(json.dumps(site, indent=1, ensure_ascii=False) + '\n')
# The app switcher's Phiegg icon is the egg with the bird now (scripts/logo-trace.py --egg): the registry is left alone.
print('p box', round(x1 - x0), 'x', round(y1 - y0), '| lead share', lead, '| face scale', round(s, 4))
