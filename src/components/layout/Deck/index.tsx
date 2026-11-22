import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../Box';
import styles from './styles.module.scss';

export type DeckProps = {
  children: React.ReactNode;
  /** How many bars stand above the card (cards behind it): 1 to 3, two unless said. */
  bars?: 1 | 2 | 3;
  className?: string;
};

/**
 * Deck: a card with more cards behind it. Above the card stand slim bars, each nine tenths as wide as what is under
 * it and centred on it, so a list laid as decks reads as stacks. The bars are the kit's one surface and the card's own
 * corner; nothing is copied from the card, so any card can stand in a deck.
 */
export const Deck = ({ children, bars = 2, className }: DeckProps) => (
  <Box className={cn('pui-deck', styles.deck, className)} data-bars={bars}>
    {Array.from({ length: bars }, (_, i) => <Box key={i} as="span" className={styles.bar} data-k={bars - i} aria-hidden="true" />)}
    {children}
  </Box>
);
