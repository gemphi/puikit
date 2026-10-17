import React from 'react';
import { Box, Spinner } from '@pui/components';
import { PhiShell } from '@phi-kit/PhiShell';
import { appMeta } from '@phi-kit/data';
import { SettingsView } from '@phi-kit/views';
import k from '@phi-kit/kit.module.scss';
import { useDB } from './data';
import { Feed } from './pages/Feed';
import { Explore } from './pages/Explore';
import { Clubs } from './pages/Clubs';
import { Shop } from './pages/Shop';
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { Events } from './pages/Events';
import { Hosts } from './pages/Hosts';
import { Data } from './pages/Data';
import { Panel, type Open } from './panels';

const NAV = [
  { id: 'feed', label: 'Feed', icon: 'home' },
  { id: 'explore', label: 'Explore', icon: 'compass' },
  { id: 'clubs', label: 'Clubs', icon: 'users' },
  { id: 'hosts', label: 'Hosts', icon: 'layers' },
  { id: 'events', label: 'Events', icon: 'map' },
  { id: 'messages', label: 'Messages', icon: 'chat' },
  { id: 'shop', label: 'Shop', icon: 'bag' },
  { id: 'data', label: 'Data', icon: 'db' },
];
const readHash = () => (window.location.hash.match(/^#\/?([\w-]+)/) || [])[1] || 'feed';

export const App: React.FC = () => {
  const { db, err } = useDB();
  const [view, setView] = React.useState(readHash);
  const [open, setOpen] = React.useState<Open | null>(null);
  React.useEffect(() => { const f = () => setView(readHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const go = (id: string) => { window.location.hash = '/' + id; setOpen(null); };

  let page: React.ReactNode;
  if (view === '_settings') page = <SettingsView />;
  else if (err) page = <Box as="p" className={k.sub}>{err}</Box>;
  else if (!db) page = <Spinner />;
  else if (view === '_you') page = <Profile db={db} onOpen={setOpen} />;
  else if (view === 'explore') page = <Explore db={db} onOpen={setOpen} />;
  else if (view === 'messages') page = <Messages db={db} onOpen={setOpen} />;
  else if (view === 'data') page = <Data db={db} />;
  else if (view === 'hosts') page = <Hosts db={db} onOpen={setOpen} />;
  else if (view === 'events') page = <Events db={db} onOpen={setOpen} />;
  else if (view === 'clubs') page = <Clubs db={db} onOpen={setOpen} />;
  else if (view === 'shop') page = <Shop db={db} onOpen={setOpen} />;
  else page = <Feed db={db} onOpen={setOpen} />;

  return (
    <PhiShell app={appMeta('phiegg')} nav={NAV} view={view} onView={go}
      right={open && db ? <Panel db={db} open={open} onOpen={setOpen} onClose={() => setOpen(null)} /> : null}>
      {page}
    </PhiShell>
  );
};
