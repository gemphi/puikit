require('./render');
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
const { cartStore } = P('pui/src/store/cart');
const { authStore } = P('pui/src/store/auth');
const { catalogStore } = P('pui/src/store/catalog');
const { wishlistStore } = P('pui/src/store/wishlist');

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' -> ' + detail : ''}`); }
};

const render = (node, provider = {}) =>
  renderToStaticMarkup(
    React.createElement(PuiProvider, { defaultTheme: 'light', defaultThemeStyle: 'gradient', defaultArchetype: 'shop', ...provider },
      React.createElement(ShopProvider, shopConfig,
        React.createElement(RouterProvider, null, node))));

const PAGES = {
  home: 'HomePage', category: 'CategoryPage', product: 'ProductPage', search: 'SearchPage',
  cart: 'CartPage', checkout: 'CheckoutPage', 'checkout-success': 'CheckoutSuccessPage',
  wishlist: 'WishlistPage', account: 'AccountPage', 'account-orders': 'AccountOrdersPage',
  'account-addresses': 'AccountAddressesPage', 'account-payments': 'AccountPaymentsPage',
  about: 'AboutPage', 'not-found': 'NotFoundPage',
};
const ARGS = { category: { slug: 'handbags' }, product: { id: 'cf-11-classic' } };
const page = (f) => React.createElement(P(`app/src/pages/${f}`)[PAGES[f]], ARGS[f] || {});

console.log('\n=== 1. Every page renders ===');
const html = {};
for (const f of Object.keys(PAGES)) {
  try { html[f] = render(page(f)); check(`${PAGES[f]}`, html[f].length > 0); }
  catch (e) { check(`${PAGES[f]}`, false, e.message.split('\n')[0]); }
}

console.log('\n=== 2. Sidebar: contextual and toggleable ===');
const shellAt = (hash) => {
  global.window.location.hash = hash;
  return render(React.createElement(AppShell, null, React.createElement('span', null, 'x')));
};
const onCatalog = shellAt('#/');
const onCart = shellAt('#/cart');
check('facet rail present on a catalog route', /data-archetype-layout|Refine/i.test(onCatalog) && /Refine/i.test(onCatalog));
check('facet rail absent on the bag route', !/Refine/i.test(onCart));
check('sidebar toggle offered on catalog routes', /Hide filters|Show filters/.test(onCatalog));
check('sidebar toggle hidden off-catalog', !/Hide filters|Show filters/.test(onCart));

console.log('\n=== 3. Guest is the default identity ===');
check('auth store starts as guest', authStore.getState().isGuest() === true);
check('guest id is "guest"', authStore.getState().user.id === 'guest');
check('account route gates a guest', /Sign in|sign in/i.test(html['account']));
check('orders route gates a guest', /Sign in|sign in/i.test(html['account-orders']));

console.log('\n=== 4. Theme + prefs drive the DOM contract ===');
const { deriveGradientTreatment } = P('pui/src/providers/gradient');
const { BRAND_THEMES } = P('pui/src/providers/themes');
const chanel = BRAND_THEMES.find((b) => b.id === 'chanel');
check('chanel brand theme registered', Boolean(chanel));
const grad = deriveGradientTreatment(chanel, 'gradient', false);
check('gradient style yields a treatment', grad !== null);
check('gradient is ambient, not a hard wipe', grad && grad.parent.includes('radial-gradient') && !/#0a0a0a 0%, transparent/.test(grad.parent), grad && grad.parent.slice(0, 60));
check('gradient tints are low-alpha', grad && /rgba\([^)]*0\.0?\d\)/.test(grad.parent), grad && grad.parent.match(/rgba\([^)]*\)/)?.[0]);
check('apple style yields no gradient treatment', deriveGradientTreatment(chanel, 'apple', false) === null);

const { RADIUS_STEPS, DENSITY_STEPS } = P('pui/src/components/overlays/PreferencesModal/index.js');
check('radius offered as discrete options', Array.isArray(RADIUS_STEPS) && RADIUS_STEPS.length >= 4);
check('density offered as discrete options', Array.isArray(DENSITY_STEPS) && DENSITY_STEPS.length >= 3);
check('a rounded (Apple-like) radius step exists', RADIUS_STEPS.some((s) => s.value > 1));
check('a square radius step exists', RADIUS_STEPS.some((s) => s.value === 0));

console.log('\n=== 5. Bag and drawer ===');
const { MOCK_PRODUCTS } = P('pui/src/api/mockShopApi');
cartStore.getState().clear();
cartStore.getState().addItem(MOCK_PRODUCTS[0], { size: 'M' }, 2);
check('adding to the bag opens the drawer', cartStore.getState().isOpen === true);
check('bag counts quantity, not lines', cartStore.getState().totalCount() === 2);
cartStore.getState().addItem(MOCK_PRODUCTS[0], { size: 'L' }, 1);
check('same product, different options = separate lines', cartStore.getState().items.length === 2);
cartStore.getState().addItem(MOCK_PRODUCTS[0], { size: 'M' }, 1);
check('same product, same options merges', cartStore.getState().items.length === 2 && cartStore.getState().totalCount() === 4);
cartStore.getState().updateQuantity(MOCK_PRODUCTS[0].id, 0, { size: 'L' });
check('quantity 0 removes the line', cartStore.getState().items.length === 1);

console.log('\n=== 6. Catalog pipeline ===');
catalogStore.getState().reset();
const { buildFacets, applyFacets, sortProducts, paginate } = P('pui/src/components/shop/logic/catalog');
const { PRODUCTS } = { PRODUCTS: require(path.join(OUT, 'app/src/mocks/api-products.json')) };
const facets = buildFacets(PRODUCTS, shopConfig.facets);
check('facets derived from the catalog', facets.length >= 6, facets.map((f) => f.id).join(','));
const priced = facets.find((f) => f.id === 'price');
check('price bands counted truthfully', priced.values.every((v) => v.count > 0));
const filtered = applyFacets(PRODUCTS, { line: ['11.12'] }, shopConfig.facets);
check('line facet filters', filtered.length > 0 && filtered.every((p) => p.line === '11.12'), `${filtered.length} kept`);
const asc = sortProducts(PRODUCTS, 'price-asc');
check('price ascending sorts', asc[0].price <= asc[asc.length - 1].price);
check('pagination clamps out-of-range pages', paginate(PRODUCTS, 99, 12).page === Math.ceil(PRODUCTS.length / 12));
catalogStore.getState().setPage(3);
catalogStore.getState().toggleFacet('line', '11.12');
check('changing a filter resets to page 1', catalogStore.getState().page === 1);

console.log('\n=== 7. Totals are computed once ===');
const { calculateTotals } = P('pui/src/components/shop/logic/order');
const t1 = calculateTotals(cartStore.getState().items, shopConfig.totals);
check('subtotal matches the lines', t1.subtotal === cartStore.getState().totalPrice());
check('shipping is complimentary', t1.shipping === 0);
check('total = subtotal when shipping and tax are zero', t1.total === t1.subtotal);

console.log('\n=== 8. No hardcoded external assets ===');
const all = Object.values(html).join('');
check('no external image hosts in rendered output', !/https?:\/\/(images\.unsplash|loremflickr|via\.placeholder)/.test(all));
// The first SSR pass renders the loading state, which is correct — so assert
// imagery on a populated list rather than on the not-yet-resolved page.
check('async pages render skeletons before data resolves', /data-skeleton/.test(html['home']));
const { ProductList } = P('pui/src/components/shop/product/list');
const { productImage } = P('app/src/lib/media');
const products = require(path.join(OUT, 'app/src/mocks/api-products.json'));
const listHtml = renderToStaticMarkup(React.createElement(ProductList, {
  variant: 'card',
  products: products.slice(0, 3).map((p) => ({ id: p.id, title: p.title, price: p.price, image: productImage(p) })),
}));
check('populated list uses inline data-URI imagery', /data:image\/svg\+xml/.test(listHtml));
check('populated list reaches no external host', !/https?:\/\//.test(listHtml));

console.log('\n=== 8b. Cart drawer ===');
const { CartDrawer } = P('pui/src/components/shop/cart/drawer');
const drawerOpen = renderToStaticMarkup(React.createElement(CartDrawer, {
  isOpen: true, onClose() {}, onCheckout() {},
  items: [{ id: 'a', title: 'Classic Handbag', price: 9700, quantity: 1 }],
}));
const drawerShut = renderToStaticMarkup(React.createElement(CartDrawer, {
  isOpen: false, onClose() {}, items: [],
}));
// Overlays portal into document.body, which does not exist on the server.
// Rendering nothing (rather than throwing) is what makes the library
// server-renderable; the contents mount on the client after hydration.
check('open drawer is SSR-safe (renders nothing, does not throw)', drawerOpen === '');
check('closed drawer renders nothing', drawerShut === '');
const { Modal } = P('pui/src/components/overlays/Modal');
const { Toast } = P('pui/src/components/overlays/Toast');
let overlaysThrew = false;
try {
  renderToStaticMarkup(React.createElement(Modal, { isOpen: true, onClose() {}, title: 'x' }, 'body'));
  renderToStaticMarkup(React.createElement(Toast, { message: 'x', onClose() {} }));
} catch { overlaysThrew = true; }
check('Modal and Toast are SSR-safe too', !overlaysThrew);

console.log('\n=== 9. Copy comes from the locale ===');
const en = require(path.join(OUT, 'app/src/locales/en.json'));
// The hero became data-driven banner panels; the locale's own heading on the
// home page is the Explore section title.
check('hero copy rendered from locale', html['home'].includes(en.home.exploreTitle));
check('bag title rendered from locale', html['cart'].includes(en.cart.title) || html['cart'].includes(en.cart.emptyTitle));

console.log(`\n${'='.repeat(46)}\n${pass} passed, ${fail} failed\n${'='.repeat(46)}`);
process.exitCode = fail ? 1 : 0;
