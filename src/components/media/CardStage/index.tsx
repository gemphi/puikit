import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Player } from '../../display/Player';
import styles from './styles.module.scss';

export type StageCard = {
  id: string;
  /** The picture: it fills its card. */
  image: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** Which of the stage's kinds it is (a reel, a show, a drop, a world). */
  kind: string;
};

export type CardStageProps = {
  cards: StageCard[];
  /** The kinds, each a pill over the stage; the first is every kind at once (its id `all`). */
  kinds: { id: string; label: string }[];
  /** A press on a card: open it (its post). */
  onOpen: (id: string) => void;
  /** Moves on by one every this many ms while the pointer is away; 0 holds still. */
  auto?: number;
  labels?: { prev?: string; next?: string; kinds?: string };
  className?: string;
};

/**
 * A stage filled with cards, as a product page shows what it has: the one in front large, the next four beside it,
 * every picture filling its card (a Player: it has depth and draws back under the pointer), its name and line on a
 * strip of blur at its foot and its kind over it. Pills over the stage choose a kind, arrows move through all of them,
 * and it moves on by itself until the pointer comes over it. There is no empty stage around a lone picture.
 */
export const CardStage = ({ cards, kinds, onOpen, auto = 6000, labels = {}, className }: CardStageProps) => {
  const [kind, setKind] = useState(kinds[0]?.id ?? 'all');
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const shown = cards.filter((card) => kind === 'all' || card.kind === kind);
  const n = shown.length;
  const go = (k: number) => setAt(((k % Math.max(n, 1)) + Math.max(n, 1)) % Math.max(n, 1));
  useEffect(() => { setAt(0); }, [kind]);
  useEffect(() => {
    if (!auto || held || n < 6) return;
    const id = setTimeout(() => go(at + 1), auto);
    return () => clearTimeout(id);
  }, [at, held, auto, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const word = (id: string) => kinds.find((k) => k.id === id)?.label ?? id;
  const five = Array.from({ length: Math.min(5, n) }, (_, i) => shown[(at + i) % n]);
  return (
    <Box as="section" className={cn(styles.stage, className)} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} aria-roledescription="carousel">
      <Box className={styles.bar}>
        <Box className={styles.kinds} role="tablist" aria-label={labels.kinds}>
          {kinds.map((k) => (
            <Box as="button" {...({ type: 'button' } as object)} key={k.id} role="tab" aria-selected={k.id === kind} className={cn(styles.kind, k.id === kind && styles.on)} onClick={() => setKind(k.id)}>{k.label}</Box>
          ))}
        </Box>
        <Box className={styles.steps}>
          <Button variant="glass" iconLeft={ChevronLeft} aria-label={labels.prev ?? 'Before'} onClick={() => go(at - 1)} />
          <Button variant="glass" iconLeft={ChevronRight} aria-label={labels.next ?? 'Next'} onClick={() => go(at + 1)} />
        </Box>
      </Box>
      <Box className={styles.grid}>
        {five.map((card, i) => (
          <Box as="button" {...({ type: 'button' } as object)} key={card.id + ':' + i} className={cn(styles.card, i === 0 && styles.lead)} onClick={() => onOpen(card.id)}>
            <Player image={card.image} label={typeof card.title === 'string' ? card.title : undefined} ratio="auto" fill className={styles.player} />
            <Box as="span" className={styles.tag}>{word(card.kind)}</Box>
            <Box as="span" className={styles.words}>
              <Text as="span" weight="semibold" className={styles.title}>{card.title}</Text>
              {card.sub ? <Text as="span" size="sm" className={styles.sub}>{card.sub}</Text> : null}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
