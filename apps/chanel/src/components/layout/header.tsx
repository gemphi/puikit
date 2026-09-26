import React, { useState } from 'react';
import { Navbar, NavbarSection, Button, Badge, Input, Text, Stack, PreferencesModal } from '@pui/components';
import { Menu, Search, ShoppingBag, Heart, User, SlidersHorizontal } from 'lucide-react';
import { useCatalogStore } from '@pui/store';
import { useCart, useWishlist, useAuth } from '@pui/shop';
import { useRouter } from '../../router';
import { routes } from '../../lib/routes';
import { t } from '../../locales/t';
import s from '../../styles/chanel.module.scss';

export interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  showSidebarToggle: boolean;
  /** Opens the bag drawer. The header owns the affordance, the shell the state. */
  onOpenBag: () => void;
}

/**
 * The utility bar. Counts come from the hooks, which read their own stores, so
 * the header re-renders on a bag change with nothing threaded down from the
 * shell.
 */
export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen, showSidebarToggle, onOpenBag }) => {
  const { navigate } = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  const { isGuest } = useAuth();
  const query = useCatalogStore((st) => st.query);
  const setQuery = useCatalogStore((st) => st.setQuery);

  const [prefsOpen, setPrefsOpen] = useState(false);

  const submitSearch = () => navigate(routes.search(query));

  return (
    <>
      <Navbar sticky variant="transparent">
      <NavbarSection align="start">
        <Stack direction="row" align="center" gap={2}>
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={sidebarOpen ? t.nav.hideFilters : t.nav.showFilters}
              aria-expanded={sidebarOpen}
              onClick={onToggleSidebar}
              icon={<Menu size={16} />}
            />
          )}
          <Button variant="ghost" className={s.plainButton} onClick={() => navigate(routes.home())}>
            <Text as="span" className={s.wordmark}>
              {t.brand.name}
            </Text>
          </Button>
        </Stack>
      </NavbarSection>

      <NavbarSection align="center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
          placeholder={t.nav.search}
          aria-label={t.nav.searchLabel}
          icon={<Search size={14} />}
        />
      </NavbarSection>

      <NavbarSection align="end">
        <Stack direction="row" align="center" gap={1}>
          <Button variant="ghost" size="sm" onClick={() => navigate(routes.account())} icon={<User size={16} />}>
            {isGuest ? t.nav.signIn : t.nav.account}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t.nav.wishlist}
            onClick={() => navigate(routes.wishlist())}
            icon={<Heart size={16} />}
          >
            {wishlist.count > 0 ? <Badge variant="count">{wishlist.count}</Badge> : null}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t.nav.cart}
            onClick={onOpenBag}
            icon={<ShoppingBag size={16} />}
          >
            {cart.count > 0 ? <Badge variant="count">{cart.count}</Badge> : null}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t.nav.preferences}
            onClick={() => setPrefsOpen(true)}
            icon={<SlidersHorizontal size={16} />}
          />
        </Stack>
      </NavbarSection>
      </Navbar>

      {/* Preferences belong to the shopper, guest included: puijs persists them
          under the `::guest` namespace until a sign-in swaps the whole set. */}
      <PreferencesModal isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  );
};
