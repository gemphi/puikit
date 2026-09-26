const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(__dirname, 'shots');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });

  for (const f of files) {
    await page.goto('file://' + path.join(dir, f), { waitUntil: 'load' });
    // Entry animations use `forwards`; wait for them so the shot is the settled state.
    await page.waitForTimeout(450);   // entry animations use `forwards`; let them settle
    const png = path.join(dir, f.replace('.html', '.png'));
    await page.screenshot({ path: png, fullPage: false });
    const dims = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
      bg: getComputedStyle(document.body).backgroundColor,
      color: getComputedStyle(document.body).color,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
    }));
    console.log(`${f.replace('.html','').padEnd(26)} ${dims.w}x${dims.h}  bg=${dims.bg}  fg=${dims.color}  h-overflow=${dims.overflowX}`);
  }
  await browser.close();
  console.log(errors.length ? '\nPAGE ERRORS:\n' + [...new Set(errors)].join('\n') : '\nno page errors');
})();
