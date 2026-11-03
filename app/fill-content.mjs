// Fill the data-driven apps' content from content/<key>.json banks: hero art, 12 dated news stories, 8 FAQs, fuller
// grids with art on every card, and a home feed (at a glance, explore and latest, linked to the menus and news). Art is shared from phiegg's public
// folder as "phiegg:worlds/..." refs, so nothing is copied. Idempotent: everything added carries gen:true and is
// stripped and rebuilt on each run. Usage: cd puikit/app && node fill-content.mjs [keys...]
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const W = path.join(here, 'phiegg/public/worlds');
const ART = [
  ...fs.readdirSync(W).filter((f) => f.endsWith('.png')).sort().map((f) => 'phiegg:worlds/' + f),
  ...fs.readdirSync(path.join(W, 'gen')).filter((f) => /\.(webp|png|jpg)$/.test(f)).sort().map((f) => 'phiegg:worlds/gen/' + f),
];
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const art = (seed) => ART[hash(seed) % ART.length];
const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const day = (i) => fmt(new Date(Date.UTC(2026, 9, 12) - i * 4 * 864e5));
const strip = (arr) => (arr || []).filter((x) => !x.gen);
const SKIP_ART = new Set(['docs', 'api', 'cli', 'terminal']);

const KEYS = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(here, 'content')).filter((f) => !f.startsWith('_')).map((f) => f.replace(/\.json$/, ''));
// Pulls every app shares: Phiegg's pools, quests and events (content/_shared.json).
const SHARED = JSON.parse(fs.readFileSync(path.join(here, 'content', '_shared.json'), 'utf8'));
// The raising and funding forms (content/_forms.json): one page each, under Founders and Backers.
const FORMS = JSON.parse(fs.readFileSync(path.join(here, 'content', '_forms.json'), 'utf8'));

for (const key of KEYS) {
  const file = path.join(here, key, 'public/data', key + '.json');
  const bank = JSON.parse(fs.readFileSync(path.join(here, 'content', key + '.json'), 'utf8'));
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const views = d.views;
  for (const [id, v] of Object.entries(views)) if (v.gen) delete views[id];
  d.nav = strip(d.nav); for (const n of d.nav) if (n.items) n.items = strip(n.items);
  for (const v of Object.values(views)) { v.blocks = strip(v.blocks); for (const b of v.blocks) if (b.items) b.items = strip(b.items); }
  // An app without a news page gets one, filed under the section that holds its FAQ (or the last section).
  if (!views.news) {
    views.news = { title: 'News', sub: 'Latest from ' + key[0].toUpperCase() + key.slice(1) + '.', gen: true, blocks: [{ kind: 'news', items: [] }] };
    const group = d.nav.find((n) => n.items?.some((i) => i.id === 'faq')) || [...d.nav].reverse().find((n) => n.items);
    if (group) group.items.unshift({ id: 'news', label: 'News', icon: 'chat', gen: true });
  }

  // News: originals first, then bank stories up to twelve; every story dated and illustrated.
  let stories = [];
  const newsBlock = views.news?.blocks.find((b) => b.kind === 'news');
  const have = new Set((newsBlock?.items || []).map((n) => n.title));
  const extra = bank.news.filter(([, t]) => !have.has(t)).map(([tag, title, body]) => ({ tag, title, body, gen: true }));
  if (newsBlock) {
    newsBlock.items = [...newsBlock.items, ...extra].slice(0, Math.max(12, newsBlock.items.length));
    let g = 0;
    newsBlock.items.forEach((n) => { if (n.gen) n.date = day(g++); if (!n.image) { n.image = art(key + n.title); if (!n.gen) n.genImage = true; } });
    newsBlock.items.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    stories = newsBlock.items;
  } else {
    stories = extra.slice(0, 12).map((n, i) => ({ ...n, date: day(i), image: art(key + n.title) }));
  }

  // FAQ up to eight.
  const faq = Object.values(views).flatMap((v) => v.blocks).find((b) => b.kind === 'faq');
  if (faq) { const q = new Set(faq.items.map((x) => x.q)); faq.items.push(...bank.faq.filter((x) => !q.has(x.q)).slice(0, Math.max(0, 8 - faq.items.length)).map((x) => ({ ...x, gen: true }))); }

  // Grids: thin ones grow from the bank (once), every card outside the docs gets art.
  const cards = [...(bank.cards || [])];
  for (const [id, v] of Object.entries(views)) {
    if (id === 'home') continue;
    for (const b of v.blocks.filter((x) => x.kind === 'grid' && !x.pull && !x.from)) {
      const proto = b.items[0] || {};
      if (!SKIP_ART.has(id) && b.items.length < 6 && cards.length) {
        const titles = new Set(b.items.map((x) => x.title));
        while (b.items.length < 8 && cards.length) {
          const c = cards.shift();
          if (titles.has(c.title)) continue;
          b.items.push({ ...c, ...(proto.action ? { action: proto.action, done: proto.done } : {}), gen: true });
        }
      }
      if (!SKIP_ART.has(id)) for (const it of b.items) if (!it.image) { it.image = art(key + id + it.title); if (!it.gen) it.genImage = true; }
    }
  }

  // Home feed: hero art, then at a glance, explore every section, and the latest stories.
  const home = views.home;
  const hero = home.blocks.find((b) => b.kind === 'hero');
  if (hero && !hero.image) { hero.image = art(key + 'hero'); hero.genImage = true; }
  // Live pulls (phi-kit/pulls.ts): menu entries fold out their top records, home sections and counts read Phiora.
  const c = bank.pulls ?? {};
  const artFor = (seed) => Array.from({ length: 12 }, (_, i) => art(key + seed + i));
  // art for records without their own picture (a pool with no world, a project)
  const withArt = (pl) => ({ ...pl, art: artFor(pl.kind) });
  if (c.portfolio) {
    views.portfolio = { title: 'Portfolio', sub: 'Every pool we back and the clubs they fund, live from Phiora.', gen: true, blocks: [
      { kind: 'stats', title: '', items: [['Pools', 'pool'], ['Clubs', 'club'], ['Worlds', 'world'], ['Quests', 'quest']].map(([label, kind]) => ({ label, value: '', sub: 'Live from Phiora', count: { kind } })) },
      { kind: 'grid', title: 'Pools', pull: withArt({ ...SHARED.pool, n: 24 }) },
      { kind: 'grid', title: 'Clubs they fund', pull: { ...SHARED.club, n: 12, art: artFor('club') } },
    ] };
    const hasPortfolio = d.nav.some((n) => n.items?.some((i) => i.id === 'portfolio'));
    const group = d.nav.find((n) => n.items?.some((i) => c.menu?.[i.id])) ?? d.nav.find((n) => n.items);
    if (group && !hasPortfolio) group.items.unshift({ id: 'portfolio', label: 'Portfolio', icon: 'layers', gen: true });
  }
  const leafWalk = (list) => list.forEach((n) => { if (n.items?.length) leafWalk(n.items); else if (c.menu?.[n.id]) n.pull = withArt({ n: 5, ...c.menu[n.id] }); });
  leafWalk(d.nav);
  if (c.counts) home.blocks.push({ kind: 'stats', title: 'At a glance', gen: true, items: c.counts.map(([label, kind]) => ({ label, value: '', sub: 'Live from Phiora', count: { kind } })) });
  else home.blocks.push({ kind: 'stats', title: 'At a glance', items: bank.stats, gen: true });
  for (const h of [...(c.home ?? []), ...SHARED.home]) home.blocks.push({ kind: h.kind ?? 'grid', title: h.title, sub: h.sub, pull: withArt(h.pull), gen: true });

  // Explore and Latest link to the menus and the news page instead of copying them (phi-kit/links.ts resolves
  // them), so renaming a menu entry or editing a story in Phiora shows here too. Each menu entry carries its art.
  const walk = (list) => list.forEach((n) => { if (n.items?.length) walk(n.items); else if (n.id !== 'home' && !n.image) n.image = art(key + 'nav' + n.id); });
  walk(d.nav);
  home.blocks.push(
    { kind: 'grid', title: 'Explore', from: 'menus', gen: true },
    { kind: 'news', title: 'Latest', from: 'page', page: 'news', limit: 4, gen: true },
  );
  // Raising and funding: every form is a page of its own (the shared stepper), grouped for founders and backers.
  const formset = c.forms === true ? FORMS : (c.forms && typeof c.forms === 'object' ? c.forms : null);
  if (formset) {
    for (const g of d.nav) if (g.items) g.items = g.items.filter((i) => !formset.forms[i.id]); // the forms live in their groups now
    const at = Math.max(1, d.nav.findIndex((n) => n.id === 'learn'));
    const groups = Object.entries(formset.groups).map(([id, g]) => ({ id, label: g.label, icon: g.icon, gen: true,
      items: Object.entries(formset.forms).filter(([, f]) => f.nav === id).map(([fid, f]) => ({ id: fid, label: f.label, icon: f.icon, gen: true })) }));
    d.nav.splice(at, 0, ...groups);
    for (const [fid, f] of Object.entries(formset.forms)) views[fid] = { title: f.title, sub: f.sub, gen: true, blocks: [{ kind: 'form', ...f.form, heading: undefined }] };
  }
  // Pools offer "Back this pool" where the app takes stakes.
  if (c.poolAct) for (const v of Object.values(views)) for (const b of v.blocks) if (b.pull?.kind === 'pool') b.pull = { ...b.pull, act: c.poolAct };
  const navPools = (list) => list.forEach((n) => { if (n.items) navPools(n.items); else if (c.poolAct && n.pull?.kind === 'pool') n.pull = { ...n.pull, act: c.poolAct }; });
  navPools(d.nav);
  // Every app's You page: one Phione identity and what you made in this app, live (phi-kit Profile).
  if (c.profile) d.profile = c.profile; else if (c.forms === true) d.profile = SHARED.profile;
  // Every pulled grid shows art, for records without a picture of their own.
  for (const [id, v] of Object.entries(views)) for (const b of v.blocks) if (b.pull && b.kind === 'grid' && !b.pull.art) b.pull = withArt(b.pull);
  fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
  const all = JSON.stringify(d);
  console.log(key.padEnd(7), 'home', home.blocks.length, 'news', stories.length, 'faq', faq?.items.length ?? 0, 'images', (all.match(/"image":/g) || []).length);
}
