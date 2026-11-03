import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Drawer, Icon, Input, Modal, ProgressBar, Rows, Stack, Tag, Text, Textarea, Title, TabList, Toast, CommentThread } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronLeft, ChevronRight, Pause, Play, Send } from 'lucide-react';
import { D, agentOf, fmt, person, poolOf, postById, postsBy, site, storySets, t } from '../../lib/data';
import { useThreadFor } from '../../lib/lazy';
import { phieggStore } from '../../state/phieggStore';
import { liveCreate, liveEdit, type LiveKind, findRecord, liveRemove } from '../../lib/live';
import { KindForm, describe, kindLabel } from '../../lib/fields';
import { withDefaults } from '../../lib/kindDefaults';
import { RecordSheet } from './RecordSheet';
import { PersonLine } from './PersonLine';
import { PersonAvatar } from './PersonAvatar';
import { EntityAvatar } from './EntityAvatar';
import { Tile, tileColour } from './Tile';
import { postTile } from './ShotCard';
import { usePageTheme } from '../../lib/pageTheme';
import { CommerceOverlays } from './Commerce';
import { PoolOverlays } from './Pools';
import { CollectionSheet } from './CollectionSheet';
import { Connected } from './Connected';
import { ChatSheet } from './ChatSheet';

const Composer: React.FC<{ placeholder: string; onSend: (v: string) => void }> = ({ placeholder, onSend }) => {
  const [v, setV] = useState('');
  const send = () => { if (v.trim()) { onSend(v.trim()); setV(''); } };
  return <Stack direction="row" gap={2}><Input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
    <Button variant="primary" icon={<Icon icon={Send} size="sm" />} onClick={send}>{t('send')}</Button></Stack>;
};
export { Composer };

const Story: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'story' ? s.overlay : null;
  const [el, setEl] = useState(0); const { storyMs, tickMs } = site.autoplay;
  useEffect(() => setEl(0), [o?.idx]);
  useEffect(() => { if (!o || o.paused) return; const id = setInterval(() => setEl((e) => e + tickMs), tickMs); return () => clearInterval(id); }, [o?.paused, o?.idx]);
  useEffect(() => { if (el >= storyMs) s.storyStep(1); }, [el]);
  if (!o) return null;
  const f = o.frames[o.idx]; const p = person(o.uid); const segs = o.frames.filter((x) => x.setK === f.setK); const pool = poolOf(o.uid);
  return (
    <Modal isOpen onClose={s.close} size="sm" title={pool ? <Stack direction="row" gap={2} align="center"><EntityAvatar id={pool.id} name={pool.name} size="sm" /><Stack direction="column" gap={0}><Text size="sm" weight="bold">{pool.name}</Text><Text size="xs" intent="muted">{f.set}</Text></Stack></Stack> : <PersonLine id={p.id} sub={f.set} size="sm" />}>
      <Stack direction="column" gap={3}>
        <Stack direction="row" gap={1}>{segs.map((x) => <Stack key={x.i} grow={1}><ProgressBar value={x.i < f.i ? 1 : x.i === f.i ? el / storyMs : 0} size="sm" animate={false} /></Stack>)}</Stack>
        <Tile key={o.idx} animate tone={f.tone} ratio="9/16" big depth={pool ? { clubId: pool.clubId, worldId: pool.worldId, entityId: pool.id, entityName: pool.name } : { personId: o.uid }} title={f.title} sub={f.caption} onClick={() => s.storyStep(1)} />
        {pool && <Button variant="primary" onClick={() => s.go('pool', { poolId: pool.id })}>{t('plOpen')}</Button>}
        <Stack direction="row" gap={2} justify="center">
          <Button variant="ghost" icon={<Icon icon={ChevronLeft} size="sm" />} onClick={() => s.storyStep(-1)} aria-label={t('prev')} />
          <Button variant="ghost" icon={<Icon icon={o.paused ? Play : Pause} size="sm" />} onClick={() => s.pause(!o.paused)} aria-label={t('pause')} />
          <Button variant="ghost" icon={<Icon icon={ChevronRight} size="sm" />} onClick={() => s.storyStep(1)} aria-label={t('next')} />
        </Stack>
        <Composer placeholder={t('reply', { name: p.name })} onSend={(v) => p.isAgent ? s.openChat(p.id, v) : (s.close(), s.flash(t('replySent', { name: p.name })))} />
      </Stack>
    </Modal>
  );
};

const Shot: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'shot' ? s.overlay : null;
  const post = o ? postById(o.postId) : undefined; const n = post?.slides.length ?? 1;
  useEffect(() => { if (!o?.auto || n < 2) return; const id = setInterval(() => s.slide(1), site.autoplay.slideMs); return () => clearInterval(id); }, [o?.auto, o?.slide, n]);
  const thread = useThreadFor(o?.postId, D.shows.shows.find((x) => x.id === o?.postId)?.looks[o?.slide ?? 0]?.poseId);
  // The opened post is the same theme as its card: the page wears the slide's render colour while it is open.
  const pt = post ? postTile(post, o?.slide ?? 0) : undefined; const sl0 = post?.slides[o?.slide ?? 0] ?? post?.slides[0];
  usePageTheme(pt && sl0 ? tileColour({ tone: sl0.tone, title: sl0.title, sub: sl0.caption, depth: pt.depth, color: pt.color }).hex : undefined, null, 'soft', 'post');
  if (!o || !post) return null;
  const sl = post.slides[o.slide] ?? post.slides[0]; const p = person(post.authorId);
  type TC = { id: string; targetId?: string; parentId: string | null; authorId: string; text: string; at: string; likes: number };
  const show = D.shows.shows.find((x) => x.id === post.id); const poseId = show?.looks[o.slide]?.poseId;
  const all: TC[] = [...post.comments.map((c) => ({ ...c, parentId: null })), ...((thread ?? []) as TC[]), ...(s.comments[post.id] ?? []).map((c) => ({ ...c, parentId: null }))];
  return (
    <Modal isOpen onClose={s.close} size="xl" title={<PersonLine id={p.id} sub={post.caption} />}>
      <Stack direction="row" gap={4} wrap align="start">
        <Stack direction="column" gap={2} flex="1.4 1 20rem">
          <Tile key={o.slide} animate {...postTile(post, o.slide)} ratio="4/5" big title={sl.title} sub={sl.caption} badges={<><Tag round size="sm">{t('slideOf', { i: o.slide + 1, n })}</Tag>{n > 1 && <Tag round size="sm" interactive onClick={() => s.setAuto(!o.auto)}>{o.auto ? t('autoplayOn') : t('autoplayOff')}</Tag>}</>} />
          {n > 1 && <Stack direction="row" justify="center" gap={2}><Button variant="ghost" icon={<Icon icon={ChevronLeft} size="sm" />} onClick={() => s.slide(-1)} aria-label={t('prev')} />
            <TabList size="sm" variant="pills" aria-label="Slides" activeId={String(o.slide)} onChange={(id) => s.slide(Number(id), true)} items={post.slides.map((_, i) => ({ id: String(i), label: String(i + 1) }))} />
            <Button variant="ghost" icon={<Icon icon={ChevronRight} size="sm" />} onClick={() => s.slide(1)} aria-label={t('next')} /></Stack>}
        </Stack>
        <Stack direction="column" gap={3} flex="1 1 17.5rem" minWidth="0" paddingTop={5}>
          <CommentThread aria-label={t('lsColComments')} maxDepth={6} depth={2} maxHeight="60vh" comments={all.map((c) => ({ id: c.id, parentId: c.parentId, author: <PersonLine id={c.authorId} size="sm" />, meta: c.at, text: c.text }))}
            labels={{ reply: t('tcReply'), hide: t('tcHide'), show: (n) => t('tcShow', { n }) }} />
          <Composer placeholder={p.isAgent ? t('commentAgentPh', { name: p.name }) : t('commentPh')} onSend={(v) => s.comment(post.id, v)} />
          {post.authorId === D.core.currentUserId && D.feed.shots.some((x) => x.id === post.id) && (
            <Stack direction="row" justify="end"><Button size="sm" variant="danger" onClick={() => s.removeShot(post.id)}>{t('shotRemove')}</Button></Stack>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
};

const NestNew: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'nest' ? s.overlay : null;
  const [kind, setKind] = useState(o?.nestKind ?? 'channel'); const [name, setName] = useState('');
  if (!o) return null;
  const parent = s.nests.find((n) => n.id === o.parentId); const inWorld = parent?.kind === 'world';
  const kinds = D.hosts.nestKinds.filter((k) => (inWorld ? !['world', 'stage'].includes(k.kind) : k.kind !== 'city'));
  return (
    <Modal isOpen onClose={s.close} size="md" title={t('nestIn', { where: parent?.name ?? '' })}
      footer={<Stack direction="row" gap={2} justify="end"><Button variant="ghost" onClick={s.close}>{t('cancel')}</Button><Button variant="primary" disabled={!name.trim()} onClick={() => s.createNest(name, kind)}>{t('nestIt')}</Button></Stack>}>
      <Stack direction="column" gap={3}><Text size="sm" intent="muted">{t('nestHint')}</Text>
        <TabList size="sm" variant="pills" activeId={kind} onChange={(id) => setKind(id as typeof kind)} items={kinds.map((k) => ({ id: k.kind, label: k.label }))} />
        <Input value={name} placeholder={t('nestName')} onChange={(e) => setName(e.target.value)} /></Stack>
    </Modal>
  );
};

/** One edit sheet for every kind: fields and their controls come from data/kinds.json (editable + control),
    the save is a PATCH through Phiora. Declared once, configurable, never hand-built per record. */
const EditSheet: React.FC<{ kind: LiveKind; id: string; row: Record<string, unknown>; title: string; savedMsg: string }> = ({ kind, id, row, title, savedMsg }) => {
  const s = useStore(phieggStore);
  const [busy, setBusy] = useState(false);
  const save = async (values: Record<string, unknown>) => {
    setBusy(true);
    const r = await liveEdit(kind, id, values);
    setBusy(false);
    if (r.ok) { phieggStore.setState({ overlay: { kind: 'none' }, dataRev: Date.now() }); s.flash(savedMsg); }
    else if (r.status === 401) s.openSignIn();
    else s.flash(r.message);
  };
  return (
    <Drawer isOpen onClose={s.close} position="right" size="lg" expandable title={title}>
      <KindForm kind={kind} initial={row} onSubmit={save} submitLabel={t('epSave')} cancelLabel={t('cancel')} onCancel={s.close} busy={busy} fill />
    </Drawer>
  );
};

/** Create a record of any declared kind: fields, groups, steps and relation links all come from data/kinds.json.
    The save is a POST through Phiora. One sheet for every kind; add a kind to kinds.json, not a form here. */
const CreateSheet: React.FC = () => {
  const s = useStore(phieggStore);
  const o = s.overlay.kind === 'create' ? s.overlay : null;
  const [busy, setBusy] = useState(false);
  if (!o) return null;
  const save = async (values: Record<string, unknown>) => {
    setBusy(true);
    const r = await liveCreate(o.createKind, withDefaults(o.createKind, values));
    setBusy(false);
    if (r.ok) { phieggStore.setState({ overlay: o.back ? { kind: 'record', ...o.back } : { kind: 'none' }, dataRev: Date.now() }); s.flash('Created'); }
    else if (r.status === 401) s.openSignIn();
    else s.flash(r.message);
  };
  return (
    <Drawer isOpen onClose={s.close} position="right" size="lg" expandable title={'New ' + o.createKind}>
      <KindForm kind={o.createKind} initial={o.initial} onSubmit={save} submitLabel="Create" cancelLabel={t('cancel')} onCancel={() => (o.back ? phieggStore.setState({ overlay: { kind: 'record', ...o.back } }) : s.close())} busy={busy} fill />
    </Drawer>
  );
};

const EditProfile: React.FC = () => {
  const s = useStore(phieggStore); const open = s.overlay.kind === 'editProfile';
  const me = person(D.core.currentUserId);
  if (!open) return null;
  return <EditSheet kind="person" id={me.id} row={me as unknown as Record<string, unknown>} title={t('editProfile')} savedMsg={t('epSaved')} />;
};

/** Rename your club: fields from kinds.json, PATCH via Phiora (founders and editors only; the server decides). */
const EditClub: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'editClub' ? s.overlay : null;
  const club = o ? D.core.clubs.find((c) => c.id === o.id) : undefined;
  if (!o || !club) return null;
  return <EditSheet kind="club" id={club.id} row={club as unknown as Record<string, unknown>} title={t('editClub')} savedMsg={t('ecSaved')} />;
};

const PersonDrawer: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'person' ? s.overlay : null;
  const [wide, setWide] = useState(false);
  if (!o) return null;
  const p = person(o.id); const ag = agentOf(p.id); const all = postsBy(p.id); const posts = all.slice(0, wide ? 18 : 6); const sets = storySets(p.id);
  return (
    <Drawer isOpen onClose={s.close} position="right" size="md" expandable expanded={wide} onExpandedChange={setWide} expandLabel={t('expand')} collapseLabel={t('collapse')}
      title={<Stack direction="row" gap={2} align="center"><PersonAvatar id={p.id} size="lg" /><Stack direction="column" gap={0}><Title level={4} size="md">{p.name}</Title><Text size="xs" intent="muted">@{p.handle}{ag ? ' · ' + ag.role : ''}</Text></Stack></Stack>}
      footer={<Stack direction="row" gap={2}><Button variant="primary" onClick={() => s.go('profile', { profileId: p.id })}>{t('viewProfile')}</Button>
        <Button variant={s.follow[p.id] ? 'secondary' : 'outline'} onClick={() => s.toggle('follow', p.id)}>{s.follow[p.id] ? t('following') : t('follow')}</Button>
        {ag && <Button variant="outline" onClick={() => s.openChat(ag.id)}>{t('chat')}</Button>}</Stack>}>
      <Stack direction="column" gap={3}>
        <Tile tone={p.tone} ratio={wide ? '3/1' : '16/9'} big={wide} grid title={p.name} sub={t('counts', { shots: fmt(ag ? ag.postCount : all.length), followers: fmt(p.followers), following: fmt(p.following) })} depth={{ clubId: p.clubIds[0], personId: p.id }} />
        <Text>{p.bio}</Text>
        {p.badges.length > 0 && <Stack direction="row" gap={1} wrap>{p.badges.map((b) => <Tag key={b} minimal round intent="primary">{b}</Tag>)}</Stack>}
        {sets.length > 0 && <Stack direction="row" gap={1} wrap>{sets.map((h, i) => <Tag key={h.id} interactive round onClick={() => s.openStory(p.id, i)}>▶ {h.label}</Tag>)}</Stack>}
        <Rows cols={wide ? 6 : 3} colsSm={3} minItemWidth={wide ? '11rem' : undefined}>{posts.map((x) => <Tile key={x.id} animate {...postTile(x)} ratio={wide ? '4/5' : '1'} title={wide ? x.slides[0].title : undefined} onClick={() => s.openPost(x.id)} />)}</Rows>
        <Connected kind="person" id={p.id} max={wide ? 12 : 4} />
      </Stack>
    </Drawer>
  );
};

export const Overlays: React.FC = () => {
  const s = useStore(phieggStore);
  return <>{s.overlay.kind === 'story' && <Story />}{s.overlay.kind === 'shot' && <Shot />}{s.overlay.kind === 'chat' && <ChatSheet />}{s.overlay.kind === 'nest' && <NestNew />}{s.overlay.kind === 'person' && <PersonDrawer />}{s.overlay.kind === 'editProfile' && <EditProfile />}{s.overlay.kind === 'create' && <CreateSheet />}{s.overlay.kind === 'record' && <RecordSheet />}{s.overlay.kind === 'editClub' && <EditClub />}<CommerceOverlays /><PoolOverlays />{s.overlay.kind === 'list' && <CollectionSheet list={s.overlay.list} />}
    {s.toast && <Toast message={s.toast} placement="center" />}</>;
};
