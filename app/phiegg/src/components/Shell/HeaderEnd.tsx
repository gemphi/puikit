import React, { useEffect, useState } from 'react';
import { Box, Button, Icon } from '@pui/components';
import { useStore } from '@pui/store';
import { Search as SearchIcon, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../lib/cart';
import { site, t } from '../../lib/data';
import { routeOf } from '../../lib/route';
import { useViewport } from '../../lib/viewport';
import { phieggStore } from '../../state/phieggStore';
import { PhipadMark } from '../Phiegg/Marks';
import { SearchBox } from '../Phiegg/Search';
import { AccountDrawer } from '@phi-kit/AccountDrawer';
import { me } from '../../lib/data';
import { usePhieggLook } from './Appearance';
import styles from './Header.module.scss';

/** The tools at the end of the shell's header. Which ones a path shows, and in what order, is data (data/route.json
 *  `header`); each tool is drawn once here. Copy from data/site.json. */
export const HeaderEnd: React.FC = () => {
  const s = useStore(phieggStore); const { compact, mobile } = useViewport(); const [, setLook] = usePhieggLook();
  const [searching, setSearching] = useState(false); const { cart } = useCart();
  useEffect(() => { if (!mobile) setSearching(false); }, [mobile]);
  const tool: Record<string, () => React.ReactNode> = {
    // Search is an icon and a row of its own on a phone.
    search: () => (mobile
      ? <Button variant="glass" aria-label={t('hdSearch')} aria-expanded={searching} onClick={() => setSearching(!searching)} icon={<Icon icon={searching ? X : SearchIcon} size="xs" />} />
      : <Box className={styles.searchSlot}><SearchBox /></Box>),
    phipad: () => <Button variant="glass" aria-label={site.brand.sub} onClick={() => s.go('phipad')} icon={<PhipadMark size="1rem" />}>{compact ? undefined : site.brand.sub}</Button>,
    cart: () => <Button variant="glass" aria-label={t('shCart', { n: cart.length })} onClick={s.openCart} icon={<Icon icon={ShoppingBag} size="xs" />}>{compact ? undefined : t('shCart', { n: cart.length })}</Button>,
    // The account drawer is the shared one (phi-kit), the same in every app; Phiegg only says where its profile is.
    account: () => <AccountDrawer onProfile={() => s.go('profile', { profileId: me().id })} onLook={setLook} />,
  };
  return (
    <Box className={styles.end}>
      {routeOf(s.tab).header.map((id) => <React.Fragment key={id}>{tool[id]?.()}</React.Fragment>)}
      {mobile && searching && <Box className={styles.searchRow}><SearchBox autoFocus onPick={() => setSearching(false)} /></Box>}
    </Box>
  );
};
