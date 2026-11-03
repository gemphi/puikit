import { Input, Stack, Text } from '@pui/components';
import React from 'react';
import type { Block } from '../data';
import s from '../kit.module.scss';

/** Scripted terminal: known commands print their lines; anything else prints "command not found". */
export const Terminal: React.FC<{ b: Block }> = ({ b }) => {
  const [lines, setLines] = React.useState<string[]>(b.lines || []);
  const [cmd, setCmd] = React.useState('');
  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const c = cmd.trim(); if (!c) return;
    const out: string[] = (b.commands || {})[c] || [c.split(' ')[0] + ': command not found. Try: ' + Object.keys(b.commands || {}).join(', ')];
    setLines((l) => [...l, '$ ' + c, ...out]); setCmd('');
  };
  return (
    <Stack as="form" className={s.term} gap={1} onSubmit={run}>
      {lines.map((l, i) => <Text as="span" key={i} size="sm" mono pre intent="inherit">{l}</Text>)}
      <Stack direction="row" gap={2} align="center"><Text as="span" size="sm" mono intent="inherit">$</Text><Input className={s.termIn} value={cmd} onChange={(e) => setCmd(e.target.value)} aria-label="Command" autoComplete="off" /></Stack>
    </Stack>
  );
};
