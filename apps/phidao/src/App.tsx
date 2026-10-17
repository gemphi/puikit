
import React from 'react';
import { Spinner, Text, Tag } from '@pui/components';
import { PhiShell } from '@phi-kit/PhiShell';
import { appMeta } from '@phi-kit/data';
import { SettingsView } from '@phi-kit/views';
import k from '@phi-kit/kit.module.scss';
import { useDB } from './data';
import { Home, Proposals, Treasury, SwapPage, Delegates, NewsPage, About, Docs, Panel, type Open } from './pages';

const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'govern', label: 'Govern', icon: 'vote', items: [
    { id: 'proposals', label: 'Proposals', icon: 'vote' },
    { id: 'treasury', label: 'Treasury', icon: 'wallet' },
    { id: 'swap', label: 'Swap', icon: 'chart' },
    { id: 'delegates', label: 'Delegates', icon: 'users' },
  ] },
  { id: 'learn', label: 'Learn', icon: 'compass', items: [
    { id: 'news', label: 'News', icon: 'chat' },
    { id: 'about', label: 'About', icon: 'compass' },
    { id: 'docs', label: 'Docs', icon: 'file' },
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
  else if (view === 'proposals') page = <Proposals db={db} onOpen={setOpen} />;
  else if (view === 'treasury') page = <Treasury db={db} />;
  else if (view === 'swap') page = <SwapPage db={db} />;
  else if (view === 'delegates') page = <Delegates db={db} onOpen={setOpen} />;
  else if (view === 'news') page = <NewsPage db={db} onOpen={setOpen} />;
  else if (view === 'about') page = <About db={db} />;
  else if (view === 'docs') page = <Docs db={db} />;
  else page = <Home db={db} go={go} onOpen={setOpen} />;

  return (
    <PhiShell app={appMeta('phidao')} nav={NAV} view={view} onView={go}
      right={open && db ? <Panel db={db} open={open} onClose={() => setOpen(null)} /> : null}>
      {live ? <Tag minimal round size="sm" intent="success">Live from Phiora</Tag> : null}
      {page}
    </PhiShell>
  );
};
