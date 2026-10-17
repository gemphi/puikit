
import React from 'react';
import { Box, Button, Image, Input, Tag } from '@pui/components';
import { useWallet } from '@phi-kit/wallet';
import { placeOffer, purchase } from '@phi-kit/shop';
import { persisted } from '@phi-kit/api';
import k from '@phi-kit/kit.module.scss';
import s from './app.module.scss';
import { Comments } from './Comments';
import { useCart, addToCart, removeFromCart, clearCart, addOffer, withdrawOffer } from './cart';
import { byId, img, initials, num, own, owned, tone, usd, type DB } from './data';

export type Open = { kind: 'shot' | 'club' | 'user' | 'look' | 'cart'; id: string };
type P = { db: DB; open: Open; onOpen: (o: Open) => void; onClose: () => void };

/** Follows — Phiora `/state/follow` (localStorage without VITE_PHI_API). */
const FOLLOWS = persisted<Record<string, number>>('follow', {});
const useFollow = (id: string) => {
  const on = !!FOLLOWS.use()[id];
  const toggle = () => { const f = { ...FOLLOWS.get() }; if (f[id]) delete f[id]; else f[id] = Date.now(); FOLLOWS.set(f); };
  return [on, toggle] as const;
};

const Top: React.FC<{ label: string; onClose: () => void }> = ({ label, onClose }) => (
  <Box className={k.row} style={{ justifyContent: 'space-between' }}><Tag minimal round>{label}</Tag><Button variant="ghost" size="sm" onClick={onClose}>Close</Button></Box>
);

const LookPanel: React.FC<P> = ({ db, open, onClose }) => {
  const l = db.ls.looks.find((x) => x.id === open.id)!;
  const w = useWallet();
  const [angle, setAngle] = React.useState('FRONT');
  const [opaque, setOpaque] = React.useState(false);
  const [mine, setMine] = React.useState(!!owned()[l.id]);
  const [msg, setMsg] = React.useState('');
  const [bid, setBid] = React.useState('');
  const { cart, offers } = useCart();
  const pending = offers.find((o) => o.lookId === l.id && o.status === 'pending');
  React.useEffect(() => { setBid(String(Math.round(l.floor))); setAngle('FRONT'); setMine(!!owned()[l.id]); setMsg(''); }, [l.id]);
  const src = (opaque && l.opaque ? l.opaque : l.views)[angle] || l.views.FRONT;
  const buy = () => { if (purchase([l.id], l.usd, 'Bought ' + l.name, () => own(l.id))) { setMine(true); setMsg('Bought ' + l.name + ' · edition ' + (l.minted + 1) + '/' + l.edition); } else setMsg('Not enough USD — top up in You.'); };
  // Seller rule (stand-in): offers at or above floor are accepted at once; lower ones wait.
  const offer = () => {
    const n = Number(bid); if (!(n > 0)) return;
    const r = placeOffer(l.id, n, l.floor, 'Offer accepted · ' + l.name, (o) => { addOffer({ lookId: l.id, usd: n, t: Date.now(), status: o }); if (o === 'accepted') own(l.id); });
    if (r === 'accepted') { setMine(true); setMsg('Offer accepted. ' + l.name + ' is yours.'); }
    else if (r === 'pending') setMsg('Offer sent. The seller has 48 hours to respond.');
    else setMsg('Not enough USD for that offer.');
  };
  return (
    <>
      <Top label={l.rarity} onClose={onClose} />
      <Box className={s.look} style={{ background: 'color-mix(in oklch, ' + l.hex + ' 22%, var(--phi-color-background))' }}><Image className={s.lookImg} src={img(src)} alt={l.name + ' ' + angle} /></Box>
      <Box className={k.row}>{db.ls.views.map((v) => <Button key={v.id} size="sm" variant={angle === v.id ? 'primary' : 'outline'} onClick={() => setAngle(v.id)}>{v.label}</Button>)}</Box>
      {l.opaque ? <Box className={k.row}><Button size="sm" variant={!opaque ? 'primary' : 'outline'} onClick={() => setOpaque(false)}>Sheer</Button><Button size="sm" variant={opaque ? 'primary' : 'outline'} onClick={() => setOpaque(true)}>Opaque</Button></Box> : null}
      <Box as="h2" className={k.title} style={{ fontSize: 30 }}>{l.name}</Box>
      <Box as="span" className={k.statValue}>{usd(l.usd)}</Box>
      <Box as="span" className={k.small}>Floor {usd(l.floor)} · {l.change7d > 0 ? '+' : ''}{l.change7d}% 7d · {l.owners} owners · {l.minted}/{l.edition} minted</Box>
      {mine ? <Tag intent="success" round>In your collection</Tag> : (
        <>
          <Box className={k.row}>
            <Button variant="primary" onClick={buy} disabled={w.usd < l.usd}>{w.usd < l.usd ? 'Not enough USD' : 'Buy for ' + usd(l.usd)}</Button>
            <Button variant="outline" onClick={() => (cart.includes(l.id) ? removeFromCart(l.id) : addToCart(l.id))}>{cart.includes(l.id) ? 'In cart' : 'Add to cart'}</Button>
          </Box>
          {pending ? (
            <Box className={k.row}><Box as="span" className={k.small}>Your offer {usd(pending.usd)} is pending.</Box><Button size="sm" variant="ghost" onClick={() => withdrawOffer(l.id)}>Withdraw</Button></Box>
          ) : (
            <Box as="form" className={k.row} onSubmit={(e) => { e.preventDefault(); offer(); }}>
              <Input className={k.input} inputMode="numeric" value={bid} onChange={(e) => setBid(e.target.value.replace(/[^0-9]/g, ''))} aria-label="Offer in USD" />
              <Button type="submit" variant="outline">Make offer</Button>
            </Box>
          )}
        </>
      )}
      {msg ? <Box as="span" className={k.body} role="status">{msg}</Box> : null}
      <Box as="h3" className={k.blockTitle}>Details</Box>
      <Box as="ul" className={k.body} style={{ margin: 0, paddingLeft: 18 }}>{l.garments.map((g) => <Box as="li" key={g}>{g}</Box>)}</Box>
      <Box as="span" className={k.small}>Colour · {l.colour}</Box>
      <Comments db={db} targetId={l.id} />
    </>
  );
};

const ClubPanel: React.FC<P> = ({ db, open, onOpen, onClose }) => {
  const c = byId(db.core.clubs, open.id)!; const f = byId(db.core.users, c.founderId);
  const [on, toggle] = useFollow(c.id); const [bg, ink] = tone(c.tone);
  return (
    <>
      <Top label={c.status === 'live' ? 'Live club' : c.status} onClose={onClose} />
      <Box className={s.media} style={{ height: 120, background: bg, color: ink }}>{c.ticker}</Box>
      <Box as="h2" className={k.title} style={{ fontSize: 30 }}>{c.name}</Box>
      <Box as="p" className={k.body}>{c.description}</Box>
      <Box className={k.grid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[['Floor', c.floor + ' ETH'], ['Holders', num(c.holders)], ['Supply', num(c.supply)]].map(([a, b]) => <Box key={a} className={k.card}><Box as="span" className={k.small}>{a}</Box><Box as="strong">{b}</Box></Box>)}
      </Box>
      <Box className={k.row}><Button variant={on ? 'outline' : 'primary'} onClick={toggle}>{on ? 'Following' : 'Follow'}</Button>{f ? <Button variant="ghost" onClick={() => onOpen({ kind: 'user', id: f.id })}>Founder · {f.name}</Button> : null}</Box>
      <Box className={k.row}>{c.tags.map((t) => <Tag key={t} minimal round>{t}</Tag>)}</Box>
    </>
  );
};

const UserPanel: React.FC<P> = ({ db, open, onOpen, onClose }) => {
  const u = byId(db.core.users, open.id)!; const [on, toggle] = useFollow(u.id); const [bg, ink] = tone(u.tone);
  return (
    <>
      <Top label={u.verified ? 'Verified' : 'Member'} onClose={onClose} />
      <Box className={s.who}><Box as="span" className={s.mini} style={{ width: 64, height: 64, fontSize: 22, background: bg, color: ink }}>{initials(u.name)}</Box><Box><Box as="h2" className={k.title} style={{ fontSize: 28 }}>{u.name}</Box><Box as="span" className={k.small}>@{u.handle}</Box></Box></Box>
      {u.bio ? <Box as="p" className={k.body}>{u.bio}</Box> : null}
      <Box as="span" className={k.small}>{num((u.followers || 0) + (on ? 1 : 0))} followers</Box>
      <Button variant={on ? 'outline' : 'primary'} onClick={toggle}>{on ? 'Following' : 'Follow'}</Button>
      <Box as="h3" className={k.blockTitle}>Clubs</Box>
      <Box className={k.row}>{(u.clubIds || []).map((id) => byId(db.core.clubs, id)).filter(Boolean).map((c) => <Button key={c!.id} size="sm" variant="outline" onClick={() => onOpen({ kind: 'club', id: c!.id })}>{c!.name}</Button>)}</Box>
    </>
  );
};

const ShotPanel: React.FC<P> = ({ db, open, onOpen, onClose }) => {
  const sh = db.feed.shots.find((x) => x.id === open.id)!; const u = byId(db.core.users, sh.authorId); const c = byId(db.core.clubs, sh.clubId); const [bg, ink] = tone(sh.media.tone);
  return (
    <>
      <Top label={sh.media.kind.replace('-', ' ')} onClose={onClose} />
      <Box className={s.media} style={{ aspectRatio: sh.media.ratio, background: bg, color: ink }}>{sh.media.title}</Box>
      <Box as="p" className={k.body}>{sh.caption}</Box>
      <Box as="span" className={k.small}>{num(sh.likes)} likes · {num(sh.comments)} comments · {new Date(sh.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Box>
      <Box className={k.row}>{u ? <Button size="sm" variant="outline" onClick={() => onOpen({ kind: 'user', id: u.id })}>{u.name}</Button> : null}{c ? <Button size="sm" variant="outline" onClick={() => onOpen({ kind: 'club', id: c.id })}>{c.name}</Button> : null}</Box>
      <Comments db={db} targetId={sh.id} />
    </>
  );
};

const CartPanel: React.FC<P> = ({ db, onOpen, onClose }) => {
  const { cart } = useCart(); const w = useWallet(); const [msg, setMsg] = React.useState('');
  const items = cart.map((id) => db.ls.looks.find((l) => l.id === id)!).filter(Boolean);
  const total = items.reduce((a, l) => a + l.usd, 0);
  const checkout = () => { if (purchase(items.map((l) => l.id), total, 'Checkout · ' + items.length + (items.length === 1 ? ' look' : ' looks'), () => { items.forEach((l) => own(l.id)); clearCart(items.map((l) => l.id)); })) { setMsg('Done. ' + items.length + (items.length === 1 ? ' look is' : ' looks are') + ' in your collection.'); } else setMsg('Not enough USD. Top up in You.'); };
  return (
    <>
      <Top label="Cart" onClose={onClose} />
      <Box as="h2" className={k.title} style={{ fontSize: 30 }}>Your cart</Box>
      {items.length ? items.map((l) => (
        <Box key={l.id} className={k.row} style={{ flexWrap: 'nowrap' }}>
          <Box as="button" className={s.look} style={{ width: 64, flex: 'none', border: 0, cursor: 'pointer', background: 'color-mix(in oklch, ' + l.hex + ' 22%, var(--phi-color-background))' }} onClick={() => onOpen({ kind: 'look', id: l.id })}><Image className={s.lookImg} src={img(l.views.FRONT)} alt="" /></Box>
          <Box as="span" style={{ flex: 1, minWidth: 0 }}><Box as="strong" style={{ display: 'block' }}>{l.name}</Box><Box as="span" className={k.small}>{usd(l.usd)}</Box></Box>
          <Button size="sm" variant="ghost" onClick={() => removeFromCart(l.id)}>Remove</Button>
        </Box>)) : <Box as="p" className={k.body}>Nothing in your cart yet.</Box>}
      {items.length ? <><Box as="span" className={k.statValue}>{usd(total)}</Box><Box as="span" className={k.small}>Wallet {usd(w.usd)}</Box><Button variant="primary" onClick={checkout} disabled={w.usd < total}>{w.usd < total ? 'Not enough USD' : 'Checkout'}</Button></> : null}
      {msg ? <Box as="span" className={k.body} role="status">{msg}</Box> : null}
    </>
  );
};

/** Right-bar: one panel per item kind; links inside open the next item in place. */
export const Panel: React.FC<P> = (p) =>
  p.open.kind === 'cart' ? <CartPanel {...p} /> : p.open.kind === 'look' ? <LookPanel {...p} /> : p.open.kind === 'club' ? <ClubPanel {...p} /> : p.open.kind === 'user' ? <UserPanel {...p} /> : <ShotPanel {...p} />;
