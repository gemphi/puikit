import { Box, Button, Stack, Table, Text, Textarea } from '@pui/components';
import React from 'react';
import { apiSend } from '../api';
import type { Block } from '../data';

type Sample = { label: string; query: Record<string, unknown> };
type Result = { items: Record<string, unknown>[]; total: number };

const cell = (v: unknown) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

/**
 * Ask the database with the original Phiora operations: map, has, select, with, orderBy, limit, offset, count, first.
 * Config: { "kind": "query", "samples": [{ "label": "Top looks", "query": { "map": "look", "limit": 5 } }] }
 */
export const Query: React.FC<{ b: Block }> = ({ b }) => {
  const samples: Sample[] = b.samples ?? [];
  const [body, setBody] = React.useState(JSON.stringify(samples[0]?.query ?? { map: 'look', limit: 5 }, null, 2));
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState('');

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    let query: unknown;
    try { query = JSON.parse(body); } catch { setError('That is not valid JSON.'); return; }
    const r = await apiSend<Result>('POST', b.path ?? '/ora/query', query);
    if (r.ok) setResult(r.body);
    else { setResult(null); setError(r.message); }
  };

  const fields = result ? [...new Set(result.items.flatMap((r) => Object.keys(r)))].filter((k) => !['slug', 'ord'].includes(k)).slice(0, 8) : [];
  return (
    <Stack as="form" direction="column" gap={3} onSubmit={run}>
      {samples.length ? (
        <Stack direction="row" gap={2} wrap>
          {samples.map((s) => <Button key={s.label} type="button" variant="ghost" size="sm" onClick={() => setBody(JSON.stringify(s.query, null, 2))}>{s.label}</Button>)}
        </Stack>
      ) : null}
      <Textarea aria-label="Query" rows={8} value={body} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)} />
      <Stack direction="row" gap={3} align="center">
        <Button type="submit">Run</Button>
        {result ? <Text size="sm" intent="secondary">{result.total.toLocaleString('en-US')} records</Text> : null}
        {error ? <Text size="sm" intent="danger">{error}</Text> : null}
      </Stack>
      {result?.items.length ? (
        <Box surface="panel" padding={0} scroll="x">
          <Table headers={fields} rows={result.items.map((r) => fields.map((f) => cell(r[f])))} />
        </Box>
      ) : null}
    </Stack>
  );
};
