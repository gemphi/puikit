import React from 'react';
import { PuiProvider } from '@pui/providers';
import { ShopProvider } from '@pui/shop';
import { RouterProvider, Routes, type Route } from './router';
import { AppShell } from './components/layout';
import { shopConfig } from './shop';
import { HomePage } from './pages/home';
import { CategoryPage } from './pages/category';
import { ProductPage } from './pages/product';
import { SearchPage } from './pages/search';
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { CheckoutSuccessPage } from './pages/checkout-success';
import { WishlistPage } from './pages/wishlist';
import { AccountPage } from './pages/account';
import { AccountOrdersPage } from './pages/account-orders';
import { AccountAddressesPage } from './pages/account-addresses';
import { AccountPaymentsPage } from './pages/account-payments';
import { AboutPage } from './pages/about';
import { NotFoundPage } from './pages/not-found';

const routeTable: Route[] = [
  { path: '/', render: () => <HomePage /> },
  { path: '/category/:slug', render: (p) => <CategoryPage slug={p.slug} /> },
  { path: '/product/:id', render: (p) => <ProductPage id={p.id} /> },
  { path: '/search', render: () => <SearchPage /> },
  { path: '/cart', render: () => <CartPage /> },
  { path: '/checkout', render: () => <CheckoutPage /> },
  { path: '/checkout/success', render: () => <CheckoutSuccessPage /> },
  { path: '/wishlist', render: () => <WishlistPage /> },
  { path: '/account', render: () => <AccountPage /> },
  { path: '/account/orders', render: () => <AccountOrdersPage /> },
  { path: '/account/addresses', render: () => <AccountAddressesPage /> },
  { path: '/account/payments', render: () => <AccountPaymentsPage /> },
  { path: '/about', render: () => <AboutPage /> },
];

/**
 * The Chanel storefront.
 *
 * `PuiProvider` runs the `shop` archetype, which supplies the structure and
 * defaults to the `chanel` brand. `ShopProvider` carries the single data seam:
 * swap `shopConfig.adapter` for a live client and nothing below here changes. The shopper starts as a guest — puijs's
 * default identity — so preferences persist under `::guest` until they sign in,
 * at which point the whole preference set swaps.
 */
export const App: React.FC = () => (
  <PuiProvider defaultTheme="light" defaultThemeStyle="gradient" defaultArchetype="shop">
    <ShopProvider {...shopConfig}>
      <RouterProvider>
        <AppShell>
          <Routes routes={routeTable} fallback={<NotFoundPage />} />
        </AppShell>
      </RouterProvider>
    </ShopProvider>
  </PuiProvider>
);
