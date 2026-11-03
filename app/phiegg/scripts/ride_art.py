"""Drawings for rides and jewels (used by world-images.py). Everything is drawn at the size it is given, flat shapes in
the house style: a body colour, a glow colour, soft blurred light. No text, no logos."""
import math
from PIL import Image, ImageDraw, ImageFilter

def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def mix(a, b, t): return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))
def glow_layer(img, draw_fn, blur):
  L = Image.new('RGBA', img.size, (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(L)); img.alpha_composite(L.filter(ImageFilter.GaussianBlur(blur)))

def van(img, x, y, w, body, glow, rnd):
  """A robo van: a tall box on a hover hull, a window band, a sliding door and two lift pods."""
  h = w * 0.5; x0, y0 = x - w / 2, y - h / 2; b, g = rgb(body), rgb(glow); dark = mix(b, (10, 10, 20), 0.45); light = mix(b, (255, 255, 255), 0.25)
  glow_layer(img, lambda d: [d.ellipse([x0 + w * (p - 0.12), y0 + h * 0.9, x0 + w * (p + 0.12), y0 + h * 1.12], fill=g + (190,)) for p in (0.22, 0.78)], w * 0.04)
  d = ImageDraw.Draw(img); ow = max(1, int(w * 0.012))
  d.rounded_rectangle([x0, y0 + h * 0.12, x0 + w * 0.97, y0 + h * 0.86], radius=h * 0.14, fill=light + (255,), outline=dark + (255,), width=ow)
  d.polygon([(x0 + w * 0.78, y0 + h * 0.14), (x0 + w, y0 + h * 0.5), (x0 + w, y0 + h * 0.84), (x0 + w * 0.78, y0 + h * 0.84)], fill=b + (255,))  # nose
  d.rounded_rectangle([x0 + w * 0.08, y0 + h * 0.24, x0 + w * 0.74, y0 + h * 0.42], radius=h * 0.05, fill=mix((180, 220, 240), b, 0.2) + (240,))  # windows
  d.polygon([(x0 + w * 0.8, y0 + h * 0.22), (x0 + w * 0.95, y0 + h * 0.5), (x0 + w * 0.8, y0 + h * 0.5)], fill=mix((180, 220, 240), b, 0.2) + (240,))  # windscreen
  d.line([(x0 + w * 0.42, y0 + h * 0.46), (x0 + w * 0.42, y0 + h * 0.84)], fill=dark + (220,), width=ow)  # door
  d.line([(x0 + w * 0.04, y0 + h * 0.62), (x0 + w * 0.96, y0 + h * 0.62)], fill=g + (255,), width=max(1, int(w * 0.02)))
  d.ellipse([x0 + w * 0.95, y0 + h * 0.6, x0 + w * 1.0, y0 + h * 0.7], fill=(255, 250, 220, 255))
  for p in (0.22, 0.78): d.rounded_rectangle([x0 + w * (p - 0.11), y0 + h * 0.84, x0 + w * (p + 0.11), y0 + h * 0.96], radius=h * 0.05, fill=dark + (255,))

def jetski(img, x, y, w, body, glow, rnd, water=True):
  """A jetski riding a wake: pointed hull, seat, bars, spray behind."""
  h = w * 0.42; x0, y0 = x - w / 2, y - h / 2; b, g = rgb(body), rgb(glow); dark = mix(b, (10, 10, 20), 0.5)
  def spray(d):
    for k in range(9):
      sx = x0 - w * (0.05 + k * 0.09); sy = y0 + h * (0.6 - (k % 3) * 0.12); r = w * (0.08 - k * 0.006)
      d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(255, 255, 255, 170 - k * 15))
  glow_layer(img, spray, w * 0.02)
  d = ImageDraw.Draw(img); ow = max(1, int(w * 0.012))
  if water:
    for k in range(3): d.arc([x0 - w * 0.3, y0 + h * (0.72 + k * 0.08), x0 + w * 1.25, y0 + h * (1.05 + k * 0.08)], 190, 350, fill=(220, 240, 255, 150 - k * 40), width=max(1, int(w * 0.015)))
  d.polygon([(x0, y0 + h * 0.55), (x0 + w * 0.12, y0 + h * 0.4), (x0 + w * 0.7, y0 + h * 0.38), (x0 + w, y0 + h * 0.62), (x0 + w * 0.82, y0 + h * 0.8), (x0 + w * 0.06, y0 + h * 0.8)], fill=b + (255,), outline=dark + (255,), width=ow)
  d.line([(x0 + w * 0.08, y0 + h * 0.66), (x0 + w * 0.9, y0 + h * 0.66)], fill=g + (255,), width=max(1, int(w * 0.025)))
  d.rounded_rectangle([x0 + w * 0.22, y0 + h * 0.26, x0 + w * 0.56, y0 + h * 0.42], radius=h * 0.07, fill=dark + (255,))  # seat
  d.line([(x0 + w * 0.6, y0 + h * 0.4), (x0 + w * 0.66, y0 + h * 0.12)], fill=dark + (255,), width=max(1, int(w * 0.025)))  # steering post
  d.line([(x0 + w * 0.6, y0 + h * 0.12), (x0 + w * 0.74, y0 + h * 0.14)], fill=dark + (255,), width=max(1, int(w * 0.025)))  # bars

def saucer(img, x, y, w, body, glow, rnd, beam=True):
  """A flying saucer: disc with a rim of lights, a glass dome, a soft beam below."""
  h = w * 0.5; x0, y0 = x - w / 2, y - h / 2; b, g = rgb(body), rgb(glow); dark = mix(b, (10, 10, 20), 0.45); light = mix(b, (255, 255, 255), 0.35)
  if beam: glow_layer(img, lambda d: d.polygon([(x - w * 0.16, y0 + h * 0.62), (x + w * 0.16, y0 + h * 0.62), (x + w * 0.42, y0 + h * 1.6), (x - w * 0.42, y0 + h * 1.6)], fill=g + (70,)), w * 0.05)
  glow_layer(img, lambda d: d.ellipse([x0 + w * 0.05, y0 + h * 0.4, x0 + w * 0.95, y0 + h * 0.8], fill=g + (120,)), w * 0.05)
  d = ImageDraw.Draw(img); ow = max(1, int(w * 0.01))
  d.ellipse([x - w * 0.22, y0 + h * 0.08, x + w * 0.22, y0 + h * 0.62], fill=mix((190, 230, 245), b, 0.15) + (235,), outline=dark + (255,), width=ow)  # dome
  d.line([(x - w * 0.08, y0 + h * 0.2), (x + w * 0.02, y0 + h * 0.16)], fill=(255, 255, 255, 180), width=max(1, int(w * 0.015)))
  d.ellipse([x0, y0 + h * 0.4, x0 + w, y0 + h * 0.74], fill=light + (255,), outline=dark + (255,), width=ow)  # disc
  d.ellipse([x0 + w * 0.12, y0 + h * 0.56, x0 + w * 0.88, y0 + h * 0.8], fill=b + (255,))  # underside
  for k in range(9):  # rim lights
    a = math.pi * (k + 0.5) / 9; lx = x + math.cos(a) * w * 0.44; ly = y0 + h * 0.6 + math.sin(a) * h * 0.1
    d.ellipse([lx - w * 0.018, ly - w * 0.018, lx + w * 0.018, ly + w * 0.018], fill=g + (255,))

def fun_ride(img, x, y, w, body, glow, rnd, kind='wheel'):
  """A fun ride, drawn whole: sky wheel, coaster, carousel, swing chairs, drop tower, bumper pods or wave ride."""
  b, g = rgb(body), rgb(glow); dark = mix(b, (10, 10, 20), 0.5); light = mix(b, (255, 255, 255), 0.3); d = ImageDraw.Draw(img); lw = max(1, int(w * 0.012))
  if kind == 'wheel':
    r = w * 0.36; cy = y - w * 0.04
    d.polygon([(x, cy), (x - w * 0.2, y + w * 0.36), (x - w * 0.16, y + w * 0.36)], fill=dark + (255,)); d.polygon([(x, cy), (x + w * 0.2, y + w * 0.36), (x + w * 0.16, y + w * 0.36)], fill=dark + (255,))
    d.ellipse([x - r, cy - r, x + r, cy + r], outline=b + (255,), width=lw * 3)
    for k in range(12):
      a = 2 * math.pi * k / 12; px, py = x + math.cos(a) * r, cy + math.sin(a) * r; d.line([(x, cy), (px, py)], fill=light + (255,), width=lw)
      gs = w * 0.05; d.rounded_rectangle([px - gs, py, px + gs, py + gs * 1.4], radius=gs * 0.4, fill=(g if k % 2 else b) + (255,))
    d.ellipse([x - w * 0.04, cy - w * 0.04, x + w * 0.04, cy + w * 0.04], fill=g + (255,))
  elif kind == 'coaster':
    pts = [(x - w * 0.5 + w * t, y + w * 0.12 - w * 0.22 * math.sin(t * math.pi * 2.2) * (1 - t * 0.4)) for t in [i / 40 for i in range(41)]]
    for p in pts[::4]: d.line([p, (p[0], y + w * 0.34)], fill=dark + (200,), width=lw)
    d.line(pts, fill=b + (255,), width=lw * 4); d.line(pts, fill=light + (255,), width=lw)
    for k in range(3): px, py = pts[8 + k * 2]; d.rounded_rectangle([px - w * 0.03, py - w * 0.05, px + w * 0.03, py], radius=w * 0.01, fill=g + (255,))
  elif kind == 'carousel':
    top = y - w * 0.3; d.polygon([(x, top - w * 0.12), (x - w * 0.4, top + w * 0.06), (x + w * 0.4, top + w * 0.06)], fill=b + (255,))
    for k in range(8): d.polygon([(x, top - w * 0.12), (x - w * 0.4 + k * w * 0.1, top + w * 0.06), (x - w * 0.35 + k * w * 0.1, top + w * 0.06)], fill=(light if k % 2 else b) + (255,))
    d.rectangle([x - w * 0.4, top + w * 0.06, x + w * 0.4, top + w * 0.1], fill=g + (255,))
    for k in range(6):
      px = x - w * 0.33 + k * w * 0.132; d.line([(px, top + w * 0.1), (px, y + w * 0.26)], fill=light + (255,), width=lw)
      hy = y + w * (0.02 + (k % 2) * 0.06); d.ellipse([px - w * 0.05, hy, px + w * 0.05, hy + w * 0.06], fill=(g if k % 2 else mix(b, (255, 255, 255), 0.5)) + (255,))
    d.rounded_rectangle([x - w * 0.44, y + w * 0.26, x + w * 0.44, y + w * 0.32], radius=w * 0.02, fill=dark + (255,))
  elif kind in ('swing', 'drop'):
    tw = w * 0.05; d.rectangle([x - tw, y - w * 0.4, x + tw, y + w * 0.34], fill=dark + (255,)); d.ellipse([x - w * 0.08, y - w * 0.46, x + w * 0.08, y - w * 0.34], fill=g + (255,))
    if kind == 'swing':
      d.ellipse([x - w * 0.3, y - w * 0.34, x + w * 0.3, y - w * 0.26], fill=b + (255,))
      for k in range(7):
        a = math.pi * (0.1 + 0.8 * k / 6); px = x - math.cos(a) * w * 0.42; py = y + w * 0.02 - math.sin(a) * w * 0.05
        d.line([(x - math.cos(a) * w * 0.28, y - w * 0.3), (px, py)], fill=light + (255,), width=lw); d.rounded_rectangle([px - w * 0.025, py, px + w * 0.025, py + w * 0.03], radius=w * 0.01, fill=g + (255,))
    else:
      d.rounded_rectangle([x - w * 0.16, y - w * 0.1, x + w * 0.16, y - w * 0.02], radius=w * 0.02, fill=b + (255,))
      for k in range(5): d.ellipse([x - w * 0.14 + k * w * 0.07, y - w * 0.02, x - w * 0.11 + k * w * 0.07, y + w * 0.02], fill=g + (255,))
  elif kind == 'bumper':
    d.rounded_rectangle([x - w * 0.48, y + w * 0.04, x + w * 0.48, y + w * 0.32], radius=w * 0.08, fill=dark + (255,))
    for k, (px, py) in enumerate([(-0.28, 0.12), (0.02, 0.18), (0.28, 0.1)]):
      cx, cy = x + w * px, y + w * py; d.ellipse([cx - w * 0.12, cy - w * 0.06, cx + w * 0.12, cy + w * 0.08], fill=((b, g, light)[k]) + (255,))
      d.line([(cx, cy - w * 0.05), (cx, cy - w * 0.22)], fill=light + (255,), width=lw)
  else:  # wave
    for k in range(3): d.arc([x - w * 0.5, y - w * (0.1 - k * 0.06), x + w * 0.5, y + w * (0.4 + k * 0.06)], 190, 350, fill=(mix((120, 200, 240), b, 0.2) + (220 - k * 50,)), width=lw * 4)
    for k in range(6): a = math.pi * (1.1 + 0.8 * k / 5); px, py = x + math.cos(a) * w * 0.5, y + w * 0.15 + math.sin(a) * w * 0.25; d.rounded_rectangle([px - w * 0.035, py - w * 0.03, px + w * 0.035, py + w * 0.02], radius=w * 0.01, fill=(g if k % 2 else b) + (255,))

def jewel(img, x, y, s, piece, metal, stone, rnd):
  """A piece of jewellery or a watch, centred at (x, y) in a square of size s, on its velvet."""
  m, st = rgb(metal), rgb(stone); md = mix(m, (40, 30, 10), 0.35); ml = mix(m, (255, 255, 255), 0.45); d = ImageDraw.Draw(img); lw = max(2, int(s * 0.03))
  def gem(cx, cy, r):
    glow_layer(img, lambda dd: dd.ellipse([cx - r * 1.6, cy - r * 1.6, cx + r * 1.6, cy + r * 1.6], fill=st + (90,)), r * 0.6)
    dd = ImageDraw.Draw(img); pts = [(cx + math.cos(a) * r, cy + math.sin(a) * r) for a in [math.pi * (k / 4 + 0.125) for k in range(8)]]
    dd.polygon(pts, fill=st + (255,), outline=md + (255,)); dd.polygon([(cx - r * 0.5, cy - r * 0.2), (cx, cy - r * 0.75), (cx + r * 0.5, cy - r * 0.2), (cx, cy + r * 0.2)], fill=mix(st, (255, 255, 255), 0.45) + (255,))
    dd.ellipse([cx - r * 0.25, cy - r * 0.55, cx - r * 0.05, cy - r * 0.35], fill=(255, 255, 255, 230))
  if piece == 'ring':
    d.ellipse([x - s * 0.26, y - s * 0.12, x + s * 0.26, y + s * 0.3], outline=m + (255,), width=lw * 2); d.arc([x - s * 0.26, y - s * 0.12, x + s * 0.26, y + s * 0.3], 200, 260, fill=ml + (255,), width=lw)
    d.polygon([(x - s * 0.1, y - s * 0.12), (x + s * 0.1, y - s * 0.12), (x + s * 0.06, y - s * 0.04), (x - s * 0.06, y - s * 0.04)], fill=md + (255,)); gem(x, y - s * 0.2, s * 0.11)
  elif piece == 'necklace':
    pts = [(x + math.cos(a) * s * 0.36, y - s * 0.12 + math.sin(a) * s * 0.3) for a in [math.pi * (0.05 + 0.9 * k / 30) for k in range(31)]]
    for p in pts: d.ellipse([p[0] - s * 0.012, p[1] - s * 0.012, p[0] + s * 0.012, p[1] + s * 0.012], fill=m + (255,))
    d.line([(x, y + s * 0.18), (x, y + s * 0.22)], fill=m + (255,), width=lw); gem(x, y + s * 0.3, s * 0.08)
  elif piece == 'earrings':
    for dx in (-0.16, 0.16):
      cx = x + s * dx; d.arc([cx - s * 0.05, y - s * 0.3, cx + s * 0.05, y - s * 0.18], 180, 360, fill=m + (255,), width=lw)
      d.line([(cx + s * 0.05, y - s * 0.24), (cx, y - s * 0.08)], fill=m + (255,), width=lw); gem(cx, y + s * 0.04, s * 0.08)
  elif piece == 'bracelet':
    d.ellipse([x - s * 0.34, y - s * 0.16, x + s * 0.34, y + s * 0.2], outline=m + (255,), width=lw * 2)
    for k in range(9):
      a = math.pi * (0.1 + 0.8 * k / 8); gx, gy = x + math.cos(a) * s * 0.34, y + s * 0.02 + math.sin(a) * s * 0.18
      d.ellipse([gx - s * 0.03, gy - s * 0.03, gx + s * 0.03, gy + s * 0.03], fill=st + (255,), outline=md + (255,))
  else:  # watch
    d.rounded_rectangle([x - s * 0.1, y - s * 0.46, x + s * 0.1, y - s * 0.14], radius=s * 0.03, fill=md + (255,)); d.rounded_rectangle([x - s * 0.1, y + s * 0.14, x + s * 0.1, y + s * 0.46], radius=s * 0.03, fill=md + (255,))
    for k in range(5): d.line([(x - s * 0.1, y - s * 0.42 + k * s * 0.06), (x + s * 0.1, y - s * 0.42 + k * s * 0.06)], fill=mix(md, (0, 0, 0), 0.3) + (180,), width=1)
    R = s * 0.22; d.ellipse([x - R, y - R, x + R, y + R], fill=m + (255,)); d.rectangle([x + R - s * 0.01, y - s * 0.03, x + R + s * 0.04, y + s * 0.03], fill=m + (255,))
    r = R * 0.82; dial = mix(st, (250, 248, 240), 0.55); d.ellipse([x - r, y - r, x + r, y + r], fill=dial + (255,), outline=md + (255,))
    for k in range(12): a = 2 * math.pi * k / 12; d.line([(x + math.cos(a) * r * 0.78, y + math.sin(a) * r * 0.78), (x + math.cos(a) * r * 0.92, y + math.sin(a) * r * 0.92)], fill=md + (255,), width=max(1, lw // 2))
    a1, a2 = rnd.random() * 2 * math.pi, rnd.random() * 2 * math.pi
    d.line([(x, y), (x + math.cos(a1) * r * 0.5, y + math.sin(a1) * r * 0.5)], fill=(30, 28, 26, 255), width=lw); d.line([(x, y), (x + math.cos(a2) * r * 0.75, y + math.sin(a2) * r * 0.75)], fill=(30, 28, 26, 255), width=max(1, lw // 2))
    d.ellipse([x - s * 0.015, y - s * 0.015, x + s * 0.015, y + s * 0.015], fill=ml + (255,))
    d.arc([x - R, y - R, x + R, y + R], 200, 250, fill=ml + (255,), width=max(1, lw // 2))
