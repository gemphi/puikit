import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhiora } from '../src/server.mjs';
import { appRows, composeApp } from '../src/apps.mjs';
import { md5, normalizeSources } from '../src/tree.mjs';

const ORIGIN = 'http://localhost:3101';
const DEMO = {
  app: 'demo',
  nav: [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'learn', label: 'Learn', icon: 'compass', items: [{ id: 'news', label: 'News', icon: 'chat' }, { id: 'faq', label: 'FAQ', icon: 'vote' }] }],
  views: {
    home: { title: '', sub: '', blocks: [{ kind: 'hero', heading: 'Demo', image: 'phiegg:worlds/w_aria.png' }, { kind: 'grid', title: 'Explore', items: [{ title: 'News', href: '#/news' }] }] },
    news: { title: 'News', sub: 'Latest.', blocks: [{ kind: 'news', items: [{ date: 'Oct 1, 2026', tag: 'Hi', title: 'First story', body: 'Hello.' }] }] },
    faq: { title: 'FAQ', sub: '', blocks: [{ kind: 'faq', items: [{ q: 'Why?', a: 'Because.' }] }] },
  },
};

test('an app document round-trips through the four kinds', () => {
  const rows = appRows('demo', DEMO);
  assert.deepEqual(Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.length])), { app: 1, menu: 4, page: 3, block: 4 });
  const { sources } = normalizeSources(Object.entries(rows).map(([kind, r]) => ({ kind, rows: r })));
  const by = Object.fromEntries(sources.map((s) => [s.kind, s.rows]));
  assert.equal(by.app[0].id, md5('app:app:demo'));
  assert.equal(by.menu.find((m) => m.key === 'news').parentId, by.menu.find((m) => m.key === 'learn').id); // sub-menus link their group
  assert.equal(by.block[0].pageId, by.page.find((p) => p.key === 'home').id);
  assert.equal(by.menu.find((m) => m.key === 'faq').pageId, by.page.find((p) => p.key === 'faq').id); // a menu entry links the page it opens
  assert.equal(by.menu.find((m) => m.key === 'learn').pageId, undefined); // a group opens none
  assert.ok(by.page.every((p) => /^demo_/.test(p.slug)));
  assert.deepEqual(JSON.parse(JSON.stringify(composeApp(by, 'demo'))), DEMO);
  assert.equal(composeApp(by, 'nope'), null);
});

test('GET /app/<key> is composed from the records, and an edit to a menu shows on the next load', async () => {
  const root = mkdtempSync(join(tmpdir(), 'phiora-apps-'));
  const shop = join(root, 'shop'); mkdirSync(shop);
  writeFileSync(join(shop, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale', handle: 'noor.hale' }] }));
  const items = join(root, 'items'); mkdirSync(items);
  writeFileSync(join(items, 'tree.json'), JSON.stringify({ sources: [{ kind: 'person', file: 'core', list: 'users' }] }));
  writeFileSync(join(items, 'core.json'), JSON.stringify({ users: [{ id: 'u_noor', name: 'Noor Hale' }] }));
  mkdirSync(join(root, 'demo', 'public', 'data'), { recursive: true });
  writeFileSync(join(root, 'demo', 'public', 'data', 'demo.json'), JSON.stringify(DEMO));
  // an app that bundles its menus keeps them in src/data/<key>.json; a menu-only document has no pages
  mkdirSync(join(root, 'bundled', 'src', 'data'), { recursive: true });
  writeFileSync(join(root, 'bundled', 'src', 'data', 'bundled.json'), JSON.stringify({ app: 'bundled', nav: [{ id: 'home', label: 'Home', icon: 'Home', slot: 'top', title: 'Home', items: [{ id: 'top', label: 'Top', position: 'top', items: [{ id: 'welcome', label: 'Welcome', tab: 'welcome', icon: 'Sparkles' }] }] }], views: {} }));
  const phiora = createPhiora({ env: { PHI_QUIET: '1', PHI_STORE: 'json', PHI_EDITORS: '*' }, dataDir: join(root, 'data'), shopDataDir: shop, appsDir: root, itemsDir: items });
  await new Promise((ok) => phiora.server.listen(0, ok)); const base = 'http://localhost:' + phiora.server.address().port;
  let cookie = '';
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : undefined };
  };
  try {
    const tree = await call('GET', '/tree?kind=app,menu,page,block');
    assert.deepEqual(tree.body.sources.map((s) => [s.kind, s.rows.length]), [['app', 2], ['menu', 7], ['page', 3], ['block', 4]]);
    assert.equal((await call('GET', '/app/bundled')).body.nav[0].items[0].items[0].tab, 'welcome');
    assert.deepEqual((await call('GET', '/app/demo')).body, DEMO);
    assert.deepEqual((await call('GET', '/app')).body.apps.map((a) => a.key), ['bundled', 'demo']);
    assert.equal((await call('GET', '/app/nope')).status, 404);

    await call('GET', '/me'); await call('POST', '/auth/demo', { userId: 'u_noor' });
    const news = tree.body.sources.find((s) => s.kind === 'menu').rows.find((m) => m.key === 'news');
    assert.equal((await call('PATCH', `/tree/item/menu/${news.id}`, { set: { label: 'Stories' } })).status, 200);
    const after = (await call('GET', '/app/demo')).body;
    assert.equal(after.nav[1].items[0].label, 'Stories');
    // a new block on a page joins it in order
    const faq = tree.body.sources.find((s) => s.kind === 'page').rows.find((p) => p.key === 'faq');
    assert.equal((await call('POST', '/tree/item', { kind: 'block', fields: { name: 'Demo FAQ more', pageId: faq.id, order: 1, type: 'prose', lead: 'More answers soon.' } })).status, 201);
    const blocks = (await call('GET', '/app/demo')).body.views.faq.blocks;
    assert.deepEqual(blocks.map((b) => b.kind), ['faq', 'prose']);
    // what you make carries ownerId, and /tree/mine finds it (the profile's raising and funding)
    const made = await call('POST', '/tree/item', { kind: 'phisumPledge', fields: { name: 'Pledge · Demo round', amount: 250, coin: 'SUM', status: 'pledged' } });
    assert.equal(made.status, 201); assert.ok(made.body.item.ownerId);
    const mine = (await call('GET', '/tree/mine?kinds=phisumPledge,phisumFunding')).body;
    assert.deepEqual(mine.kinds.phisumPledge.map((r) => r.amount), [250]); assert.deepEqual(mine.kinds.phisumFunding, []);
  } finally { phiora.server.close(); rmSync(root, { recursive: true, force: true }); }
});
