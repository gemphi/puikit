
import React from 'react';
import { Spinner, Tag, Text } from '@pui/components';
import { PhiShell } from '@phi-kit/PhiShell';
import { appMeta } from '@phi-kit/data';
import { Block, type GridItem } from '@phi-kit/blocks';
import { Head, ItemPanel, YouView } from '@phi-kit/views';
import { SettingsView } from '@phi-kit/settings';
import { useDB } from './data';
import { PAGE, detail } from './pages';

const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'launch', label: 'Launch', icon: 'rocket', items: [
    { id: 'launchpad', label: 'Launchpad', icon: 'rocket' },
    { id: 'tracks', label: 'Tracks', icon: 'layers' },
    { id: 'pipeline', label: 'Pipeline', icon: 'chart' },
    { id: 'portfolio', label: 'Portfolio', icon: 'grid' },
    { id: 'apply', label: 'Apply', icon: 'clipboard' },
  ] },
  { id: 'learn', label: 'Learn', icon: 'compass', items: [
    { id: 'news', label: 'News', icon: 'chat' },
    { id: 'about', label: 'About', icon: 'compass' },
    { id: 'faq', label: 'FAQ', icon: 'vote' },
  ] },
];
const readHash = () => (window.location.hash.match(/^#\/?([\w-]+)/) || [])[1] || 'home';

/** Phipad: the shared shell, and each view a list of shared blocks built from the db (pages.tsx). */
export const App: React.FC = () => {
  const { db, err, live } = useDB();
  const [view, setView] = React.useState(readHash);
  const [open, setOpen] = React.useState<GridItem | null>(null);
  React.useEffect(() => { const f = () => setView(readHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const go = (id: string) => { window.location.hash = '/' + id; setOpen(null); };
  const openItem = (it: GridItem) => { if (it.route) go(it.route); else setOpen(it); };

  let page: React.ReactNode;
  if (view === '_settings') page = <SettingsView />;
  else if (view === '_you') page = <YouView />;
  else if (err) page = <Text intent="secondary" maxWidth="60ch">{err}</Text>;
  else if (!db) page = <Spinner />;
  else {
    const p = (PAGE[view] ?? PAGE.home)(db);
    page = <>{p.title ? <Head title={p.title} sub={p.sub} /> : null}{p.blocks.map((b, i) => <Block key={view + i} b={b} onOpen={openItem} />)}</>;
  }
  const side = open && db ? detail(db, open) : null;

  return (
    <PhiShell app={appMeta('phipad')} nav={NAV} view={view} onView={go}
      right={side ? <><ItemPanel it={side.it} onClose={() => setOpen(null)} />{side.blocks.map((b, i) => <Block key={i} b={b} onOpen={() => undefined} />)}</> : null}>
      {live ? <Tag minimal round size="sm" intent="success">Live from Phiora</Tag> : null}
      {page}
    </PhiShell>
  );
};
