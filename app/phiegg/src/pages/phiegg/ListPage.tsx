import React, { useMemo, useState } from 'react';
import { Page, Stack, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { phieggStore } from '../../state/phieggStore';
import { TabLists } from '../../components/Phiegg/KindList';
import { routeOf, rowsOf, worded } from '../../lib/route';

/** A list page: a path's title, its line and its tabs (data/route.json), each tab a kind and its rows. Worlds, shows,
 *  events, drops, hosts, quests, coins, pools, shops and casts are all this page; a new list is a line of data. */
export const ListPage: React.FC<{ path: string }> = ({ path }) => {
  const s = useStore(phieggStore); const route = routeOf(path); const [on, setOn] = useState(route.on ?? '');
  const tabs = useMemo(() => (route.tab ?? []).map((tab) => ({ tab, rows: rowsOf(tab, undefined) })), [path, s.dataRev]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = tabs[0]?.rows.length ?? 0; const title = worded(route.title, count);
  return (
    <Page><Stack direction="column" gap={4}>
      <Stack direction="column" gap={1} surface="region"><Title level={2} size="xl">{title}</Title>{route.sub ? <Text intent="secondary">{worded(route.sub, count)}</Text> : null}</Stack>
      <TabLists tabs={tabs} on={on} onTab={setOn} label={title} />
    </Stack></Page>
  );
};
