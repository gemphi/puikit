import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';

export type LabelProps = {
  /** The icon the words belong to. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Lets long words wrap under themselves (a sentence beside its icon) instead of staying on one line. */
  wrap?: boolean;
  as?: 'span' | 'div' | 'p';
  className?: string;
};

/**
 * An icon with its words: the icon sits in a chip of light (tokens.scss --phi-label) that fades towards the words, so
 * an icon never sits bare on a page and the words sit on nothing. Section and relation headings use the same chip;
 * use this for every other pair (a fact with its mark, a count with its icon, a line of text with its glyph).
 */
export const Label = ({ icon, children, wrap = false, as = 'span', className }: LabelProps) => (
  <Box as={as} className={cn('pui-label', className)} style={wrap ? undefined : { whiteSpace: 'nowrap' }}>
    {icon != null && <Box as="span" className="pui-label-icon" aria-hidden="true">{icon}</Box>}
    <Box as="span" style={{ minWidth: 0, overflow: wrap ? undefined : 'hidden', textOverflow: wrap ? undefined : 'ellipsis' }}>{children}</Box>
  </Box>
);

export default Label;
