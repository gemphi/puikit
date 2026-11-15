import React from 'react';
import { Pressable, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { site, t } from '../../lib/data';
import { useViewport } from '../../lib/viewport';
import { phieggStore } from '../../state/phieggStore';
import { stageStore } from '../../state/stageStore';
import { PhieggMark, SidePin, Wordmark } from '../Phiegg/Marks';
import styles from './Header.module.scss';

/**
 * The header's first column, exactly as wide as the sidebar under it. Open: the logo, and the pin at the right end.
 * Closed: the icon alone, and under the pointer the icon gives way to the pin that opens the sidebar. Phones have no
 * sidebar, so the icon stays.
 */
export const Brand: React.FC = () => {
  const s = useStore(phieggStore); const stage = useStore(stageStore); const { compact, mobile } = useViewport();
  // Compact windows float the panel over the content, so the cell stays rail-wide: the icon, and the pin under the pointer.
  const open = compact ? stage.float : stage.docked; const wide = open && !compact;
  const toggle = () => (compact ? stage.setFloat(!stage.float) : stage.setOpen(!stage.open));
  const home = <Pressable row gap={2} hover flex="none" paddingY={1} paddingX={2} className={styles.home} onClick={() => s.go('feed')} aria-label={site.brand.name + ' · ' + t('pgHome')}>
    <PhieggMark size="1.5rem" />{wide && <Title level={4} size="sm"><Wordmark /></Title>}
  </Pressable>;
  const pin = <Pressable hover rounded="lg" className={styles.pin} onClick={toggle} aria-expanded={open} aria-label={open ? t('hdCloseMenu') : t('hdMenu')} title={open ? t('hdCloseMenu') : t('hdMenu')}>
    <SidePin open={open} />
  </Pressable>;
  if (mobile) return <div className={[styles.brand, styles.phone].join(' ')}>{home}</div>;
  return <div className={[styles.brand, wide ? styles.brandOpen : styles.brandClosed].join(' ')}>{home}{pin}</div>;
};
