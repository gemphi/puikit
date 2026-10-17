
import React from 'react';
import { Spinner, Tag, Text } from '@pui/components';
import { PhiShell } from '@phi-kit/PhiShell';
import { appMeta } from '@phi-kit/data';
import { SettingsView } from '@phi-kit/views';
import { useDB } from './data';
import { Home, Tracks, Pipeline, Portfolio, Apply, NewsPage, About, Faq, Launchpad, Panel, type Open } from './pages';

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

export const App: React.FC = () => {
  const { db, err, live } = useDB();
  const [view, setView] = React.useState(readHash);
  const [open, setOpen] = React.useState<Open | null>(null);
  React.useEffect(() => { const f = () => setView(readHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const go = (id: string) => { window.location.hash = '/' + id; setOpen(null); };

  let page: React.ReactNode;
  if (view === '_settings') page = <SettingsView />;
  else if (err) page = <Text intent="secondary" maxWidth="60ch">{err}</Text>;
  else if (!db) page = <Spinner />;
  else if (view === 'launchpad') page = <Launchpad db={db} />;
  else if (view === 'tracks') page = <Tracks db={db} go={go} />;
  else if (view === 'pipeline') page = <Pipeline db={db} onOpen={setOpen} />;
  else if (view === 'portfolio') page = <Portfolio db={db} onOpen={setOpen} />;
  else if (view === 'apply') page = <Apply db={db} />;
  else if (view === 'news') page = <NewsPage db={db} onOpen={setOpen} />;
  else if (view === 'about') page = <About db={db} />;
  else if (view === 'faq') page = <Faq db={db} />;
  else page = <Home db={db} go={go} onOpen={setOpen} />;

  return (
    <PhiShell app={appMeta('phipad')} nav={NAV} view={view} onView={go}
      right={open && db ? <Panel db={db} open={open} onClose={() => setOpen(null)} /> : null}>
      {live ? <Tag minimal round size="sm" intent="success">Live from Phiora</Tag> : null}
      {page}
    </PhiShell>
  );
};
