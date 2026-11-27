import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, ChatComposer, Drawer, DrawerClosingContext, FullScreen, Icon, Input, Modal, ProgressBar, Rows, Stack, Tag, Text, Textarea, Title, TabList, Toast, CommentThread } from '@pui/components';
import { useStore } from '@pui/store';
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play, Send } from 'lucide-react';
import { D, fmt, person, postById, postsBy, site, storySets, t, itemOf } from '../../lib/data';
import { useThreadFor } from '../../lib/lazy';
import { phieggStore } from '../../state/phieggStore';
import { liveCreate, liveEdit, type LiveKind, liveRemove } from '../../lib/live';
import { KindForm, describe, kindLabel } from '../../lib/fields';
import { withDefaults } from '../../lib/kindDefaults';
import { RecordSheet } from './RecordSheet';
import { PersonLine } from './PersonLine';
import { PersonProfile } from './PersonProfile';
import { PersonAvatar } from './PersonAvatar';
import { EntityAvatar } from './EntityAvatar';
import { Tile } from './Tile';
import { postTile } from './ShotCard';
import { CommerceOverlays } from './Commerce';
import { PoolOverlays } from './Pools';
import { CollectionSheet } from './CollectionSheet';
import { Connected } from './Connected';
import { ChatSheet } from './ChatSheet';

/** Where a message is written: the kit's one composer, with this app's word for Send. */
const Composer: React.FC<{ placeholder: string; onSend: (v: string) => void }> = ({ placeholder, onSend }) => <ChatComposer placeholder={placeholder} sendLabel={t('send')} onSend={onSend} />;
export { Composer };

const Story: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'story' ? s.overlay : null;
  const [el, setEl] = useState(0); const { storyMs, tickMs } = site.autoplay;
  useEffect(() => setEl(0), [o?.idx]);
  useEffect(() => { if (!o || o.paused) return; const id = setInterval(() => setEl((e) => e + tickMs), tickMs); return () => clearInterval(id); }, [o?.paused, o?.idx]);
  useEffect(() => { if (el >= storyMs) s.storyStep(1); }, [el]);
  if (!o) return null;
  const f = o.frames[o.idx]; const p = person(o.uid); const segs = o.frames.filter((x) => x.setK === f.setK); const pool = itemOf('pool', o.uid);
  // A show plays full screen, over the whole app (the kit's FullScreen): the story fills the screen with its progress
  // over it, the arrows and the keys step through it, play/pause and the drop are its buttons, a reply comes up from the foot.
  const name = pool ? pool.name : p.name;
  return (
    <FullScreen label={name + ' · ' + f.set} onClose={s.close} closeLabel={t('close')} onPrev={() => s.storyStep(-1)} onNext={() => s.storyStep(1)} prevLabel={t('prev')} nextLabel={t('next')}
      actions={[
        { id: 'pause', label: t('pause'), icon: <Icon icon={o.paused ? Play : Pause} size="sm" />, active: o.paused, onClick: () => s.pause(!o.paused) },
        ...(pool ? [{ id: 'open', label: t('plOpen'), icon: <Icon icon={ExternalLink} size="sm" />, onClick: () => s.go('pool', { poolId: pool.id }) }] : []),
      ]}
      media={<Stack direction="column" gap={2} style={{ height: '100%', width: 'min(100%, calc((100dvh - 2rem) * 9 / 16))', margin: '0 auto', justifyContent: 'center' }}>
        <Stack direction="row" gap={1}>{segs.map((x) => <Stack key={x.i} grow={1}><ProgressBar value={x.i < f.i ? 1 : x.i === f.i ? el / storyMs : 0} size="sm" animate={false} /></Stack>)}</Stack>
        <Tile key={o.idx} animate tone={f.tone} ratio="9/16" big depth={pool ? { clubId: pool.clubId, worldId: pool.worldId, entityId: pool.id, entityName: pool.name } : { personId: o.uid }} title={f.title} sub={f.caption} onClick={() => s.storyStep(1)} />
      </Stack>}>
      <Composer placeholder={t('reply', { name: p.name })} onSend={(v) => p.isAgent ? s.openChat(p.id, v) : (s.close(), s.flash(t('replySent', { name: p.name })))} />
    </FullScreen>
  );
};

/** A post's comments as one block: the thread, then the composer held at its foot. The post's page shows it in its
 *  Chat section; anywhere else the comment button opens it in a drawer at the right (Comments, below). */
export const PostComments: React.FC<{ postId: string; slide?: number }> = ({ postId, slide = 0 }) => {
  const s = useStore(phieggStore); const post = postById(postId);
  const thread = useThreadFor(postId, D.shows.shows.find((x) => x.id === postId)?.looks[slide]?.poseId);
  if (!post) return null;
  const p = person(post.authorId);
  type TC = { id: string; targetId?: string; parentId: string | null; authorId: string; text: string; at: string; likes: number };
  const all: TC[] = [...post.comments.map((c) => ({ ...c, parentId: null })), ...((thread ?? []) as TC[]), ...(s.comments[post.id] ?? []).map((c) => ({ ...c, parentId: c.parentId ?? null }))];
  const me = D.core.currentUserId;
  return (
    <Stack direction="column" gap={3}>
      {/* The same chat as everywhere: each comment and reply a bubble with its writer's picture; Reply and Like work. */}
      <CommentThread aria-label={t('lsColComments')} maxDepth={6}
        comments={all.map((c) => ({ id: c.id, parentId: c.parentId, author: person(c.authorId).name, avatar: <PersonAvatar id={c.authorId} size="sm" />, meta: c.at, text: c.text,
          mine: c.authorId === me, liked: !!s.liked[c.id], likes: (c.likes ?? 0) + (s.liked[c.id] ? 1 : 0) }))}
        onReply={(parentId, text) => s.comment(post.id, text, parentId)} onLike={(id) => s.toggle('liked', id)}
        labels={{ reply: t('tcReply'), hide: t('tcHide'), show: (n) => t('tcShow', { n }), like: t('isLike'), send: t('send'), replyTo: t('tcReply') }} />
      <Composer placeholder={p.isAgent ? t('commentAgentPh', { name: p.name }) : t('commentPh')} onSend={(v) => s.comment(post.id, v)} />
    </Stack>
  );
};

/** A post's comments opened from its card: a drawer at the right, as wide as a column (never a window with the
 *  thread in a strip of it), the post's picture at its head so it is clear what the comments are on. */
const Comments: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'comments' ? s.overlay : null;
  const post = o ? postById(o.postId) : undefined;
  if (!o || !post) return null;
  const sl = post.slides[o.slide] ?? post.slides[0];
  return (
    <Drawer isOpen onClose={s.close} position="right" size="md" title={sl.title}>
      <Stack direction="column" gap={3}>
        <Tile {...postTile(post, o.slide)} ratio="4/3" title={sl.title} sub={person(post.authorId).name} onClick={() => { s.close(); s.openPost(post.id); }} />
        <PostComments postId={post.id} slide={o.slide} />
      </Stack>
    </Drawer>
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
      footer={<Stack direction="row" gap={2} justify="end"><Button variant="glass" onClick={s.close}>{t('cancel')}</Button><Button variant="glass" disabled={!name.trim()} onClick={() => s.createNest(name, kind)}>{t('nestIt')}</Button></Stack>}>
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

/** A person opened from anywhere: the one profile (PersonProfile) in the drawer at the right; widened, it lays out as the page. */
const PersonDrawer: React.FC = () => {
  const s = useStore(phieggStore); const o = s.overlay.kind === 'person' ? s.overlay : null;
  const [wide, setWide] = useState(false);
  if (!o) return null;
  return (
    <Drawer isOpen onClose={s.close} position="right" size="md" expandable expanded={wide} onExpandedChange={setWide} expandLabel={t('expand')} collapseLabel={t('collapse')} title={t('prProfile')}>
      <PersonProfile id={o.id} variant="popup" wide={wide} />
    </Drawer>
  );
};

export const Overlays: React.FC = () => {
  const s = useStore(phieggStore);
  // Tells the open drawer when it is sliding out, so it leaves the way it came instead of vanishing.
  return <DrawerClosingContext.Provider value={s.overlay.kind !== 'none' && s.closingOverlay === s.overlay}>{s.overlay.kind === 'story' && <Story />}{s.overlay.kind === 'comments' && <Comments />}{s.overlay.kind === 'chat' && <ChatSheet />}{s.overlay.kind === 'nest' && <NestNew />}{s.overlay.kind === 'person' && <PersonDrawer />}{s.overlay.kind === 'editProfile' && <EditProfile />}{s.overlay.kind === 'create' && <CreateSheet />}{s.overlay.kind === 'record' && <RecordSheet />}{s.overlay.kind === 'editClub' && <EditClub />}<CommerceOverlays /><PoolOverlays />{s.overlay.kind === 'list' && <CollectionSheet list={s.overlay.list} />}
    {s.toast && <Toast message={s.toast} placement="center" />}</DrawerClosingContext.Provider>;
};
