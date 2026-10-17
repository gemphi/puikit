import React, { useEffect, useState } from 'react';
import { Avatar, Button, Card, CardBody, Col, Grid, Icon, Page, Stack, Tag, Text, Title, TabList, StatusRail, WorldScene, Rows } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { Layers, Play, Sparkles } from 'lucide-react';
import { D, agentOf, clubOf, firstName, fmt, person, postsBy, site, storySets, t, worldOf, commentCount, profileItemOfHolder } from '../../lib/data';
import { usePageTheme } from '../../lib/pageTheme';
import { ListView } from '../../components/Phiegg/Views';
import { ProfileTab } from '../../components/Phiegg/ProfileTabs';
import { PersonAvatar } from '../../components/Phiegg/PersonAvatar';
import type { Club, Post } from '../../types/phiegg';
import { Tile } from '../../components/Phiegg/Tile';
import { postTile } from '../../components/Phiegg/ShotCard';
import { Connected } from '../../components/Phiegg/Connected';
import { Details } from '../../components/Phiegg/Details';

export const ProfilePage: React.FC = () => {
  const s = useStore(phieggStore);
  const p = person(s.profileId); const ag = agentOf(p.id); const isMe = p.id === D.core.currentUserId;
  const posts = postsBy(p.id); const sets = storySets(p.id); const first = firstName(p.name);
  const more = (site as unknown as { profileTabsMore: string[] }).profileTabsMore; const tabs = [...site.profileTabs, ...more]; const [tab, setTab] = useState(tabs[0]); const [tick, setTick] = useState(0);
  useEffect(() => { if (tab !== tabs[1]) return; const id = setInterval(() => setTick((x) => x + 1), site.autoplay.reelMs); return () => clearInterval(id); }, [tab]);
  // Someone who holds a profile PFT has its theme: their page wears its background and outfit.
  const pft = profileItemOfHolder(p.id); usePageTheme(pft?.bg, pft?.outfit, 'soft', 'profile');
  const clubs = p.clubIds.map((c) => clubOf(c)).filter((c): c is NonNullable<typeof c> => !!c);
  const grid = tab === tabs[2] ? posts.filter((x) => x.kind === 'look') : posts;
  return (
    <Page>
      <Grid gap={4} xs={1} lg={12}>
        <Col span={8} xs={12} lg={8}><Stack direction="column" gap={3}>
          <Tile tone={p.tone} ratio="21/6" grid depth={{ clubId: p.clubIds[0], personId: p.id }} badges={ag && <Tag round size="sm" icon={<Icon icon={Sparkles} size="xs" />}>{t('aiAgent')} · {ag.house}</Tag>} />
          <Stack direction="row" justify="between" align="center" wrap gap={2}>
            <Stack direction="row" gap={3} align="center"><PersonAvatar id={p.id} size="xl" />
              <Stack direction="column" gap={0}><Title level={2} size="xl">{p.name}</Title><Text size="sm" intent="muted">@{p.handle} · {ag ? ag.role + ' · ' + ag.status : p.user?.wallet}</Text></Stack></Stack>
            <Stack direction="row" gap={2} wrap>
              {ag && <Button variant="primary" iconLeft={Sparkles} onClick={() => s.openChat(p.id)}>{t('chatWith', { name: first })}</Button>}
              {!isMe && <Button variant={s.follow[p.id] ? 'secondary' : 'outline'} onClick={() => s.toggle('follow', p.id)}>{s.follow[p.id] ? t('following') : t('follow')}</Button>}
              {isMe && !ag && <Button variant="outline" onClick={s.openEditProfile}>{t('editProfile')}</Button>}
              {ag && <Button variant="outline" onClick={() => s.summon(p.id)}>{t('summon')}</Button>}
            </Stack>
          </Stack>
          <Text size="sm">{t('counts', { shots: fmt(ag ? ag.postCount : posts.length), followers: fmt(p.followers), following: fmt(p.following) })}</Text>
          <Text>{p.bio}</Text>{ag && <Text size="sm" intent="muted">{ag.style}</Text>}
          {p.user?.celebStats && <Rows cols={4} colsSm={2} aria-label="Stats">{Object.entries(p.user.celebStats).filter(([k]) => k !== 'kind').map(([k, v]) => (
            <Card key={k} variant="flat" padding="sm"><CardBody><Text size="xs" intent="muted">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</Text><Text weight="bold" numeric>{typeof v === 'number' ? fmt(v) : v}</Text></CardBody></Card>))}</Rows>}
          {sets.length > 0 && <StatusRail aria-label="Highlights" items={sets.map((h, i) => ({ id: h.id, label: h.label, sub: h.frames.length + ' moments',
            thumb: <WorldScene seed={h.id} />, onClick: () => s.openStory(p.id, i) }))} />}
          <TabList size="sm" variant="pills" activeId={tab} onChange={(id) => setTab(id as typeof tab)} items={tabs.map((x) => ({ id: x, label: x }))} />
          {more.includes(tab) ? <ProfileTab id={p.id} tab={tab as 'Likes'} />
          : tab === tabs[3] ? <ListView<Club> rows={clubs} keyOf={(c) => c.id} text={(c) => c.name + ' ' + c.tagline} cols={2} onRow={(c) => s.go('club', { clubId: c.id })}
              facets={[{ id: 'status', label: t('lsStatus'), get: (c) => (site.clubStatus as Record<string, string>)[c.status] }, { id: 'chain', label: t('lsChain'), get: (c) => c.chain }]}
              sorts={[{ id: 'holders', label: t('lsSortHolders'), by: (a, b) => b.holders - a.holders }, { id: 'az', label: t('lsSortAz'), by: (a, b) => a.name.localeCompare(b.name) }]}
              table={[{ id: 'name', header: t('lsColName'), cell: (c) => c.name, sortValue: (c) => c.name }, { id: 'holders', header: t('lsColHolders'), cell: (c) => fmt(c.holders), sortValue: (c) => c.holders, align: 'right' }]}
              render={(c) => <Tile tone={c.tone} ratio="16/9" depth={{ clubId: c.id, personId: c.founderId }} title={c.name} sub={c.tagline} onClick={() => s.go('club', { clubId: c.id })} />} />
          : <ListView<Post> rows={tab === tabs[1] ? posts : grid} keyOf={(x) => x.id} text={(x) => x.caption + ' ' + x.slides.map((y) => y.title).join(' ')} cols={tab === tabs[1] ? 4 : 3} onRow={(x) => s.openPost(x.id)}
              facets={[{ id: 'kind', label: t('lsColKind'), get: (x) => x.kind }, { id: 'club', label: t('lsColClub'), get: (x) => clubOf(x.clubId)?.name }, { id: 'world', label: t('lsWorld'), get: (x) => worldOf(x.worldId)?.name }]}
              sorts={[{ id: 'new', label: t('lsSortRecent'), by: (a, b) => b.createdAt.localeCompare(a.createdAt) }, { id: 'likes', label: t('lsSortLikes'), by: (a, b) => b.likes - a.likes }]}
              table={[{ id: 'title', header: t('lsColName'), cell: (x) => x.slides[0].title, sortValue: (x) => x.slides[0].title }, { id: 'date', header: t('lsColDate'), cell: (x) => x.createdAt.slice(0, 10), sortValue: (x) => x.createdAt },
                { id: 'likes', header: t('lsColLikes'), cell: (x) => fmt(x.likes), sortValue: (x) => x.likes, align: 'right' }, { id: 'comments', header: t('lsColComments'), cell: (x) => commentCount(x), sortValue: (x) => commentCount(x), align: 'right' }]}
              render={(x) => { if (tab === tabs[1]) { const k = posts.indexOf(x); const sl = x.slides[(tick + k) % x.slides.length];
                  return <Tile {...postTile(x, (tick + k) % x.slides.length)} ratio="9/16" title={sl.title} sub={t('plays', { n: fmt(x.likes * 7) })} onClick={() => s.openPost(x.id)} badges={<Tag round size="sm" icon={<Icon icon={Play} size="xs" />}>{t('slideOf', { i: ((tick + k) % x.slides.length) + 1, n: x.slides.length })}</Tag>} />; }
                return <Tile {...postTile(x)} title={x.slides[0].title} onClick={() => s.openPost(x.id)}
                  sub={t('likes', { n: fmt(x.likes) }) + ' · ' + t('comments', { n: commentCount(x, s.comments[x.id]?.length ?? 0) })} badges={x.slides.length > 1 && <Tag round size="sm" icon={<Icon icon={Layers} size="xs" />}>{x.slides.length}</Tag>} />; }} />}
        </Stack></Col>
        <Col span={4} xs={12} lg={4}><Stack direction="column" gap={3}>
          {ag && <Card depth={2} variant="hero"><CardBody><Stack direction="column" gap={2}><Title level={4} size="md">{t('ask', { name: first })}</Title><Text size="sm">{ag.askHint}</Text>
            {ag.prompts.map((q) => <Button key={q} variant="outline" size="sm" onClick={() => s.openChat(ag.id, q)}>{q}</Button>)}</Stack></CardBody></Card>}
          <Card depth={2}><CardBody><Title level={5} size="sm">{t('about')}</Title>{(ag ? [[t('house'), ag.house], [t('home'), ag.home], [t('chats'), ag.stats.conversations], [t('looks'), ag.stats.looks], [t('rating'), ag.stats.rating], [t('since'), ag.since]] : [[t('wallet'), p.user?.wallet ?? '']]).map(([k, v]) =>
            <Stack key={k} direction="row" justify="between"><Text size="sm" intent="muted">{k}</Text><Text size="sm" weight="medium">{v}</Text></Stack>)}</CardBody></Card>
          {ag && <Card depth={2}><CardBody><Title level={5} size="sm">{t('abilities')}</Title>{ag.abilities.map((x) => <Text key={x} size="sm">✓ {x}</Text>)}</CardBody></Card>}
          <Card depth={2}><CardBody><Title level={5} size="sm">{t('badges')}</Title><Stack direction="row" gap={1} wrap>{p.badges.map((b) => <Tag key={b} minimal round intent="primary">{b}</Tag>)}</Stack></CardBody></Card>
          <Card depth={2}><CardBody><Details at={{ kind: 'person', id: p.id }} /></CardBody></Card>
          <Connected kind="person" id={p.id} max={4} />
        </Stack></Col>
      </Grid>
    </Page>
  );
};
