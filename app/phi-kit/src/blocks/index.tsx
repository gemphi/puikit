import { Stack, Title } from '@pui/components';
import React from 'react';
import type { Block as B } from '../data';
import { Chat } from './Chat';
import { Grid, type GridItem } from './Grid';
import { Table } from './Table';
import { Terminal } from './Terminal';
import { Swap } from './Swap';
import { Stats } from './Stats';
import { Figure } from './Figure';
import { Hero, News, Prose, Faq } from './Content';
import { Agent } from './Agent';
import { Form } from './Form';

export type { GridItem };

/** One renderer for every content block kind in app data. Add a kind here, not per app. */
export const Block: React.FC<{ b: B; onOpen: (it: GridItem) => void }> = ({ b, onOpen }) => {
  const body =
    b.kind === 'chat' ? <Chat b={b} /> :
    b.kind === 'grid' ? <Grid b={b} onOpen={onOpen} /> :
    b.kind === 'table' ? <Table b={b} onRoute={(hash) => onOpen({ title: '', route: hash })} /> :
    b.kind === 'terminal' ? <Terminal b={b} /> :
    b.kind === 'swap' ? <Swap b={b} /> :
    b.kind === 'stats' ? <Stats b={b} /> :
    b.kind === 'figure' ? <Figure b={b} /> :
    b.kind === 'hero' ? <Hero b={b} /> :
    b.kind === 'news' ? <News b={b} /> :
    b.kind === 'prose' ? <Prose b={b} /> :
    b.kind === 'faq' ? <Faq b={b} /> :
    b.kind === 'agent' ? <Agent b={b} /> :
    b.kind === 'form' ? <Form b={b} /> : null;
  if (!body) return null;
  return <Stack as="section" direction="column" gap={3}>{b.title ? <Title level={2} size="lg">{b.title}</Title> : null}{body}</Stack>;
};
