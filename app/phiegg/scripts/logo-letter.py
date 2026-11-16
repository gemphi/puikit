"""Cut the first letter (the p) out of the phiegg wordmark: the brand's icon is the letter already in the logo.

    python scripts/logo-letter.py public/logo/phiegg-3d.svg public/logo/phiegg-p.svg src/data/site.json ../phi-kit/src/registry.json

The wordmark draws each letter as five side layers stepping down and right, then the face; the first six paths are
the p. This writes
  - phiegg-p.svg: the p with its layers and gradient, in a square box (an icon on its own);
  - site.json brand.mark: the p's face in the 100 box, one colour (PhieggMark, PhipadMark);
  - site.json brand.wordmarkLead: the share of the wordmark's width the p takes, up to halfway to the h, so the header
    can show the wordmark cut to its p at the same size and place when the sidebar is closed;
  - site.json brand.wordmarkAspect: the wordmark's width over its height;
  - registry.json phiegg icon: the same face path (the app switcher)."""
import json, re, sys

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

# The square icon, layers and all.
x0, x1, y0, y1 = bounds(paths)
side = max(x1 - x0, y1 - y0); vx, vy = (x0 + x1 - side) / 2, (y0 + y1 - side) / 2
body = ''.join(f'<path d="{d}" transform="translate({tx} {ty})" fill="{fill}"/>' for d, tx, ty, fill in paths)
open(out, 'w', encoding='utf-8', newline='\n').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:g} {vy:g} {side:g} {side:g}" role="img" aria-label="phiegg">'
    f'<defs>{defs}</defs><g transform="scale(1 -1)">{body}</g></svg>')

# The face alone in the 100 box, one colour, height 88 like every mark.
face = paths[-1][0]
fx0, fx1, fy0, fy1 = bounds([paths[-1]])
s = 88 / max(fx1 - fx0, fy1 - fy0); cx, cy = (fx0 + fx1) / 2, (fy0 + fy1) / 2
mark = walk(face, lambda x, y: (50 + s * (x - cx), 50 + s * (-y - cy)))

# The p's share of the wordmark, cut halfway between the p and the h.
hx0 = bounds(after)[0]
lead = round(((x1 + hx0) / 2 - view[0]) / view[2], 4)

site = json.load(open(site_path, encoding='utf-8'))
b = site['brand']
b['mark'] = mark
b['markSource'] = 'the p of the phiegg wordmark (public/logo/phiegg-3d.svg), its face, height 88 of the 100 box'
b['wordmarkLead'] = lead
b['wordmarkAspect'] = round(view[2] / view[3], 4)
open(site_path, 'w', encoding='utf-8', newline='\n').write(json.dumps(site, indent=1, ensure_ascii=False) + '\n')
reg = json.load(open(reg_path, encoding='utf-8'))
for a in reg:
    if a.get('key') == 'phiegg':
        a['icon'] = [{'d': mark, 'fill': 'currentColor', 'stroke': 'none'}]
open(reg_path, 'w', encoding='utf-8', newline='\n').write(json.dumps(reg, indent=2, ensure_ascii=False) + '\n')
print('p box', round(x1 - x0), 'x', round(y1 - y0), '| lead share', lead, '| face scale', round(s, 4))
