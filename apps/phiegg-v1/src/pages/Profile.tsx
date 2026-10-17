
import React from 'react';
import { Box, Button, Image, Input, Tag } from '@pui/components';
import { useWallet, useHistory, earn, fmt, LABEL, USD, type Coin } from '@phi-kit/wallet';
import { sell as sellLook } from '@phi-kit/shop';
import { appUrl } from '@phi-kit/data';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { byId, disown, img, initials, meEdits, num, owned, saveMe, tone, usd, type DB } from '../data';
import type { Open } from '../panels';

const TABS = ['Overview', 'Collection', 'Wallet', 'Activity'] as const;
const COINS: Coin[] = ['usd', 'egg', 'sum', 'eth'];

/** "You" in Phiegg: profile header, edit, collection with Sell, wallet with top-up, activity. */
export const Profile: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const seed = byId(db.core.users, db.core.currentUserId)!;
  const [edit, setEdit] = React.useState(meEdits());
  const [editing, setEditing] = React.useState(false);
  const [tab, setTab] = React.useState<(typeof TABS)[number]>('Overview');
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const w = useWallet(); const hist = useHistory();
  const me = { ...seed, ...edit };
  const mine = owned();
  const looks = db.ls.looks.filter((l) => mine[l.id]);
  const total = COINS.reduce((a, c) => a + w[c] * USD[c], 0);
  const [bg, ink] = tone(me.tone);
  const sell = (id: string) => { const l = db.ls.looks.find((x) => x.id === id)!; sellLook(id, l.floor, 'Sold ' + l.name, () => disown(id)); bump(); };
  const field = (key: 'name' | 'handle' | 'bio', label: string) => (
    <Box as="label" className={k.small} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{label}
      <Input className={k.input} style={{ flex: 'none' }} value={(edit as any)[key] ?? (seed as any)[key] ?? ''} onChange={(e) => setEdit({ ...edit, [key]: e.target.value })} />
    </Box>
  );
  return (
    <>
      <Box as="section" className={s.hero}>
        <Box className={s.who}>
          <Box as="span" className={s.mini} style={{ width: 84, height: 84, fontSize: 28, background: bg, color: ink }}>{initials(me.name)}</Box>
          <Box><Box as="h1" className={k.title}>{me.name}</Box><Box as="span" className={k.small}>@{me.handle} · {num(me.followers || 0)} followers</Box></Box>
        </Box>
        {me.bio ? <Box as="p" className={k.body} style={{ maxWidth: '60ch' }}>{me.bio}</Box> : null}
        <Box className={k.row}><Button variant="outline" onClick={() => setEditing((v) => !v)}>{editing ? 'Cancel' : 'Edit profile'}</Button></Box>
        {editing ? (
          <Box as="form" className={k.card} style={{ maxWidth: 520 }} onSubmit={(e) => { e.preventDefault(); saveMe(edit); setEditing(false); }}>
            {field('name', 'Name')}{field('handle', 'Handle')}{field('bio', 'Bio')}
            <Button type="submit" variant="primary">Save</Button>
          </Box>
        ) : null}
      </Box>
      <Box className={s.chips}>{TABS.map((t) => <Button key={t} size="sm" variant={tab === t ? 'primary' : 'outline'} onClick={() => setTab(t)}>{t}</Button>)}</Box>

      {tab === 'Overview' ? (
        <Box className={k.grid}>
          <Box as="button" className={k.card + ' ' + k.cardBtn} onClick={() => setTab('Collection')}><Box as="span" className={k.small}>Collection</Box><Box as="span" className={k.statValue}>{looks.length}</Box><Box as="span" className={k.body}>{looks.length === 1 ? 'look' : 'looks'} · {usd(looks.reduce((a, l) => a + l.floor, 0))}</Box></Box>
          <Box as="button" className={k.card + ' ' + k.cardBtn} onClick={() => setTab('Wallet')}><Box as="span" className={k.small}>Wallet</Box><Box as="span" className={k.statValue}>{Math.round(total).toLocaleString('en-US')}</Box><Box as="span" className={k.body}>USD across 4 coins</Box></Box>
          {(me.clubIds || []).map((id) => byId(db.core.clubs, id)).filter(Boolean).map((c) => (
            <Box as="button" key={c!.id} className={k.card + ' ' + k.cardBtn} onClick={() => onOpen({ kind: 'club', id: c!.id })}><Box as="span" className={k.small}>Club</Box><Box as="h3" className={k.cardTitle}>{c!.name}</Box><Box as="span" className={k.body}>{c!.tagline}</Box></Box>
          ))}
        </Box>
      ) : null}

      {tab === 'Collection' ? (looks.length ? (
        <Box className={k.grid}>{looks.map((l) => (
          <Box as="article" key={l.id} className={k.card}>
            <Box as="button" className={s.look} style={{ border: 0, cursor: 'pointer', background: 'color-mix(in oklch, ' + l.hex + ' 22%, var(--phi-color-background))' }} onClick={() => onOpen({ kind: 'look', id: l.id })}><Image className={s.lookImg} src={img(l.views.FRONT)} alt={l.name} loading="lazy" /></Box>
            <Box className={k.row}><Tag minimal round>{l.rarity}</Tag></Box>
            <Box as="h3" className={k.cardTitle}>{l.name}</Box>
            <Box as="span" className={k.small}>Floor {usd(l.floor)}</Box>
            <Box className={k.row}><Button size="sm" variant="outline" onClick={() => onOpen({ kind: 'look', id: l.id })}>Details</Button><Button size="sm" variant="ghost" onClick={() => sell(l.id)}>Sell at floor</Button></Box>
          </Box>))}</Box>
      ) : <Box as="p" className={k.sub}>No looks yet. Find one in the Shop.</Box>) : null}

      {tab === 'Wallet' ? (
        <>
          <Box className={k.grid}>{COINS.map((c) => <Box key={c} className={k.card}><Box as="span" className={k.small}>{LABEL[c]}</Box><Box as="span" className={k.statValue}>{fmt(c, w[c])}</Box><Box as="span" className={k.body}>≈ {Math.round(w[c] * USD[c]).toLocaleString('en-US')} USD</Box></Box>)}</Box>
          <Box className={k.row}><Button variant="primary" onClick={() => earn('usd', 500, 'Top-up')}>Top up 500 USD</Button><Button variant="outline" href={appUrl('phidao') + '#/swap'}>Swap in Phidao</Button></Box>
        </>
      ) : null}

      {tab === 'Activity' ? (hist.length ? (
        <Box className={k.tableWrap}><Box as="table" className={k.table}><Box as="thead"><Box as="tr"><Box as="th">When</Box><Box as="th">What</Box><Box as="th">Amount</Box></Box></Box>
          <Box as="tbody">{hist.map((h, i) => <Box as="tr" key={i}><Box as="td">{new Date(h.t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Box><Box as="td">{h.what}</Box><Box as="td" style={{ color: h.amt < 0 ? 'var(--phi-color-text-secondary)' : 'var(--phi-color-text-accent)' }}>{h.amt > 0 ? '+' : ''}{fmt(h.coin, h.amt)} {LABEL[h.coin]}</Box></Box>)}</Box></Box></Box>
      ) : <Box as="p" className={k.sub}>Nothing yet. Buys, sales, swaps and top-ups show here.</Box>) : null}
    </>
  );
};
