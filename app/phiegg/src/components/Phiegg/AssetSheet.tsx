import React, { useState } from 'react';
import { Button, Columns, DataTable, Drawer, Input, ItemCard, SpriteImage, Stack, Swatch, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { useWallet } from '@phi-kit/wallet';
import { D, cityOf, jewelOf, jewelSprite, rideOf, ridePrice, rideSprite, clubOf, eggOf, eggUsd, fmt, hostOf, person, poolOf, profileItemOf, seriesOf, sumOf, t, usd, worldOf, rideKind, rideMode } from '../../lib/data';
import { buyAsset, deposit, sumYield, useHoldings } from '../../lib/holdings';
import { useNow } from '../../lib/market';
import { spriteOfCell } from '../../lib/portraits';
import { phieggStore } from '../../state/phieggStore';
import { AgentChat } from './AgentChat';
import { EntityAvatar } from './EntityAvatar';
import { PersonAvatar } from './PersonAvatar';
import { Tile } from './Tile';
import { PageSections } from './PageSections';
import { usePageTheme } from '../../lib/pageTheme';

type Row = { id: string; k: string; v: React.ReactNode };
const Facts: React.FC<{ rows: Row[] }> = ({ rows }) => <DataTable rows={rows} getKey={(r) => r.id} columns={[{ id: 'k', header: t('isField'), cell: (r) => <Text as="span" size="sm" intent="muted">{r.k}</Text>, width: '9rem' }, { id: 'v', header: t('isValue'), cell: (r) => r.v }]} />;
const egg = (n: number) => fmt(Math.round(n)) + ' EGG';

/**
 * EGG items, SUM machines and profile PFTs open in the same bottom sheet as looks: what it is and its facts in the
 * centre (buy with EGG, or deposit into a SUM), what it links to on the left (host, holder, pool, the productions
 * its host is cast in), and a chat with the club's agent on the right.
 */
export const AssetSheet: React.FC<{ id: string }> = ({ id }) => {
  const s = useStore(phieggStore); const w = useWallet(); const held = useHoldings(); const now = useNow(1000);
  const e = eggOf(id), m = sumOf(id), p = profileItemOf(id), c = rideOf(id), j = jewelOf(id); const [amt, setAmt] = useState('100'); const [msg, setMsg] = useState('');
  // A profile PFT's background and outfit are its theme; the page wears them while it is open.
  // A ride's or a jewel's designer theme does the same.
  const th = c?.theme ?? j?.theme;
  usePageTheme(p?.bg ?? th?.colours[0], p?.outfit ?? th?.colours[1], 'vivid', c ? 'ride' : j ? 'jewel' : 'profile');
  if (!e && !m && !p && !c && !j) return null;
  const it = (e ?? m ?? p ?? c ?? j)!; const clubId = it.clubId; const club = clubOf(clubId); const pool = poolOf(e?.poolId ?? m?.poolId ?? p?.poolId);
  const agent = D.agents.agents.find((a) => a.clubIds.includes(clubId)) ?? D.agents.agents[0];
  const mine = held[id];
  const typeTag = e ? t('itEgg') + ' · ' + t(e.kind === 'gate' ? 'itGate' : e.kind === 'earnings' ? 'itEarnings' : 'itLand') : m ? t('itSum') + ' · ' + t('itMachine') : c ? `${t('itPft')} · ${rideKind(c.kind)} · ${rideMode(c.mode)}` : j ? t(j.kind === 'watch' ? 'itWatch' : 'itJewel') : t('itProfile');
  const priceEgg = e ? e.priceEgg : p ? Math.round(p.priceUsd / D.assets.eggUsd) : c ? Math.round(ridePrice(c) / D.assets.eggUsd) : j ? Math.round(j.priceUsd / D.assets.eggUsd) : m?.minEgg ?? 0;
  // A ride for fun or for hire is a ticket: it is booked, not owned.
  const buy = () => setMsg(buyAsset(id, priceEgg, it.name) ? t(c && c.mode !== 'sale' ? 'rdBooked' : 'asBought', { name: it.name }) : t('asNoEgg'));
  const put = () => { const n = Number(amt); setMsg(m && n >= m.minEgg && deposit(id, n, m.name) ? t('asBought', { name: m.name }) : t('asNoEgg')); };

  const rows: Row[] = e ? [
    { id: 'kind', k: t('asKind'), v: typeTag }, { id: 'host', k: t('asHost'), v: hostOf(e.hostId)?.name ?? '·' }, { id: 'owner', k: t('asOwner'), v: e.ownerId ? person(e.ownerId).name : '·' },
    { id: 'world', k: t('asWorld'), v: worldOf(e.worldId)?.name ?? '·' }, { id: 'price', k: t('asPrice'), v: <Text as="span" size="sm" weight="bold" numeric>{egg(e.priceEgg)} · {usd(e.priceUsd)}</Text> },
    { id: 'supply', k: t('asSupply'), v: `${fmt(e.sold)} / ${fmt(e.supply)}` }, { id: 'yield', k: t('asYield'), v: egg(e.yieldDay) },
    ...(e.sharePct ? [{ id: 'share', k: t('asShare'), v: e.sharePct + '%' }] : []), ...(e.sizeM2 ? [{ id: 'size', k: t('asSize'), v: fmt(e.sizeM2) + ' m²' }] : []),
  ] : m ? [
    { id: 'strategy', k: t('asStrategy'), v: m.strategy }, { id: 'apy', k: t('asApy'), v: m.apy + '%' }, { id: 'tvl', k: t('asTvl'), v: <Text as="span" size="sm" weight="bold" numeric>{egg(m.tvlEgg)} · {usd(eggUsd(m.tvlEgg))}</Text> },
    { id: 'min', k: t('asMin'), v: egg(m.minEgg) }, { id: 'rebalance', k: t('asRebalance'), v: m.rebalance }, { id: 'holders', k: t('holders'), v: fmt(m.holders) },
    { id: 'rules', k: t('asRules'), v: <Stack direction="column" gap={0}>{m.rules.map((r) => <Text key={r} as="span" size="sm">{r}</Text>)}</Stack> },
  ] : c ? [
    { id: 'kind', k: t('rdKind'), v: `${rideKind(c.kind)} · ${c.body} · ${c.year}` }, { id: 'mode', k: t('rdMode'), v: rideMode(c.mode) }, { id: 'make', k: t('carMake'), v: c.make },
    { id: 'seats', k: t('rdSeats'), v: fmt(c.seats) }, { id: 'lift', k: t('carLift'), v: c.lift },
    ...(c.kind === 'fun' ? [{ id: 'minutes', k: t('rdMinutes'), v: String(c.minutes) }, { id: 'thrill', k: t('rdThrill'), v: '★'.repeat(c.thrill ?? 1) }]
      : [{ id: 'speed', k: t('carTop'), v: <Text as="span" size="sm" numeric>{fmt(c.topKmh)} km/h · {fmt(c.rangeKm)} km</Text> }]),
    ...(c.cargoM3 ? [{ id: 'cargo', k: t('rdCargo'), v: c.cargoM3 + ' m³' }] : []),
    { id: 'lane', k: t('carLane'), v: `${c.lane} · ${cityOf(c.cityId)?.city.name ?? ''}, ${worldOf(c.worldId)?.name ?? ''}` },
    { id: 'price', k: c.mode === 'sale' ? t('asPrice') : c.mode === 'fun' ? t('rdTicket') : t('rdFare'), v: <Text as="span" size="sm" weight="bold" numeric>{usd(ridePrice(c))} · {egg(priceEgg)}</Text> },
    ...(c.mode === 'sale' ? [{ id: 'supply', k: t('asSupply'), v: `${fmt(c.minted)} / ${fmt(c.edition)} · ${t('holders')} ${fmt(c.owners)}` }] : [{ id: 'today', k: t('rdToday'), v: fmt(c.ridesToday) }]),
    { id: 'theme', k: t('carTheme'), v: <Stack direction="row" gap={1} wrap>{c.theme.kinds.map((k) => <Tag key={k} minimal round size="sm">{k}</Tag>)}<Tag minimal round size="sm">{c.theme.mood}</Tag></Stack> },
    { id: 'colours', k: t('carColours'), v: <Stack direction="row" gap={1} align="center">{c.theme.colours.map((x) => <Swatch key={x} color={x} size="sm" />)}<Text as="span" size="sm">{c.theme.colours.join(' · ')}</Text></Stack> },
    { id: 'holder', k: t('asHolder'), v: person(c.holderId).name },
  ] : j ? [
    { id: 'piece', k: t('jwPiece'), v: `${j.piece} · ${j.make}` }, { id: 'metal', k: t('jwMetal'), v: <Stack direction="row" gap={1} align="center"><Swatch color={j.metalHex} size="sm" /><Text as="span" size="sm">{j.metal}</Text></Stack> },
    ...(j.stone ? [{ id: 'stone', k: t('jwStone'), v: <Stack direction="row" gap={1} align="center"><Swatch color={j.stoneHex} size="sm" /><Text as="span" size="sm">{j.stone}{j.carats ? ` · ${j.carats} ct` : ''}</Text></Stack> }] : []),
    ...(j.kind === 'watch' ? [{ id: 'movement', k: t('jwMovement'), v: `${j.movement} · ${j.powerHours} h` }, { id: 'complication', k: t('jwComplication'), v: j.complication ?? '' },
      { id: 'case', k: t('jwCase'), v: `${j.caseMm} mm · ${j.waterM} m` }, { id: 'strap', k: t('jwStrap'), v: j.strap ?? '' }] : []),
    { id: 'hours', k: t('jwHours'), v: fmt(j.hoursToMake) }, { id: 'edition', k: t('jwEdition'), v: j.holderId ? t('jwSold') + ' · ' + person(j.holderId).name : t('jwAvailable') },
    { id: 'price', k: t('asPrice'), v: <Text as="span" size="sm" weight="bold" numeric>{usd(j.priceUsd)} · {egg(priceEgg)}</Text> },
    { id: 'colours', k: t('carColours'), v: <Stack direction="row" gap={1} align="center">{j.theme.colours.map((x) => <Swatch key={x} color={x} size="sm" />)}<Text as="span" size="sm">{j.theme.mood}</Text></Stack> },
  ] : [
    { id: 'token', k: t('asKind'), v: `${typeTag} · ${p!.tokenId.toUpperCase()}` }, { id: 'holder', k: t('asHolder'), v: p!.holderId ? person(p!.holderId).name : '·' },
    { id: 'price', k: t('asPrice'), v: <Text as="span" size="sm" weight="bold" numeric>{usd(p!.priceUsd)} · {egg(priceEgg)}</Text> },
    ...Object.entries(p!.traits).map(([k, v]) => ({ id: 'tr' + k, k: k[0].toUpperCase() + k.slice(1), v: v.startsWith('#') ? <Stack direction="row" gap={1} align="center"><Swatch color={v} size="sm" /><Text as="span" size="sm">{v}</Text></Stack> : v })),
  ];

  const hero = p ? <SpriteImage sprite={spriteOfCell(p.sheet, p.index)} alt={p.name} radius="xl" maxWidth="16rem" />
    : c ? <SpriteImage sprite={rideSprite(c)} alt={c.name} ratio="16 / 10" radius="xl" maxWidth="28rem" />
    : j ? <SpriteImage sprite={jewelSprite(j)} alt={j.name} radius="xl" maxWidth="18rem" />
    : <Tile tone={club?.tone ?? 'accent'} ratio="16/9" depth={{ worldId: e?.worldId ?? club?.worldIds?.[0], clubId, personId: e?.ownerId ?? undefined }} title={(e ?? m)!.name} sub={typeTag} />;
  const centre = (
    <PageSections id="asset" size="sm" sections={[
      { id: 'item', title: it.name, expandable: true, content: <Stack direction="column" gap={2}>{hero}{e && <Text>{e.desc}</Text>}{th && <Text>{th.story}</Text>}</Stack> },
      { id: 'buy', title: t('asBuy'), content: (
        <Stack direction="column" gap={2}>
          {mine && <Tag intent="success" round>{t('asHeld')} · {m ? t('asHolding', { n: fmt(mine.egg), date: new Date(mine.at).toISOString().slice(0, 10) }) + ' · +' + egg(sumYield(mine, m.apy, now)) : '×' + mine.qty}</Tag>}
          {m ? <Stack direction="row" gap={2} align="center"><Input inputMode="numeric" value={amt} aria-label={t('asMin')} onChange={(ev) => setAmt(ev.target.value.replace(/[^0-9]/g, ''))} />
              <Button variant="primary" disabled={w.egg < Number(amt)} onClick={put}>{t('asDeposit', { v: egg(Number(amt) || 0) })}</Button></Stack>
            : <Button variant="primary" disabled={w.egg < priceEgg || (!!j && !!j.holderId)} onClick={buy}>{w.egg < priceEgg ? t('asNoEgg') : c && c.mode !== 'sale' ? t(c.mode === 'fun' ? 'rdBook' : 'rdHire', { v: egg(priceEgg) }) : t('asBuyEgg', { v: egg(priceEgg) })}</Button>}
          {msg && <Text size="sm" role="status">{msg}</Text>}
        </Stack>) },
      { id: 'details', title: t('asFacts'), expandable: true, content: <Facts rows={rows} /> },
    ]} />
  );
  const titles = (e?.seriesIds ?? m?.seriesIds ?? []).map(seriesOf).filter((x): x is NonNullable<typeof x> => !!x);
  const inputs = (m?.inputs ?? []).map(eggOf).filter((x): x is NonNullable<typeof x> => !!x);
  const left = (
    <Stack direction="column" gap={2}>
      <Text size="xs" weight="bold" intent="muted">{t('asLinked')}</Text>
      {pool && <ItemCard variant="flat" padding="sm" stackBelow="never" onClick={() => s.go('pool', { poolId: pool.id })} media={<EntityAvatar id={pool.id} name={pool.name} size="sm" />} title={pool.name} meta={t('lsPool')} />}
      {club && <ItemCard variant="flat" padding="sm" stackBelow="never" onClick={() => s.go('club', { clubId: club.id })} media={<EntityAvatar id={club.id} name={club.name} size="sm" />} title={club.name} meta={t('lsColClub')} />}
      {e && hostOf(e.hostId) && <ItemCard variant="flat" padding="sm" stackBelow="never" onClick={() => s.openDetails({ kind: 'host', id: e.hostId })} media={<EntityAvatar id={e.hostId} name={hostOf(e.hostId)!.name} size="sm" />} title={hostOf(e.hostId)!.name} meta={t('asHost')} />}
      {(e?.ownerId ?? p?.holderId ?? c?.holderId ?? j?.holderId) && <ItemCard variant="flat" padding="sm" stackBelow="never" onClick={() => s.openPerson((e?.ownerId ?? p?.holderId ?? c?.holderId ?? j?.holderId)!)} media={<PersonAvatar id={(e?.ownerId ?? p?.holderId ?? c?.holderId ?? j?.holderId)!} size="sm" />} title={person((e?.ownerId ?? p?.holderId ?? c?.holderId ?? j?.holderId)!).name} meta={e ? t('asOwner') : t('asHolder')} />}
      {(c ?? j) && worldOf((c ?? j)!.worldId) && <ItemCard variant="flat" padding="sm" stackBelow="never" onClick={() => s.go('world', { worldId: (c ?? j)!.worldId })} media={<EntityAvatar id={(c ?? j)!.worldId} name={worldOf((c ?? j)!.worldId)!.name} size="sm" />} title={worldOf((c ?? j)!.worldId)!.name} meta={t('asWorld')} />}
      {inputs.length > 0 && <><Text size="xs" weight="bold" intent="muted">{t('asInputs')}</Text>
        {inputs.slice(0, 12).map((x) => <ItemCard key={x.id} variant="flat" padding="sm" stackBelow="never" onClick={() => s.openAsset(x.id)} media={<EntityAvatar id={x.hostId} name={x.name} size="sm" />} title={x.name} aside={<Text size="xs" numeric>{egg(x.priceEgg)}</Text>} />)}</>}
      {titles.length > 0 && <><Text size="xs" weight="bold" intent="muted">{t('asTitles')}</Text>
        {titles.map((x) => <ItemCard key={x.id} variant="flat" padding="sm" stackBelow="never" onClick={() => s.openSeries(x.id)} media={<EntityAvatar id={x.clubId} name={x.title} size="sm" />} title={x.title} meta={x.genre} />)}</>}
    </Stack>
  );
  return (
    <Drawer isOpen onClose={s.close} position="bottom" size="lg" expandable expandLabel={t('expand')} collapseLabel={t('collapse')}
      title={<Stack direction="row" gap={2} align="center"><Title level={4} size="md">{it.name}</Title><Text size="xs" intent="muted">{typeTag}{club ? ' · ' + club.name : ''}</Text></Stack>}>
      <Columns expandLabel={t('expand')} collapseLabel={t('collapse')} columns={[
        { id: 'linked', title: t('asLinked'), content: left, width: '19rem', closable: true, expandable: true },
        { id: 'item', title: it.name, label: t('asDetails'), content: centre, minWidth: '20rem', expandable: true },
        { id: 'chat', title: agent.name, label: t('chat'), content: <AgentChat agentId={agent.id} context={it.name} prompts={[e ? t('asAskHost') : m ? t('asAskSum') : c ? t('asAskRide') : j ? t('asAskJewel') : t('asAskPft')]} />, width: '21rem', closable: true, expandable: true },
      ]} />
    </Drawer>
  );
};
