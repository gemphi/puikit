import React from 'react';
import { Box, Spinner, Text } from '@pui/components';
import { appMeta, loadApp, type AppData } from './data';
import { resolvePulls } from './pulls';
import { loadPeople, type People } from './people';
import { Hosts, madeRoom, useHosts } from './hosts';
import { Shops, useShops } from './shops';
import { Bag } from './bag';
import { FindPeople, directWith, useDirect } from './direct';
import { Friends, useFriendEntry } from './friends';
import words from './words.json';
import { PhiShell } from './PhiShell';
import { Block, type GridItem } from './blocks';
import { Head, ItemPage, ItemPanel, ownItem } from './views';
import { SettingsView } from './settings';
import { Profile, useMine, buildAccountNav } from './Profile';
import { AppLanding } from './AppLanding';
import { RecordSheet } from './RecordSheet';

/** The address, split: a page (#/pools) or a record (#/round/<id>). Two path segments mean a record, routed by kind. */
const readRoute = () => { const m = window.location.hash.match(/^#\/?([\w.-]+)(?:\/([^?]+))?/); return { seg0: m?.[1] ?? '', seg1: m?.[2] ? decodeURIComponent(m[2]) : '' }; };

/** A whole Phi app from its data file: sections from `nav`, pages from `views`, built-ins You + Settings. */
export const PhiApp: React.FC<{ appKey: string }> = ({ appKey }) => {
  const app = appMeta(appKey);
  const [data, setData] = React.useState<AppData | null>(null);
  const [err, setErr] = React.useState('');
  const [people, setPeople] = React.useState<People | null>(null);
  const [route, setRoute] = React.useState(readRoute);
  const [open, setOpen] = React.useState<GridItem | null>(null);
  const lastTab = React.useRef('');

  // The page paints from the app document at once; the records it pulls from Phiora (menus, sections, counts) land after.
  React.useEffect(() => { loadApp(appKey).then((d) => { setData(d); return resolvePulls(d).then(setData); }, (e) => setErr(String(e.message || e))); }, [appKey]);
  React.useEffect(() => { if (data?.people) void loadPeople(data.people).then(setPeople, () => setPeople(null)); }, [data?.people]);
  React.useEffect(() => { const f = () => setRoute(readRoute()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  React.useEffect(() => { document.title = app ? app.name + ' · ' + app.tagline : appKey; }, [app, appKey]);

  // Every app opens on the same Welcome landing (built from its own data); it leads the rail.
  const WELCOME = { id: '_welcome', label: 'Welcome', icon: 'rocket', items: [{ id: '_welcome', label: 'Welcome', icon: 'rocket' }] };
  // An app whose first page says it all (`"start": "show"`) opens there and has no Welcome.
  const start = data?.start ?? '_welcome';
  // The hosts a person is in are groups of the menu after the app's own, and one more entry adds a host.
  const hosts = useHosts(data);
  // The shops a person has open are groups too, each with its own menu, and one more entry picks a shop.
  const shops = useShops(data);
  // The direct list: friends first, what the app's data wrote, then the way to find anyone and the conversations the
  // viewer began.
  const friends = useFriendEntry(appKey, people);
  const direct = useDirect(appKey, people, data?.nav.find((n) => n.id === data.direct)?.items ?? []);
  const own = (data?.nav ?? []).map((n) => (data?.direct && n.id === data.direct ? { ...n, items: [friends, ...(n.items ?? []), ...direct] } : n));
  const nav = data ? [...(data.start ? own : [WELCOME, ...own]), ...hosts.nav, ...(hosts.on ? [{ id: '_hosts', label: words.host.add, icon: 'plus' }] : []), ...shops.nav, ...(shops.on ? [{ id: '_shops', label: words.shop.add, icon: 'compass' }] : [])] : [];
  const views = data?.views ?? {};
  // A record route (#/round/<id>): a second segment on a name that is not one of this app's pages.
  const record = route.seg1 && !views[route.seg0] && !shops.owns(route.seg0) ? { kind: route.seg0, id: route.seg1 } : null;
  // A record the app's own data holds (a token of one of its grids) is a page of its own; any other is Phiora's.
  const held = record ? ownItem(views, record.kind, record.id) : null;
  const tab = record ? (held?.view ?? (lastTab.current || start)) : (route.seg0 || start);
  if (!record) lastTab.current = tab;
  const cur = tab;
  const go = (x: string) => { const h = x.replace(/^#/, ''); window.location.hash = h.startsWith('/') ? h : '/' + h; setOpen(null); };
  const openItem = (it: GridItem) => { if (it.route) go(it.route); else setOpen(it); };
  // Which page creates a kind (for a record's actions): the view whose form block has that createKind.
  const formFor = (createKind: string) => Object.entries(views).find(([, v]) => v.blocks.some((b) => b.kind === 'form' && b.createKind === createKind))?.[0];
  // A room with no page written for it (a host's, of the catalogue or made here) is drawn as a room all the same.
  const isRoom = !!data?.people && (!!people?.room?.[cur] || !!madeRoom(appKey, cur) || !!directWith(cur));
  const v = data && (data.views[cur] ?? shops.view(cur, route.seg1) ?? (isRoom ? { title: '', blocks: [{ kind: 'chat', variant: 'room', app: appKey, source: data.people, room: cur }] } : undefined));

  // The account (You) is a dashboard: the shell's foot gets its sub-nav, filled with your own records (useMine).
  const mine = useMine(data?.profile);
  const account = data?.profile ? buildAccountNav(data.profile, mine) : undefined;
  const section = cur === '_wallet' ? 'wallet' : cur === '_account' ? 'account' : cur.startsWith('_you_') ? cur.slice(5) : undefined;
  const onAccount = ['_you', '_wallet', '_account'].includes(cur) || cur.startsWith('_you_');

  let page: React.ReactNode;
  if (cur === '_welcome') page = data ? <AppLanding data={data} go={go} /> : <Spinner />;
  else if (onAccount) page = <Profile spec={data?.profile} section={section} mine={mine} onOpen={openItem} />;
  else if (cur === '_settings') page = <SettingsView />;
  else if (cur === '_hosts') page = <Hosts hosts={hosts} go={go} />;
  else if (cur === '_shops') page = <Shops shops={shops} go={go} />;
  else if (cur === '_bag') page = <Bag app={appKey} />;
  else if (cur === '_people') page = <FindPeople app={appKey} people={people} go={go} />;
  else if (cur === '_friends') page = <Friends app={appKey} people={people} go={go} />;
  else if (err) page = <Text intent="secondary" maxWidth="60ch" marginTop={2}>{err}</Text>;
  else if (!data) page = <Spinner />;
  else if (held) page = <ItemPage found={held} go={go} />;
  else if (!v) page = <Text intent="secondary" maxWidth="60ch" marginTop={2}>Nothing here yet.</Text>;
  else page = (
    <>
      {v.title ? <Head title={v.title} sub={v.sub} /> : null}
      {v.blocks.map((b, i) => <Block key={cur + route.seg1 + i} b={b} onOpen={openItem} />)}
    </>
  );

  // A page that is the whole app (`"bare": true`), a show or a lookbook: no rail and no bar, the page alone.
  if (data?.bare) return <Box as="main" style={{ minHeight: '100vh', padding: 'clamp(1rem, 3vw, 2.5rem)' }}>{page}</Box>;

  return (
    <PhiShell app={app} nav={nav} side={data?.side} view={cur} onView={go} onRecord={openItem} account={account} people={people} right={open ? <ItemPanel it={open} onClose={() => setOpen(null)} /> : null}>
      {page}
      {record && !held ? <RecordSheet kind={record.kind} id={record.id} onClose={() => go('#/' + cur)} go={go} formFor={formFor} /> : null}
    </PhiShell>
  );
};
