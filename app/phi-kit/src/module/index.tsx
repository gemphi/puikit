import { Box, Stack, Title, WithHeadTools } from '@pui/components';
import React from 'react';
import type { Block as B } from '../data';
import { Agent } from '../blocks/Agent';
import { Chat } from '../blocks/Chat';
import { Faq, Hero, News, Prose } from '../blocks/Content';
import { Figure } from '../blocks/Figure';
import { Form } from '../blocks/Form';
import { Grid, type GridItem } from '../blocks/Grid';
import { Stats } from '../blocks/Stats';
import { Swap } from '../blocks/Swap';
import { Table } from '../blocks/Table';
import { Terminal } from '../blocks/Terminal';
import { Marquee, SiteBar, SiteFooter } from '../blocks/Site';
import { Feed } from './feed';
import { Product } from './product';
import { Query } from './query';
import { Runway } from './runway';

export type ModuleProps = { b: B; onOpen: (it: GridItem) => void };
export type ModuleView = React.FC<ModuleProps>;

/**
 * Every module any app can show, once, named in the singular. An app turns one on by naming it in its config
 * (`{ "kind": "feed", ... }` in <key>.json); it never carries its own copy. A feature only one app needs still lands
 * here, or that app contributes it with registerModule, and the next app gets it by config.
 */
const MODULE: Record<string, ModuleView> = {
  agent: ({ b }) => <Agent b={b} />,
  bar: ({ b }) => <SiteBar b={b} />,
  chat: ({ b }) => <Chat b={b} />,
  faq: ({ b }) => <Faq b={b} />,
  feed: Feed,
  figure: ({ b }) => <Figure b={b} />,
  footer: ({ b }) => <SiteFooter b={b} />,
  form: ({ b }) => <Form b={b} />,
  grid: Grid,
  hero: ({ b }) => <Hero b={b} />,
  marquee: ({ b }) => <Marquee b={b} />,
  news: ({ b }) => <News b={b} />,
  product: ({ b }) => <Product b={b} />,
  prose: ({ b }) => <Prose b={b} />,
  query: ({ b }) => <Query b={b} />,
  runway: ({ b }) => <Runway b={b} />,
  stats: ({ b }) => <Stats b={b} />,
  swap: ({ b }) => <Swap b={b} />,
  table: ({ b, onOpen }) => <Table b={b} onRoute={(hash) => onOpen({ title: '', route: hash })} />,
  terminal: ({ b }) => <Terminal b={b} />,
};

export const registerModule = (kind: string, view: ModuleView) => { MODULE[kind] = view; };

/** One block of an app's config, drawn by its module. */
export const Block: React.FC<ModuleProps> = ({ b, onOpen }) => {
  const View = MODULE[b.kind];
  if (!View) return null;
  // A titled block's heading is a header that takes tools: a list in it puts its total and layout right after the
  // title, its search and tabs in the room between, its filter and sort at the far end. With no title there is no
  // header, and the list draws its own bar.
  if (!b.title) return <Stack as="section" direction="column" gap={3}><View b={b} onOpen={onOpen} /></Stack>;
  return (
    <WithHeadTools>{(slot) => (
      <Stack as="section" direction="column" gap={3}>
        <Stack direction="row" gap={2} align="center" wrap><Box minWidth="0"><Title level={2} size="lg">{b.title}</Title></Box>{slot.start}{slot.center}{slot.end}</Stack>
        <View b={b} onOpen={onOpen} />
      </Stack>)}
    </WithHeadTools>
  );
};
