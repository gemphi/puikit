require('./render');
const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const OUT = path.join(__dirname, 'work/out');
const P = (p) => require(path.join(OUT, p));

const { ShopProvider } = P('pui/src/components/shop/provider');
const { PuiProvider } = P('pui/src/providers/PuiProvider');
const { RouterProvider } = P('app/src/router');
const { shopConfig } = P('app/src/shop');
const { AppShell } = P('app/src/components/layout/shell');
const { BRAND_THEMES } = P('pui/src/providers/themes');
const { deriveGradientTreatment } = P('pui/src/providers/gradient');
const { cartStore } = P('pui/src/store/cart');
const { authStore } = P('pui/src/store/auth');
const { addressStore } = P('pui/src/store/address');
const { paymentStore } = P('pui/src/store/payment');
const { orderStore } = P('pui/src/store/order');

const css = fs.readFileSync(path.join(__dirname, 'bundle.css'), 'utf8');
const OUTDIR = path.join(__dirname, 'shots');
fs.mkdirSync(OUTDIR, { recursive: true });

/**
 * PuiProvider writes theme state onto <html> in an effect, which never runs
 * during SSR. Reproduce that contract here so the screenshot reflects the real
 * token cascade for a given theme/brand/style/radius/density.
 */
function rootAttrs({ theme = 'light', brandId = 'chanel', style = 'gradient', radius = 1, density = 1 }) {
  const brand = BRAND_THEMES.find((b) => b.id === brandId) || BRAND_THEMES[0];
  const isDark = theme === 'dark';
  const vars = [
    `--phi-radius-scale:${radius}`,
    `--phi-space-scale:${density}`,
    `--phi-color-primary:${(isDark && brand.colors.primaryDark) || brand.colors.primary}`,
    `--phi-color-primary-hover:${(isDark && (brand.colors.primaryHoverDark || brand.colors.primaryDark)) || brand.colors.primaryHover}`,
    `--phi-color-primary-light:${isDark ? brand.colors.primaryLightDark : brand.colors.primaryLight}`,
    `--phi-color-secondary:${brand.colors.secondary}`,
    `--phi-brand-gradient:${isDark ? brand.gradientDark : brand.gradient}`,
  ];
  const g = deriveGradientTreatment(brand, style, isDark);
  if (g) {
    vars.push(`--phi-gradient-parent:${g.parent}`, `--phi-gradient-child:${g.child}`, `--phi-gradient-accent:${g.accent}`);
  }
  return {
    cls: isDark ? 'dark' : '',
    attrs: `data-theme="${isDark ? 'dark' : 'light'}" data-style="${style}" data-brand="${brandId}"${g ? ' data-gradient-default="true"' : ''}`,
    style: vars.join(';'),
  };
}

function page(node, opts = {}) {
  const body = renderToStaticMarkup(
    React.createElement(PuiProvider, { defaultTheme: opts.theme || 'light', defaultThemeStyle: opts.style || 'gradient', defaultArchetype: opts.archetype || 'shop', defaultBrand: opts.brandId },
      React.createElement(ShopProvider, shopConfig,
        React.createElement(RouterProvider, null, node))));
  const r = rootAttrs(opts);
  return `<!doctype html><html lang="en" class="${r.cls}" ${r.attrs} style="${r.style}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style>
<style>
  /* Google Fonts are unreachable offline; fall back to local families. */
  :root { --chanel-serif: Georgia, 'Times New Roman', serif; }
  body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
</style>
</head><body>${body}</body></html>`;
}

const write = (name, html) => { fs.writeFileSync(path.join(OUTDIR, name + '.html'), html); return name; };

// --- Chanel -----------------------------------------------------------------
const pg = (file, name, props) => React.createElement(P(`app/src/pages/${file}`)[name], props || {});
const shell = (node) => React.createElement(AppShell, null, node);

global.window.location.hash = '#/';
write('chanel-home', page(shell(pg('home', 'HomePage'))));
write('chanel-home-dark', page(shell(pg('home', 'HomePage')), { theme: 'dark' }));
write('chanel-home-apple-round', page(shell(pg('home', 'HomePage')), { style: 'apple', radius: 1.6, density: 1.2 }));

global.window.location.hash = '#/category/handbags';
write('chanel-category', page(shell(pg('category', 'CategoryPage', { slug: 'handbags' }))));

global.window.location.hash = '#/product/cf-11-classic';
write('chanel-product', page(shell(pg('product', 'ProductPage', { id: 'cf-11-classic' }))));

// A populated bag, so the cart page shows lines rather than its empty state.
const products = require(path.join(OUT, 'app/src/mocks/api-products.json'));
cartStore.getState().clear();
cartStore.getState().addItem(products[0], { size: 'Medium' }, 1);
cartStore.getState().addItem(products[9], { size: '50ml' }, 2);
global.window.location.hash = '#/cart';
write('chanel-cart', page(shell(pg('cart', 'CartPage'))));

global.window.location.hash = '#/checkout';
write('chanel-checkout', page(shell(pg('checkout', 'CheckoutPage'))));

// Signed in, with the account fixtures hydrated.
authStore.getState().signIn({ id: 'riya', firstName: 'Riya', lastName: 'Sharma', email: 'riya@example.com' });
const addrs = require(path.join(OUT, 'app/src/mocks/api-addresses.json'));
const pms = require(path.join(OUT, 'app/src/mocks/api-payment-methods.json'));
addressStore.getState().hydrate(addrs.map(({ userId, ...a }) => a));
paymentStore.getState().hydrate(pms.map(({ userId, ...m }) => m));
orderStore.getState().hydrate([{ id: 'CH-4821', date: '2026-08-14', status: 'delivered', totalAmount: 9865,
  items: [{ product: products[0], quantity: 1, priceAtPurchase: 9700 }, { product: products[9], quantity: 1, priceAtPurchase: 165 }] }]);
global.window.location.hash = '#/account';
write('chanel-account', page(shell(pg('account', 'AccountPage'))));
global.window.location.hash = '#/account/orders';
write('chanel-orders', page(shell(pg('account-orders', 'AccountOrdersPage'))));
global.window.location.hash = '#/account/addresses';
write('chanel-addresses', page(shell(pg('account-addresses', 'AccountAddressesPage'))));

console.log('wrote', fs.readdirSync(OUTDIR).length, 'html files');
