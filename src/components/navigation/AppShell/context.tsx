'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';
import styles from './styles.module.scss';

/** What the shell tells the components inside it: whether the menu panel is open beside the content, and the stage
 *  (the layer under the whole shell) a page can paint its picture into. */
export type ShellState = { navOpen: boolean; stage?: HTMLElement | null };
const Shell = createContext<ShellState>({ navOpen: false });

export const ShellProvider: React.FC<ShellState & { children: React.ReactNode }> = ({ navOpen, stage, children }) => (
  <Shell.Provider value={{ navOpen, stage }}>{children}</Shell.Provider>
);
export const useShell = () => useContext(Shell);

/**
 * What a page wears behind the whole shell: its picture across the screen, under the header, the sidebar and the
 * content. Blurred by default, so an entity page takes its picture's colour and every surface above reads as glass;
 * `sharp` keeps the picture as it is (a welcome scene). Outside a shell it draws nothing.
 */
export const Backdrop: React.FC<{ children: React.ReactNode; sharp?: boolean }> = ({ children, sharp }) => {
  const { stage } = useShell();
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => { setHost(stage ?? null); }, [stage]);
  if (!host) return null;
  return createPortal(<div className={cn(styles.backdrop, sharp ? styles.sharp : styles.blurred)}><div className={styles.picture}>{children}</div></div>, host);
};
