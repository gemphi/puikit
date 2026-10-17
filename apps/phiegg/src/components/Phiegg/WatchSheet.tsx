import React, { useEffect, useState } from 'react';
import { Button, Columns, Drawer, ItemCard, Rows, Select, Spinner, Stack, Tag, TabList, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { D, agentOf, clubOf, hostOf, lookOf, person, poolOf, seriesOf, t, usd, worldOf } from '../../lib/data';
import { useProduction } from '../../lib/productions';
import { useStory } from '../../lib/lazy';
import { record } from '../../lib/activity';
import { phieggStore } from '../../state/phieggStore';
import { AgentChat } from './AgentChat';
import { LookImage } from './LookImage';
import { PersonAvatar } from './PersonAvatar';
import { Tile } from './Tile';
import type { ProdRole } from '../../types/phiegg';

/**
 * A title opened like a streaming page, in the bottom sheet: seasons and episodes on the left, the episode in the
 * centre (synopsis, crew, guests, themes and the look to shop), the cast and their roles on the right (character, part,
 * arc, actionable behaviours, the host they play through, their wardrobe), and a chat with the club's agent.
 * The hierarchy runs to sales: title → season → episode → the look worn (a PFT in the club's pool).
 */
export const WatchSheet: React.FC<{ id: string }> = ({ id }) => {
  const s = useStore(phieggStore); const x = seriesOf(id); const prod = useProduction(id); const story = useStory(x?.storyId);
  const [season, setSeason] = useState(1); const [ep, setEp] = useState(1); const [part, setPart] = useState('all');
  useEffect(() => { setSeason(1); setEp(1); setPart('all'); }, [id]);
  if (!x) return null;
  const club = clubOf(x.clubId); const world = worldOf(x.worldId); const host = hostOf(x.hostId);
  const agent = D.agents.agents.find((a) => a.clubIds.includes(x.clubId)) ?? D.agents.agents[0];
  const se = prod?.seasons.find((z) => z.n === season) ?? prod?.seasons[0]; const e = se?.episodes.find((z) => z.n === ep) ?? se?.episodes[0];
  const shopLook = e ? lookOf(e.shop.lookId) : undefined; const pool = poolOf(e?.shop.poolId ?? x.poolId ?? undefined);
  const parts = prod ? ['all', ...new Set(prod.roles.map((r) => r.part))] : ['all'];
  const roles = (prod?.roles ?? []).filter((r) => part === 'all' || r.part === part);
  const pick = (n: number) => { setEp(n); record('open', `${x.id}:${season}:${n}`, { refKind: 'episode', with: x.id }); };

  const left = !prod ? <Spinner /> : (
    <Stack direction="column" gap={2}>
      {prod.seasons.length > 1 && <TabList size="sm" variant="pills" aria-label={t('wsSeasons')} activeId={String(season)} onChange={(v) => { setSeason(Number(v)); setEp(1); }}
        items={prod.seasons.map((z) => ({ id: String(z.n), label: t('wsSeason', { n: z.n }), count: z.episodes.length }))} />}
      {se && <Text size="xs" intent="muted">{se.title} · {se.year} · {se.synopsis}</Text>}
      {se?.episodes.map((z) => (
        <ItemCard key={z.n} variant="flat" padding="sm" selected={z.n === e?.n} onClick={() => pick(z.n)} stackBelow="sm"
          media={<Tag round size="sm" intent={z.n === e?.n ? 'primary' : undefined}>{z.n}</Tag>} title={z.title} meta={t('wsMinutes', { n: z.runtime }) + ' · ' + person(z.directorId).name}>{z.synopsis}</ItemCard>))}
    </Stack>
  );

  const centre = !prod || !e ? <Spinner /> : (
    <Stack direction="column" gap={3}>
      <Tile animate tone={x.tone} color={shopLook?.hex} ratio="16/8" depth={{ worldId: x.worldId, clubId: x.clubId, personId: prod.roles[0]?.personId, mid: shopLook?.views.FRONT }}
        title={e.title} sub={(x.kind === 'series' ? t('wsSeason', { n: season }) + ' · ' : '') + t('wsMinutes', { n: e.runtime })} badges={<><Tag round size="sm">{x.genre}</Tag>{x.seasonCount && x.seasonCount > 1 && <Tag round size="sm">{x.episodeCount} episodes</Tag>}</>} />
      <Text>{e.synopsis}</Text>
      {story && story.story !== story.logline && <Stack direction="column" gap={1}>
        <Text size="xs" weight="bold" intent="muted">{t('wsStory')}</Text>
        <Text size="sm">{story.story}</Text>
        {story.after && <Tag minimal round size="sm">{t('wsAfter', { work: story.after })}</Tag>}
      </Stack>}
      <Stack direction="row" gap={1} wrap>
        <Tag minimal round interactive onClick={() => s.openPerson(e.directorId)}>{t('wsDirector', { name: person(e.directorId).name })}</Tag>
        {e.writerIds.length > 0 && <Tag minimal round>{t('wsWriters', { names: e.writerIds.map((w) => person(w).name).join(', ') })}</Tag>}
        {club && <Tag minimal round interactive onClick={() => s.go('club', { clubId: club.id })}>{club.name}</Tag>}
        {world && <Tag minimal round interactive onClick={() => s.go('world', { worldId: world.id })}>{world.name}</Tag>}
      </Stack>
      {e.guestIds.length > 0 && <Stack direction="column" gap={1}><Text size="xs" weight="bold" intent="muted">{t('wsGuests')}</Text>
        <Stack direction="row" gap={1} wrap>{e.guestIds.map((g) => <Button key={g} size="sm" variant="ghost" icon={<PersonAvatar id={g} size="xs" />} onClick={() => s.openPerson(g)}>{person(g).name}</Button>)}</Stack></Stack>}
      {shopLook && <Stack direction="column" gap={1}><Text size="xs" weight="bold" intent="muted">{t('wsShop')}</Text>
        <ItemCard depth={2} mediaSize="lg" onClick={() => s.openLook(shopLook.id)} media={<LookImage look={shopLook} cascade={1} />}
          title={shopLook.name} meta={`${prod.roles.find((r) => r.lookIds.includes(shopLook.id))?.character ?? prod.roles[0]?.character ?? ''} ${e.shop.moment}`}
          aside={<Text size="sm" weight="bold" numeric>{usd(shopLook.usd)}</Text>}
          actions={<>{<Button size="sm" variant="primary" onClick={(ev) => { ev.stopPropagation(); s.openLook(shopLook.id); }}>{t('shOpenPft')}</Button>}{pool && <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); s.go('pool', { poolId: pool.id }); }}>{pool.name}</Button>}</>}>
          {shopLook.colour} · {shopLook.rarity}
        </ItemCard></Stack>}
      <Stack direction="column" gap={1}><Text size="xs" weight="bold" intent="muted">{t('wsThemes')}</Text>
        <Stack direction="row" gap={1} wrap>{[...prod.themes.motifs, ...prod.themes.moods].map((m) => <Tag key={m} minimal round size="sm" intent="primary">{m}</Tag>)}</Stack>
        <Text size="xs" intent="muted">{t('wsConflict')}: {prod.themes.conflict} · {t('wsStakes')}: {prod.themes.stakes}</Text></Stack>
      {host && <Button variant="primary" onClick={() => s.go('hosts')}>{t('seWatch', { host: host.name })}</Button>}
    </Stack>
  );

  const role = (r: ProdRole) => {
    const h = hostOf(r.hostId ?? undefined); const looks = r.lookIds.map(lookOf).filter((l): l is NonNullable<typeof l> => !!l);
    return (
      <ItemCard key={r.personId + r.character} variant="flat" padding="sm" stackBelow="md" onClick={() => s.openPerson(r.personId)}
        media={<PersonAvatar id={r.personId} size="md" />} title={r.character} meta={`${person(r.personId).name} · ${r.part}`}
        actions={h ? <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); s.openDetails({ kind: 'host', id: h.id }); }}>{t('wsPlaysThrough', { host: h.name })}</Button> : undefined}>
        <Stack direction="column" gap={1}>
          <Text size="xs">{r.arc} · {r.traits.join(', ')}</Text>
          {r.actions.length > 0 && <Stack direction="row" gap={1} wrap>{r.actions.map((a) => <Tag key={a} minimal round size="sm">{a}</Tag>)}</Stack>}
          {looks.length > 0 && <Rows cols={3} colsSm={3} minItemWidth="3.5rem">{looks.map((l) => <ItemCard key={l.id} variant="flat" padding="sm" layout="vertical" onClick={(ev) => { ev.stopPropagation(); s.openLook(l.id); }} media={<LookImage look={l} cascade={0} />} title={l.name} />)}</Rows>}
        </Stack>
      </ItemCard>
    );
  };
  const right = !prod ? <Spinner /> : (
    <Stack direction="column" gap={2}>
      <Stack direction="row" justify="between" align="center" gap={2}><Text size="xs" intent="muted">{t('wsCastN', { n: prod.roles.length })}</Text>
        <Select size="sm" value={part} aria-label={t('wsPart')} onChange={(ev) => setPart(ev.target.value)} options={parts.map((p) => ({ value: p, label: p === 'all' ? t('wsAllParts') : p }))} /></Stack>
      {roles.map(role)}
    </Stack>
  );

  return (
    <Drawer isOpen onClose={s.close} position="bottom" size="lg" expandable expandLabel={t('expand')} collapseLabel={t('collapse')}
      title={<Stack direction="row" gap={2} align="center"><Title level={4} size="md">{x.title}</Title><Text size="xs" intent="muted">{x.genre} · {x.era}{x.seasonCount && x.seasonCount > 1 ? ' · ' + x.seasonCount + ' seasons' : ''}</Text></Stack>}>
      <Columns expandLabel={t('expand')} collapseLabel={t('collapse')} columns={[
        { id: 'episodes', title: x.kind === 'series' ? t('wsSeasons') : x.kind === 'play' ? t('wsAct') : t('wsEpisode'), content: left, width: '22rem', closable: true, expandable: true },
        { id: 'episode', title: e?.title ?? x.title, label: t('wsEpisode'), content: centre, minWidth: '20rem', expandable: true },
        { id: 'cast', title: t('wsCast'), content: right, width: '24rem', closable: true, expandable: true },
        { id: 'chat', title: agentOf(agent.id)?.name ?? agent.name, label: t('chat'), content: <AgentChat agentId={agent.id} context={x.title} prompts={[t('wsAskPlot'), t('wsAskLook'), t('wsAskRole')]} />, width: '20rem', closable: true, expandable: true },
      ]} />
    </Drawer>
  );
};
