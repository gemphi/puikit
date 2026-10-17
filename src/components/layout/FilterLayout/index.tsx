import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Drawer } from '../../overlays/Drawer';
import styles from './styles.module.scss';

export type FilterLayoutProps = {
  open: boolean; onClose: () => void; title?: React.ReactNode; filters: React.ReactNode; children: React.ReactNode; closeLabel?: string; className?: string;
  /** `drawer` (default): the filters slide in as a drawer from the right over the page. `aside`: a third sidebar beside the content. */
  mode?: 'drawer' | 'aside';
};

/**
 * FilterLayout — page content with a filter sidebar (a third sidebar) that slides in on the right when open. On
 * phones the sidebar sits above the content. Width, radius, surfaces and motion are theme tokens.
 */
export const FilterLayout = ({ open, onClose, title = 'Filter & sort', filters, children, closeLabel = 'Close filters', className, mode = 'drawer' }: FilterLayoutProps) => (
  <Box className={cn(styles.layout, mode === 'aside' && open && styles.open, className)}>
    <Box className={styles.content}>{children}</Box>
    {mode === 'drawer' ? (
      <Drawer isOpen={open} onClose={onClose} position="right" size="sm" title={title}>
        <Box className={styles.body}>{filters}</Box>
      </Drawer>
    ) : open && (
      <Box as="aside" className={styles.aside} aria-label={typeof title === 'string' ? title : 'Filters'}>
        <Box className={styles.head}><Text size="sm" weight="semibold">{title}</Text><Button variant="icon" size="sm" onClick={onClose} aria-label={closeLabel}><X size={15} /></Button></Box>
        <Box className={styles.body}>{filters}</Box>
      </Box>
    )}
  </Box>
);
