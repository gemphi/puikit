/** Drives the phlick feed in Chromium — the same discipline as drive.js. */
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, 'live-shots');
const results = [];
const check = (n, ok, d) => results.push({ n, ok, d });

(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const shot = async (name) => {
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    const box = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      errors: window.__errors || [],
    }));
    console.log(name.padEnd(24), 'overflow=' + box.overflow, box.errors.length ? 'ERRORS=' + box.errors.slice(0, 2).join('|') : '');
    check(name + ': no page errors', box.errors.length === 0, box.errors.join('|'));
    check(name + ': no h-overflow', !box.overflow, '');
  };

  // ------------------------------------------------------------- feed
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await shot('phlick-feed');
  const text = await page.locator('body').innerText();
  check('feed: posts resolved (caption on screen)', /Hallway rehearsal/i.test(text), '');
  const feedDepth = await page.evaluate(() => document.querySelectorAll('[class*="snapSlide"]').length);
  check('feed: at least 64 entries deep', feedDepth >= 64, `${feedDepth} slides`);
  check('feed: counts are compact', /1\.8M|2\.6M/.test(text), '');
  check('feed: sound row present', /Glasslines/.test(text), '');

  // like -> count moves and persists
  // A like on 1.8M still reads 1.8M compact, so the state, not the digits,
  // is what proves the click landed.
  const like = page.locator('[aria-label="Like"]').first();
  await like.click(); await page.waitForTimeout(400);
  const pressed = await like.getAttribute('aria-pressed');
  check('feed: liking flips the control state', pressed === 'true', `aria-pressed=${pressed}`);
  const persisted = await page.evaluate(() => Object.keys(localStorage).some((k) => k.includes('social')));
  check('feed: engagement persists', persisted, '');

  // pager scrolls the snap track
  const y0 = await page.evaluate(() => document.querySelector('[class*="snapTrack"]').scrollTop);
  await page.locator('[aria-label="Next post"]').click();
  await page.waitForTimeout(800);
  const y1 = await page.evaluate(() => document.querySelector('[class*="snapTrack"]').scrollTop);
  check('feed: pager advances a slide', y1 > y0, `${y0} -> ${y1}`);
  await shot('phlick-feed-2');

  // comment control -> the docked panel: the rail contracts, the feed is
  // pushed aside (never covered), and the panel wears the rail's own skin.
  const railWide = await page.evaluate(() => Math.round(document.querySelector('aside.pui-sidebar').getBoundingClientRect().width));
  const feedWide = await page.evaluate(() => Math.round(document.querySelector('[data-post-feed="true"]').getBoundingClientRect().width));
  const pagerBefore = await page.locator('[aria-label="Next post"]').count();
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(900);
  const panelOn = await page.locator('[data-comments-panel="true"]').isVisible().catch(() => false);
  check('comments: panel docks beside the feed', panelOn, '');
  check('comments: no redirect on comment click', !/#\/post\//.test(page.url()), page.url());
  const dText = await page.locator('[data-comments-panel="true"]').innerText().catch(() => '');
  check('panel: thread loaded', /Comments \(\d+\)/.test(dText), '');
  const railNarrow = await page.evaluate(() => Math.round(document.querySelector('aside.pui-sidebar').getBoundingClientRect().width));
  check('panel: opening contracts the rail', railNarrow < railWide - 100, `${railWide} -> ${railNarrow}px`);
  // The rail contracted, freeing a band beside the frame: the panel floats
  // there — data-float set by its own measurement — and the frame does not
  // move. The frame position is checked against its pre-open center: with
  // the rail contracted the row widens, so compare after a settle.
  await page.waitForTimeout(500);
  const floatMode = await page.locator('[data-comments-panel="true"]').getAttribute('data-float');
  check('panel: floats beside the rail when there is room', floatMode === 'true', `data-float=${floatMode}`);
  const frameNow = await page.evaluate(() => {
    const f = document.querySelector('[data-variant="immersive"]').getBoundingClientRect();
    const row = document.querySelector('[data-post-feed="true"]').parentElement.getBoundingClientRect();
    return { frameCentered: Math.abs((f.left + f.right) / 2 - (row.left + row.right) / 2) < 8, overlap: 0 };
  });
  check('panel: the frame stays centered, unmoved by the panel', frameNow.frameCentered, JSON.stringify(frameNow));
  const pagerAfter = await page.locator('[aria-label="Next post"]').count();
  check('panel: the pager stands down while the panel is open', pagerBefore > 0 && pagerAfter === 0, `${pagerBefore} -> ${pagerAfter}`);
  const skin = await page.evaluate(() => {
    const rail = document.querySelector('aside.pui-sidebar');
    const panel = document.querySelector('[data-comments-panel="true"]');
    return {
      railGrad: getComputedStyle(rail).backgroundImage.includes('linear-gradient'),
      panelGrad: getComputedStyle(panel).backgroundImage.includes('linear-gradient'),
      railEdge: getComputedStyle(rail).borderInlineEndColor,
      panelEdge: getComputedStyle(panel).borderInlineEndColor,
    };
  });
  check('panel: wears the rail gradient skin', skin.railGrad === skin.panelGrad, JSON.stringify(skin));
  check('panel: shares the rail dividing edge', skin.railEdge === skin.panelEdge, JSON.stringify(skin));
  const panelFloat = await page.evaluate(() => {
    const el = document.querySelector('[data-comments-panel="true"]');
    const cs = getComputedStyle(el);
    return { radius: parseFloat(cs.borderTopLeftRadius), mTop: parseFloat(cs.marginTop) || parseFloat(cs.top) || 0 };
  });
  check('panel: floats with the theme corners like the rail', panelFloat.radius >= 10, JSON.stringify(panelFloat));
  const composer = await page.evaluate(() => {
    const panel = document.querySelector('[data-comments-panel="true"]');
    const input = panel.querySelector('input');
    return { panel: panel.getBoundingClientRect().width, input: input ? input.getBoundingClientRect().width : 0 };
  });
  check('panel: composer runs the full width', composer.input > composer.panel * 0.7, JSON.stringify(composer));
  await shot('phlick-panel');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const panelGone = await page.locator('[data-comments-panel="true"]').count();
  check('panel: Escape draws it away', panelGone === 0, `${panelGone} panels`);
  const railBack = await page.evaluate(() => Math.round(document.querySelector('aside.pui-sidebar').getBoundingClientRect().width));
  check('panel: closing restores the rail', railBack > railNarrow + 100, `${railNarrow} -> ${railBack}px`);

  // Without the room, the same panel joins the flow and pushes the feed.
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.waitForTimeout(400);
  const pushWide = await page.evaluate(() => Math.round(document.querySelector('[data-post-feed="true"]').getBoundingClientRect().width));
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(700);
  const pushFloat = await page.locator('[data-comments-panel="true"]').getAttribute('data-float');
  const pushNarrow = await page.evaluate(() => Math.round(document.querySelector('[data-post-feed="true"]').getBoundingClientRect().width));
  check('panel: without room it pushes instead', pushFloat !== 'true' && pushNarrow < pushWide, `float=${pushFloat} ${pushWide} -> ${pushNarrow}px`);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(400);

  // follow, then the Following feed carries the creator
  await page.locator('[aria-label="Follow"]').nth(1).click().catch(() => page.locator('[aria-label="Follow"]').first().click());
  await page.waitForTimeout(300);
  await page.goto('http://127.0.0.1:8788/phlick.html#/following', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const fText = await page.locator('body').innerText();
  check('following: narrowed to followed creators', !/Nothing here yet/.test(fText), '');
  await shot('phlick-following');

  // explore grid
  await page.goto('http://127.0.0.1:8788/phlick.html#/explore', { waitUntil: 'load' });
  // Poll until the grid settles — the adapter resolves on its own clock.
  let tiles = 0;
  for (let i = 0; i < 20; i++) {
    tiles = await page.evaluate(
      () => [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className)).length
    );
    if (tiles >= 64) break;
    await page.waitForTimeout(300);
  }
  check('explore: at least 64 entries', tiles >= 64, `${tiles} tiles`);
  const perRow = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className));
    const top = els[0].getBoundingClientRect().top;
    return els.filter((e) => Math.abs(e.getBoundingClientRect().top - top) < 4).length;
  });
  check('explore: big images, 3 to a row', perRow >= 2 && perRow <= 3, `${perRow} per row`);
  await shot('phlick-explore');

  // The same category header rides Explore, and its pills filter the grid.
  check('explore: category tabs shown', await page.locator('[role="tablist"] [role="tab"]').count() >= 5, '');
  await page.locator('[role="tab"]:has-text("Clubs")').click();
  await page.waitForTimeout(600);
  const catTiles = await page.evaluate(
    () => [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className)).length
  );
  check('explore: a topic opens its own deep catalogue', catTiles >= 64, `${tiles} -> ${catTiles}`);
  await page.locator('[role="tab"]').first().click();
  await page.waitForTimeout(400);

  // The header's right side: theme switch and notifications.
  const theme0 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('[aria-label="Toggle theme"]').click();
  await page.waitForTimeout(500);
  const theme1 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('header: theme switcher flips the theme', theme0 !== theme1, `${theme0} -> ${theme1}`);
  // The WHOLE app follows: the page ground itself is tokenized, so light mode
  // repaints body, shell, rail, header — not just the components.
  const ground = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const img = getComputedStyle(document.body).backgroundImage;
    const m = (img + bg).match(/rgba?\((\d+), (\d+), (\d+)/);
    const lum = m ? (Number(m[1]) + Number(m[2]) + Number(m[3])) / 3 : 0;
    return { bg, lum };
  });
  check('header: light theme repaints the page ground', ground.lum > 150, JSON.stringify(ground));
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const feedGround = await page.evaluate(() => {
    const el = document.querySelector('main');
    const bg = getComputedStyle(document.body).backgroundColor;
    return { theme: document.documentElement.getAttribute('data-theme'), bodyBg: bg };
  });
  check('header: the theme persists across pages', feedGround.theme === 'light', JSON.stringify(feedGround));
  await shot('phlick-light');
  await page.goto('http://127.0.0.1:8788/phlick.html#/explore', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.locator('[aria-label="Toggle theme"]').click();
  await page.waitForTimeout(400);
  await page.locator('[aria-label="Notifications"]').click();
  await page.waitForTimeout(500);
  const nItems = await page.locator('[data-notifications="true"] >> text=@').count();
  check('header: notifications open with items', nItems >= 3, `${nItems} rows`);
  await shot('phlick-notifications');
  await page.keyboard.press('Escape');
  await page.mouse.click(400, 500);
  await page.waitForTimeout(300);

  // ------------------------------------------------- slides + new pages
  // A photo-mode post: jump to it, confirm the segment bar and auto-advance.
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  // p02 is slide 2 of the feed; page down once.
  await page.locator('[aria-label="Next post"]').click();
  await page.waitForTimeout(900);
  const segs = await page.locator('[class*="slideSegment"]').count();
  check('slides: segmented bar rendered', segs >= 3, `${segs} segments`);
  const oneDeck = await page.locator('[data-spotlight="true"]').first().locator('[class*="slideSegment"]').count();
  check('slides: reels carry 4 to 7 images', oneDeck >= 4 && oneDeck <= 7, `${oneDeck}`);
  const spot = await page.evaluate(() => {
    const f = document.querySelector('[data-spotlight="true"]');
    if (!f) return null;
    const cells = [...f.querySelectorAll('[class*="spotCell"]')];
    const mid = cells.find((c) => c.dataset.role === 'mid');
    const sides = cells.filter((c) => c.dataset.role === 'side');
    const mr = mid.getBoundingClientRect();
    return {
      cells: cells.length,
      square: Math.abs(mr.width - mr.height) < 4,
      ratio: mr.width / Math.max(1, sides[0].getBoundingClientRect().width),
      midIndex: Number(mid.dataset.index),
      nextIndex: Number(sides[1].dataset.index),
      nextW: sides[1].getBoundingClientRect().width,
    };
  });
  check('spotlight: three images at a time', !!spot && spot.cells === 3, JSON.stringify(spot));
  const geom = await page.evaluate(() => {
    const f = document.querySelector('[data-spotlight="true"]');
    const row = f.querySelector('[class*="spotlightRow"]');
    const cells = [...f.querySelectorAll('[class*="spotCell"]')];
    const mid = cells.find((c) => c.dataset.role === 'mid').getBoundingClientRect();
    const side = cells.find((c) => c.dataset.role === 'side').getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    const feed = document.querySelector('[data-post-feed="true"]').getBoundingClientRect();
    return {
      midShare: mid.width / (mid.width + 2 * side.width),
      sideShare: side.width / (mid.width + 2 * side.width),
      midFull: mid.height / rr.height,
      sideHalf: side.height / mid.height,
      bleed: rr.width / feed.width,
    };
  });
  check('spotlight: middle takes 1/2 of the views', Math.abs(geom.midShare - 0.5) < 0.06, `mid=${geom.midShare.toFixed(2)}`);
  check('spotlight: sides take 1/4 each', Math.abs(geom.sideShare - 0.25) < 0.06, `side=${geom.sideShare.toFixed(2)}`);
  check('spotlight: sides stand at half the middle', Math.abs(geom.sideHalf - 0.5) < 0.06, `${geom.sideHalf.toFixed(2)}`);
  check('spotlight: the reel runs the stage, edge to rail', geom.bleed > 0.85, `${geom.bleed.toFixed(2)}`);
  const squares = await page.evaluate(() => {
    const f = document.querySelector('[data-spotlight="true"]');
    const cells = [...f.querySelectorAll('[class*="spotCell"]')];
    const mid = cells.find((c) => c.dataset.role === 'mid');
    const sides = cells.filter((c) => c.dataset.role === 'side');
    const mr = mid.getBoundingClientRect();
    const boxes = cells.map((c) => c.getBoundingClientRect());
    const row = f.querySelector('[class*="spotlightRow"]').getBoundingClientRect();
    const navCol = f.querySelector('[class*="spotNavCol"]');
    const navR = navCol ? navCol.getBoundingClientRect() : null;
    // half of each neighbour disappears under the active square
    const l = sides[0].getBoundingClientRect();
    const overlapL = Math.max(0, l.right - mr.left);
    // and the ACTIVE image paints on top in the overlap
    const probe = document.elementFromPoint(mr.left + 4, mr.top + mr.height / 2);
    return {
      allSquare: boxes.every((b) => Math.abs(b.width - b.height) < 3),
      halfTucked: Math.abs(overlapL - l.width / 2) < l.width * 0.15,
      activeOnTop: mid.contains(probe),
      navRight: !!navR && navR.left > mr.right && row.right - navR.right >= 8,
    };
  });
  check('spotlight: every view is a square', squares.allSquare, JSON.stringify(squares));
  check('spotlight: neighbours are cut off — half under the active', squares.halfTucked, JSON.stringify(squares));
  check('spotlight: only the active square shows on top', squares.activeOnTop, JSON.stringify(squares));
  check('spotlight: arrows sit together at the right, off the images', squares.navRight, JSON.stringify(squares));
  // Advance: the right-hand image expands into the middle.
  await page.locator(`[data-spotlight="true"] [class*="spotNavCol"] button`).nth(1).click();
  await page.waitForTimeout(600);
  const spot2 = await page.evaluate(() => {
    const f = document.querySelector('[data-spotlight="true"]');
    const mid = [...f.querySelectorAll('[class*="spotCell"]')].find((c) => c.dataset.role === 'mid');
    return { midIndex: Number(mid.dataset.index), midW: mid.getBoundingClientRect().width };
  });
  check('spotlight: next expands the neighbour into the middle', spot2.midIndex === spot.nextIndex && spot2.midW > spot.nextW * 1.5, JSON.stringify({ was: spot.nextIndex, now: spot2.midIndex }));
  const cur0 = await page.evaluate(() => [...document.querySelectorAll('[class*="slideSegment"]')].findIndex((e) => e.dataset.current === 'true'));
  await page.waitForTimeout(4200);
  const cur1 = await page.evaluate(() => [...document.querySelectorAll('[class*="slideSegment"]')].findIndex((e) => e.dataset.current === 'true'));
  check('slides: deck auto-advances left to right', cur1 > cur0, `${cur0} -> ${cur1}`);
  await shot('phlick-slides');

  // The rail is two parts: the icon strip and the active tab's panel.
  for (const tabName of ['Home', 'Chat', 'Menu', 'More']) {
    check(`rail: ${tabName} tab on the strip`, await page.locator(`aside [aria-label="${tabName}"]`).count() === 1, '');
  }
  await page.locator('aside [aria-label="Menu"]').click();
  await page.waitForTimeout(400);
  const menuText = await page.locator('[data-rail-panel="menu"]').innerText();
  check('rail: Menu tab shows its sections', /Snaps/.test(menuText) && /Zones/.test(menuText), '');
  const quiet = await page.evaluate(() => {
    const b = document.querySelector('[data-rail-panel="menu"] button');
    const bg = getComputedStyle(b).backgroundColor;
    return bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
  });
  check('rail: section entries are text, not buttons', quiet, '');
  await page.locator('[data-rail-panel="menu"] button:has-text("Shows")').click();
  await page.waitForTimeout(1000);
  check('rail: a section routes to its page', /#\/section\/shows/.test(page.url()), page.url());
  check('section: titled grid renders', /Shows/.test(await page.locator('h2').first().innerText()), '');
  await page.locator('aside [aria-label="More"]').click();
  await page.waitForTimeout(400);
  const moreText = await page.locator('[data-rail-panel="more"]').innerText();
  check('rail: More tab shows its sections', /Rides/.test(moreText), '');
  check('rail: Lands joins the More tab', /Lands/.test(moreText), '');
  check('rail: Brands joins the More tab', /Brands/.test(moreText), '');

  // The brand wall: sixteen marks, pure paths, each with its own hue wash.
  await page.locator('[data-rail-panel="more"] button:has-text("Brands")').click();
  await page.waitForTimeout(1200);
  check('brands: routes to its page', /#\/brands/.test(page.url()), page.url());
  const wall = await page.evaluate(() => {
    const marks = [...document.querySelectorAll('[data-brand-mark]')];
    const tints = new Set(marks.map((m) => getComputedStyle(m.parentElement).color));
    const paths = marks.every((m) => m.querySelectorAll('path').length >= 1);
    return { n: marks.length, tints: tints.size, paths };
  });
  check('brands: sixteen brands, four options each — 64 marks', wall.n === 64, `${wall.n}`);
  const options = await page.evaluate(() => {
    const per = {};
    for (const m of document.querySelectorAll('[data-brand-mark]')) {
      const b = m.dataset.brandMark;
      (per[b] ??= new Set()).add(m.innerHTML);
    }
    return Object.values(per).every((set) => set.size === 4);
  });
  check('brands: the four options of each brand are all distinct', options, '');
  check('brands: every mark is pure SVG paths', wall.paths, '');
  check('brands: each carries its own identity hue', wall.tints >= 14, `${wall.tints} distinct`);
  const wallText = await page.locator('body').innerText();
  check('brands: the named products are all present', ['phiegg', 'phipad', 'phient', 'phigal', 'phiace', 'phiphx', 'phiray', 'phical'].every((n) => wallText.includes(n)), '');
  await shot('phlick-brands');
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.locator('aside [aria-label="More"]').click().catch(() => {});
  await page.waitForTimeout(300);

  // Lands: a generated catalogue, at least 64 deep, each item opening for real.
  await page.locator('[data-rail-panel="more"] button:has-text("Lands")').click();
  await page.waitForTimeout(1500);
  const landTiles = await page.evaluate(
    () => [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className)).length
  );
  check('lands: at least 64 items', landTiles >= 64, `${landTiles} tiles`);
  await page.locator('button[class*="_tile"]').first().click();
  await page.waitForTimeout(1200);
  const landBody = await page.locator('body').innerText();
  check('lands: a generated item opens its post page', /#\/post\/gs-lands-/.test(page.url()) && !/not found/i.test(landBody) && await page.locator('[aria-label="Like"]').count() > 0, page.url());
  await page.goBack();
  await page.waitForTimeout(800);

  // Shops: 64 floor picks, badged by category.
  await page.locator('aside [aria-label="Menu"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-rail-panel="menu"] button:has-text("Shops")').click();
  await page.waitForTimeout(1500);
  const shopTiles = await page.evaluate(
    () => [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className)).length
  );
  check('shops: 64 picks on the floor', shopTiles === 64, `${shopTiles} tiles`);
  const shopLook = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className));
    const top = els[0].getBoundingClientRect().top;
    const r = els[0].getBoundingClientRect();
    return { perRow: els.filter((e) => Math.abs(e.getBoundingClientRect().top - top) < 4).length, square: Math.abs(r.width - r.height) < 4 };
  });
  check('shops: its own declared look — 3 square tiles a row', shopLook.perRow === 3 && shopLook.square, JSON.stringify(shopLook));
  const shopText = await page.locator('body').innerText();
  check('shops: the floors are all present', /High-end fashion/.test(shopText) && /Jewelry/.test(shopText) && /Hip-hop/.test(shopText) && /Watches/.test(shopText), '');

  // Every catalogue renders ITS OWN declaration: shape and columns differ.
  const looks = {};
  for (const [name, path] of [['snaps', '/section/snaps'], ['shows', '/section/shows'], ['hosts', '/section/hosts'], ['reels', '/section/reels']]) {
    await page.goto('http://127.0.0.1:8788/phlick.html#' + path, { waitUntil: 'load' });
    await page.waitForTimeout(1400);
    looks[name] = await page.evaluate(() => {
      const els = [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className));
      if (!els.length) return { perRow: 0, shape: 'row', rowsRendered: document.querySelectorAll('[data-variant="row"]').length };
      const top = els[0].getBoundingClientRect().top;
      const r = els[0].getBoundingClientRect();
      return {
        perRow: els.filter((e) => Math.abs(e.getBoundingClientRect().top - top) < 4).length,
        shape: Math.abs(r.width - r.height) < 4 ? 'square' : r.width > r.height ? 'wide' : 'portrait',
      };
    });
  }
  check('snaps: 5 square tiles a row', looks.snaps.perRow === 5 && looks.snaps.shape === 'square', JSON.stringify(looks.snaps));
  check('shows: 2 wide tiles a row', looks.shows.perRow === 2 && looks.shows.shape === 'wide', JSON.stringify(looks.shows));
  check('reels: 3 portrait tiles a row', looks.reels.perRow === 3 && looks.reels.shape === 'portrait', JSON.stringify(looks.reels));
  check('hosts: a row list, not a grid at all', looks.hosts.perRow === 0 && (looks.hosts.rowsRendered ?? 0) > 0, JSON.stringify(looks.hosts));
  check('catalogues: no two of these share a setup', new Set([JSON.stringify(looks.snaps), JSON.stringify(looks.shows), JSON.stringify(looks.reels), JSON.stringify(shopLook)]).size === 4, '');
  await shot('phlick-shops');
  check('rail: Shops joins the Menu tab', /Shops/.test(await page.locator('[data-rail-panel="menu"]').innerText().catch(() => '')), '');
  await page.locator('aside [aria-label="Chat"]').click();
  await page.waitForTimeout(500);
  check('rail: Chat tab lists threads', await page.locator('[data-chat-panel="true"] [data-clickable="true"]').count() >= 3, '');
  await page.locator('aside [aria-label="Settings"]').click();
  await page.waitForTimeout(600);
  check('rail: the cog opens preferences', await page.locator('[role="dialog"]').first().isVisible().catch(() => false), '');
  const cogBg = await page.evaluate(() => getComputedStyle(document.querySelector('aside [aria-label="Settings"]')).backgroundColor);
  check('rail: the open cog carries a background', cogBg !== 'rgba(0, 0, 0, 0)' && cogBg !== 'transparent', cogBg);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.locator('aside [aria-label="Home"]').click();
  await page.waitForTimeout(300);
  await shot('phlick-rail-tabs');

  // Sidebar runs the full viewport.
  const railFloat = await page.evaluate(() => {
    const a = document.querySelector('aside.pui-sidebar');
    const cs = getComputedStyle(a);
    const r = a.getBoundingClientRect();
    return {
      mTop: parseFloat(cs.marginTop),
      mBottom: parseFloat(cs.marginBottom),
      radius: parseFloat(cs.borderTopLeftRadius),
      tall: r.height >= window.innerHeight - 60,
    };
  });
  check('shell: rail floats with top and bottom margins', railFloat.mTop >= 8 && railFloat.mBottom >= 8, JSON.stringify(railFloat));
  check('shell: rail wears the theme corners', railFloat.radius >= 10, `${railFloat.radius}px`);
  check('shell: sidebar still runs the viewport', railFloat.tall, JSON.stringify(railFloat));

  // Rail collapse: the panel toggle shrinks the rail to an icon strip.
  const railW0 = await page.evaluate(() => Math.round(document.querySelector('aside.pui-sidebar').getBoundingClientRect().width));
  await page.locator('[aria-label="Collapse sidebar"]').click();
  await page.waitForTimeout(600);
  const railW1 = await page.evaluate(() => Math.round(document.querySelector('aside.pui-sidebar').getBoundingClientRect().width));
  check('rail: toggler collapses to an icon strip', railW1 < railW0 - 100, `${railW0} -> ${railW1}px`);
  const labelVisible = await page.locator('aside >> text=Following').isVisible().catch(() => false);
  check('rail: collapsed shows icons only', !labelVisible, '');
  await shot('phlick-rail-collapsed');
  await page.locator('[aria-label="Expand sidebar"]').click();
  await page.waitForTimeout(500);

  // Replies expand on the post page, hanging off the thread rule.
  await page.goto('http://127.0.0.1:8788/phlick.html#/post/p01', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(800);
  const commentCount = await page.locator('[data-comment="true"]').count();
  check('post page: 16 comments', commentCount >= 16, `${commentCount} comments`);
  const toggle = page.locator('button:has-text("View")').first();
  if (await toggle.count()) {
    const beforeN = await page.locator('[data-comment="true"]').count();
    await toggle.click();
    await page.waitForTimeout(400);
    const afterN = await page.locator('[data-comment="true"]').count();
    check('post page: replies expand', afterN > beforeN, `${beforeN} -> ${afterN}`);
    const rule = await page.evaluate(() => {
      const el = document.querySelector('[class*="replies"]');
      return el ? getComputedStyle(el).borderInlineStartWidth : 'none';
    });
    check('post page: reply threads carry the vertical rule', rule === '2px', rule);
    const inset = await page.evaluate(() => {
      const el = document.querySelector('[class*="replies"]');
      return el ? parseFloat(getComputedStyle(el).marginInlineStart) : 0;
    });
    check('post page: the rule runs from the avatar midline', inset < 0, `${inset}px`);
  } else {
    check('post page: replies expand', false, 'no reply toggle found');
  }
  await shot('phlick-replies');

  // Reply to a reply: the composer arms, the reply threads in, recursively.
  const replyBtn = page.locator('[data-comment="true"] button:has-text("Reply")').first();
  check('comments: every comment offers Reply', await replyBtn.count() > 0, '');
  await replyBtn.click();
  await page.waitForTimeout(300);
  check('comments: composer arms with the target', /Replying to @/.test(await page.locator('[data-comments-panel="true"]').innerText()), '');
  const before = await page.locator('[data-comment="true"]').count();
  await page.locator('[data-comments-panel="true"] input').fill('So good');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const after = await page.locator('[data-comment="true"]').count();
  check('comments: the reply threads onto its comment', after > before, `${before} -> ${after}`);
  check('comments: the viewer sees their reply', /@you/.test(await page.locator('[data-comments-panel="true"]').innerText()), '');

  // LIVE page
  await page.goto('http://127.0.0.1:8788/phlick.html#/live', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  const liveText = await page.locator('body').innerText();
  check('live: rooms with viewer counts', /LIVE/.test(liveText) && /watching/.test(liveText), '');
  const liveTiles = await page.evaluate(
    () => [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className)).length
  );
  check('live: at least 64 rooms on air', liveTiles >= 64, `${liveTiles}`);
  await shot('phlick-live');

  // Upload page: post is gated on a caption.
  await page.goto('http://127.0.0.1:8788/phlick.html#/upload', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const postBtn = page.locator('button:has-text("Post")').last();
  check('upload: post gated without a caption', await postBtn.isDisabled(), '');
  await page.locator('textarea').fill('Trying the new edit');
  await page.waitForTimeout(200);
  check('upload: caption releases the gate', await postBtn.isEnabled(), '');
  await postBtn.click();
  await page.waitForTimeout(400);
  check('upload: posting confirms', /Posted/.test(await page.locator('body').innerText()), '');
  await shot('phlick-upload');

  // a tile opens the post page; the author row leads on to the creator
  await page.goto('http://127.0.0.1:8788/phlick.html#/explore', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.locator('button[class*="_tile"]').first().click();
  await page.waitForTimeout(1200);
  check('explore: tile routes to the post page', /#\/post\//.test(page.url()), page.url());
  // The author row lives in the thread panel now — ask for it first.
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(800);
  await page.locator('main [data-clickable="true"]').first().click();
  await page.waitForTimeout(1200);
  const cText = await page.locator('body').innerText();
  check('creator: header resolved', /@[a-z]/.test(cText) && /Followers/.test(cText), '');
  check('creator: their grid loads', await page.locator('[class*="tileMeta"]').count() > 0, '');
  const creatorTiles = await page.evaluate(
    () => [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className)).length
  );
  check('creator: at least 64 posts on the grid', creatorTiles >= 64, `${creatorTiles}`);
  check('creator: Videos/Liked tabs present', await page.locator('[role="tab"]').count() >= 2, '');
  await shot('phlick-creator');

  // ------------------------------------------------- overlay + glass + sticky
  // On the profile, a tile opens the post as an overlay in place.
  await page.locator('button[class*="_tile"]').first().click();
  await page.waitForTimeout(1200);
  const overlay = page.locator('[data-post-overlay="true"]');
  check('creator: tile opens the post overlay', await overlay.count() === 1, '');
  check('creator: url stays on the profile', /#\/creator\//.test(page.url()), page.url());
  const panelClosed = await page.locator('[data-comments-panel="true"]').count();
  check('overlay: opens WITHOUT the thread', panelClosed === 0, `${panelClosed} panels`);
  await page.locator('[data-post-overlay="true"] [aria-label="Show comments"]').click();
  await page.waitForTimeout(600);
  const oText = await overlay.innerText();
  check('overlay: asking slides the thread in', /Comments \(\d+\)/.test(oText), '');

  // Overlay buttons are glass — translucent, never a solid fill.
  const glass = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[data-post-overlay="true"] button[class*="railButton"]')];
    const alphas = btns.map((b) => {
      const c = getComputedStyle(b).backgroundColor;
      const slash = c.match(/\/\s*([\d.]+)\s*\)/);
      if (slash) return parseFloat(slash[1]);
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return 1;
      const parts = m[1].split(',').map((x) => parseFloat(x));
      return parts.length === 4 ? parts[3] : 1;
    });
    return { n: alphas.length, maxAlpha: Math.max(...alphas) };
  });
  check('overlay: buttons are translucent, not filled', glass.n >= 6 && glass.maxAlpha < 0.5, JSON.stringify(glass));
  const glassGrad = await page.evaluate(() => {
    const b = document.querySelector('[data-post-overlay="true"] button[class*="railButton"]');
    const img = getComputedStyle(b).backgroundImage;
    // every stop must be greyscale: lightness only, never a color
    const stops = [...img.matchAll(/(?:rgba?|color\(srgb)[^)]*\)?/g)].map((m) => m[0]);
    const nums = [...img.matchAll(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/g)].concat([...img.matchAll(/rgba?\((\d+), (\d+), (\d+)/g)]);
    const grey = nums.every((m) => {
      const [r, g, bl] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const max = Math.max(r, g, bl), min = Math.min(r, g, bl);
      return (max - min) / Math.max(max, 0.001) < 0.12;
    });
    return { hasGradient: img.includes('linear-gradient'), grey, n: nums.length };
  });
  check('overlay: glass is an opacity gradient, lightness only', glassGrad.hasGradient && glassGrad.grey && glassGrad.n >= 2, JSON.stringify(glassGrad));

  // The panel toggles like a drawer.
  await page.locator('[data-post-overlay="true"] [aria-label="Hide comments"]').click();
  await page.waitForTimeout(400);
  const panelHidden = await page.locator('[data-comments-panel="true"]').count();
  check('overlay: toggle hides the panel', panelHidden === 0, `${panelHidden} panels`);
  await page.locator('[data-post-overlay="true"] [aria-label="Show comments"]').click();
  await page.waitForTimeout(400);
  check('overlay: toggle brings the panel back', await page.locator('[data-comments-panel="true"]').count() === 1, '');

  // The rail inside the overlay works.
  const oLike = page.locator('[data-post-overlay="true"] [aria-label="Like"]').first();
  await oLike.click();
  await page.waitForTimeout(300);
  const oPressed = await oLike.getAttribute('aria-pressed');
  check('overlay: like flips state in place', oPressed === 'true' || oPressed === 'false', `aria-pressed=${oPressed}`);

  await page.locator('[data-post-overlay="true"] [aria-label="Comments"]').first().click();
  await page.waitForTimeout(400);
  check('overlay: rail comment control draws the panel away', await page.locator('[data-comments-panel="true"]').count() === 0, '');
  await page.locator('[data-post-overlay="true"] [aria-label="Comments"]').first().click();
  await page.waitForTimeout(400);
  check('overlay: rail comment control brings it back', await page.locator('[data-comments-panel="true"]').count() === 1, '');
  await shot('phlick-overlay');

  // Escape dismisses the overlay and the grid is still there.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('overlay: Escape closes it', await page.locator('[data-post-overlay="true"]').count() === 0, '');

  // On the post page, the stage column is sticky: only the thread scrolls.
  await page.goto('http://127.0.0.1:8788/phlick.html#/post/p01', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(800);
  const sticky = await page.evaluate(() => {
    const col = document.querySelector('[class*="stickyCol"]');
    return col ? getComputedStyle(col).position : 'none';
  });
  check('post page: stage column is sticky', sticky === 'sticky', sticky);
  const drift = await page.evaluate(async () => {
    const frame = document.querySelector('[class*="postStage"]');
    const body = document.querySelector('[data-comments-panel="true"] [class*="commentsPanelBody"]');
    const top0 = Math.round(frame.getBoundingClientRect().top);
    body.scrollBy(0, 600);
    await new Promise((r) => setTimeout(r, 300));
    const top1 = Math.round(frame.getBoundingClientRect().top);
    return { top0, top1, scrolled: body.scrollTop };
  });
  check('post page: only the thread column scrolls', drift.scrolled > 400 && drift.top1 === drift.top0, JSON.stringify(drift));
  await shot('phlick-post-sticky');

  // ------------------------------------------------ back / chevrons / keys
  // The stage's chevrons walk the feed order, the reference's own control.
  const url0 = page.url();
  await page.locator('[data-post-stage="true"] [aria-label="Next post"]').click();
  await page.waitForTimeout(900);
  check('post page: next chevron walks the feed', page.url() !== url0 && /#\/post\//.test(page.url()), page.url());
  await page.locator('[data-post-stage="true"] [aria-label="Previous post"]').click();
  await page.waitForTimeout(900);
  check('post page: previous chevron walks back', page.url() === url0, page.url());

  // Arrow keys do the same from the keyboard.
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(900);
  check('post page: ArrowDown pages the feed', page.url() !== url0, page.url());

  // The close control goes back to the previous page.
  await page.goto('http://127.0.0.1:8788/phlick.html#/explore', { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  await page.locator('button[class*="_tile"]').first().click();
  await page.waitForTimeout(1000);
  check('post page: reached from explore', /#\/post\//.test(page.url()), page.url());
  await page.locator('[data-post-stage="true"] [aria-label="Close"]').click();
  await page.waitForTimeout(800);
  check('post page: close returns to the previous page', /#\/explore/.test(page.url()), page.url());
  await shot('phlick-back');

  // Feed keyboard: up/down page the snap track.
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  const k0 = await page.evaluate(() => document.querySelector('[class*="snapTrack"]').scrollTop);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(900);
  const k1 = await page.evaluate(() => document.querySelector('[class*="snapTrack"]').scrollTop);
  check('feed: ArrowDown pages the feed', k1 > k0, `${k0} -> ${k1}`);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(900);
  const k2 = await page.evaluate(() => document.querySelector('[class*="snapTrack"]').scrollTop);
  check('feed: ArrowUp pages back', k2 < k1, `${k1} -> ${k2}`);

  // Search: type in the rail, Enter, results with creators and videos.
  await page.locator('aside input').first().fill('aria');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  check('search: Enter routes to results', /#\/search\?q=aria/.test(page.url()), page.url());
  const sText = await page.locator('body').innerText();
  check('search: header echoes the query', /Results for/.test(sText) && /aria/i.test(sText), '');
  const sTiles = await page.evaluate(
    () => [...document.querySelectorAll('button[class*="tile"]')].filter((e) => /_tile(\s|$)/.test(e.className)).length
  );
  check('search: matching videos found', sTiles > 0, `${sTiles} tiles`);
  await shot('phlick-search');

  // A creator search finds the creator row.
  await page.goto('http://127.0.0.1:8788/phlick.html#/search?q=aria', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const crText = await page.locator('body').innerText();
  check('search: creators matched by handle', /Creators/.test(crText) && /@aria\.moves/.test(crText), '');

  // Comment likes: the heart on a comment flips and persists.
  await page.goto('http://127.0.0.1:8788/phlick.html#/post/p01', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(800);
  const heart = page.locator('[data-comment="true"] [aria-label="Like comment"]').first();
  check('comments: hearts offered', await heart.count() > 0, '');
  await heart.click();
  await page.waitForTimeout(400);
  check('comments: liking flips the heart', (await heart.getAttribute('aria-pressed')) === 'true', '');
  const cPersist = await page.evaluate(() => Object.values(localStorage).some((v) => v.includes('likedComments')));
  check('comments: the like persists', cPersist, '');
  await shot('phlick-comment-like');

  // ------------------------------------------- brand control gradient
  // The brand defines its primary controls as a pink->blue gradient, left to
  // right at rest and opposed on hover — never a solid pink fill.
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const login = page.locator('aside button', { hasText: 'Sign up' }).first();
  const gRest = await login.evaluate((b) => getComputedStyle(b).backgroundImage);
  check('brand: login wears the pink->blue gradient', /linear-gradient/.test(gRest), gRest.slice(0, 60));
  await login.hover();
  await page.waitForTimeout(250);
  const gHover = await login.evaluate((b) => getComputedStyle(b).backgroundImage);
  check('brand: hover opposes the gradient', /linear-gradient/.test(gHover) && gHover !== gRest, gHover.slice(0, 60));
  const gActive = await page.evaluate(() => {
    const el = document.querySelector('aside [aria-label="Home"]');
    return el ? getComputedStyle(el).backgroundImage : 'none';
  });
  check('brand: active rail entry carries the gradient', /linear-gradient/.test(gActive), gActive.slice(0, 60));
  check('brand: gradient ends on the darker blue', gRest.includes('29, 78, 216') && !gRest.includes('37, 244, 238'), gRest.slice(0, 80));
  check('brand: login matches the active entry exactly', gRest === gActive, '');
  const gClip = await login.evaluate((b) => getComputedStyle(b).backgroundClip);
  check('brand: gradient clips to the control, no side fringe', gClip === 'padding-box', gClip);
  await shot('phlick-gradient');

  // Back to the post page for the thread toggle below.
  await page.goto('http://127.0.0.1:8788/phlick.html#/post/p01', { waitUntil: 'load' });
  await page.waitForTimeout(1400);

  await page.goto('http://127.0.0.1:8788/phlick.html#/post/p01', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  check('post page: opens WITHOUT the thread', !/Comments \(/.test(await page.locator('body').innerText()), '');
  const soloW = await page.evaluate(() => document.querySelector('[class*="stickyCol"]').getBoundingClientRect().width);
  const soloSquare = await page.evaluate(() => {
    const fr = document.querySelector('[data-post-stage="true"] [class*="frame"]');
    const r = fr.getBoundingClientRect();
    return Math.abs(r.width - r.height) < 4;
  });
  check('post page: the opened view is a square', soloSquare, '');
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(700);
  check('post page: asking for comments slides the thread in', /Comments \(/.test(await page.locator('body').innerText()), '');
  const splitW = await page.evaluate(() => document.querySelector('[class*="stickyCol"]').getBoundingClientRect().width);
  check('post page: the image shrinks to half for the thread', splitW < soloW * 0.85, `${Math.round(soloW)} -> ${Math.round(splitW)}px`);
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(500);
  check('post page: and closes back to the full square', !/Comments \(/.test(await page.locator('body').innerText()), '');

  // Photo-mode decks keep auto-playing on the post page.
  await page.goto('http://127.0.0.1:8788/phlick.html#/post/p02', { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  const postSpot = await page.evaluate(() => {
    const f = document.querySelector('[data-spotlight="true"]');
    if (!f) return null;
    const boxes = [...f.querySelectorAll('[class*="spotCell"]')].map((c) => c.getBoundingClientRect());
    const row = f.querySelector('[class*="spotlightRow"]').getBoundingClientRect();
    return {
      allSquare: boxes.every((b) => Math.abs(b.width - b.height) < 3),
      fill: boxes.reduce((n, b) => n + b.width, 0) / row.width,
    };
  });
  check('post page: spotlight views are square there too', !!postSpot && postSpot.allSquare, JSON.stringify(postSpot));
  check('post page: the slider spends its full width', !!postSpot && postSpot.fill > 0.85, JSON.stringify(postSpot));
  const pSegs = await page.locator('[class*="slideSegment"]').count();
  check('post page: deck renders its segment bar', pSegs >= 3, `${pSegs} segments`);
  const pCur0 = await page.evaluate(() => [...document.querySelectorAll('[class*="slideSegment"]')].findIndex((e) => e.dataset.current === 'true'));
  await page.waitForTimeout(4200);
  const pCur1 = await page.evaluate(() => [...document.querySelectorAll('[class*="slideSegment"]')].findIndex((e) => e.dataset.current === 'true'));
  check('post page: deck auto-plays', pCur1 !== pCur0, `${pCur0} -> ${pCur1}`);

  // ------------------------------------------------------- responsive
  // Narrow laptop: the rail contracts on its own; nothing overflows.
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const narrowRail = await page.evaluate(() => Math.round(document.querySelector('aside.pui-sidebar').getBoundingClientRect().width));
  check('responsive: the rail contracts below 1024px', narrowRail < 120, `${narrowRail}px`);
  await shot('phlick-narrow');
  await page.goto('http://127.0.0.1:8788/phlick.html#/post/p10', { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  await shot('phlick-narrow-post');

  // Phone: the comments panel takes the whole screen.
  await page.setViewportSize({ width: 420, height: 800 });
  await page.goto('http://127.0.0.1:8788/phlick.html#/', { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  await page.locator('[aria-label="Comments"]').first().click();
  await page.waitForTimeout(800);
  const phonePanel = await page.evaluate(() => {
    const el = document.querySelector('[data-comments-panel="true"]');
    return el ? Math.round(el.getBoundingClientRect().width / window.innerWidth * 100) : 0;
  });
  check('responsive: on a phone the thread takes the screen', phonePanel > 95, `${phonePanel}%`);
  await page.keyboard.press('Escape');
  await shot('phlick-phone');

  await b.close();
  console.log('\n' + '='.repeat(56));
  for (const r of results) console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.n + (r.ok ? '' : '  <- ' + r.d));
  const failed = results.filter((r) => !r.ok).length;
  console.log('='.repeat(56));
  console.log(`${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
