import React from 'react';
import { BankCard, Stack } from '@pui/components';
import { mediaUrl } from '../../lib/media';
import { fmt, t, usd, type ItemRow } from '../../lib/data';
import { Parts, hasParts, type PartDecl } from './CardPart';
/** What a coin record carries for its card (data/economy.json, written by scripts/coin-art.mjs). */
type CoinRow = { id: string; symbol: string; name: string; price: number; change24h: number; holders: number; image?: string; card?: [string, string]; platform?: boolean };
/** A card's number: two groups of dots, then the holders. */
const numberOf = (holders: number) => ['\u2022\u2022\u2022\u2022', '\u2022\u2022\u2022\u2022', String(Math.max(0, Math.round(holders))).padStart(4, '0')].join(' ');
/** A coin under a dollar keeps its cents. */
const priceOf = (p: number) => (p < 1 ? '$' + p.toFixed(2) : usd(p));
/** A coin as a bank card (puikit BankCard) with its round coin laid on it; under it, what the viewer can do (Buy). */
export const CoinCard: React.FC<{ kind: string; row: ItemRow; decl: PartDecl; open: () => void }> = ({ kind, row, decl, open }) => {
  const c = row as unknown as CoinRow;
  const [from, to] = c.card ?? [];
  const up = c.change24h >= 0;
  return (
    <Stack direction="column" gap={2}>
      <BankCard from={from} to={to} art={c.image ? mediaUrl(c.image) : undefined} onClick={open} aria-label={c.name}
        label={t(c.platform ? 'coinPlatform' : 'coinClub')} title={c.symbol} number={numberOf(c.holders)}
        note={c.platform ? t('coinIssued') : t('coinHolders', { n: fmt(c.holders) })} name={c.name}
        value={priceOf(c.price)} change={{ text: (up ? '\u25B2 ' : '\u25BC ') + Math.abs(c.change24h).toFixed(1) + '%', up }} />
      {hasParts(decl) && <Parts kind={kind} row={row} decl={decl} />}
    </Stack>
  );
};
