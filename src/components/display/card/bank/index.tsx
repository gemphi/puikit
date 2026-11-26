import React from 'react';
import { cn } from '../../../../utils/cn';
import { Box } from '../../../layout/Box';
import { Stack } from '../../../layout/Stack';
import { Text } from '../../../primitives/Text';
import { Image } from '../../../media/Image';
import { Card } from '../card';
import chip from './chip.svg';
import contactless from './contactless.svg';
import styles from './styles.module.scss';
export type BankCardProps = {
  /** The card's two colours, dark at the head-left to lighter at the foot-right. */
  from?: string;
  to?: string;
  /** A picture laid on the card's right, tilted, with a shadow under it (a coin, a badge). */
  art?: string;
  /** Small capitals at the head. */
  label?: React.ReactNode;
  /** Large, beside the chip. */
  title: React.ReactNode;
  /** The card's number, in figures. */
  number?: string;
  /** Small capitals at the foot, over `name`. */
  note?: React.ReactNode;
  name?: React.ReactNode;
  /** At the foot's end: a value and how it moved. */
  value?: React.ReactNode;
  change?: { text: string; up: boolean };
  onClick?: () => void;
  'aria-label'?: string;
  className?: string;
};
/**
 * A bank card face: two colours struck with a fine diagonal weave, a light across its head, a ring behind its art, a
 * chip, the contactless mark, a number and a name. It knows nothing of what it stands for; the app gives the words,
 * the colours and the picture. Clickable when `onClick` is given (Card makes it a button).
 */
export const BankCard = ({ from, to, art, label, title, number, note, name, value, change, onClick, className, ...rest }: BankCardProps) => (
  <Card flush hoverable={!!onClick} tint="none" onClick={onClick} aria-label={rest['aria-label']} className={cn('pui-bank-card', styles.bank, className)}
    style={{ ['--pui-bank-from' as string]: from, ['--pui-bank-to' as string]: to }}>
    <Box className={styles.ring} aria-hidden="true" />
    {art && <Image src={art} alt="" width={256} height={256} draggable={false} className={styles.art} />}
    <Stack direction="column" justify="between" className={styles.face}>
      <Stack direction="row" justify="between" align="start">
        <Text as="span" size="inherit" intent="inherit" className={styles.caps}>{label}</Text>
        <Image src={contactless} alt="" width={26} height={26} />
      </Stack>
      <Stack direction="row" align="center" gap={2} className={styles.half}>
        <Image src={chip} alt="" width={44} height={34} />
        <Text as="span" size="inherit" intent="inherit" weight="bold" truncate className={styles.title}>{title}</Text>
      </Stack>
      {number && <Text as="span" size="inherit" intent="inherit" mono className={cn(styles.number, styles.half)}>{number}</Text>}
      <Stack direction="row" justify="between" align="end" gap={2}>
        <Stack direction="column" gap={0} className={styles.foot}>
          {note && <Text as="span" size="inherit" intent="inherit" className={styles.note}>{note}</Text>}
          {name && <Text as="span" size="inherit" intent="inherit" truncate className={styles.name}>{name}</Text>}
        </Stack>
        <Stack direction="column" gap={0} align="end">
          {value && <Text as="span" size="inherit" intent="inherit" weight="bold" className={styles.value}>{value}</Text>}
          {change && <Text as="span" size="inherit" intent="inherit" weight="bold" className={change.up ? styles.up : styles.down}>{change.text}</Text>}
        </Stack>
      </Stack>
    </Stack>
  </Card>
);
