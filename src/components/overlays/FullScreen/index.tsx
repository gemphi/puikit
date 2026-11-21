'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { Title } from '../../primitives/Title';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import { usePortalTarget } from '../usePortalTarget';
import styles from './styles.module.scss';

/** An entry either names a section of the sheet (its data-section) to bring into view, or does its own thing. */
export type FullScreenMenuItem = { id: string; label: string; icon: React.ReactNode; section?: string; onClick?: () => void };
export type FullScreenAction = { id: string; label: string; icon?: React.ReactNode; count?: string; active?: boolean; onClick: () => void };

export type FullScreenProps = {
  /** The item itself, filling the whole screen (pictures keep their shape, centred). */
  media: React.ReactNode;
  /** What comes up over the item: its author, caption, related things; the handle at the foot (or a scroll) brings it up. */
  children?: React.ReactNode;
  /** The item's buttons, a small pill of icons at the bottom right (like, comment, save, share, details); each usually opens a drawer. */
  actions?: FullScreenAction[];
  onClose: () => void;
  closeLabel?: string;
  /** The previous and next item (arrows on the right, the keys up and down). */
  onPrev?: () => void; onNext?: () => void; prevLabel?: string; nextLabel?: string;
  /** Read out for the whole view, and shown at the top left over the item. */
  label: string;
  /** Words for the handle that brings the sheet up. */
  moreLabel?: string;
  /** The colour behind the item (its own colour), else the page's. */
  tint?: string;
  /** The item's menu (About, Stats, Join, Chat…): the sheet's first column, full height, its entries held in view;
   *  give only the entries that can act. */
  menu?: FullScreenMenuItem[];
  menuLabel?: string;
  /** The info button's name: it brings the sheet (the item's details) up over the picture. */
  infoLabel?: string;
  /** The item's picture: blurred, it is the whole screen's ground, so the glass over it wears the item's own colours. */
  fill?: string;
};

/**
 * An item full screen, over the whole app with its header and sidebar out of sight: the item fills the screen, its name
 * and the way out at the top left, the next and previous on the right (and with the keys), its buttons a small pill of
 * icons at the bottom right, and a handle at the foot that brings up what belongs to it over the item.
 */
/** Inside a full-screen view: bring its sheet up over the picture, or hide it back down (a menu's Hide, an info button). */
const FullScreenContext = React.createContext<{ show: () => void; hide: () => void; up: boolean }>({ show: () => {}, hide: () => {}, up: false });
export const useFullScreen = () => React.useContext(FullScreenContext);

export const FullScreen: React.FC<FullScreenProps> = ({ media, children, actions = [], onClose, closeLabel = 'Close', onPrev, onNext, prevLabel = 'Previous', nextLabel = 'Next', label, tint, fill, moreLabel = 'More', infoLabel = 'Info', menu = [], menuLabel = 'Menu' }) => {
  const target = usePortalTarget();
  const sheet = React.useRef<HTMLElement | null>(null); const scroller = React.useRef<HTMLElement | null>(null);
  const [up, setUp] = React.useState(false);
  const show = () => sheet.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const hide = () => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
  // A section of the sheet into view: the sheet's own scroller, a little clear of the top.
  const goTo = (id: string) => { const sc = scroller.current; const el = sheet.current?.querySelector(`[data-section="${id}"]`); if (!sc || !el) return;
    sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 24, behavior: 'smooth' }); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowUp': case 'ArrowLeft': if (onPrev) { e.preventDefault(); onPrev(); } break;
        case 'ArrowDown': case 'ArrowRight': if (onNext) { e.preventDefault(); onNext(); } break;
      }
    };
    window.addEventListener('keydown', key);
    // While it is open the app's header and sidebar are out of sight altogether (the shell reads this mark), never peeking round it.
    const was = document.body.style.overflow; document.body.style.overflow = 'hidden'; document.documentElement.setAttribute('data-pui-fullscreen', '');
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = was; document.documentElement.removeAttribute('data-pui-fullscreen'); };
  }, [onClose, onPrev, onNext]);
  const view = (
    <Box className={styles.root} role="dialog" aria-modal="true" aria-label={label} style={tint ? ({ '--pui-fs-tint': tint } as React.CSSProperties) : undefined}>
      {/* As the sheet comes up the picture rises a third as fast and the controls fade (--pui-fs-k, 0 to 1). */}
      <Box ref={scroller} className={styles.scroll} onScroll={(e: React.UIEvent<HTMLElement>) => {
        const el = e.currentTarget; const k = Math.min(1, el.scrollTop / (el.clientHeight / 3)); setUp(k > 0.5);
        el.parentElement?.style.setProperty('--pui-fs-y', el.scrollTop + 'px'); el.parentElement?.style.setProperty('--pui-fs-k', String(k));
      }}>
        {fill && <img className={styles.ground} src={fill} alt="" aria-hidden="true" />}
        <Box className={styles.stage}><Box className={styles.media}>{media}</Box></Box>
        {children && (
          <Box ref={sheet} className={cn(styles.sheet, menu.length > 0 && styles.withMenu, 'phi-layers')}>
            {/* The item's menu is the sheet's first column: full height, part of the content, its entries held in view. */}
            {menu.length > 0 && (
              <Box as="nav" className={styles.menu} aria-label={menuLabel}>
                <Box className={styles.menuList}>
                  {menu.map((m) => (
                    <Pressable key={m.id} className={styles.menuItem} onClick={() => (m.section ? goTo(m.section) : m.onClick?.())} aria-label={m.label} title={m.label}>
                      <Box as="span" className={styles.menuIcon}>{m.icon}</Box><Text as="span" size="xs" weight="semibold">{m.label}</Text>
                    </Pressable>))}
                </Box>
              </Box>
            )}
            <Box className={styles.body}><FullScreenContext.Provider value={{ show, hide, up }}>{children}</FullScreenContext.Provider></Box>
          </Box>
        )}
      </Box>
      <Box className={styles.top}>
        <Pressable className={styles.round} onClick={onClose} aria-label={closeLabel} title={closeLabel}><X size={20} /></Pressable>
        <Title level={2} size="md" className={styles.title}>{label}</Title>
      </Box>
      {children && <Pressable className={cn(styles.round, styles.info)} onClick={up ? hide : show} aria-label={infoLabel} title={infoLabel} aria-expanded={up}><Info size={20} /></Pressable>}
      {children && <Pressable className={cn(styles.round, styles.handle)} onClick={() => sheet.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} aria-label={moreLabel} title={moreLabel}><ChevronUp size={20} /></Pressable>}
      {(onPrev || onNext) && (
        <Box className={styles.steps}>
          {/* Only what can be done shows: no step back on the first item, none forward on the last. */}
          {onPrev && <Pressable className={styles.round} onClick={onPrev} aria-label={prevLabel} title={prevLabel}><ChevronUp size={20} /></Pressable>}
          {onNext && <Pressable className={styles.round} onClick={onNext} aria-label={nextLabel} title={nextLabel}><ChevronDown size={20} /></Pressable>}
        </Box>
      )}
      {actions.length > 0 && (
        <Box className={cn(styles.bar, 'phi-layers')} role="toolbar" aria-label={label}>
          {actions.map((a) => (
            <Pressable key={a.id} className={cn(styles.action, a.active && styles.on)} onClick={a.onClick} aria-pressed={a.active} aria-label={a.label} title={a.label}>
              {a.icon}{a.count && <Text as="span" size="xs" weight="semibold">{a.count}</Text>}
            </Pressable>
          ))}
        </Box>
      )}
    </Box>
  );
  return target ? createPortal(view, target) : view;
};

export default FullScreen;
