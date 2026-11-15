import React, { useEffect, useState } from 'react';
import { Box, Button, Icon } from '@pui/components';
import { useStore } from '@pui/store';
import { Search as SearchIcon, X } from 'lucide-react';
import { site, t } from '../../lib/data';
import { useViewport } from '../../lib/viewport';
import { phieggStore } from '../../state/phieggStore';
import { PhipadMark } from '../Phiegg/Marks';
import { SearchBox } from '../Phiegg/Search';
import { AccountDrawer } from '@phi-kit/AccountDrawer';
import { me } from '../../lib/data';
import { usePhieggLook } from './Appearance';
import styles from './Header.module.scss';

/** Phiegg's tools at the end of the shell's header: search (an icon and a row of its own on a phone), Phipad and the
 *  shared account drawer. Copy from data/site.json. */
export const HeaderEnd: React.FC = () => {
  const s = useStore(phieggStore); const { compact, mobile } = useViewport(); const [, setLook] = usePhieggLook();
  const [searching, setSearching] = useState(false);
  useEffect(() => { if (!mobile) setSearching(false); }, [mobile]);
  return (
    <Box className={styles.end}>
      {mobile
        ? <Button variant="ghost" size="sm" aria-label={t('hdSearch')} aria-expanded={searching} onClick={() => setSearching(!searching)} icon={<Icon icon={searching ? X : SearchIcon} size="xs" />} />
        : <Box className={styles.searchSlot}><SearchBox /></Box>}
      {compact
        ? <Button variant="primary" size="sm" aria-label={site.brand.sub} onClick={() => s.go('phipad')} icon={<PhipadMark size="1rem" />} />
        : <Button variant="primary" size="sm" icon={<PhipadMark size="1rem" />} onClick={() => s.go('phipad')}>{site.brand.sub}</Button>}
      {/* The account drawer is the shared one (phi-kit), the same in every app; Phiegg only says where its profile is. */}
      <AccountDrawer onProfile={() => s.go('profile', { profileId: me().id })} onLook={setLook} />
      {mobile && searching && <Box className={styles.searchRow}><SearchBox autoFocus onPick={() => setSearching(false)} /></Box>}
    </Box>
  );
};
