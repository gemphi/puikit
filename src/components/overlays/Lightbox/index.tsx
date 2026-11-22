'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Download, ExternalLink, Share2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import { usePortalTarget } from '../usePortalTarget';
import styles from './styles.module.scss';

/** One picture to look at: the file, and who posted it and when (their face, their name, the day and hour). */
export type LightboxItem = { src: string; alt?: string; name?: string; when?: string; face?: React.ReactNode };

/** Words the viewer says; English by default. */
export type LightboxLabels = { close: string; prev: string; next: string; zoom: string; fit: string; share: string; shared: string; download: string; open: string; strip: string };
const WORDS: LightboxLabels = { close: 'Close', prev: 'Previous', next: 'Next', zoom: 'Zoom in', fit: 'Fit to the screen', share: 'Share', shared: 'Link copied', download: 'Download', open: 'Open in a new tab', strip: 'Pictures' };

export type LightboxProps = {
  /** Every picture that can be stepped through (a room's, a profile's), in order. */
  list: LightboxItem[];
  /** The one shown, and what to do when another is picked (an arrow, a key, a press on the strip). */
  index: number; onIndex: (index: number) => void;
  onClose: () => void;
  /** Read out for the whole view. */
  label: string;
  labels?: Partial<LightboxLabels>;
};

/**
 * A picture opened from where it was posted, over the whole app, which stays dimmed behind it: who posted it and when
 * at the top left; its tools at the top right (larger and back, share, download, open in a new tab) and the way out
 * beside them; the picture whole in the middle; the one before and the one after at the sides (and with the arrow
 * keys); and at the foot a strip of every picture there is to step through, the one shown marked. Escape or a press
 * beside the picture closes it.
 */
export const Lightbox: React.FC<LightboxProps> = ({ list, index, onIndex, onClose, label, labels }) => {
  const W = { ...WORDS, ...labels };
  const target = usePortalTarget();
  const [large, setLarge] = React.useState(false);
  const [told, setTold] = React.useState(false);
  const strip = React.useRef<HTMLElement | null>(null);
  const at = Math.min(Math.max(index, 0), list.length - 1);
  const shown = list[at];
  const go = React.useCallback((to: number) => { if (to >= 0 && to < list.length) onIndex(to); }, [list.length, onIndex]);
  // Another picture is seen whole first, and has not been shared yet.
  useEffect(() => { setLarge(false); setTold(false); }, [at]);
  useEffect(() => { strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' }); }, [at]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': e.preventDefault(); go(at - 1); break;
        case 'ArrowRight': e.preventDefault(); go(at + 1); break;
      }
    };
    window.addEventListener('keydown', key);
    const was = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = was; };
  }, [onClose, go, at]);
  if (!shown) return null;

  /** Hand the picture's address on: the device's own share sheet where it has one, the clipboard where it has not. */
  const share = () => {
    const url = new URL(shown.src, window.location.href).href;
    const done = navigator.share ? navigator.share({ url }) : navigator.clipboard?.writeText(url).then(() => setTold(true));
    done?.catch(() => undefined);
  };
  const file = shown.src.split(/[?#]/)[0].split('/').pop() || 'picture';

  const view = (
    <Box className={styles.root} role="dialog" aria-modal="true" aria-label={label}>
      <Box className={styles.veil} onClick={onClose} aria-hidden="true" />
      <Box className={cn(styles.stage, large && styles.large)} onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}>
        <img className={styles.picture} src={shown.src} alt={shown.alt ?? ''} onClick={() => setLarge(!large)} />
      </Box>
      {(shown.name || shown.when) && (
        <Box className={styles.who}>
          {shown.face}
          <Box className={styles.said}>
            {shown.name && <Text as="span" size="sm" weight="semibold" truncate>{shown.name}</Text>}
            {shown.when && <Text as="span" size="xs" intent="muted" truncate>{shown.when}</Text>}
          </Box>
        </Box>
      )}
      <Box className={styles.top}>
        <Box className={styles.tools} role="toolbar" aria-label={label}>
          <Pressable className={styles.tool} onClick={() => setLarge(!large)} aria-pressed={large} aria-label={large ? W.fit : W.zoom} title={large ? W.fit : W.zoom}>{large ? <ZoomOut size={18} /> : <ZoomIn size={18} />}</Pressable>
          <Pressable className={styles.tool} onClick={share} aria-label={told ? W.shared : W.share} title={told ? W.shared : W.share}><Share2 size={18} /></Pressable>
          <Pressable className={styles.tool} href={shown.src} {...({ download: file } as object)} aria-label={W.download} title={W.download}><Download size={18} /></Pressable>
          <Pressable className={styles.tool} href={shown.src} {...({ target: '_blank', rel: 'noreferrer' } as object)} aria-label={W.open} title={W.open}><ExternalLink size={18} /></Pressable>
        </Box>
        <Pressable className={styles.round} onClick={onClose} aria-label={W.close} title={W.close}><X size={20} /></Pressable>
      </Box>
      {/* Only what can be done shows: no step back on the first picture, none forward on the last. */}
      {at > 0 && <Pressable className={cn(styles.round, styles.prev)} onClick={() => go(at - 1)} aria-label={W.prev} title={W.prev}><ArrowLeft size={20} /></Pressable>}
      {at < list.length - 1 && <Pressable className={cn(styles.round, styles.next)} onClick={() => go(at + 1)} aria-label={W.next} title={W.next}><ArrowRight size={20} /></Pressable>}
      {list.length > 1 && (
        <Box ref={strip} className={styles.strip} role="tablist" aria-label={W.strip}>
          {list.map((it, i) => (
            <Pressable key={it.src + i} className={cn(styles.thumb, i === at && styles.on)} role="tab" aria-selected={i === at} current={i === at} onClick={() => go(i)} aria-label={[it.name, it.when].filter(Boolean).join(', ') || String(i + 1)}>
              <img src={it.src} alt="" loading="lazy" decoding="async" />
            </Pressable>
          ))}
        </Box>
      )}
    </Box>
  );
  return target ? createPortal(view, target) : view;
};

export default Lightbox;
