import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Text } from '../../primitives/Text';
import { Pressable } from '../../primitives/Pressable';
import styles from './styles.module.scss';

/** The pin: a rounded square with a pill at its left that widens while the menu panel is open. */
export const ShellPin: React.FC<{ open: boolean }> = ({ open }) => (
  <svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="3.5" width="19" height="17" rx="5.5" />
    <rect x="6" y="7" height="10" width={open ? 6.5 : 3} rx={open ? 3.25 : 1.5} fill="currentColor" stroke="none" className={styles.pinPill} />
  </svg>
);

/** The back arrow, drawn like the pin: the same box, the same rounded line, the same weight. */
export const ShellBack: React.FC = () => (
  <svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 6.5 9 12l5.5 5.5" />
  </svg>
);

/** The header's back control: the arrow alone, styled exactly like the pin (no button box of its own). */
export const ShellBackButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => (
  <Pressable className={styles.pin} onClick={disabled ? undefined : onClick} disabled={disabled} aria-disabled={disabled || undefined} aria-label={label} title={label}>
    <ShellBack />
  </Pressable>
);

export type ShellBrandProps = {
  /** `wordmark` is the drawn name shown in place of the plain one. */
  brand: { name: string; glyph?: React.ReactNode; wordmark?: React.ReactNode };
  open: boolean;
  onHome: () => void;
  onToggle: () => void;
  openLabel: string;
  closeLabel: string;
};

/**
 * The header's first cell, exactly as wide as the sidebar under it. Open: the logo (glyph and name) and the pin at the
 * cell's end. Closed: the glyph alone over the rail; under the pointer it gives way to the pin that opens the panel.
 */
export const ShellBrand: React.FC<ShellBrandProps> = ({ brand, open, onHome, onToggle, openLabel, closeLabel }) => (
  <Box className={cn(styles.brandCell, open ? styles.brandOpen : styles.brandClosed)}>
    <Pressable className={styles.brand} onClick={onHome} aria-label={brand.name}>
      {brand.glyph && <Box className={styles.brandGlyph}>{brand.glyph}</Box>}
      {open && (brand.wordmark ?? <Text as="span" weight="bold" className={styles.brandName}>{brand.name}</Text>)}
    </Pressable>
    <Pressable className={styles.pin} onClick={onToggle} aria-expanded={open} aria-label={open ? closeLabel : openLabel} title={open ? closeLabel : openLabel}>
      <ShellPin open={open} />
    </Pressable>
  </Box>
);
