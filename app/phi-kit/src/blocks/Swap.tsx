import React from 'react';
import { Box, Button, Input, Select, Stack, Text } from '@pui/components';
import type { Block } from '../data';
import { useWallet, quote, swap, fmt, LABEL, type Coin } from '../wallet';
import s from '../kit.module.scss';

export const Swap: React.FC<{ b: Block }> = ({ b }) => {
  const w = useWallet();
  const coins: Coin[] = b.coins || ['egg', 'sum', 'usd', 'eth'];
  const fee: number = b.fee ?? 0.003;
  const [from, setFrom] = React.useState<Coin>(b.from || 'egg');
  const [to, setTo] = React.useState<Coin>(b.to || 'sum');
  const [amt, setAmt] = React.useState('100');
  const [msg, setMsg] = React.useState('');
  const n = Number(amt) || 0, got = quote(n, from, to, fee), ok = n > 0 && n <= w[from] && from !== to;
  const sel = (v: Coin, set: (c: Coin) => void, label: string) => (
    <Select size="sm" value={v} onChange={(e) => set(e.target.value as Coin)} aria-label={label} options={coins.map((c) => ({ value: c, label: LABEL[c] }))} />
  );
  return (
    <Stack maxWidth="520px" direction="column" gap={2} surface="card">
      <Text as="span" size="xs" intent="muted">You pay · balance {fmt(from, w[from])} {LABEL[from]}</Text>
      <Stack direction="row" gap={2} wrap align="center"><Input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} aria-label="Amount" />{sel(from, setFrom, 'From')}</Stack>
      <Text as="span" size="xs" intent="muted">You receive</Text>
      <Stack direction="row" gap={2} wrap align="center"><Text as="span" font="heading" size="3xl" lineHeight={1} flex="1">{fmt(to, got)}</Text>{sel(to, setTo, 'To')}</Stack>
      <Text as="span" size="xs" intent="muted">1 {LABEL[from]} = {fmt(to, quote(1, from, to, 0))} {LABEL[to]} · fee {(fee * 100).toFixed(1)}%</Text>
      <Button variant="primary" disabled={!ok} onClick={() => { if (swap(n, from, to, fee)) setMsg('Swapped ' + fmt(from, n) + ' ' + LABEL[from] + ' for ' + fmt(to, got) + ' ' + LABEL[to]); }}>{ok ? 'Swap' : n > w[from] ? 'Not enough ' + LABEL[from] : 'Enter an amount'}</Button>
      {msg ? <Text as="span" size="sm" intent="secondary" flex="1" role="status">{msg}</Text> : null}
    </Stack>
  );
};
