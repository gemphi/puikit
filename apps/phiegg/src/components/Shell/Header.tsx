import React, { useEffect, useState } from 'react';
import { Box, Button, Icon, Navbar, NavbarSection, Pressable, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronLeft, Search as SearchIcon, X } from 'lucide-react';
import { site, t } from '../../lib/data';
import { useViewport } from '../../lib/viewport';
import { phieggStore } from '../../state/phieggStore';
import { PhieggMark, PhipadMark, Wordmark } from '../Phiegg/Marks';
import { Crumbs, SearchBox } from '../Phiegg/Search';
import { AccountMenu } from './HeaderMenus';
import styles from './Header.module.scss';

interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

/** Brand, back + breadcrumbs, global search, Phipad and the account menu (wallet, cart, theme and mode live inside it).
 *  Copy and marks from data/site.json; folds below site.compactBelow and again on phones. */
export const Header: React.FC<HeaderProps> = ({ onSelectTab }) => {
  const s = useStore(phieggStore); const { compact, mobile } = useViewport();
  const [searching, setSearching] = useState(false);
  useEffect(() => { if (!mobile) setSearching(false); }, [mobile]);
  return (
    <>
      <Navbar sticky variant="solid" height={56} className={[styles.bar, compact ? styles.compact : ''].join(' ')}>
        <NavbarSection align="start" className={styles.start}>
          <Pressable row gap={2} hover flex="none" paddingY={1} paddingX={2} color="primary" onClick={() => onSelectTab('feed')} aria-label={site.brand.name + ' · ' + t('pgHome')}>
            <PhieggMark size="1.5rem" />
            {!mobile && <Title level={4} size="sm"><Wordmark /></Title>}
          </Pressable>
          {mobile
            ? <Button variant="ghost" size="sm" aria-label={t('navBack')} disabled={!s.hist.length} onClick={s.back} icon={<Icon icon={ChevronLeft} size="xs" />} />
            : <Crumbs compact={compact} />}
        </NavbarSection>

        <NavbarSection align="end" className={styles.end}>
          {mobile
            ? <Button variant="ghost" size="sm" aria-label={t('hdSearch')} aria-expanded={searching} onClick={() => setSearching(!searching)} icon={<Icon icon={searching ? X : SearchIcon} size="xs" />} />
            : <Box className={styles.searchSlot}><SearchBox /></Box>}
          {compact
            ? <Button variant="primary" size="sm" aria-label={site.brand.sub} onClick={() => s.go('phipad')} icon={<PhipadMark size="1rem" />} />
            : <Button variant="primary" size="sm" icon={<PhipadMark size="1rem" />} onClick={() => s.go('phipad')}>{site.brand.sub}</Button>}
          <AccountMenu />
        </NavbarSection>
      </Navbar>
      {mobile && searching && <Box className={styles.searchRow}><SearchBox autoFocus onPick={() => setSearching(false)} /></Box>}
    </>
  );
};
