// The metal a coin is struck in, and the two colours of its bank card: from one hue, a saturation and a brightness.
// A club's coin takes its tone's hue, moved a little by its symbol, so a hundred coins are not one colour.
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
/** HSL (degrees, percent) as #rrggbb. */
const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
};
export const metal = (h, s, bright = 0) => ({
  rimLight: hsl(h, s, 84 + bright), rimMid: hsl(h, s, 62 + bright), rimDark: hsl(h, s, 28 + bright / 2),
  faceLight: hsl(h, s, 74 + bright), faceMid: hsl(h, s, 56 + bright), faceDark: hsl(h, s, 36 + bright / 2),
  top: hsl(h, s, 30 + bright / 2), mid: hsl(h, s, 66 + bright), foot: hsl(h, s, 88 + bright),
  side: [0, 1, 2, 3, 4].map((i) => hsl(h, Math.min(100, s + 6), 40 - i * 4 + bright / 2)),
  ink: hsl(h, s, 18),
  /** The card beside the coin: two colours of its metal, dark to lighter. */
  card: [hsl(h, s, 20 + bright / 2), hsl((h + 22) % 360, s, 42 + bright)],
});
const BASE = { accent: [345, 58], neutral: [214, 22], ink: [250, 34], sage: [140, 38] };
/** A club coin's metal, from its tone and symbol. */
export const clubMetal = (c) => {
  const [h, s] = BASE[c.tone] ?? BASE.neutral; const move = (hash(c.symbol) % 60) - 30;
  return metal((h + move + 360) % 360, s + (hash(c.symbol + 's') % 14), 2);
};
