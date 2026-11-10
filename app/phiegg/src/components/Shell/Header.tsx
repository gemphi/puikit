import React, { useEffect, useState } from 'react';
import { Box, Button, Icon } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronLeft, Search as SearchIcon, X } from 'lucide-react';
import { site, t } from '../../lib/data';
import { useViewport } from '../../lib/viewport';
import { phieggStore } from '../../state/phieggStore';
import { PhipadMark } from '../Phiegg/Marks';
import { Crumbs, SearchBox } from '../Phiegg/Search';
import { AccountMenu } from './HeaderMenus';
import { Brand } from './Brand';
import styles from './Header.module.scss';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

/** Two columns and no border. The first is the brand cell over the sidebar (Brand.tsx). The second lines up with the
 *  content under it: back + breadcrumbs at the content's left edge, search, Phipad and the account menu at its right.
 *  Copy and marks from data/site.json; folds below site.compactBelow and again on phones. */
export const Header: React.FC<HeaderProps> = () => {
  const s = useStore(phieggStore); const { compact, mobile } = useViewport();
  const [searching, setSearching] = useState(false);
  useEffect(() => { if (!mobile) setSearching(false); }, [mobile]);
  return (
    <>
      <Box as="header" className={[styles.bar, compact ? styles.compact : ''].join(' ')}>
        <Brand />
        <Box className={styles.lane}><Box className={styles.row}>
          <Box className={styles.start}>
            {mobile
              ? <Button variant="ghost" size="sm" aria-label={t('navBack')} disabled={!s.hist.length} onClick={s.back} icon={<Icon icon={ChevronLeft} size="xs" />} />
              : <Crumbs compact={compact} />}
          </Box>
          <Box className={styles.end}>
            {mobile
              ? <Button variant="ghost" size="sm" aria-label={t('hdSearch')} aria-expanded={searching} onClick={() => setSearching(!searching)} icon={<Icon icon={searching ? X : SearchIcon} size="xs" />} />
              : <Box className={styles.searchSlot}><SearchBox /></Box>}
            {compact
              ? <Button variant="primary" size="sm" aria-label={site.brand.sub} onClick={() => s.go('phipad')} icon={<PhipadMark size="1rem" />} />
              : <Button variant="primary" size="sm" icon={<PhipadMark size="1rem" />} onClick={() => s.go('phipad')}>{site.brand.sub}</Button>}
            <AccountMenu />
          </Box>
        </Box></Box>
      </Box>
      {mobile && searching && <Box className={styles.searchRow}><SearchBox autoFocus onPick={() => setSearching(false)} /></Box>}
    </>
  );
};
