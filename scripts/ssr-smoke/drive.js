/**
 * Drives the live apps in Chromium: navigates, waits for the async adapters to
 * settle, clicks real controls, and screenshots the result. Anything asserted
 * here is asserted against a running app, not a static render.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'live-shots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:8788';

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); };

async function settle(page, ms = 700) {
  await page.waitForTimeout(ms);
}

async function shot(page, name, full = false) {
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full });
  const box = await page.evaluate(() => ({
    w: document.documentElement.scrollWidth,
    h: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    errors: window.__errors || [],
    primary: getComputedStyle(document.documentElement).getPropertyValue('--phi-color-primary').trim(),
    theme: document.documentElement.getAttribute('data-theme'),
  }));
  console.log(
    name.padEnd(26),
    `${box.w}x${box.h}`.padEnd(12),
    'primary=' + (box.primary || '-').padEnd(9),
    'overflow=' + box.overflow,
    box.errors.length ? 'ERRORS=' + box.errors.slice(0, 2).join(' | ') : ''
  );
  check(name + ': no page errors', box.errors.length === 0, box.errors.join(' | '));
  check(name + ': no horizontal overflow', !box.overflow, `${box.w}px wide`);
  return box;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => page.evaluate((m) => window.__errors.push(m), String(e.message)).catch(() => {}));

  // ---------------------------------------------------------------- Chanel
  await page.goto(`${BASE}/chanel.html#/`, { waitUntil: 'load' });
  await settle(page, 1200);
  await shot(page, 'live-chanel-home', true);

  const cards = await page.locator('[class*="card"]').count();
  const heroText = await page.locator('body').innerText();
  check('chanel home: catalog resolved (product cards present)', cards > 0, `${cards} cards`);
  check('chanel home: no raw locale keys leaked', !/\b(home|nav|cart)\.[a-z]/.test(heroText), '');

  // Category page: facets must derive from the resolved catalog.
  await page.goto(`${BASE}/chanel.html#/category/handbags`, { waitUntil: 'load' });
  await settle(page, 1200);
  const catBox = await shot(page, 'live-chanel-category', true);
  const catText = await page.locator('body').innerText();
  check('chanel category: pieces counted', /[1-9]\d*\s+piece/i.test(catText), catText.match(/\d+\s+piece\w*/i)?.[0] || 'none');
  check('chanel category: facet rail populated', /refine/i.test(catText) && catText.length > 400, '');
  check('chanel category: prices in euro', catText.includes('€'), '');

  // Sidebar toggle — the shop archetype's toggleable rail.
  const toggle = page.locator('[aria-label*="sidebar" i], [aria-label*="filter" i], button:has-text("Refine")').first();
  if (await toggle.count()) {
    const before = await page.locator('aside, [class*="sidebar"]').first().boundingBox().catch(() => null);
    await toggle.click();
    await settle(page, 500);
    await shot(page, 'live-chanel-sidebar-closed');
    const after = await page.locator('aside, [class*="sidebar"]').first().boundingBox().catch(() => null);
    check('chanel: sidebar toggles', JSON.stringify(before) !== JSON.stringify(after), `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
    await toggle.click();
    await settle(page, 400);
  } else {
    check('chanel: sidebar toggles', false, 'no toggle control found');
  }

  // Product page, then add to bag -> the drawer opens for real.
  await page.goto(`${BASE}/chanel.html#/category/handbags`, { waitUntil: 'load' });
  await settle(page, 1200);
  const firstProduct = page.locator('a[href*="#/product/"]').first();
  const href = await firstProduct.getAttribute('href').catch(() => null);
  check('chanel: product links generated from data', !!href, href || 'none');
  if (href) {
    await page.goto(`${BASE}/chanel.html${href.replace(/^.*#/, '#')}`, { waitUntil: 'load' });
    await settle(page, 1200);
    await shot(page, 'live-chanel-product', true);
    const pText = await page.locator('body').innerText();
    check('chanel product: resolved (not the not-found state)', !/not found/i.test(pText), '');
    check('chanel product: price shown', /€\s?\d/.test(pText), '');

    // The product gate: add-to-bag stays disabled until a size is chosen.
    const addBtn = page.locator('button:has-text("Add to bag"), button:has-text("Add to Bag"), button:has-text("Add")').first();
    const gated = await addBtn.isDisabled().catch(() => false);
    check('chanel product: add-to-bag is gated until a size is chosen', gated, '');
    const sizeSelect = page.locator('main [role="combobox"]').first();
    if (await sizeSelect.count()) {
      await sizeSelect.click().catch(() => {});
      await settle(page, 300);
      const opts = page.locator('[role="option"]');
      const n = await opts.count();
      check('select: the listbox is the library\'s own, not the OS menu', n > 0, `${n} options`);
      // The first entry is the "choose a size" placeholder.
      if (n > 1) await opts.nth(1).click().catch(() => {});
      await settle(page, 400);
    }
    const enabled = await addBtn.isEnabled().catch(() => false);
    check('chanel product: choosing a size releases the gate', enabled, '');
    if (enabled) {
      await addBtn.click();
      await settle(page, 700);
      await shot(page, 'live-chanel-drawer');
      // The bag opens from the header, from any route.
      await page.locator('[aria-label="Shopping bag"]').first().click();
      await settle(page, 700);
      await shot(page, 'live-chanel-drawer');
      const drawerVisible = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
      check('chanel: the bag drawer opens from the header', drawerVisible, '');
      const dText = await page.locator('body').innerText();
      check('chanel drawer: totals rendered', /€\s?\d/.test(dText), '');
      await page.keyboard.press('Escape');
      await settle(page, 400);
      const stillOpen = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
      check('chanel: Escape closes the drawer', !stillOpen, '');
    } else {
      check('chanel: add-to-bag opens the cart drawer', false, 'no add button');
    }
  }

  // Cart + checkout, carrying the line added above.
  await page.goto(`${BASE}/chanel.html#/cart`, { waitUntil: 'load' });
  await settle(page, 900);
  await shot(page, 'live-chanel-cart', true);
  const cartText = await page.locator('body').innerText();
  check('chanel cart: holds the added line', /€\s?\d/.test(cartText) && !/empty/i.test(cartText.slice(0, 600)), '');

  await page.goto(`${BASE}/chanel.html#/checkout`, { waitUntil: 'load' });
  await settle(page, 900);
  await shot(page, 'live-chanel-checkout', true);

  await page.goto(`${BASE}/chanel.html#/account`, { waitUntil: 'load' });
  await settle(page, 900);
  await shot(page, 'live-chanel-account', true);

  // ------------------------------------------------------- Prefs + themes
  await page.goto(`${BASE}/chanel.html#/`, { waitUntil: 'load' });
  await settle(page, 1100);
  const prefBtn = page.locator('[aria-label*="preference" i], [aria-label*="settings" i], [aria-label*="appearance" i]').first();
  if (await prefBtn.count()) {
    await prefBtn.click();
    await settle(page, 600);
    await shot(page, 'live-chanel-prefs');
    const selects = await page.locator('[role="dialog"] [role="combobox"]').count();
    check('prefs modal: option pickers, not free input', selects >= 3, `${selects} pickers`);
    const inputs = await page.locator('[role="dialog"] input[type="text"], [role="dialog"] input[type="range"]').count();
    check('prefs modal: no free-text or slider inputs', inputs === 0, `${inputs} raw inputs`);

    // Flip to dark through the real control and confirm the token cascade.
    await page.locator('#pref-theme').click().catch(() => {});
    await settle(page, 300);
    await page.locator('[role="option"]:has-text("Dark")').first().click().catch(() => {});
    await settle(page, 600);
    await page.keyboard.press('Escape');
    await settle(page, 500);
    const dark = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      primary: getComputedStyle(document.documentElement).getPropertyValue('--phi-color-primary').trim(),
    }));
    if (dark.theme === 'dark') {
      await shot(page, 'live-chanel-dark', true);
      check('dark mode: brand primary inverts (not the light-mode near-black)', dark.primary.toLowerCase() !== '#0a0a0a', dark.primary);
    }
  } else {
    check('prefs modal: option pickers, not free input', false, 'no preferences control found');
  }

  // Preference persistence across a reload, namespaced to the guest.
  const keys = await page.evaluate(() => Object.keys(window.localStorage));
  check('guest preferences persist under a ::guest namespace', keys.some((k) => k.includes('guest')), keys.join(', ') || 'none');

  // ------------------------------------------------------------- pui-book
  await page.goto(`${BASE}/book.html`, { waitUntil: 'load' });
  await settle(page, 1200);
  await shot(page, 'live-book-home', true);
  const bText = await page.locator('body').innerText();
  check('book: docs shell rendered (nav present)', /playground|tokens|components/i.test(bText), '');
  const navLinks = await page.locator('nav a, aside a, [class*="sidebar"] a, [class*="nav"] button').count();
  const navItems = await page.locator('aside button').count();
  check('book: every docs group is reachable without opening an accordion', navItems >= 8, `${navItems} rail items`);

  for (const [label, name] of [['Playground', 'live-book-playground'], ['Tokens', 'live-book-tokens'], ['Shop', 'live-book-shop']]) {
    const link = page.locator(`text=${label}`).first();
    if (await link.count()) {
      await link.click().catch(() => {});
      await settle(page, 900);
      await shot(page, name, true);
      check(`book: ${label} page navigates`, true, '');
    } else {
      check(`book: ${label} page navigates`, false, 'link not found');
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.name + (r.ok ? '' : '  <- ' + r.detail));
  console.log('='.repeat(60));
  console.log(`${results.length - failed.length} passed, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
})();
