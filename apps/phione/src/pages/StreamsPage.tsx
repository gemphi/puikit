import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Icon, Input, Page, Stack, TabList, Tag, Text, Textarea, Title, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { Pause, Play, Radio, RefreshCw, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { streamStore } from '../state/streamStore';
import { hasPhiadk } from '../state/phiadkClient';
import type { StreamPacket } from '../types/streams';

const POLL_MS = 3000;

/** PhiBus streams: the Phient bus (GET /v2/bus/events, polled while running), filtered by topic, sortable, and a publisher. */
export const StreamsPage: React.FC = () => {
  const { packets, live, isPaused, selectedTaxonomy, searchQuery, lastError, togglePause, setTaxonomy, setSearch, clearPackets, refresh, publish } = useStore(streamStore);
  const [topic, setTopic] = useState('AGENT_STATUS');
  const [body, setBody] = useState('{ "state": "RUNNING" }');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPhiadk || isPaused) return undefined;
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [isPaused, refresh]);

  const topics = useMemo(() => ['ALL', ...Array.from(new Set(packets.map((p) => p.taxonomy))).sort()], [packets]);
  const sources = useMemo(() => new Set(packets.map((p) => p.source)).size, [packets]);
  const q = searchQuery.trim().toLowerCase();
  const rows = packets.filter((p) => (selectedTaxonomy === 'ALL' || p.taxonomy === selectedTaxonomy)
    && (!q || (p.source + ' ' + p.taxonomy + ' ' + JSON.stringify(p.payload)).toLowerCase().includes(q)));

  const send = async () => {
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(body || '{}'); } catch { setNote('The payload is not valid JSON.'); return; }
    const ok = await publish(topic.trim() || 'default', payload);
    setNote(ok ? `Published to ${topic}.` : 'The Phient bus did not accept the event.');
  };

  const columns: DataTableColumn<StreamPacket>[] = [
    { id: 'seq', header: 'Sequence', cell: (p) => <Badge variant="secondary">#{p.sequence}</Badge>, sortValue: (p) => p.sequence, width: '7rem' },
    { id: 'time', header: 'Time', cell: (p) => <Text as="span" size="sm" numeric>{p.timestamp}</Text>, sortValue: (p) => p.timestamp, width: '7rem' },
    { id: 'topic', header: 'Topic', cell: (p) => <Tag intent="primary" minimal round size="sm">{p.taxonomy}</Tag>, sortValue: (p) => p.taxonomy },
    { id: 'source', header: 'Source agent', cell: (p) => <Badge variant="primary">{p.source}</Badge>, sortValue: (p) => p.source },
    { id: 'payload', header: 'Payload', cell: (p) => <Text as="span" size="xs" intent="secondary" mono truncate maxWidth="20rem">{JSON.stringify(p.payload)}</Text> },
    { id: 'sha', header: 'Commit', cell: (p) => <Stack direction="row" align="center" gap={1}><Icon icon={ShieldCheck} size="xs" /><Text as="span" size="xs" intent="muted" mono>{p.merkleSignature}</Text></Stack> },
  ];

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="between" align="center" wrap gap={2}>
          <Stack direction="column" gap={1}>
            <Title level={2} size="xl">PhiBus streams</Title>
            <Text intent="secondary">Events on the Phient bus, newest first. Filter by topic, sort any column, publish your own.</Text>
          </Stack>
          <Stack direction="row" gap={2} align="center">
            <Tag intent={live ? 'success' : hasPhiadk ? 'warning' : undefined} minimal round>{live ? 'Live' : hasPhiadk ? 'Connecting' : 'Sample data'}</Tag>
            {hasPhiadk && <Button size="sm" variant="ghost" onClick={() => void refresh()} icon={<Icon icon={RefreshCw} size="xs" />}>Refresh</Button>}
            <Button size="sm" variant={isPaused ? 'danger' : 'primary'} onClick={togglePause} icon={<Icon icon={isPaused ? Play : Pause} size="xs" />}>{isPaused ? 'Resume' : 'Pause'}</Button>
            <Button size="sm" variant="ghost" onClick={clearPackets} icon={<Icon icon={Trash2} size="xs" />}>Clear</Button>
          </Stack>
        </Stack>
        {lastError && <Text size="sm" intent="warning">{lastError}</Text>}

        <Stack autoFill="10rem" gap={3}>
          {[['Packets', packets.length], ['Topics', topics.length - 1], ['Sources', sources], ['Shown', rows.length]].map(([l, v]) => (
            <Stack key={l} direction="column" gap={1} surface="card"><Text as="span" size="xs" intent="muted">{l}</Text><Text as="span" font="heading" size="2xl" lineHeight={1} numeric>{v}</Text></Stack>))}
        </Stack>

        <Stack direction="row" gap={2} align="center" wrap>
          <TabList size="sm" variant="pills" aria-label="Topics" activeId={selectedTaxonomy} onChange={(id) => setTaxonomy(id)} items={topics.map((t) => ({ id: t, label: t === 'ALL' ? 'All' : t }))} />
          <Input value={searchQuery} onChange={(e) => setSearch(e.target.value)} placeholder="Search source, topic or payload" aria-label="Search packets" width="18rem" />
        </Stack>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={Radio} size="sm" /><Title level={4} size="md">Packets ({rows.length})</Title></Stack></CardHeader>
          <CardBody>
            <DataTable rows={rows} getKey={(p) => p.id} columns={columns} defaultSort={{ id: 'seq', dir: 'desc' }}
              empty={{ title: 'No packets', description: hasPhiadk ? 'Nothing on the bus for this filter yet. Publish one below.' : 'Clear removed the samples; publish one below.' }} />
          </CardBody>
        </Card>

        <Card variant="default">
          <CardHeader><Stack direction="row" align="center" gap={2}><Icon icon={Send} size="sm" /><Title level={4} size="md">Publish</Title></Stack></CardHeader>
          <CardBody>
            <Stack direction="column" gap={2} maxWidth="40rem">
              <Stack as="label" direction="column" gap={1}><Text as="span" size="xs" intent="muted">Topic</Text><Input value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" /></Stack>
              <Stack as="label" direction="column" gap={1}><Text as="span" size="xs" intent="muted">Payload (JSON)</Text><Textarea value={body} onChange={(e) => setBody(e.target.value)} minRows={3} aria-label="Payload" /></Stack>
              <Stack direction="row" gap={2} align="center"><Button variant="primary" size="sm" onClick={() => void send()} icon={<Icon icon={Send} size="xs" />}>Publish</Button>{note && <Text as="span" size="sm" intent="secondary" role="status">{note}</Text>}</Stack>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </Page>
  );
};
