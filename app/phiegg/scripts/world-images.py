#!/usr/bin/env python3
"""World scenes and flying cars, seeded and idempotent.

  python3 scripts/world-images.py            # draw what is missing, patch core.json
  python3 scripts/world-images.py --force    # redraw everything

Scenes are drawn in the style of public/worlds/*.png (flat dunes, a sun, pillar towers, a dotted sky) from each
world's own colours, so no two worlds share a picture any more:
  * a world whose image is missing, or shared with a world before it, gets public/worlds/gen/<worldId>.webp;
  * the sky worlds (Wondrous, Verbum, Naimia) get flying cars on light trails across the sky, skylanes, and
    billboards on the towers showing the club portrait art (art/clubs/*/*.png, the beta PFT portraits);
  * Verbum's towers are letters.
The rides (src/data/ride.json, scripts/rides.mjs: flying cars, robo cabs, robo vans, jetskis, flying saucers, fun rides)
are drawn into public/rides/sheet-NN.webp (8 x 8 cells of 320 x 200) and Maison Once's jewellery and watches
(src/data/jewel.json, scripts/jewels.mjs) into public/jewels/sheet-00.webp (8 x 4 cells of 256 x 256). The scenes of
the round-29 worlds carry their rides: vans over Lora Land, jetskis on Skim City's canals, saucers over Loon Lake and
Wand City, the sky wheel over Bozo City, the clock tower of Once City, speech bubbles over Chatty Valley.
"""
import glob, json, math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import ride_art as RA

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DATA = os.path.join(ROOT, 'src', 'data'); PUB = os.path.join(ROOT, 'public')
FORCE = '--force' in sys.argv
W, H, S = 640, 400, 2  # drawn at 2x, saved at 1x
SKY_WORLDS = {'w_wondrous': 'cars', 'w_verbum': 'letters', 'w_naimia': 'royal', 'w_loraland': 'vans', 'w_chatty': 'talk', 'w_bozo': 'fair',
              'w_skim': 'water', 'w_loon': 'lake', 'w_wand': 'stars', 'w_once': 'clock'}
NIGHT = {'letters', 'lake', 'stars'}

def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def mix(a, b, t): return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))
CREAM = (243, 236, 226)

def font(size):
  for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf', 'C:/Windows/Fonts/georgiab.ttf']:
    if os.path.exists(f): return ImageFont.truetype(f, size)
  return ImageFont.load_default(size=size)

PORTRAITS = sorted(glob.glob(os.path.join(ROOT, 'art', 'clubs', '*', '*.png')))
_pcache = {}
def portrait(i, size):
  if not PORTRAITS: return None
  f = PORTRAITS[i % len(PORTRAITS)]
  if f not in _pcache: _pcache[f] = Image.open(f).convert('RGB').resize((256, 256), Image.LANCZOS)
  return _pcache[f].resize((size, size), Image.LANCZOS)

# ── a flying car, side view, facing right; (x, y) is the centre, w its length ──
def car(img, x, y, w, body, glow, rnd, trail=True, detail=True, shape='coupe'):
  if shape == 'van': return RA.van(img, x, y, w, body, glow, rnd)
  if shape == 'limousine': w *= 1.18
  if shape == 'pod': w *= 0.78
  h = w * (0.46 if shape == 'pod' else 0.36); L = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(L)
  x0, y0 = x - w / 2, y - h / 2; b, g = rgb(body), rgb(glow); dark = mix(b, (10, 10, 20), 0.45)
  if trail:
    T = Image.new('RGBA', img.size, (0, 0, 0, 0)); td = ImageDraw.Draw(T); length = w * (1.4 + rnd.random() * 1.6)
    for k, (dy, a) in enumerate([(0.62, 150), (0.5, 90), (0.74, 70)]):
      for j in range(24):
        t = j / 24; td.line([(x0 - length * t, y0 + h * dy), (x0 - length * (t + 1 / 24), y0 + h * dy)], fill=g + (int(a * (1 - t)),), width=max(1, int(w * (0.05 - k * 0.012))))
    img.alpha_composite(T.filter(ImageFilter.GaussianBlur(w * 0.012)))
  G = Image.new('RGBA', img.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(G)
  for px in (0.22, 0.76): gd.ellipse([x0 + w * (px - 0.13), y0 + h * 0.86, x0 + w * (px + 0.13), y0 + h * 1.18], fill=g + (190,))
  img.alpha_composite(G.filter(ImageFilter.GaussianBlur(w * 0.04)))
  # canopy (behind the body)
  glass = mix((180, 220, 240), b, 0.25) + (235,); ow = max(1, int(w * 0.012))
  cw, ch = w * (0.38 + rnd.random() * 0.12), h * (0.62 + rnd.random() * 0.18); cx = x0 + w * (0.5 + rnd.random() * 0.06)
  if shape == 'saloon': cw *= 1.3
  if shape == 'pod': cw, ch, cx = w * 0.62, h * 0.9, x0 + w * 0.52
  if shape == 'cab': ch *= 1.25
  if shape == 'roadster': cw, ch, cx = w * 0.16, h * 0.5, x0 + w * 0.66  # a windscreen only
  canopies = [(cx - w * 0.14, cw * 0.55), (cx + w * 0.16, cw * 0.55)] if shape == 'limousine' else [(cx, cw)]
  for (ccx, ccw) in canopies:
    d.ellipse([ccx - ccw / 2, y0 + h * 0.42 - ch / 2, ccx + ccw / 2, y0 + h * 0.42 + ch / 2], fill=glass, outline=dark + (255,), width=ow)
    d.line([(ccx - ccw * 0.1, y0 + h * 0.42 - ch / 2 + 2), (ccx + ccw * 0.18, y0 + h * 0.42 - ch * 0.15)], fill=(255, 255, 255, 170), width=max(1, int(w * 0.018)))
  if shape == 'cab':  # the cab sign on the roof
    d.rounded_rectangle([cx - w * 0.06, y0 + h * 0.42 - ch / 2 - h * 0.16, cx + w * 0.06, y0 + h * 0.42 - ch / 2 + 1], radius=h * 0.04, fill=g + (255,))
  if shape == 'roadster':  # the driver's head above the low hull
    d.ellipse([x0 + w * 0.46, y0 + h * 0.18, x0 + w * 0.56, y0 + h * 0.44], fill=dark + (255,))
  # hull: a capsule with a dropped nose and a raised tail
  hull = [(x0 + w * 0.02, y0 + h * 0.46), (x0 + w * 0.10, y0 + h * 0.34), (x0 + w * 0.30, y0 + h * 0.40), (x0 + w * 0.72, y0 + h * 0.42), (x0 + w * 0.93, y0 + h * 0.52),
          (x0 + w * 1.0, y0 + h * 0.64), (x0 + w * 0.95, y0 + h * 0.78), (x0 + w * 0.10, y0 + h * 0.80), (x0, y0 + h * 0.66)]
  d.polygon(hull, fill=b + (255,), outline=dark + (255,), width=max(1, int(w * 0.014)))
  d.polygon([(x0 + w * 0.03, y0 + h * 0.46), (x0 + w * 0.10, y0 + h * 0.14), (x0 + w * 0.18, y0 + h * 0.40)], fill=dark + (255,))  # tail fin
  d.line([(x0 + w * 0.06, y0 + h * 0.60), (x0 + w * 0.92, y0 + h * 0.62)], fill=g + (255,), width=max(1, int(w * 0.022)))  # glow stripe
  d.ellipse([x0 + w * 0.94, y0 + h * 0.56, x0 + w * 0.99, y0 + h * 0.64], fill=(255, 250, 220, 255))  # headlight
  d.rectangle([x0 + w * 0.0, y0 + h * 0.52, x0 + w * 0.03, y0 + h * 0.62], fill=(255, 60, 70, 255))  # tail light
  for px in (0.22, 0.76):  # lift pods
    d.rounded_rectangle([x0 + w * (px - 0.12), y0 + h * 0.76, x0 + w * (px + 0.12), y0 + h * 0.92], radius=h * 0.08, fill=dark + (255,))
    if detail: d.ellipse([x0 + w * (px - 0.08), y0 + h * 0.86, x0 + w * (px + 0.08), y0 + h * 0.95], fill=g + (255,))
  if detail: d.line([(x0 + w * 0.36, y0 + h * 0.48), (x0 + w * 0.36, y0 + h * 0.76)], fill=dark + (200,), width=max(1, int(w * 0.008)))  # door seam
  img.alpha_composite(L)

TONE_COLOURS = {'accent': ['#c26a4a', '#d9a37a', '#7a3b2e', '#e8c9a8'], 'sage': ['#7d8f62', '#a9b78f', '#4f5d3c', '#d3dcc0'],
                'neutral': ['#9a8f80', '#c8bfb2', '#5f564b', '#e6dfd4'], 'ink': ['#4a4744', '#7a756f', '#2a2826', '#b9b2a8']}

def scene(w, rides, rnd):
  cols = [rgb(c) for c in (w.get('colors') or TONE_COLOURS.get(w.get('tone'), TONE_COLOURS['neutral']))]
  while len(cols) < 4: cols.append(mix(cols[-1], CREAM, 0.4))
  kind = SKY_WORLDS.get(w['id']); night = w.get('tone') == 'ink' or kind in NIGHT
  sky_top = mix(cols[0], (24, 22, 40) if night else CREAM, 0.72 if night else 0.82); sky_bot = mix(cols[1], (40, 34, 60) if night else CREAM, 0.55 if night else 0.62)
  img = Image.new('RGBA', (W * S, H * S)); px = img.load(); d = ImageDraw.Draw(img)
  for yy in range(H * S):
    c = mix(sky_top, sky_bot, yy / (H * S)); d.line([(0, yy), (W * S, yy)], fill=c + (255,))
  dot = mix(sky_top, (255, 255, 255) if night else (90, 80, 70), 0.25)
  for yy in range(30, int(H * S * 0.55), 40):
    for xx in range(20 + (yy // 40 % 2) * 20, W * S, 40): d.ellipse([xx - 1.5, yy - 1.5, xx + 1.5, yy + 1.5], fill=dot + (120,))
  if night:
    for _ in range(60): sx, sy = rnd.random() * W * S, rnd.random() * H * S * 0.5; d.ellipse([sx - 1, sy - 1, sx + 1, sy + 1], fill=(255, 255, 255, 140))
  r = (40 + rnd.random() * 40) * S; sx, sy = (0.15 + rnd.random() * 0.7) * W * S, (0.12 + rnd.random() * 0.22) * H * S
  d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=mix(cols[2], sky_top, 0.35) + (255,))
  if kind == 'talk':  # speech bubbles drifting over the valley
    for k in range(7):
      bx, by, bw = rnd.random() * W * S, (0.08 + rnd.random() * 0.35) * H * S, (40 + rnd.random() * 50) * S
      d.rounded_rectangle([bx, by, bx + bw, by + bw * 0.55], radius=bw * 0.25, fill=mix(cols[3], (255, 255, 255), 0.6) + (230,))
      d.polygon([(bx + bw * 0.2, by + bw * 0.5), (bx + bw * 0.12, by + bw * 0.75), (bx + bw * 0.38, by + bw * 0.5)], fill=mix(cols[3], (255, 255, 255), 0.6) + (230,))
      for j in range(3): d.ellipse([bx + bw * (0.3 + j * 0.15), by + bw * 0.24, bx + bw * (0.36 + j * 0.15), by + bw * 0.3], fill=mix(cols[2], sky_top, 0.2) + (255,))
  if kind in ('cars', 'letters', 'vans'):  # skylanes: soft glowing arcs
    SL = Image.new('RGBA', img.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(SL)
    for k in range(4):
      y0 = (0.14 + k * 0.08) * H * S; amp = (10 + rnd.random() * 30) * S; ph = rnd.random() * 6
      pts = [(xx, y0 + amp * math.sin(xx / (W * S) * math.pi * 1.4 + ph)) for xx in range(0, W * S + 20, 20)]
      sd.line(pts, fill=mix(cols[3], (255, 255, 255), 0.4) + (110,), width=3 * S)
    img.alpha_composite(SL.filter(ImageFilter.GaussianBlur(2 * S)))
  # towers (pillars with round tops), some with billboards of the club portraits; Verbum's towers are letters
  base = H * S * 0.62; tower = mix(cols[2], sky_bot, 0.25)
  if kind == 'letters':
    word = rnd.choice(['VERBUM', 'LEXICON', 'SONNET', 'QUILL']); size = int(118 * S); f = font(size)
    total = sum(d.textbbox((0, 0), ch, font=f)[2] - d.textbbox((0, 0), ch, font=f)[0] + 14 * S for ch in word)
    if total > W * S * 0.88: f = font(int(size * W * S * 0.88 / total))
    x = W * S * 0.06
    for ch in word:
      bb = d.textbbox((0, 0), ch, font=f); tw = bb[2] - bb[0]; th = bb[3] - bb[1]; lift = rnd.random() * 40 * S
      d.text((x - bb[0], base - th - bb[1] - lift), ch, font=f, fill=mix(tower, (255, 120, 200) if rnd.random() < 0.3 else tower, 0.35) + (255,))
      x += tw + 14 * S
  else:
    n = rnd.randint(4, 7) if kind else rnd.randint(3, 5)
    for k in range(n):
      tx = (0.08 + 0.84 * (k + rnd.random() * 0.6) / n) * W * S; tw = (8 + rnd.random() * (14 if kind else 8)) * S; th = (60 + rnd.random() * (140 if kind else 90)) * S
      d.rounded_rectangle([tx - tw / 2, base - th, tx + tw / 2, base + 20 * S], radius=tw / 2, fill=tower + (235,))
      if kind and PORTRAITS and k % 2 == 0:  # billboard: a portrait from the club art in a rounded frame
        bs = int(46 * S); p = portrait(rnd.randint(0, 10 ** 6), bs); bx, by = int(tx - bs / 2), int(base - th - bs * 0.2 - bs)
        m = Image.new('L', (bs, bs), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, bs, bs], radius=bs * 0.18, fill=255)
        d.rounded_rectangle([bx - 3 * S, by - 3 * S, bx + bs + 3 * S, by + bs + 3 * S], radius=bs * 0.22, fill=mix(cols[3], (255, 255, 255), 0.5) + (255,))
        img.paste(p, (bx, by), m); d.line([(tx, by + bs + 3 * S), (tx, base - th)], fill=tower + (255,), width=2 * S)
  if kind == 'fair':  # the sky wheel and striped tents over Bozo City
    fun = [r for r in rides if r['kind'] == 'fun']
    if fun: RA.fun_ride(img, W * S * 0.72, base - 70 * S, 300 * S, fun[0]['hex'], fun[0]['glow'], rnd, 'wheel')
    for k in range(4):
      tx, tw = (0.08 + k * 0.16) * W * S, (60 + rnd.random() * 30) * S; th = tw * 0.8; c1 = rgb(['#c2185b', '#f9a825', '#1565c0', '#2e7d32'][k])
      for j in range(6): d.polygon([(tx, base - th), (tx - tw / 2 + j * tw / 6, base + 10 * S), (tx - tw / 2 + (j + 1) * tw / 6, base + 10 * S)], fill=(c1 if j % 2 else (250, 245, 235)) + (255,))
  if kind == 'clock':  # the clock tower of Once City, with sparkles of the jewellers' windows
    tx = W * S * 0.5; d.rectangle([tx - 30 * S, base - 230 * S, tx + 30 * S, base + 20 * S], fill=mix(tower, (0, 0, 0), 0.1) + (255,))
    d.polygon([(tx - 38 * S, base - 230 * S), (tx, base - 290 * S), (tx + 38 * S, base - 230 * S)], fill=tower + (255,))
    cr = 22 * S; cy = base - 190 * S; d.ellipse([tx - cr, cy - cr, tx + cr, cy + cr], fill=(250, 244, 226, 255), outline=(120, 96, 40, 255), width=2 * S)
    d.line([(tx, cy), (tx, cy - cr * 0.7)], fill=(40, 30, 20, 255), width=2 * S); d.line([(tx, cy), (tx + cr * 0.5, cy + cr * 0.2)], fill=(40, 30, 20, 255), width=2 * S)
    for _ in range(40):
      sx, sy, r = rnd.random() * W * S, (0.05 + rnd.random() * 0.5) * H * S, (2 + rnd.random() * 4) * S
      d.polygon([(sx, sy - r * 2), (sx + r * 0.5, sy), (sx, sy + r * 2), (sx - r * 0.5, sy)], fill=(255, 245, 200, 200)); d.polygon([(sx - r * 2, sy), (sx, sy - r * 0.5), (sx + r * 2, sy), (sx, sy + r * 0.5)], fill=(255, 245, 200, 200))
  # dunes: four layers, light to dark
  for k in range(4):
    c = mix(mix(cols[k % 2], cols[2], k / 4), sky_bot, 0.45 - k * 0.12); y0 = H * S * (0.58 + k * 0.1); amp = (14 + rnd.random() * 22) * S
    f1, f2, ph = 1 + rnd.random() * 2, 2 + rnd.random() * 3, rnd.random() * 6
    pts = [(xx, y0 + amp * math.sin(xx / (W * S) * math.pi * f1 + ph) + amp * 0.4 * math.sin(xx / (W * S) * math.pi * f2)) for xx in range(0, W * S + 10, 10)]
    d.polygon(pts + [(W * S, H * S), (0, H * S)], fill=c + (255,))
  if kind in ('water', 'lake'):  # a canal or the lake across the foreground, its jetskis on it
    wy = H * S * 0.74; water = mix(rgb('#3a7fb0') if kind == 'water' else rgb('#16203a'), cols[1], 0.25)
    d.rectangle([0, wy, W * S, H * S], fill=water + (255,))
    for k in range(14): yy = wy + (k + 1) * 6 * S; d.line([(rnd.random() * W * S * 0.5, yy), (W * S * (0.5 + rnd.random() * 0.5), yy)], fill=mix(water, (255, 255, 255), 0.25) + (120,), width=S)
    if kind == 'lake': d.ellipse([sx - r * 0.9, wy + 18 * S, sx + r * 0.9, wy + 40 * S], fill=mix(cols[2], water, 0.35) + (180,))  # the moon on the water
    for k, rr in enumerate([r for r in rides if r['kind'] == 'jetski'][:4]):
      RA.jetski(img, (0.16 + k * 0.22) * W * S, wy + (22 + (k % 2) * 26) * S, (70 + rnd.random() * 30) * S, rr['hex'], rr['glow'], rnd)
  fly = [r for r in rides if r['kind'] in ('car', 'cab', 'van', 'saucer')][:7]
  for k, rr in enumerate(fly):  # spread over the sky: one per column slot, rows staggered
    cw = (44 + rnd.random() * 40) * S; cx = ((k + 0.5) / len(fly) + (rnd.random() - 0.5) * 0.06) * W * S; cy = (0.12 + (k * 3 % 5) * 0.075) * H * S
    if rr['kind'] == 'saucer': RA.saucer(img, cx, cy, cw * 0.9, rr['hex'], rr['glow'], rnd)
    else: car(img, cx, cy, cw, rr['hex'], rr['glow'], rnd, trail=True, detail=cw > 60 * S, shape=rr.get('body', 'coupe'))
  return img.resize((W, H), Image.LANCZOS).convert('RGB')

def ride_cell(c, rnd, cw=320, ch=200):
  bg = mix(rgb(c['hex']), (14, 12, 26), 0.78); edge = mix(rgb(c['glow']), bg, 0.75); kind = c.get('kind', 'car')
  img = Image.new('RGBA', (cw * S, ch * S)); d = ImageDraw.Draw(img)
  for r in range(max(cw, ch) * S, 0, -6):  # radial glow behind the ride
    t = r / (max(cw, ch) * S); col = mix(edge, bg, t); d.ellipse([cw * S / 2 - r, ch * S * 0.52 - r * 0.7, cw * S / 2 + r, ch * S * 0.52 + r * 0.7], fill=col + (255,))
  sk = mix(bg, (0, 0, 0), 0.3)
  if kind == 'jetski':  # water instead of a skyline
    d.rectangle([0, ch * S * 0.62, cw * S, ch * S], fill=mix(rgb('#2a6f9a'), bg, 0.45) + (255,))
    for k in range(8): yy = ch * S * 0.66 + k * 7 * S; d.line([(rnd.random() * cw * S * 0.4, yy), (cw * S * (0.6 + rnd.random() * 0.4), yy)], fill=(255, 255, 255, 60), width=S)
    RA.jetski(img, cw * S * 0.55, ch * S * 0.56, cw * S * 0.56, c['hex'], c['glow'], rnd)
  else:
    for k in range(9):  # a faint skyline
      tx = (k + 0.5) / 9 * cw * S; th = (30 + rnd.random() * 60) * S; tw = (8 + rnd.random() * 10) * S
      d.rounded_rectangle([tx - tw / 2, ch * S - th, tx + tw / 2, ch * S + 10], radius=tw / 2, fill=sk + (110,))
    if kind == 'saucer': RA.saucer(img, cw * S * 0.5, ch * S * 0.4, cw * S * 0.52, c['hex'], c['glow'], rnd)
    elif kind == 'fun': RA.fun_ride(img, cw * S * 0.5, ch * S * 0.5, ch * S * 0.95, c['hex'], c['glow'], rnd, c.get('body', 'wheel'))
    else: car(img, cw * S * 0.55, ch * S * 0.5, cw * S * 0.62, c['hex'], c['glow'], rnd, trail=True, detail=True, shape=c.get('body', 'coupe'))
  return img.resize((cw, ch), Image.LANCZOS).convert('RGB')

def jewel_cell(j, rnd, cw=256, ch=256):
  base = rgb(j.get('stoneHex') or j['hex']); bg = mix(base, (16, 10, 20), 0.82); edge = mix(base, bg, 0.6)
  img = Image.new('RGBA', (cw * S, ch * S)); d = ImageDraw.Draw(img)
  for r in range(cw * S, 0, -6): t = r / (cw * S); d.ellipse([cw * S / 2 - r, ch * S * 0.5 - r, cw * S / 2 + r, ch * S * 0.5 + r], fill=mix(edge, bg, t) + (255,))
  d.ellipse([cw * S * 0.18, ch * S * 0.78, cw * S * 0.82, ch * S * 0.9], fill=mix(bg, (0, 0, 0), 0.4) + (160,))  # its shadow on the velvet
  RA.jewel(img, cw * S / 2, ch * S * 0.5, cw * S * 0.8, j['piece'], j['metalHex'], j.get('stoneHex') or j['metalHex'], rnd)
  return img.resize((cw, ch), Image.LANCZOS).convert('RGB')

def main():
  core = json.load(open(os.path.join(DATA, 'core.json'), encoding='utf8'))
  ride_f = os.path.join(DATA, 'ride.json'); ride = json.load(open(ride_f, encoding='utf8')) if os.path.exists(ride_f) else {'list': [], 'sheets': []}
  jewel_f = os.path.join(DATA, 'jewel.json'); jewels = json.load(open(jewel_f, encoding='utf8')) if os.path.exists(jewel_f) else {'list': []}
  for sub in ('worlds/gen', 'rides', 'jewels'): os.makedirs(os.path.join(PUB, sub), exist_ok=True)
  seen, made, patched = set(), 0, 0
  for w in core['worlds']:
    img = w.get('image'); path = os.path.join(PUB, img.replace('assets/', '', 1)) if img else None
    gen = 'assets/worlds/gen/%s.webp' % w['id']
    need = w['id'] in SKY_WORLDS or not img or img == gen or img in seen or not os.path.exists(path)
    if img and img != gen: seen.add(img)
    if not need: continue
    out = os.path.join(PUB, gen.replace('assets/', '', 1))
    if FORCE or not os.path.exists(out):
      rnd = random.Random(w['id'])
      scene(w, [r for r in ride['list'] if r['worldId'] == w['id']], rnd).save(out, 'WEBP', quality=84); made += 1
    if w.get('image') != gen: w['image'] = gen; patched += 1
  cf = os.path.join(DATA, 'core.json'); pretty = '\n  "' in open(cf, encoding='utf8').read(400)
  json.dump(core, open(cf, 'w', encoding='utf8'), ensure_ascii=False, **({'indent': 2} if pretty else {'separators': (',', ':')}))
  cw, ch = ride.get('cell', [320, 200]); cols, rows = ride.get('cols', 8), ride.get('rows', 8)
  for k, name in enumerate(ride.get('sheets', [])):  # rides: one sheet per 64
    sheet = Image.new('RGB', (cw * cols, ch * rows), (14, 12, 26))
    for c in [r for r in ride['list'] if r['sheet'] == k]: sheet.paste(ride_cell(c, random.Random(c['id']), cw, ch), ((c['index'] % cols) * cw, (c['index'] // cols) * ch))
    sheet.save(os.path.join(PUB, name), 'WEBP', quality=86)
  if jewels['list']:
    jw, jh = jewels.get('cell', [256, 256]); jc, jr = jewels.get('cols', 8), jewels.get('rows', 4)
    sheet = Image.new('RGB', (jw * jc, jh * jr), (16, 10, 20))
    for j in jewels['list']: sheet.paste(jewel_cell(j, random.Random(j['id']), jw, jh), ((j['index'] % jc) * jw, (j['index'] // jc) * jh))
    sheet.save(os.path.join(PUB, jewels['sheet']), 'WEBP', quality=88)
  print('world-images: %d scenes drawn, %d worlds repointed, %d rides on %d sheets, %d jewels' % (made, patched, len(ride['list']), len(ride.get('sheets', [])), len(jewels['list'])))

if __name__ == '__main__': main()
