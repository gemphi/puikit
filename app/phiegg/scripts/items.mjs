#!/usr/bin/env node
// Item specs, seeded and idempotent. Run after brands / deepen-data / hosts-casts / celebs and before pools:
//   python3 scripts/item-colors.py   (measures every render → src/data/itemColors.json)
//   node scripts/items.mjs
//
// 1. Colour comes from the render. Every look with a render takes the garment colour measured from its FRONT image
//    (hex = a display tint of it, family, palette, colour name). A look's name that starts with a colour word of a
//    different family is renamed to the render's colour, so "Amber Sailor Top" on a crimson dress becomes
//    "Crimson Sailor Top". Looks without a render get one of the same colour family when there is one.
// 2. Specs: every look carries `specs` (colour, theme kinds pending from designers, category, silhouette, fabric,
//    finish, sizes, season, collection, renders, provenance, supply, utility, tags) so every field has a home.
// 3. Activity: every look has its ledger in sales.json (mint, list, offers, sales, transfers), at least a mint.
// 4. Show looks link to a store look (lookId) and take its render colour, so the runway card matches the dress.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
// Keep each file's layout (minified or 2-space).
const write = (f, v) => { const prev = readFileSync(join(DATA, f), 'utf8'); const pretty = /\n\s+"/.test(prev.slice(0, 400)); writeFileSync(join(DATA, f), JSON.stringify(v, null, pretty ? 2 : undefined) + (prev.endsWith('\n') ? '\n' : '')); };
const hash = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

const colors = read('itemColors.json'); const ls = read('ls.json'); const storesDoc = read('stores.json'); const shows = read('shows.json');
const sales = read('sales.json'); const pools = read('pools.json'); const core = read('core.json'); const casts = read('casts.json'); const seriesDoc = read('series.json');
import { readdirSync, existsSync } from 'node:fs';
const PROD = join(DATA, 'productions'); const productions = existsSync(PROD) ? Object.assign({}, ...readdirSync(PROD).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(PROD, f), 'utf8')))) : {};
// Where each look appears: casts (shows, plays, films), runway shows, and every production that dresses a role in it or shops it in an episode.
const appears = new Map(); const add = (lookId, k, id) => { const a = appears.get(lookId) ?? { castIds: new Set(), showIds: new Set(), seriesIds: new Set(), episodes: 0 }; a[k].add(id); appears.set(lookId, a); return a; };
for (const c of casts.casts) for (const l of c.lookIds ?? []) add(l, 'castIds', c.id);
for (const [sid, p] of Object.entries(productions)) { for (const r of p.roles) for (const l of r.lookIds) add(l, 'seriesIds', sid); for (const se of p.seasons) for (const e of se.episodes) if (e.shop?.lookId) add(e.shop.lookId, 'seriesIds', sid).episodes++; }

// ── colour maths ──
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (r, g, b) => '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const hsl = (hex) => { const [r, g, b] = rgb(hex).map((x) => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s, l]; };
const fromHsl = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255); };
// Renders are shaded; the display tint keeps the hue, lifts lightness into a readable band and keeps some saturation.
const tint = (hex) => { const [h, s, l] = hsl(hex); return s < 0.12 ? fromHsl(h, s, Math.min(0.62, Math.max(0.4, l))) : fromHsl(h, Math.min(0.85, Math.max(0.38, s * 1.25)), Math.min(0.6, Math.max(0.4, l * 1.25))); };
// Same thresholds as pools.mjs so posts, pools and items agree on a family.
const hexFamily = (hex) => { const [h, s, l] = hsl(hex); const d = s * (1 - Math.abs(2 * l - 1));
  if (l < 0.16) return 'black'; if (l > 0.88 && d < 0.12) return 'white'; if (d < 0.08) return l < 0.5 ? 'black' : 'white';
  if (h < 12 || h >= 345) return l > 0.7 ? 'pink' : 'red'; if (h < 40) return l < 0.35 ? 'brown' : 'orange'; if (h < 68) return 'yellow'; if (h < 170) return 'green';
  if (h < 255) return 'blue'; if (h < 300) return 'purple'; return 'pink'; };
const NAMES = { Ruby: '#9b1b33', Crimson: '#a3122a', Scarlet: '#c8202b', Coral: '#e0644f', Ember: '#c2401f', Rust: '#9a4a24', Amber: '#d9851c', Saffron: '#e3a51c', Gold: '#c9a227',
  Champagne: '#cdb27a', Sand: '#c8b28e', Lemon: '#e8d44d', Olive: '#7a7a2e', Sage: '#7a8a5e', Emerald: '#1f8a4c', Jade: '#2f9a74', Teal: '#2f8a86', Lagoon: '#2a9c95',
  Azure: '#3d6fc4', Cornflower: '#6f93d6', Cobalt: '#2f55c4', Navy: '#24306b', Indigo: '#2b2a9c', Violet: '#6b3fb8', Plum: '#6e2a5e', Magenta: '#d6177f', Fuchsia: '#c4268a',
  Rose: '#d46a8c', Blush: '#e0a27a', Porcelain: '#8fa9d9', Pearl: '#e6e0d4', Ivory: '#efe9df', Onyx: '#24211f', Graphite: '#4a4a4f', Chocolate: '#5a3a26', Camel: '#b48a5a', Silver: '#a8a9ad' };
// Distance between two colours: hue matters most when both are saturated, then saturation and lightness.
const dist = (a, b) => { const [h, s, l] = hsl(a), [h2, s2, l2] = hsl(b); const dh = Math.min(Math.abs(h - h2), 360 - Math.abs(h - h2)) / 180;
  return dh * dh * (s > 0.15 && s2 > 0.15 ? 3 : 0.4) + (s - s2) ** 2 + (l - l2) ** 2 * 1.4; };
const nameOf = (hex) => Object.keys(NAMES).reduce((best, n) => (dist(hex, NAMES[n]) < dist(hex, NAMES[best]) ? n : best), 'Graphite');
const FAR = 0.08; // a colour word this far from the render no longer describes it
const COLOUR_WORDS = new Set([...Object.keys(NAMES), 'Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Purple', 'Orange', 'Yellow', 'Brown', 'Grey', 'Gray']);

// ── render catalogue: one entry per look render set (the FRONT image is measured) ──
const RENDERS = ls.looks.filter((l) => l.views?.FRONT && colors[l.views.FRONT]).map((l) => { const m = colors[l.views.FRONT]; const t = tint(m.hex);
  return { from: l.id, views: l.views, opaque: l.opaque, measured: m.hex, palette: m.palette, share: m.share, hex: t, family: hexFamily(t), name: nameOf(t) }; });
// Recoloured flagship dresses (scripts/recolour-renders.py) for the colours the flagship never rendered; their hex is
// the colour they were recoloured to, so a plum look gets the plum dress and no store shows a bare swatch.
import { existsSync as fileExists } from 'node:fs';
if (fileExists(join(DATA, 'recolours.json'))) for (const x of read('recolours.json').looks)
  RENDERS.push({ from: x.id, views: x.views, opaque: undefined, measured: x.hex, palette: [x.hex], share: null, hex: x.hex, family: hexFamily(x.hex), name: x.name });
const renderOf = (front) => RENDERS.find((r) => r.views.FRONT === front);

// ── specs vocabulary ──
const CATEGORY = [[/gown/i, 'gown'], [/dress|tutu|slip|column|sheath/i, 'dress'], [/suit|tuxedo|blazer/i, 'tailoring'], [/coat|trench|cape|jacket/i, 'outerwear'],
  [/corset|bodice|bodysuit|top/i, 'top'], [/skirt|trousers/i, 'bottoms'], [/kimono|robe|wrap/i, 'wrap'], [/glove|shawl|scarf|hat/i, 'accessory']];
const SILHOUETTE = [[/tier|tutu|petal|feather/i, 'Tiered'], [/column|sheath/i, 'Column'], [/bias|slip/i, 'Bias'], [/a-line|swirl|spiral/i, 'A-line'], [/cape|train/i, 'Trained'], [/wrap|kimono/i, 'Wrap'], [/suit|blazer|tuxedo/i, 'Tailored']];
const FABRIC = [[/tulle|tutu|petal/i, 'tulle'], [/lace/i, 'lace'], [/silk|slip|bias/i, 'silk'], [/velvet/i, 'velvet'], [/satin|ombré|ombre/i, 'satin'], [/feather/i, 'feathers'], [/linen/i, 'linen'], [/wool|tweed|coat|suit|trench/i, 'wool'], [/sheer|organza|chiffon/i, 'organza']];
const match = (rules, text, dflt) => (rules.find(([re]) => re.test(text)) ?? [, dflt])[1];
const poolById = new Map(pools.pools.map((p) => [p.id, p])); const clubById = new Map(core.clubs.map((c) => [c.id, c]));


// High-fashion attributes, read from the look's own words first and seeded where it says nothing.
const ATTR = {
  neckline: [[/plunge/i, 'Plunge'], [/keyhole/i, 'Keyhole'], [/halter/i, 'Halter'], [/sweetheart|bustier|corset/i, 'Sweetheart'], [/off.?shoulder|bardot/i, 'Off-shoulder'], [/bow/i, 'Bow neck'], [/collar|blazer|suit|trench|coat/i, 'Notched lapel']],
  sleeve: [[/sheer long|long sleeve/i, 'Sheer long'], [/puff/i, 'Puff'], [/cap/i, 'Cap'], [/strapless|bustier|corset/i, 'Strapless'], [/wing|cape/i, 'Cape'], [/blazer|suit|coat|trench|jacket/i, 'Tailored long']],
  length: [[/tutu|mini|cropped/i, 'Mini'], [/train|gown|column/i, 'Floor with train'], [/midi|slip|bias/i, 'Midi'], [/trousers|suit/i, 'Full length'], [/coat|trench|cape/i, 'Knee']],
  embellishment: [[/feather/i, 'Feathers'], [/lace/i, 'Lace appliqué'], [/sequin|glitter|crystal/i, 'Crystals'], [/bead|pearl/i, 'Pearl beading'], [/embroider/i, 'Embroidery'], [/ombr/i, 'Hand-dyed ombré']],
};
const SEED = { neckline: ['V-neck', 'Square', 'Boat', 'High neck', 'Cowl', 'Scoop'], sleeve: ['Sleeveless', 'Short', 'Bishop', 'Three-quarter'], length: ['Midi', 'Knee', 'Tea', 'Floor'], embellishment: ['None', 'Tonal embroidery', 'Crystals', 'Bugle beads', 'Hand pleating'],
  closure: ['Invisible zip', 'Corset lacing', 'Covered buttons', 'Hook and eye', 'Wrap tie'], waist: ['Natural', 'Empire', 'Drop', 'Corseted', 'Belted'],
  technique: ['Draping', 'Pleating', 'Smocking', 'Hand rolling', 'Bias cutting', 'Couture basting'], inspiration: ['golden-age premieres', 'ballet rehearsal rooms', 'riviera nights', 'opera galas', 'midnight runways', 'garden parties', 'old-hollywood glamour', 'the salon of mirrors'] };
const OCCASION = { gown: ['Gala', 'Red carpet', 'Black tie'], dress: ['Cocktail', 'Party', 'Premiere'], tailoring: ['Business', 'Evening', 'Black tie'], outerwear: ['Day', 'Travel', 'Arrivals'], top: ['Party', 'Date night'], bottoms: ['Day', 'Evening'], wrap: ['Resort', 'Lounge'], accessory: ['Gala', 'Day'] };
const pickBy = (rules, text, list, seed) => (rules.find(([re]) => re.test(text)) ?? [, list[hash(seed) % list.length]])[1];
function couture(l, text, club) {
  const h = hash(l.id); const cat = match(CATEGORY, text, 'dress');
  const menswear = /deer|tailor|gentle|suit|tuxedo/i.test((club?.name ?? '') + ' ' + text);
  const gender = menswear ? 'Menswear' : ['outerwear', 'accessory', 'wrap'].includes(cat) ? (h % 3 ? 'Unisex' : 'Genderless') : 'Womenswear';
  const occ = [...(OCCASION[cat] ?? ['Party']), ...(h % 4 === 0 ? ['Runway'] : []), ...(/tutu|ballet/i.test(text) ? ['Ballet'] : [])];
  const city = (core.worlds.find((w) => w.id === club?.worldIds?.[0])?.cities ?? [])[0]?.name ?? null;
  return {
    gender, occasion: [...new Set(occ)],
    neckline: pickBy(ATTR.neckline, text, SEED.neckline, l.id + 'n'), sleeve: pickBy(ATTR.sleeve, text, SEED.sleeve, l.id + 's'),
    length: pickBy(ATTR.length, text, SEED.length, l.id + 'l'), embellishment: pickBy(ATTR.embellishment, text, SEED.embellishment, l.id + 'e'),
    closure: SEED.closure[h % SEED.closure.length], waist: SEED.waist[(h >>> 3) % SEED.waist.length],
    craft: { hours: { Common: 12, Rare: 40, Epic: 120, Legendary: 360 }[l.rarity] ?? 24, technique: SEED.technique[(h >>> 5) % SEED.technique.length], artisans: 1 + (h % 7), atelier: city },
    inspiration: SEED.inspiration[(h >>> 7) % SEED.inspiration.length],
    care: { digital: 'No care needed', physical: 'Dry clean only, store flat in tissue' },
    sustainability: { madeTo: 'order', deadstock: h % 5 === 0, traceable: true },
  };
}

// Beta designer themes: one look in three (and every look of the round-28 houses) ships with its designer's kinds,
// mood, story and two colours, so opening it dresses the page in it. The rest stay pending until a designer sets them.
const THEME_KINDS = read('site.json').themeKinds ?? ['Couture', 'Evening', 'Futurist'];
const MOODS = ['After the show', 'First light', 'Velvet dusk', 'Sunday garden', 'Neon rain', 'Ballroom hush', 'Salt and linen', 'Midsummer'];
const SEEDED = new Set(['c_wondrous', 'c_skylane', 'c_hoverhouse', 'c_verbum', 'c_inkwell', 'c_syntax', 'c_naimroyal']);
const seededTheme = (l, club, r) => {
  const h = hash(l.id + ':theme');
  if (!(SEEDED.has(club?.id) || h % 3 === 0)) return { kinds: [], mood: null, story: null, source: 'pending' };
  const [hh, ss, ll] = hsl(l.hex); const second = r?.palette?.find((x) => x !== l.hex) ?? fromHsl((hh + 40) % 360, Math.max(ss, 0.4), Math.min(Math.max(ll, 0.35), 0.6));
  return { kinds: [THEME_KINDS[h % THEME_KINDS.length], THEME_KINDS[(h >>> 5) % THEME_KINDS.length]].filter((x, i, a) => a.indexOf(x) === i), mood: MOODS[(h >>> 9) % MOODS.length],
    story: `${l.name}, by ${club?.name ?? 'the house'}: cut for ${MOODS[(h >>> 9) % MOODS.length].toLowerCase()}.`, colours: [l.hex, second], by: club?.founderId ?? null, seeded: true, source: 'designer' };
};
let renamed = 0, givenRenders = 0, specced = 0;
const specsOf = (l, store) => {
  const text = [l.name, l.colour, ...(l.garments ?? [])].join(' ');
  const pool = poolById.get(l.poolId); const club = clubById.get(store?.clubId ?? pool?.clubId);
  const r = l.views?.FRONT ? renderOf(l.views.FRONT) : undefined;
  const prev = l.specs ?? {};
  return {
    colour: { name: l.colour, hex: l.hex, family: hexFamily(l.hex), palette: r?.palette ?? [l.hex], measured: r?.measured ?? null, share: r?.share ?? null,
      source: r ? 'render' : 'swatch', designer: prev.colour?.designer ?? null },
    // Thematic kinds come from the designers over time; until then the field exists and says so.
    theme: prev.theme?.kinds?.length && !prev.theme?.seeded ? { ...prev.theme, source: 'designer' } : seededTheme(l, club, r),
    category: match(CATEGORY, text, 'dress'), silhouette: match(SILHOUETTE, text, 'Fitted'),
    fabric: [...new Set(FABRIC.filter(([re]) => re.test(text)).map(([, f]) => f))].concat(FABRIC.some(([re]) => re.test(text)) ? [] : ['silk']),
    finish: l.opaque ? 'sheer and opaque' : 'as rendered', garments: l.garments ?? [],
    sizes: ['XS', 'S', 'M', 'L', 'XL'], fits: ['avatar', 'street'], fit: 'True to size',
    season: pool?.season ?? null, collection: pool?.name ?? null,
    renders: { angles: Object.keys(l.views ?? {}), opaque: !!l.opaque, front: l.views?.FRONT ?? null, from: r?.from ?? null },
    provenance: { storeId: l.storeId ?? store?.id ?? null, clubId: club?.id ?? null, poolId: l.poolId ?? null, worldId: club?.worldIds?.[0] ?? null, designerId: club?.founderId ?? null, mintDate: l.mintDate ?? null },
    supply: { edition: l.edition, minted: l.minted, owners: l.owners },
    utility: [`Front row at ${club?.name ?? 'the house'} shows`, 'Swap into any pool, the pool settles the difference', 'Wear it in every world as an avatar look'],
    tags: [l.rarity, pool?.season, club?.ticker].filter(Boolean),
    physical: { available: l.rarity === 'Legendary' || l.rarity === 'Epic', made: 'to order' },
    ...couture(l, text, club),
    price: { list: l.usd, floor: l.floor, lastSale: l.lastSale ?? null, change7d: l.change7d, currency: 'USD', royaltyPct: { Common: 5, Rare: 6, Epic: 7.5, Legendary: 10 }[l.rarity] ?? 5 },
  };
};
const applyRender = (l, r) => {
  l.views = r.views; if (r.opaque) l.opaque = r.opaque; else delete l.opaque;
  if (!l.specs?.colour?.designer) l.specs = { ...(l.specs ?? {}), colour: { ...(l.specs?.colour ?? {}), designer: { name: l.colour, hex: l.hex } } };
  l.hex = r.hex;
  const first = l.name.split(' ')[0] ?? ''; const word = NAMES[first] ?? ({ Red: '#c0182c', Blue: '#2f6fd0', Green: '#2e9a55', Pink: '#e0569a', Purple: '#7a4cc2', Orange: '#e87a2c', Yellow: '#e3b21c', Black: '#24211f', White: '#efe9df', Brown: '#7a5134' })[first];
  if (word && dist(word, r.hex) > FAR) { l.name = r.name + l.name.slice(first.length); renamed++; }
  const cw = NAMES[(l.colour ?? '').split(' ')[0]];
  if (!cw || dist(cw, r.hex) > FAR) l.colour = l.name.split(' ')[0] in NAMES && dist(NAMES[l.name.split(' ')[0]], r.hex) <= FAR ? l.name.split(' ')[0] : r.name;
};
// The closest renders to a colour; one of the near-best is picked per look so a store does not repeat one dress.
const nearestRender = (hex, seed) => { const ranked = RENDERS.map((r) => [dist(hex, r.hex), r]).sort((a, b) => a[0] - b[0]);
  const near = ranked.filter(([d]) => d <= ranked[0][0] * 1.3 + 0.01); return near[hash(seed) % near.length][1]; };
// Flagship: renders are its own; keep the designer's colour names, take the measured hex.
for (const l of ls.looks) { const r = l.views?.FRONT && renderOf(l.views.FRONT); if (r) { if (!l.specs?.colour?.designer) l.specs = { colour: { designer: { name: l.colour, hex: l.hex } } }; l.hex = r.hex; } l.specs = specsOf(l, { id: ls.store.id, clubId: 'c_opal' }); specced++; }
for (const s of storesDoc.stores) for (const l of s.looks) {
  let r = l.views?.FRONT ? renderOf(l.views.FRONT) : undefined;
  // A look whose render is a borrowed one (generated houses), or none yet, takes the render closest to its own colour.
  // The look's intended colour: the colour word in its name, else its colour field, else its hex. Kept as `designer`.
  const word = l.name.split(' ')[0]; const cword = (l.colour ?? '').split(' ')[0];
  if (!l.specs?.colour?.designer) l.specs = { colour: { designer: NAMES[word] ? { name: word, hex: NAMES[word] } : { name: l.colour, hex: NAMES[cword] ?? l.hex } } };
  const own = l.specs.colour.designer.hex;
  if (!r || (r.from && dist(own, r.hex) > FAR)) { const want = own;
    const near = nearestRender(want, l.id);
    // No render close enough (black, white, purple, brown…): the look stays a colour swatch until its own render exists.
    if (dist(want, near.hex) <= FAR * 1.5) { r = near; givenRenders++; } else { r = undefined; l.views = {}; delete l.opaque; if (l.specs?.colour?.designer) { l.hex = l.specs.colour.designer.hex; l.colour = l.specs.colour.designer.name; } } }
  if (r) applyRender(l, r);
  l.specs = specsOf(l, s); specced++;
}

// Show looks: link each to a store look of the show's club (same title first) and take its render colour.
const storeLooksOf = (clubId) => (storesDoc.stores.find((s) => s.clubId === clubId)?.looks ?? []).filter((l) => l.views?.FRONT);
const anyRendered = storesDoc.stores.flatMap((s) => s.looks).filter((l) => l.views?.FRONT);
for (const sh of shows.shows) { const own = storeLooksOf(sh.clubId); const pool = own.length ? own : anyRendered;
  sh.looks.forEach((lk, i) => { const hit = own.find((l) => l.name.toLowerCase() === String(lk.title).toLowerCase()) ?? pool[(i + hash(sh.id)) % pool.length];
    // The runway look takes the PFT's name too, so the title, the dress and the background all agree.
    if (hit) { if (lk.pieces?.[0] === lk.title) lk.pieces[0] = hit.name; lk.title = hit.name; lk.lookId = hit.id; lk.hex = hit.hex; } }); }

for (const sh of shows.shows) for (const lk of sh.looks) if (lk.lookId) add(lk.lookId, 'showIds', sh.id);
for (const l of [...ls.looks, ...storesDoc.stores.flatMap((x) => x.looks)]) { const a = appears.get(l.id); l.specs.appearsIn = a ? { castIds: [...a.castIds], showIds: [...a.showIds], seriesIds: [...a.seriesIds], episodes: a.episodes } : { castIds: [], showIds: [], seriesIds: [], episodes: 0 }; }

// Activity: every look has a ledger; looks without one get mint → list → sales up to their minted count (max 3).
let added = 0; const users = core.users.map((u) => u.id);
const allLooks = [...ls.looks.map((l) => ({ ...l, storeId: ls.store.id })), ...storesDoc.stores.flatMap((s) => s.looks)];
sales.sales = sales.sales.filter((x) => !String(x.id).startsWith('ia_'));
const has = new Set(sales.sales.map((x) => x.itemId));
for (const l of allLooks) { if (has.has(l.id)) continue;
  const h = hash(l.id); const t0 = Date.parse(l.mintDate ?? '2026-08-01') + (h % 20) * 864e5; const creator = l.specs?.provenance?.designerId ?? users[h % users.length];
  const ev = (k, event, extra) => { sales.sales.push({ id: `ia_${l.id}_${k}`, event, itemKind: 'look', itemId: l.id, ...extra }); added++; };
  ev(0, 'mint', { toId: creator, priceUsd: 0, at: new Date(t0).toISOString() });
  ev(1, 'list', { fromId: creator, priceUsd: l.usd, at: new Date(t0 + 864e5).toISOString() });
  for (let k = 0; k < Math.min(3, l.minted ?? 0); k++) ev(2 + k, 'sale', { fromId: creator, toId: users[(h + k * 7) % users.length], priceUsd: Math.round(l.floor * (0.95 + ((h >>> k) % 10) / 100)), at: new Date(t0 + (k + 2) * 2 * 864e5).toISOString() });
}

write('ls.json', ls); write('stores.json', storesDoc); write('shows.json', shows); write('sales.json', sales);
console.log(`items: ${RENDERS.length} renders (${[...new Set(RENDERS.map((r) => r.family))].join(', ')}) · ${specced} looks with specs · ${givenRenders} looks given the closest render · ${renamed} names recoloured to their render · +${added} ledger events`);
