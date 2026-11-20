import React from 'react';
import { Button, ChoiceRow, Image, ItemCard, Stack, Tag, Text, Label } from '@pui/components';
import { Eye, Heart, Pencil, Share2, Store, type LucideIcon } from 'lucide-react';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { usePlaces } from '../../lib/lazy';
import { mediaUrl } from '../../lib/media';
import { D, fmt, person, placesOfClub, site, storeOfClub, t, itemOf } from '../../lib/data';
import { Tile } from '../../components/Phiegg/Tile';
import { ClubIcon } from '../../components/Phiegg/Views';
import { RelationTabs } from '../../components/Phiegg/Connected';
import { EntityAvatar } from '../../components/Phiegg/EntityAvatar';
import { EntityPage } from '../../components/Phiegg/EntityPage';
import { PageSections } from '../../components/Phiegg/PageSections';
import { StatGrid } from '@phi-kit/blocks/Stats';

const KIND = (site as unknown as { placeKinds: Record<string, string> }).placeKinds;
/** The relations a club's tabs open on first: its own items, then where it lives and what it posts. */
const FIRST = (site as unknown as { clubTabsFirst: string[] }).clubTabsFirst;

/**
 * A club's page (#/club/<id>), the one entity page every record opens on: the club itself, its facts and places in
 * the side column; its relations as tabs (its PFTs, pieces, worlds, hosts, shots, members, events…) in the middle,
 * held in view while the side scrolls.
 */
/** One action as an icon: its name as its label and tooltip, pressed when on. */
const act = (I: LucideIcon, label: string, onClick: () => void, on?: boolean) => (
  <Button key={label} variant="glass" size="sm" icon={<I size={16} fill={on ? 'currentColor' : 'none'} />} aria-label={label} title={label} aria-pressed={on} onClick={onClick} />
);

export const ClubPage: React.FC = () => {
  const s = useStore(phieggStore);
  const c = itemOf('club', s.clubId) ?? D.core.clubs[0];
  const founder = person(c.founderId); const host = itemOf('host', c.hostId);
  usePlaces(); const store = storeOfClub(c.id); const spots = placesOfClub(c.id);
  const worlds = c.worldIds.map((w) => itemOf('world', w)).filter((w): w is NonNullable<typeof w> => !!w);
  const seen = worlds.find((w) => w.gallery?.length);
  const picture = seen?.gallery?.[0] ? mediaUrl(seen.gallery[0].lg) : undefined;
  const facts: [string, React.ReactNode][] = [
    [t('floor'), c.floor ? c.floor + ' ETH' : '·'], [t('holders'), fmt(c.holders)], [t('supply'), fmt(c.supply)],
    [t('cities'), fmt(worlds.length)], [t('lsChain'), c.chain], [t('lsStatus'), (site.clubStatus as Record<string, string>)[c.status]], [t('founder'), founder.name],
  ];
  const side = (
    <PageSections id="club-side" size="sm" sections={[
      { id: 'info', title: t('secInfo'), content: (
        <Stack direction="column" gap={3}>
          {/* The club's picture, no name on it (the page's title says it), and its actions as one row of icons. */}
          <Tile tone={c.tone} ratio="1" big grid depth={{ clubId: c.id, worldId: c.worldIds[0], personId: c.founderId }}
            badges={<><Tag round size="sm">{(site.clubStatus as Record<string, string>)[c.status]}</Tag><Tag round size="sm">{c.ticker}</Tag></>} />
          <Stack direction="row" gap={1} align="center">
            {host && act(Eye, t('view'), () => s.go('hosts'))}
            {act(Heart, t('isLike'), () => s.toggle('follow', c.id), !!s.follow[c.id])}
            {store && act(Store, t('pgShop'), () => s.go('shop', { storeId: store.id }))}
            {act(Share2, t('isShare'), () => { void navigator.clipboard?.writeText(location.href); s.flash(t('isCopied')); })}
            {c.founderId === D.core.currentUserId && act(Pencil, t('editClub'), () => s.openEditClub(c.id))}
          </Stack>
        </Stack>) },
      { id: 'about', title: t('wdAbout'), content: (
        <Stack direction="column" gap={3}>
          <Label wrap as="p" icon={<ClubIcon icon={(c as { icon?: string }).icon} size="1.75rem" />}><Text as="span" size="md">{c.description}</Text></Label>
          <StatGrid size="sm" items={facts.map(([label, value]) => ({ label, value }))} />
          {c.tags?.length ? <Stack direction="row" gap={1} wrap>{c.tags.map((x) => <Tag key={x} minimal round size="sm">{x}</Tag>)}</Stack> : null}
        </Stack>) },
      { id: 'places', title: t('wdPlaceCount'), hint: String(spots.length), hidden: !spots.length, content: (
        <Stack direction="column" gap={2}>{spots.slice(0, 12).map(({ place: p }) => (
          <ItemCard key={p.id} variant="flat" stackBelow="never" onClick={() => s.openPlace(p.id)} media={<EntityAvatar id={p.id} name={p.name} size="md" />}
            title={p.name} meta={(KIND[p.kind] ?? p.kind) + ' · ' + fmt(p.visitors)} />))}</Stack>) },
      { id: 'clubs', title: t('lsChooseClub'), content: <ChoiceRow value={c.id} label={t('lsChooseClub')} onChange={(v) => s.go('club', { clubId: v })} options={D.core.clubs.map((x) => ({ value: x.id, label: x.name }))} /> },
    ]} />
  );
  return (
    <EntityPage wear={(c as { colors?: string[] }).colors?.[0]} picture={picture ? <Image src={picture} alt="" fit="cover" fill /> : undefined}
      title={c.name} sub={<>{c.tagline} · {fmt(c.holders)} {t('holders')}</>}
      columns={[
        { id: 'club', title: c.name, label: t('wdAbout'), content: side, width: '22rem' },
        { id: 'tabs', title: c.name, label: t('connected'), content: <RelationTabs kind="club" id={c.id} first={FIRST} />, minWidth: '24rem', stick: true },
      ]} />
  );
};
