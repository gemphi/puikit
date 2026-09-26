require('./render');
const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const OUT = path.join(__dirname, 'work/out');
const P = (p) => require(path.join(OUT, p));

const { PuiProvider } = P('pui/src/providers/PuiProvider');
const { BRAND_THEMES } = P('pui/src/providers/themes');
const { deriveGradientTreatment } = P('pui/src/providers/gradient');

const css = fs.readFileSync(path.join(__dirname, 'bundle.css'), 'utf8');
const OUTDIR = path.join(__dirname, 'shots');
fs.mkdirSync(OUTDIR, { recursive: true });

function rootAttrs({ theme = 'light', brandId = 'foundry', style = 'apple', radius = 1, density = 1 }) {
  const brand = BRAND_THEMES.find((b) => b.id === brandId) || BRAND_THEMES[0];
  const isDark = theme === 'dark';
  const vars = [
    `--phi-radius-scale:${radius}`, `--phi-space-scale:${density}`,
    `--phi-color-primary:${brand.colors.primary}`,
    `--phi-color-primary-hover:${brand.colors.primaryHover}`,
    `--phi-color-primary-light:${isDark ? brand.colors.primaryLightDark : brand.colors.primaryLight}`,
    `--phi-color-secondary:${brand.colors.secondary}`,
    `--phi-brand-gradient:${isDark ? brand.gradientDark : brand.gradient}`,
  ];
  const g = deriveGradientTreatment(brand, style, isDark);
  if (g) vars.push(`--phi-gradient-parent:${g.parent}`, `--phi-gradient-child:${g.child}`, `--phi-gradient-accent:${g.accent}`);
  return {
    cls: isDark ? 'dark' : '',
    attrs: `data-theme="${isDark ? 'dark' : 'light'}" data-style="${style}" data-brand="${brandId}"${g ? ' data-gradient-default="true"' : ''}`,
    style: vars.join(';'),
  };
}

function page(node, opts = {}) {
  const body = renderToStaticMarkup(
    React.createElement(PuiProvider,
      { defaultTheme: opts.theme || 'light', defaultThemeStyle: opts.style || 'apple', defaultArchetype: opts.archetype || 'docs', defaultBrand: opts.brandId },
      node));
  const r = rootAttrs(opts);
  return `<!doctype html><html lang="en" class="${r.cls}" ${r.attrs} style="${r.style}">
<head><meta charset="utf-8"><style>${css}</style>
<style>body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}</style></head>
<body>${body}</body></html>`;
}

const write = (n, h) => fs.writeFileSync(path.join(OUTDIR, n + '.html'), h);
const pg = (file, name) => React.createElement(P(`book/src/pages/${file}`)[name]);

const pages = [
  ['HomePage', 'HomePage'], ['ComponentsPage', 'ComponentsPage'], ['TokensPage', 'TokensPage'],
  ['ShopPage', 'ShopPage'], ['PlaygroundPage', 'PlaygroundPage'], ['EcosystemPage', 'EcosystemPage'],
  ['DataEnginePage', 'DataEnginePage'],
];
let ok = 0;
for (const [file, name] of pages) {
  try { write('book-' + file.replace('Page', '').toLowerCase(), page(pg(file, name))); ok++; }
  catch (e) { console.log('FAILED', name, '->', e.message.split('\n')[0].slice(0, 120)); }
}

// The shared preference surface, open, in the rounded Apple style.
try {
  const { PreferencesModal } = P('pui/src/components/overlays/PreferencesModal');
  write('book-prefs', page(React.createElement(PreferencesModal, { isOpen: true, onClose() {} }), { radius: 1.6 }));
  ok++;
} catch (e) { console.log('FAILED PreferencesModal ->', e.message.split('\n')[0].slice(0, 120)); }

console.log(`wrote ${ok} book pages`);

// --- Overlay screenshots ----------------------------------------------------
// Overlays deliberately render nothing without a DOM. For a visual check only,
// make the portal resolve and render inline; the markup is identical, just not
// relocated to document.body.
{
  const rd = require('react-dom');
  const realPortal = rd.createPortal;
  rd.createPortal = (children) => children;
  const upt = require(path.join(OUT, 'pui/src/components/overlays/usePortalTarget.js'));
  const realTarget = upt.usePortalTarget;
  upt.usePortalTarget = () => ({});

  const { PreferencesModal } = P('pui/src/components/overlays/PreferencesModal');
  write('book-prefs', page(React.createElement(PreferencesModal, { isOpen: true, onClose() {} }), { radius: 1.6 }));

  const { Drawer } = P('pui/src/components/overlays/Drawer');
  const { CartDrawer } = P('pui/src/components/shop/cart/drawer');
  const products = require(path.join(OUT, 'app/src/mocks/api-products.json'));
  const { productImage } = P('app/src/lib/media');
  const { ShopProvider } = P('pui/src/components/shop/provider');
  const { shopConfig } = P('app/src/shop');
  write('chanel-drawer', page(
    React.createElement(ShopProvider, shopConfig,
      React.createElement(CartDrawer, {
        isOpen: true, onClose() {}, onCheckout() {},
        items: [
          { id: products[0].id, title: products[0].title, price: products[0].price, quantity: 1, image: productImage(products[0]) },
          { id: products[9].id, title: products[9].title, price: products[9].price, quantity: 2, image: productImage(products[9]) },
        ],
      })),
    { brandId: 'chanel', style: 'gradient' }));

  rd.createPortal = realPortal;
  upt.usePortalTarget = realTarget;
  console.log('wrote overlay screenshots');
}
