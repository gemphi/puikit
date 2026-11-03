import React, { useMemo, useState } from 'react';
import { Page, Container, Section } from '@pui/components';
import { Header } from './header';
import { CategoryBar } from './category-bar';
import { FacetRail } from './facet-rail';
import { Footer } from './footer';
import { useRouter } from '../../router';
import { routes } from '../../lib/routes';
import { useCartLines } from '../../lib/present';
import { t } from '../../locales/t';
import { useCatalog, useShop, CartDrawer } from '@pui/shop';

/** Routes where a facet rail is meaningful. Elsewhere it is not offered at all. */
const isFaceted = (path: string) =>
  path === '/' || path === '/search' || path.startsWith('/category/');

/**
 * The shop archetype's structure, realised with `Page`.
 *
 * The rail is both contextual and toggleable: it exists only on catalog routes,
 * and can be collapsed anywhere. Passing `sidebar={undefined}` makes `Page`
 * collapse to header + main so the content reclaims the full width — which is
 * why the archetype declares `supportsSidebar` rather than hardcoding a rail.
 */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bagOpen, setBagOpen] = useState(false);
  const shop = useShop();
  const cartLines = useCartLines();
  const faceted = isFaceted(path);
  const showSidebar = faceted && sidebarOpen;

  // The rail is counted from the same scope the page renders.
  const categorySlug = path.startsWith('/category/') ? path.split('/')[2] : undefined;
  const { facets } = useCatalog(categorySlug);
  const rail = useMemo(
    () => (showSidebar ? <FacetRail facets={facets} onClose={() => setSidebarOpen(false)} /> : undefined),
    [showSidebar, facets]
  );

  return (
    <Page
      direction="row"
      header={
        <Section as="header">
          <Header
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            sidebarOpen={showSidebar}
            showSidebarToggle={faceted}
            onOpenBag={() => setBagOpen(true)}
          />
          <CategoryBar />
        </Section>
      }
      sidebar={rail}
      footer={<Footer />}
    >
      <Container size="full">{children}</Container>

      {/* The bag is reachable from anywhere without leaving the page: the
          drawer reads the same lines the cart page does, through `useCartLines`. */}
      <CartDrawer
        isOpen={bagOpen}
        onClose={() => setBagOpen(false)}
        items={cartLines()}
        onUpdateQuantity={(id, qty) => shop.cart.updateQuantity(id, qty)}
        onRemoveItem={(id) => shop.cart.remove(id)}
        onCheckout={() => {
          setBagOpen(false);
          navigate(routes.checkout());
        }}
        currency={shop.config.locale.currency}
        labels={{
          title: (n) => t.cart.drawerTitle.replace('{count}', String(n)),
          empty: t.cart.emptyTitle,
          continueShopping: t.cart.continue,
          summary: {
            subtotal: t.cart.subtotal,
            shipping: t.cart.shipping,
            total: t.cart.total,
            checkout: t.cart.checkout,
            free: t.cart.shippingFree,
          },
        }}
      />
    </Page>
  );
};
