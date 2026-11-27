import React from 'react';
import { Box, Button, Stack, Tag, Text, Title } from '@pui/components';
import { APPS, appUrl, type AppData } from './data';
import { AccountPanel } from './AccountDialog';
import { accountsEnabled } from './auth';
import { useWallet, fmt, LABEL, USD, type Coin } from './wallet';
import type { GridItem } from './blocks';
import { FieldList, cardPicture } from './blocks/GridExtra';
import { Profile, type ProfileSpec } from './Profile';

/** A page's head, the same on every page of every app: its title and one line under it. `action` puts the page's own
 *  controls (a status tag, a refresh, a primary button) at the end of the head's row. */
export const Head: React.FC<{ title: string; sub?: string; action?: React.ReactNode }> = ({ title, sub, action }) => {
  const head = <Box as="header"><Title level={1} size="2xl" lineHeight={1.1}>{title}</Title>{sub ? <Text intent="secondary" maxWidth="60ch" marginTop={2}>{sub}</Text> : null}</Box>;
  return action ? <Stack direction="row" justify="between" align="center" wrap gap={3}>{head}<Stack direction="row" gap={2} align="center" wrap>{action}</Stack></Stack> : head;
};

export const YouView: React.FC<{ profile?: ProfileSpec }> = ({ profile }) => {
  const w = useWallet();
  const coins: Coin[] = ['usd', 'egg', 'sum', 'eth'];
  const total = coins.reduce((a, c) => a + w[c] * USD[c], 0);
  return (
    <>
      <Head title="You" sub={'Wallet worth ' + Math.round(total).toLocaleString('en-US') + ' USD across Phiace.'} />
      <Profile spec={profile} />
      <Stack autoFill="220px" gap={3}>
        {coins.map((c) => (
          <Stack key={c} direction="column" gap={2} surface="card"><Text as="span" size="xs" intent="muted">{LABEL[c]}</Text><Text as="span" font="heading" size="3xl" lineHeight={1}>{fmt(c, w[c])}</Text><Text as="span" size="sm" intent="secondary" flex="1">≈ {Math.round(w[c] * USD[c]).toLocaleString('en-US')} USD</Text></Stack>
        ))}
      </Stack>
      {accountsEnabled && <Stack as="section" maxWidth="560px" direction="column" gap={2} surface="card">
        <Title level={2} size="lg">Account</Title>
        <AccountPanel />
      </Stack>}
      <Stack as="section" direction="column" gap={3}>
        <Title level={2} size="lg">Your apps</Title>
        <Stack direction="row" gap={2} wrap align="center">{APPS.filter((a) => a.built).map((a) => <Button key={a.key} variant="glass" href={appUrl(a.key)}>{a.name}</Button>)}</Stack>
      </Stack>
    </>
  );
};

/** A card of the app's own data with a `kind` and `id` (a token of a collection), found by its record address
 *  (#/<kind>/<id>), with the grid it is one of. */
export const ownItem = (views: AppData['views'], kind: string, id: string) => {
  // A card shown in several grids (a teaser on Home and the whole collection) opens with the largest of them, so its
  // facts, its standing and its strip come from the whole set.
  let found: { view: string; b: AppData['views'][string]['blocks'][number]; list: GridItem[]; at: number } | null = null;
  for (const [view, v] of Object.entries(views)) {
    for (const b of v.blocks) {
      const list = (b.items ?? []) as GridItem[];
      const at = list.findIndex((it) => it.kind === kind && it.id === id);
      if (at >= 0 && (!found || list.length > found.list.length)) found = { view, b, list, at };
    }
  }
  return found;
};
    }
  }
  return null;
};

export const ItemPanel: React.FC<{ it: GridItem; onClose: () => void }> = ({ it, onClose }) => (
  <>
    <Stack direction="row" justify="between" align="center">
      {it.sub ? <Text size="xs" weight="medium" as="span">{it.sub}</Text> : <Box />}
      <Button variant="glass" onClick={onClose}>Close</Button>
    </Stack>
    {it.image || it.sprite || it.swatch ? cardPicture(it, false, '16/10') : null}
    <Title level={2} size="2xl">{it.title}</Title>
    {it.body ? <Text as="p" size="sm" intent="secondary">{it.body}</Text> : null}
    {it.fields?.length ? <FieldList list={it.fields} /> : null}
    {it.cost ? <Text as="span" size="xs" intent="muted">Cost · {it.cost.toLocaleString('en-US')} USD</Text> : null}
    {it.meta ? <Text as="span" size="xs" intent="muted" mono>{it.meta}</Text> : null}
    {it.app ? <Button variant="glass" href={it.href || appUrl(it.app)}>Open in {it.app[0].toUpperCase() + it.app.slice(1)}</Button> : null}
  </>
);
