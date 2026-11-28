import React, { useEffect, useState } from 'react';
import { Text } from '@pui/components';
import { useStore } from '@pui/store';
import { PhiShell } from '@phi-kit/PhiShell';
import { appMeta } from '@phi-kit/data';
import { Block } from '@phi-kit/blocks';
import { Head, ItemPanel, YouView } from '@phi-kit/views';
import { SettingsView } from '@phi-kit/settings';
import { ontologyStore } from './state/ontologyStore';
import { useAgentView } from './view/agent';
import { useDocView } from './view/doc';
import { PLAYBOOK_VIEW, SPATIAL_VIEW } from './view/fixed';
import { useGovernanceView } from './view/governance';
import { useIdentityView } from './view/identity';
import { useLogView } from './view/log';
import { inspectedItem, useOntologyView } from './view/ontology';
import { useSecurityView } from './view/security';
import { useStreamView } from './view/stream';
import type { ConsoleView } from './view/part';

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
  { id: 'watch', label: 'Watch', icon: 'check', items: [
    { id: 'logs', label: 'Logs · PhiLog', icon: 'file' },
    { id: 'security', label: 'Security · PhiSec', icon: 'check' },
  ] },
  { id: 'operate', label: 'Operate', icon: 'grid', items: [
    { id: 'orchestration', label: 'Playbooks', icon: 'grid' },
    { id: 'governance', label: 'Audit & governance', icon: 'check' },
    { id: 'docs', label: 'API & SDK docs', icon: 'file' },
  ] },
];

/** Every page of the console, as data: a view id to its head and blocks, built from the stores. No page components. */
const VIEW: Record<string, () => ConsoleView> = {
  identity: useIdentityView,
  agents: useAgentView,
  ontology: useOntologyView,
  streams: useStreamView,
  spatial: () => SPATIAL_VIEW,
  logs: useLogView,
  security: useSecurityView,
  orchestration: () => PLAYBOOK_VIEW,
  governance: useGovernanceView,
  docs: useDocView,
};
const START = 'agents';
const readView = () => window.location.hash.match(/^#\/?([\w-]+)/)?.[1] ?? START;

/** One view, drawn the way PhiApp draws a config view: the shared head, then each block by its module. */
const Screen: React.FC<{ id: string }> = ({ id }) => {
  const v = VIEW[id]();
  return (
    <>
      <Head title={v.title} sub={v.sub} action={v.action} />
      {v.noteList?.map((n) => <Text key={n.text} size="sm" intent={n.intent} role={n.intent === 'secondary' ? 'status' : 'alert'}>{n.text}</Text>)}
      {v.blocks.map((b, i) => <Block key={b.key ?? i} b={b} onOpen={v.onOpen ?? (() => undefined)} />)}
      {v.overlay}
    </>
  );
};

export const App: React.FC = () => {
  // The view is in the address (#/logs), as in every config app, so a page can be linked to and the shared blocks' links work.
  const [view, setView] = useState<string>(readView);
  useEffect(() => { const f = () => setView(readView()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const go = (id: string) => { window.location.hash = '/' + id.replace(/^#?\/?/, ''); };

  // The object picked in the ontology table opens in the shell's side panel, as a record does in every app.
  const ontology = useStore(ontologyStore);
  const inspected = view === 'ontology' ? inspectedItem(ontology) : null;

  return (
    <PhiShell app={appMeta('phione')} nav={NAV} view={view} onView={go} right={inspected ? <ItemPanel it={inspected} onClose={() => ontology.selectInstance(null)} /> : null}>
      {view === '_you' ? <YouView /> : view === '_settings' ? <SettingsView /> : <Screen key={view in VIEW ? view : START} id={view in VIEW ? view : START} />}
    </PhiShell>
  );
};
