
import React from 'react';
import { Box, Button, Divider, Frame, Grid, Input, Pressable, ProgressBar, Select, Stack, Table, Tag, Tbody, Td, Text, Th, Thead, Title, Tr } from '@pui/components';
import { useWallet, quote, swap, fmt, LABEL, type Coin } from '@phi-kit/wallet';
import k from '@phi-kit/kit.module.scss';
import s from './app.module.scss';
import { num, pctOf, met, STATUS, votes, castVote, tone, initials, type DB, type Proposal } from './data';

export type Open = { kind: 'proposal' | 'delegate' | 'news'; id: string };
const Head: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (<Stack as="header" direction="column" gap={2}><Title level={1} size="2xl">{title}</Title>{sub ? <Text intent="secondary" maxWidth="60ch">{sub}</Text> : null}</Stack>);

const VoteBar: React.FC<{ p: Proposal }> = ({ p }) => {
  const pf = pctOf(p);
  return (
    <>
      <ProgressBar value={pf / 100} color="var(--phi-color-success)" rest="var(--phi-color-error)" />
      <Text size="xs" intent="muted" as="span">{pf}% for · {num(p.for)} vs {num(p.against)} · quorum {met(p) ? 'met' : num(p.quorum) + ' needed'}</Text>
    </>
  );
};

export const Home: React.FC<{ db: DB; go: (v: string) => void; onOpen: (o: Open) => void }> = ({ db, go, onOpen }) => {
  const open = db.proposals.filter((p) => p.status === 'open');
  return (
    <>
      <Stack as="section" direction="column" gap={3} surface="hero">
        <Title level={1} size="2xl">{db.hero.title}</Title>
        <Text size="lg" intent="secondary">{db.hero.subtitle}</Text>
        <Text size="sm" intent="secondary" maxWidth="64ch">{db.hero.body}</Text>
        <Stack direction="row" gap={2} wrap align="center"><Button variant="primary" onClick={() => go('proposals')}>See proposals</Button><Button variant="outline" onClick={() => go('swap')}>Swap tokens</Button></Stack>
      </Stack>
      <Stack autoFill="150px" gap={3}>{db.stats.map((st) => <Stack key={st.label} direction="column" gap={2} surface="card"><Text size="xs" intent="muted" as="span">{st.label}</Text><Text font="heading" size="3xl" lineHeight={1} as="span">{st.value}</Text><Text size="sm" intent="secondary" as="span">{st.sub}</Text></Stack>)}</Stack>
      <Stack as="section" direction="column" gap={3}>
        <Stack direction="row" justify="between" align="baseline" gap={2} wrap><Title level={2} size="lg">Open for voting</Title><Button size="sm" variant="ghost" onClick={() => go('proposals')}>All proposals</Button></Stack>
        <Stack direction="column" gap={3}>{open.map((p) => (
          <Pressable key={p.id} fill onClick={() => onOpen({ kind: 'proposal', id: p.id })} card column gap={2}>
            <Stack direction="row" justify="between" align="baseline" gap={2} wrap><Text as="strong" weight="bold">{p.n} · {p.title}</Text><Tag minimal round intent={STATUS[p.status].intent}>{p.closes}</Tag></Stack>
            <Text size="sm" intent="secondary">{p.summary}</Text><VoteBar p={p} />
          </Pressable>))}</Stack>
      </Stack>
    </>
  );
};

export const Proposals: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const [f, setF] = React.useState('All');
  const mine = votes();
  const list = db.proposals.filter((p) => f === 'All' || p.status === f.toLowerCase());
  return (
    <>
      <Head title="Proposals" sub="Vote with your Phiput weight. Any member can propose." />
      <Stack direction="row" gap={2} wrap align="center">{['All', 'Open', 'Passed', 'Rejected'].map((x) => <Button key={x} size="sm" variant={f === x ? 'primary' : 'outline'} onClick={() => setF(x)}>{x}</Button>)}</Stack>
      <Stack direction="column" gap={3}>{list.map((p) => (
        <Pressable key={p.id} fill onClick={() => onOpen({ kind: 'proposal', id: p.id })} card column gap={2}>
          <Stack direction="row" justify="between" align="baseline" gap={2} wrap><Text as="strong" weight="bold">{p.n} · {p.title}</Text><Stack direction="row" gap={2} wrap align="center"><Tag minimal round>{p.category}</Tag><Tag minimal round intent={STATUS[p.status].intent}>{STATUS[p.status].label}</Tag></Stack></Stack>
          <Text size="sm" intent="secondary">{p.summary}</Text><VoteBar p={p} />
          <Text size="xs" intent="muted" as="span">{p.status === 'open' ? p.closes : 'by ' + p.proposer}{mine[p.id] ? ' · you voted ' + mine[p.id] : ''}</Text>
        </Pressable>))}</Stack>
    </>
  );
};

export const Treasury: React.FC<{ db: DB }> = ({ db }) => (
  <>
    <Head title="Treasury" sub={'Held in the open. ' + db.treasury.total + ' across four assets.'} />
    <Box surface="panel" padding={0} scroll="x"><Table><Thead><Tr><Th>Asset</Th><Th>Amount</Th><Th>Value (USD)</Th><Th>Share</Th><Th>7d</Th></Tr></Thead>
      <Tbody>{db.treasury.holdings.map((h) => <Tr key={h.asset}><Td><Text as="strong" weight="bold">{h.asset}</Text></Td><Td>{h.amount}</Td><Td>{h.usd.toLocaleString('en-US')}</Td><Td>{h.pct}%</Td><Td>{h.change}</Td></Tr>)}</Tbody></Table></Box>
    <Stack as="section" direction="column" gap={3}><Title level={2} size="lg">Recent flows</Title>
      <Box surface="panel" padding={0} scroll="x"><Table><Thead><Tr><Th>Date</Th><Th>Movement</Th><Th>Amount</Th></Tr></Thead>
        <Tbody>{db.treasury.flows.map((fl, i) => <Tr key={i}><Td>{fl.date}</Td><Td>{fl.what}</Td><Td><Text as="span" size="sm" intent={fl.dir === 'in' ? 'primary' : 'secondary'}>{fl.amount} {fl.coin}</Text></Td></Tr>)}</Tbody></Table></Box>
    </Stack>
  </>
);

export const SwapPage: React.FC<{ db: DB }> = ({ db }) => {
  const w = useWallet();
  const coins = db.swap.coins as Coin[]; const fee = db.swap.fee;
  const [from, setFrom] = React.useState<Coin>(db.swap.from as Coin);
  const [to, setTo] = React.useState<Coin>(db.swap.to as Coin);
  const [amt, setAmt] = React.useState('100'); const [msg, setMsg] = React.useState('');
  const n = Number(amt) || 0, got = quote(n, from, to, fee), ok = n > 0 && n <= w[from] && from !== to;
  const sel = (v: Coin, set: (c: Coin) => void, label: string) => <Select size="sm" value={v} onChange={(e) => set(e.target.value as Coin)} aria-label={label} options={coins.map((c) => ({ value: c, label: LABEL[c] }))} />;
  return (
    <>
      <Head title="Swap" sub={'$EGG and $SUM interchange here, priced from the token table. ' + (fee * 100).toFixed(1) + '% goes to the treasury.'} />
      <Stack maxWidth="520px" direction="column" gap={2} surface="card">
        <Text size="xs" intent="muted" as="span">You pay · balance {fmt(from, w[from])} {LABEL[from]}</Text>
        <Stack direction="row" gap={2} wrap align="center"><Input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} aria-label="Amount" />{sel(from, setFrom, 'From')}</Stack>
        <Text size="xs" intent="muted" as="span">You receive</Text>
        <Stack direction="row" gap={2} wrap align="center"><Text font="heading" size="3xl" lineHeight={1} as="span" flex="1">{fmt(to, got)}</Text>{sel(to, setTo, 'To')}</Stack>
        <Text size="xs" intent="muted" as="span">1 {LABEL[from]} = {fmt(to, quote(1, from, to, 0))} {LABEL[to]} · fee {(fee * 100).toFixed(1)}%</Text>
        <Button variant="primary" disabled={!ok} onClick={() => { if (swap(n, from, to, fee)) setMsg('Swapped ' + fmt(from, n) + ' ' + LABEL[from] + ' for ' + fmt(to, got) + ' ' + LABEL[to]); }}>{ok ? 'Swap' : n > w[from] ? 'Not enough ' + LABEL[from] : 'Enter an amount'}</Button>
        {msg ? <Text size="sm" intent="secondary" as="span" role="status">{msg}</Text> : null}
      </Stack>
    </>
  );
};

export const Delegates: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => (
  <>
    <Head title="Delegates" sub="Members who vote on behalf of others. Delegation is revocable any time." />
    <Stack autoFill="220px" gap={3}>{db.delegates.map((d) => { const [bg, ink] = tone(d.tone); return (
      <Pressable key={d.id} fill onClick={() => onOpen({ kind: 'delegate', id: d.id })} card column gap={2}>
        <Stack direction="row" align="center" gap={3}><Box flex="none"><Frame ratio="1/1" width="40px" rounded="full" tint={bg} tintStrength={100} ink={ink}><Text size="sm" weight="bold" as="span">{initials(d.name)}</Text></Frame></Box><Stack direction="column"><Text as="strong" weight="bold">{d.name}</Text><Text size="xs" intent="muted" as="span">{num(d.weight)} PFT · {d.votes} votes</Text></Stack></Stack>
        <Text size="sm" intent="secondary">{d.bio}</Text>
      </Pressable>); })}</Stack>
  </>
);

export const NewsPage: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => (
  <>
    <Head title="News" sub="Decisions, treasury reports and drafts from the council." />
    <Stack direction="column" gap={3} maxWidth="760px">{db.news.map((nw) => (
      <Stack key={nw.id} direction="column" gap={3}>
        <Pressable fill pad="sm" hover onClick={() => onOpen({ kind: 'news', id: nw.id })}>
          <Stack direction="column" gap={2}>
            <Stack direction="row" gap={2} wrap align="center"><Tag minimal round>{nw.tag}</Tag><Text size="xs" intent="muted" as="span">{nw.date}</Text></Stack>
            <Title level={3} size="md">{nw.title}</Title><Text size="sm" intent="secondary">{nw.body}</Text>
          </Stack>
        </Pressable>
        <Divider />
      </Stack>))}</Stack>
  </>
);

export const About: React.FC<{ db: DB }> = ({ db }) => (
  <>
    <Head title="About Phidao" />
    <Stack direction="column" gap={4} maxWidth="70ch">
      <Text size="lg" intent="secondary">{db.about.body}</Text>
      {db.about.sections.map((sec) => <Stack as="section" key={sec.title} direction="column" gap={2}><Title level={2} size="lg">{sec.title}</Title><Text size="sm" intent="secondary">{sec.body}</Text></Stack>)}
      <Stack as="section" direction="column" gap={3}><Title level={2} size="lg">Parameters</Title>
        <Box surface="panel" padding={0} scroll="x"><Table><Tbody>
          <Tr><Td>Quorum</Td><Td>{db.params.quorum}</Td></Tr><Tr><Td>Voting period</Td><Td>{db.params.votingPeriod}</Td></Tr>
          <Tr><Td>Proposal stake</Td><Td>{db.params.proposalStake}</Td></Tr><Tr><Td>Pass threshold</Td><Td>{db.params.passThreshold}</Td></Tr>
        </Tbody></Table></Box>
      </Stack>
    </Stack>
  </>
);

export const Docs: React.FC<{ db: DB }> = ({ db }) => (
  <>
    <Head title="Docs" sub="How governance works, in detail." />
    <Stack autoFill="220px" gap={3}>{db.docs.map((d) => (
      <Stack key={d.title} direction="column" gap={2} surface="card"><Text size="xs" intent="muted" as="span">{d.sub}</Text><Title level={3} size="md">{d.title}</Title><Text size="sm" intent="secondary">{d.body}</Text>{d.action ? <Button size="sm" variant="outline" href={d.href}>{d.action}</Button> : null}</Stack>))}</Stack>
    <Stack as="section" direction="column" gap={3}><Title level={2} size="lg">FAQ</Title>
      {db.faq.map((f) => <Stack key={f.q} direction="column" gap={1} maxWidth="70ch" paddingY={4} rule="bottom"><Text as="strong" weight="bold">{f.q}</Text><Text size="sm" intent="secondary" as="span">{f.a}</Text></Stack>)}</Stack>
  </>
);

export const Panel: React.FC<{ db: DB; open: Open; onClose: () => void }> = ({ db, open, onClose }) => {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  if (open.kind === 'proposal') {
    const p = db.proposals.find((x) => x.id === open.id)!; const mine = votes()[p.id];
    const vote = (v: 'for' | 'against') => { castVote(p.id, v); bump(); };
    return (
      <>
        <Stack direction="row" justify="between" align="center" wrap><Tag minimal round intent={STATUS[p.status].intent}>{STATUS[p.status].label}</Tag><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></Stack>
        <Title level={2} size="xl">{p.n} · {p.title}</Title>
        <Text size="xs" intent="muted" as="span">{p.category} · by {p.proposer} · {p.status === 'open' ? p.closes : ''}</Text>
        <VoteBar p={p} />
        <Text size="sm" intent="secondary">{p.body}</Text>
        {p.status === 'open' ? (
          <>
            <Text size="xs" intent="muted" as="span">Your weight: 1,420 PFT{mine ? ' · you voted ' + mine : ''}</Text>
            <Stack direction="row" gap={2} wrap align="center"><Button variant={mine === 'for' ? 'primary' : 'outline'} onClick={() => vote('for')}>Vote for</Button><Button variant={mine === 'against' ? 'primary' : 'outline'} onClick={() => vote('against')}>Vote against</Button></Stack>
            <Text size="xs" intent="muted" as="span">Stake to propose: {db.params.proposalStake} · period {db.params.votingPeriod}</Text>
          </>
        ) : <Text size="sm" intent="secondary" as="span">Voting has closed.</Text>}
      </>
    );
  }
  if (open.kind === 'delegate') {
    const d = db.delegates.find((x) => x.id === open.id)!; const [bg, ink] = tone(d.tone);
    return (
      <>
        <Stack direction="row" justify="between" align="center" wrap><Tag minimal round>Delegate</Tag><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></Stack>
        <Stack direction="row" align="center" gap={3}><Box flex="none"><Frame ratio="1/1" width="60px" rounded="full" tint={bg} tintStrength={100} ink={ink}><Text size="xl" weight="bold" as="span">{initials(d.name)}</Text></Frame></Box><Stack direction="column" gap={1}><Title level={2} size="xl">{d.name}</Title><Text size="xs" intent="muted" as="span">@{d.handle} · since {d.since}</Text></Stack></Stack>
        <Text size="sm" intent="secondary">{d.bio}</Text>
        <Grid columns={2} gap={3}>
          <Stack direction="column" gap={2} surface="card"><Text size="xs" intent="muted" as="span">Weight</Text><Text as="strong" weight="bold">{num(d.weight)} PFT</Text></Stack>
          <Stack direction="column" gap={2} surface="card"><Text size="xs" intent="muted" as="span">Votes cast</Text><Text as="strong" weight="bold">{d.votes}</Text></Stack>
          <Stack direction="column" gap={2} surface="card"><Text size="xs" intent="muted" as="span">Proposals</Text><Text as="strong" weight="bold">{d.proposals}</Text></Stack>
        </Grid>
        <Button variant="primary">Delegate to {d.name.split(' ')[0]}</Button>
      </>
    );
  }
  const nw = db.news.find((x) => x.id === open.id)!;
  return (
    <>
      <Stack direction="row" justify="between" align="center" wrap><Tag minimal round>{nw.tag}</Tag><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></Stack>
      <Text size="xs" intent="muted" as="span">{nw.date}</Text><Title level={2} size="xl">{nw.title}</Title><Text size="sm" intent="secondary">{nw.body}</Text>
    </>
  );
};
