import React, { useMemo, useState } from 'react';
import { Badge, Button, Icon, Stack, Tag, Text, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { Pause, Play, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { streamStore } from '../state/streamStore';
import { hasPhiadk } from '../state/phiadkClient';
import type { StreamPacket } from '../types/streams';
import { dataCell, sourceTag, timeCell, usePoll, type ConsoleView } from './part';

const COLUMN: DataTableColumn<StreamPacket>[] = [
  { id: 'seq', header: 'Sequence', cell: (p) => <Badge variant="secondary">#{p.sequence}</Badge>, sortValue: (p) => p.sequence, width: '7rem' },
  { id: 'time', header: 'Time', cell: (p) => timeCell(p.timestamp), sortValue: (p) => p.timestamp, width: '7rem' },
  { id: 'topic', header: 'Topic', cell: (p) => <Tag intent="primary" minimal round size="sm">{p.taxonomy}</Tag>, sortValue: (p) => p.taxonomy },
  { id: 'source', header: 'Source agent', cell: (p) => <Badge variant="primary">{p.source}</Badge>, sortValue: (p) => p.source },
  { id: 'payload', header: 'Payload', cell: (p) => dataCell(p.payload, '20rem') },
  { id: 'sha', header: 'Commit', cell: (p) => <Stack direction="row" align="center" gap={1}><Icon icon={ShieldCheck} size="xs" /><Text as="span" size="xs" intent="muted" mono>{p.merkleSignature}</Text></Stack> },
];

/** PhiBus streams: the Phient bus (GET /v2/bus/events, polled while running), filtered by topic, sortable, and a publisher. */
export const useStreamView = (): ConsoleView => {
  const { packets, live, isPaused, selectedTaxonomy, searchQuery, lastError, togglePause, setTaxonomy, setSearch, clearPackets, refresh, publish } = useStore(streamStore);
  const [note, setNote] = useState<string | null>(null);
  usePoll(hasPhiadk && !isPaused, refresh, 3000);

  const topics = useMemo(() => ['ALL', ...Array.from(new Set(packets.map((p) => p.taxonomy))).sort()], [packets]);
  const sources = useMemo(() => new Set(packets.map((p) => p.source)).size, [packets]);
  const q = searchQuery.trim().toLowerCase();
  const rows = packets.filter((p) => (selectedTaxonomy === 'ALL' || p.taxonomy === selectedTaxonomy)
    && (!q || (p.source + ' ' + p.taxonomy + ' ' + JSON.stringify(p.payload)).toLowerCase().includes(q)));

  const send = async (v: Record<string, string>) => {
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(v.body || '{}'); } catch { setNote('The payload is not valid JSON.'); return; }
    const topic = v.topic.trim() || 'default';
    const ok = await publish(topic, payload);
    setNote(ok ? `Published to ${topic}.` : 'The Phient bus did not accept the event.');
  };

  return {
    title: 'PhiBus streams',
    sub: 'Events on the Phient bus, newest first. Filter by topic, sort any column, publish your own.',
    action: <>
      {sourceTag(live)}
      {hasPhiadk && <Button size="sm" variant="ghost" onClick={() => void refresh()} icon={<Icon icon={RefreshCw} size="xs" />}>Refresh</Button>}
      <Button size="sm" variant={isPaused ? 'danger' : 'primary'} onClick={togglePause} icon={<Icon icon={isPaused ? Play : Pause} size="xs" />}>{isPaused ? 'Resume' : 'Pause'}</Button>
      <Button size="sm" variant="ghost" onClick={clearPackets} icon={<Icon icon={Trash2} size="xs" />}>Clear</Button>
    </>,
    noteList: lastError ? [{ text: lastError, intent: 'warning' }] : [],
    blocks: [
      { kind: 'stats', items: [{ label: 'Packets', value: packets.length }, { label: 'Topics', value: topics.length - 1 }, { label: 'Sources', value: sources }, { label: 'Shown', value: rows.length }] },
      {
        kind: 'table', title: `Packets (${rows.length})`, columns: COLUMN, items: rows, getKey: (p: StreamPacket) => p.id, sort: { id: 'seq', dir: 'desc' },
        tabs: { label: 'Topics', activeId: selectedTaxonomy, onChange: setTaxonomy, items: topics.map((t) => ({ id: t, label: t === 'ALL' ? 'All' : t })) },
        search: { value: searchQuery, onChange: setSearch, placeholder: 'Search source, topic or payload' },
        empty: { title: 'No packets', description: hasPhiadk ? 'Nothing on the bus for this filter yet. Publish one below.' : 'Clear removed the samples; publish one below.' },
      },
      {
        kind: 'form', variant: 'inline', title: 'Publish', submitLabel: 'Publish', onSubmit: send, note,
        fields: [{ id: 'topic', label: 'Topic', value: 'AGENT_STATUS' }, { id: 'body', label: 'Payload (JSON)', control: 'textarea', value: '{ "state": "RUNNING" }' }],
      },
    ],
  };
};
