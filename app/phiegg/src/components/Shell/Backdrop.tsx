import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Backdrop.module.scss';

/** The stage: a full-screen layer under the header, the sidebar and the content. Pages paint into it with Backdrop. */
export const STAGE_ID = 'ph-stage';
export const Stage: React.FC = () => <div id={STAGE_ID} className={styles.stage} aria-hidden />;

/**
 * What a page wears behind everything: its picture across the whole screen, under the sidebar and the header.
 * An entity page (a look, an asset, a title, a place) blurs its own picture so the page takes its colour and every
 * surface above reads as glass; `sharp` keeps the picture as it is (the welcome scene).
 */
export const Backdrop: React.FC<{ children: React.ReactNode; sharp?: boolean }> = ({ children, sharp }) => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => { setHost(document.getElementById(STAGE_ID)); }, []);
  if (!host) return null;
  return createPortal(<div className={[styles.backdrop, sharp ? styles.sharp : styles.blurred].join(' ')}><div className={styles.picture}>{children}</div></div>, host);
};
