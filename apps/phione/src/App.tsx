import React, { useState } from 'react';
import { PhiShell } from '@phi-kit/PhiShell';
import { appMeta } from '@phi-kit/data';
import { SettingsView, YouView } from '@phi-kit/views';
import { AgentsPage } from './pages/AgentsPage';
import { OntologyPage } from './pages/OntologyPage';
import { StreamsPage } from './pages/StreamsPage';
import { SpatialPage } from './pages/SpatialPage';
import { OrchestrationPage } from './pages/OrchestrationPage';
import { GovernancePage } from './pages/GovernancePage';
import { DocsPage } from './pages/DocsPage';
import { IdentityPage } from './pages/IdentityPage';

/** The menu, as data: groups on the rail, sub-navs in the panel — the same shell every Phi app wears. */
const NAV = [
  { id: 'who', label: 'Identity', icon: 'user', items: [
    { id: 'identity', label: 'Identity', icon: 'user' },
    { id: 'agents', label: 'Agents', icon: 'users' },
  ] },
  { id: 'data', label: 'Data', icon: 'db', items: [
    { id: 'ontology', label: 'Ontology', icon: 'db' },
    { id: 'streams', label: 'PhiBus streams', icon: 'network' },
    { id: 'spatial', label: 'Spatial & vectors', icon: 'map' },
  ] },
  { id: 'operate', label: 'Operate', icon: 'grid', items: [
    { id: 'orchestration', label: 'Playbooks', icon: 'grid' },
    { id: 'governance', label: 'Audit & governance', icon: 'check' },
    { id: 'docs', label: 'API & SDK docs', icon: 'file' },
  ] },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('agents');

  const renderActivePage = () => {
    switch (activeTab) {
      case '_you': return <YouView />;
      case '_settings': return <SettingsView />;
      case 'identity': return <IdentityPage />;
      case 'agents': return <AgentsPage />;
      case 'ontology': return <OntologyPage />;
      case 'streams': return <StreamsPage />;
      case 'spatial': return <SpatialPage />;
      case 'orchestration': return <OrchestrationPage />;
      case 'governance': return <GovernancePage />;
      case 'docs': return <DocsPage />;
      default: return <AgentsPage />;
    }
  };

  return (
    <PhiShell app={appMeta('phione')} nav={NAV} view={activeTab} onView={setActiveTab}>
      {renderActivePage()}
    </PhiShell>
  );
};
