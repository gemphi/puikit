
import React from 'react';
import { Box, Button, Input } from '@pui/components';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import type { DB } from '../data';

type Row = Record<string, any> & { id: string };
const KINDS = (db: DB): [string, Row[]][] => [
  ['user', db.core.users], ['club', db.core.clubs], ['shot', db.feed.shots], ['event', db.events.events],
  ['look', db.ls.looks], ['collection', db.ls.collections], ['application', db.phipad.applications], ['conversation', db.messages.conversations],
];

/** Admin data browser over everything Phiegg loaded: kinds → paged records → JSON + links (fields ending in Id/Ids). */
export const Data: React.FC<{ db: DB }> = ({ db }) => {
  const kinds = KINDS(db); const all = new Map<string, [string, Row]>(); kinds.forEach(([kd, rs]) => rs.forEach((r) => all.set(r.id, [kd, r])));
  const [kind, setKind] = React.useState('user');
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [sel, setSel] = React.useState<string[]>([]);
  const rows = (kinds.find(([kd]) => kd === kind)?.[1] || []).filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  const per = 20, pages = Math.max(1, Math.ceil(rows.length / per));
  const cur = sel.length ? all.get(sel[sel.length - 1]) : undefined;
  const links = cur ? Object.entries(cur[1]).filter(([f]) => /Ids?$/.test(f)).flatMap(([f, v]) => (Array.isArray(v) ? v : [v]).filter((id) => all.has(id)).map((id) => [f, id] as const)) : [];
  const incoming = cur ? [...all.values()].filter(([, r]) => r.id !== cur[1].id && Object.entries(r).some(([f, v]) => /Ids?$/.test(f) && (v === cur[1].id || (Array.isArray(v) && v.includes(cur[1].id))))).slice(0, 30) : [];
  const name = (r: Row) => r.name || r.title || r.handle || r.caption?.slice(0, 40) || r.id;
  return (
    <>
      <Box as="header"><Box as="h1" className={k.title}>Data</Box><Box as="p" className={k.sub}>Items by kind. Links follow any field ending in Id or Ids.</Box></Box>
      <Box className={s.chips}>{kinds.map(([kd, rs]) => <Button key={kd} size="sm" variant={kind === kd ? 'primary' : 'outline'} onClick={() => { setKind(kd); setPage(0); setSel([]); }}>{kd} · {rs.length}</Button>)}</Box>
      <Input className={k.input} style={{ flex: 'none', maxWidth: 520 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={'Filter ' + kind + 's'} aria-label="Filter" />
      <Box className={s.inbox}>
        <Box className={k.tableWrap}><Box as="table" className={k.table}><Box as="thead"><Box as="tr"><Box as="th">Name</Box><Box as="th">Id</Box></Box></Box>
          <Box as="tbody">{rows.slice(page * per, page * per + per).map((r) => <Box as="tr" key={r.id} onClick={() => setSel([r.id])} style={{ cursor: 'pointer', background: sel[0] === r.id ? 'var(--phi-organic-accent-100)' : undefined }}><Box as="td">{name(r)}</Box><Box as="td" className={k.mono}>{r.id}</Box></Box>)}</Box></Box>
          <Box className={k.row} style={{ padding: 12 }}><Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Box as="span" className={k.small}>{page + 1} / {pages}</Box><Button size="sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></Box>
        </Box>
        {cur ? (
          <Box className={k.card}>
            <Box className={k.row} style={{ justifyContent: 'space-between' }}><Box as="strong">{cur[0]} · {name(cur[1])}</Box>{sel.length > 1 ? <Button size="sm" variant="ghost" onClick={() => setSel(sel.slice(0, -1))}>Back</Button> : null}</Box>
            {links.length ? <><Box as="span" className={k.small}>→ Links</Box><Box className={k.row}>{links.map(([f, id]) => <Button key={f + id} size="sm" variant="outline" onClick={() => setSel([...sel, id])}>{f}: {name(all.get(id)![1])}</Button>)}</Box></> : null}
            {incoming.length ? <><Box as="span" className={k.small}>← Linked from</Box><Box className={k.row}>{incoming.map(([kd, r]) => <Button key={r.id} size="sm" variant="ghost" onClick={() => setSel([...sel, r.id])}>{kd}: {name(r)}</Button>)}</Box></> : null}
            <Box as="pre" className={k.mono} style={{ whiteSpace: 'pre-wrap', margin: 0, maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(cur[1], null, 2)}</Box>
          </Box>
        ) : <Box as="p" className={k.sub}>Pick a record.</Box>}
      </Box>
    </>
  );
};
