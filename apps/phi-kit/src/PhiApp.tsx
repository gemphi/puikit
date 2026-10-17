import React from 'react';
import { Box, Spinner, Text, Title } from '@pui/components';
import { appMeta, loadApp, type AppData } from './data';
import { resolvePulls } from './pulls';
import { PhiShell } from './PhiShell';
import { Block, type GridItem } from './blocks';
import { SettingsView, ItemPanel } from './views';
import { Profile, useMine, buildAccountNav } from './Profile';
import { AppLanding } from './AppLanding';
import { RecordSheet } from './RecordSheet';

/** The address, split: a page (#/pools) or a record (#/round/<id>). Two path segments mean a record, routed by kind. */
const readRoute = () => { const m = window.location.hash.match(/^#\/?([\w-]+)(?:\/([^?]+))?/); return { seg0: m?.[1] ?? '', seg1: m?.[2] ? decodeURIComponent(m[2]) : '' }; };

/** A whole Phi app from its data file: sections from `nav`, pages from `views`, built-ins You + Settings. */
export const PhiApp: React.FC<{ appKey: string }> = ({ appKey }) => {
  const app = appMeta(appKey);
  const [data, setData] = React.useState<AppData | null>(null);
  const [err, setErr] = React.useState('');
  const [route, setRoute] = React.useState(readRoute);
  const [open, setOpen] = React.useState<GridItem | null>(null);
  const lastTab = React.useRef('');

  // The page paints from the app document at once; the records it pulls from Phiora (menus, sections, counts) land after.
  React.useEffect(() => { loadApp(appKey).then((d) => { setData(d); return resolvePulls(d).then(setData); }, (e) => setErr(String(e.message || e))); }, [appKey]);
  React.useEffect(() => { const f = () => setRoute(readRoute()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  React.useEffect(() => { document.title = app ? app.name + ' · ' + app.tagline : appKey; }, [app, appKey]);

  // Every app opens on the same Welcome landing (built from its own data); it leads the rail.
  const WELCOME = { id: '_welcome', label: 'Welcome', icon: 'rocket', items: [{ id: '_welcome', label: 'Welcome', icon: 'rocket' }] };
  const nav = data ? [WELCOME, ...data.nav] : [];
  const views = data?.views ?? {};
  // A record route (#/round/<id>): a second segment on a name that is not one of this app's pages.
  const record = route.seg1 && !views[route.seg0] ? { kind: route.seg0, id: route.seg1 } : null;
  const tab = record ? (lastTab.current || '_welcome') : (route.seg0 || '_welcome');
  if (!record) lastTab.current = tab;
  const cur = tab;
  const go = (x: string) => { const h = x.replace(/^#/, ''); window.location.hash = h.startsWith('/') ? h : '/' + h; setOpen(null); };
  const openItem = (it: GridItem) => { if (it.route) go(it.route); else setOpen(it); };
  // Which page creates a kind (for a record's actions): the view whose form block has that createKind.
  const formFor = (createKind: string) => Object.entries(views).find(([, v]) => v.blocks.some((b) => b.kind === 'form' && b.createKind === createKind))?.[0];
  const v = data && data.views[cur];

  // The account (You) is a dashboard: the shell's foot gets its sub-nav, filled with your own records (useMine).
  const mine = useMine(data?.profile);
  const account = data?.profile ? buildAccountNav(data.profile, mine) : undefined;
  const section = cur === '_wallet' ? 'wallet' : cur === '_account' ? 'account' : cur.startsWith('_you_') ? cur.slice(5) : undefined;
  const onAccount = ['_you', '_wallet', '_account'].includes(cur) || cur.startsWith('_you_');

  let page: React.ReactNode;
  if (cur === '_welcome') page = data ? <AppLanding data={data} go={go} /> : <Spinner />;
  else if (onAccount) page = <Profile spec={data?.profile} section={section} mine={mine} onOpen={openItem} />;
  else if (cur === '_settings') page = <SettingsView />;
  else if (err) page = <Text intent="secondary" maxWidth="60ch" marginTop={2}>{err}</Text>;
  else if (!data) page = <Spinner />;
  else if (!v) page = <Text intent="secondary" maxWidth="60ch" marginTop={2}>Nothing here yet.</Text>;
  else page = (
    <>
      {v.title ? <Box as="header"><Title level={1} size="2xl" lineHeight={1.1}>{v.title}</Title>{v.sub ? <Text intent="secondary" maxWidth="60ch" marginTop={2}>{v.sub}</Text> : null}</Box> : null}
      {v.blocks.map((b, i) => <Block key={cur + i} b={b} onOpen={openItem} />)}
    </>
  );

  return (
    <PhiShell app={app} nav={nav} view={cur} onView={go} onRecord={openItem} account={account} right={open ? <ItemPanel it={open} onClose={() => setOpen(null)} /> : null}>
      {page}
      {record ? <RecordSheet kind={record.kind} id={record.id} onClose={() => go('#/' + cur)} go={go} formFor={formFor} /> : null}
    </PhiShell>
  );
};
