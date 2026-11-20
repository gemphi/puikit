import React, { useEffect, useRef, useState } from 'react';
import { Box, ChatComposer, Columns, CommentThread, Icon, Input, ItemCard, Stack, Tag, Text } from '@pui/components';
import { Search } from 'lucide-react';
import { t } from '../../lib/data';

/** A conversation in the list. `group` heads a run of rows (My chats, All agents); `onAvatar` is what its picture opens. */
export type ChatRow = { id: string; title: string; sub?: string; at?: string; unread?: number; avatar: React.ReactNode; group?: string; onAvatar?: () => void };
/** A message. `actions` are what can be done with it (run, save, copy): icon buttons at the right of its band. */
export type ChatLine = { id: string; mine: boolean; avatar: React.ReactNode; text?: React.ReactNode; attachment?: React.ReactNode; at?: string; who?: string; actions?: React.ReactNode };

/**
 * Every chat in the app, one way: the conversations (searchable) on the left, the thread in the middle with its
 * composer held at the foot, the people in it on the right. Each column expands over the others or closes into the
 * strip (the kit's Columns). Messages, the agent sheet and the hosts' nests all hand it their rows and lines.
 * A conversation is a full-width row on the kit's surface (ItemCard); the thread is the kit's CommentThread (each
 * message one band, its actions icons at the right) and its foot the kit's ChatComposer, both on the one surface.
 */
export const ChatColumns: React.FC<{
  rows: ChatRow[]; selected: string; onSelect: (id: string) => void;
  head: React.ReactNode; lines: ChatLine[]; onSend: (text: string) => void; placeholder: string;
  /** Shown over the thread (what an agent can do, a room's topic). */
  intro?: React.ReactNode;
  people?: React.ReactNode; prompts?: string[]; height?: string;
  /** The people column's own way out and back (a details stack): Columns' onClose, onBack and backLabel. */
  peopleNav?: { onClose?: () => void; onBack?: () => void; backLabel?: string };
  labels: { list: string; search: string; people: string };
}> = ({ rows, selected, onSelect, head, lines, onSend, placeholder, intro, people, prompts = [], height, peopleNav, labels }) => {
  const [q, setQ] = useState('');
  const list = useRef<HTMLElement | null>(null);
  // The newest line comes into view inside the thread, never by scrolling the page.
  useEffect(() => { const el = list.current; if (el) el.scrollTop = el.scrollHeight; }, [lines.length, selected]);
  const ql = q.trim().toLowerCase();
  const shown = rows.filter((r) => !ql || r.title.toLowerCase().includes(ql) || (r.sub ?? '').toLowerCase().includes(ql));

  // Every part of the column is a region of its own: the search, then each group of conversations under its name.
  const groups: { name?: string; rows: typeof shown }[] = [];
  shown.forEach((r) => { const name = ql ? undefined : r.group; const last = groups[groups.length - 1]; if (last && last.name === name) last.rows.push(r); else groups.push({ name, rows: [r] }); });
  const left = (
    <Stack direction="column" gap={2}>
      <Box surface="region"><Input value={q} placeholder={labels.search} aria-label={labels.search} icon={<Icon icon={Search} size="xs" />} onChange={(e) => setQ(e.target.value)} /></Box>
      {groups.map((g, k) => (
        <Stack key={(g.name ?? '') + k} direction="column" gap={1} surface="region">
          {g.name && <Text size="xs" weight="bold" intent="muted">{g.name}</Text>}
          {g.rows.map((r) => (
          <ItemCard key={r.id} variant="flat" padding="sm" stackBelow="never" mediaSize="sm" selected={r.id === selected} aria-current={r.id === selected || undefined} onClick={() => onSelect(r.id)}
            media={r.onAvatar ? <Box as="span" onClick={(e: React.MouseEvent) => { e.stopPropagation(); r.onAvatar?.(); }}>{r.avatar}</Box> : r.avatar}
            title={<Text size="sm" weight="semibold" truncate>{r.title}</Text>}
            meta={r.sub ? <Text size="xs" intent="muted" truncate>{r.sub}</Text> : undefined}
            aside={(r.at || r.unread) ? <Stack as="span" direction="column" gap={0} align="end">
              {r.at && <Text size="xs" intent="muted">{r.at}</Text>}
              {r.unread ? <Tag round size="sm">{r.unread}</Tag> : null}
            </Stack> : undefined} />))}
        </Stack>))}
    </Stack>
  );

  const thread = (
    <Stack direction="column" gap={3} height="100%" minHeight="0">
      {/* Each part of the thread is a region too: what it is about, the messages, the quick prompts, the composer. */}
      {intro && <Box surface="region">{intro}</Box>}
      <Box ref={list} className="ph-chat-list" surface="region">
        <CommentThread aria-label={labels.list} comments={lines.map((m) => ({ id: m.id, parentId: null, author: m.who, avatar: m.avatar, meta: m.at, mine: m.mine, actions: m.actions,
          text: <Stack direction="column" gap={1}>{m.text && <Text size="sm">{m.text}</Text>}{m.attachment}</Stack> }))} />
      </Box>
      {prompts.length > 0 && <Stack direction="row" gap={1} wrap surface="region">{prompts.map((p) => <Tag key={p} interactive round onClick={() => onSend(p)}>{p}</Tag>)}</Stack>}
      <Box surface="region"><ChatComposer placeholder={placeholder} sendLabel={t('send')} onSend={onSend} /></Box>
    </Stack>
  );

  return (
    <Box style={height ? { height } : undefined} className="ph-chat-columns">
      <Columns expandLabel={t('expand')} collapseLabel={t('collapse')}
        columns={[
          { id: 'list', title: labels.list, content: left, width: '18rem', closable: true, expandable: true },
          { id: 'thread', title: head, label: labels.list, content: thread, expandable: true, minWidth: '20rem' },
          { id: 'people', title: labels.people, content: people, width: '22rem', hidden: !people, expandable: true, closable: true, ...peopleNav },
        ]} />
    </Box>
  );
};
