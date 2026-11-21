import React from 'react';
import { TabList, Tag, Text, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import { docsStore } from '../state/docsStore';
import type { ApiEndpoint } from '../types/docs';
import { monoCell, type ConsoleView } from './part';

type Language = 'python' | 'ts' | 'curl';
const LANGUAGE: { id: Language; label: string }[] = [{ id: 'python', label: 'Python' }, { id: 'ts', label: 'Ts' }, { id: 'curl', label: 'Curl' }];
const snippetOf = (ep: ApiEndpoint, language: Language) => (language === 'python' ? ep.pythonSnippet : language === 'ts' ? ep.tsSnippet : ep.curlSnippet);
const pre = (text: string) => <Text size="sm" mono pre>{text}</Text>;

/**
 * API and SDK reference: every endpoint by namespace (pick a row), the one picked with its snippet in the language
 * chosen in the head, and a sandbox that calls it.
 */
export const useDocView = (): ConsoleView => {
  const { namespaces, selectedNamespaceName, selectedEndpointId, activeLanguage, liveResponse, isRunning, selectEndpoint, setLanguage, runEndpoint } = useStore(docsStore);
  const ns = namespaces.find((n) => n.name === selectedNamespaceName) || namespaces[0];
  const ep = ns.endpoints.find((e) => e.id === selectedEndpointId) || ns.endpoints[0];
  const endpoints = namespaces.flatMap((n) => n.endpoints);
  const titleOf = (e: ApiEndpoint) => namespaces.find((n) => n.name === e.namespace)?.title ?? e.namespace;
  const language = LANGUAGE.find((l) => l.id === activeLanguage)!.label;

  const column: DataTableColumn<ApiEndpoint>[] = [
    { id: 'summary', header: 'Endpoint', cell: (e) => <Text as="span" size="sm" weight={e.id === ep.id ? 'bold' : undefined} intent={e.id === ep.id ? 'primary' : undefined}>{e.summary}</Text> },
    { id: 'method', header: 'Method', cell: (e) => <Tag intent="primary" minimal round size="sm">{e.method}</Tag>, width: '7rem' },
    { id: 'path', header: 'Path', cell: (e) => monoCell(e.path) },
  ];

  return {
    title: 'API & SDK reference',
    sub: 'Interactive documentation sandbox with real-time multi-language code generation.',
    action: <TabList size="sm" variant="pills" aria-label="Language" activeId={activeLanguage} onChange={(id) => setLanguage(id as Language)} items={LANGUAGE} />,
    blocks: [
      {
        kind: 'table', title: `${namespaces.length} namespaces · ${endpoints.length} endpoints`, columns: column, items: endpoints,
        getKey: (e: ApiEndpoint) => e.id, group: titleOf, onRow: (e: ApiEndpoint) => selectEndpoint(e.namespace, e.id),
      },
      {
        kind: 'table', key: ep.id, title: ep.summary, cols: ['', ''],
        rows: [
          ['Method', <Tag key="m" intent="primary" minimal round size="sm">{ep.method}</Tag>],
          ['Path', monoCell(ep.path)],
          ['Description', ep.description],
          [`SDK code snippet (${language})`, pre(snippetOf(ep, activeLanguage))],
        ],
      },
      {
        kind: 'form', variant: 'inline', title: 'Live sandbox', fields: [], submitLabel: isRunning ? 'Executing...' : 'Run request', disabled: isRunning, onSubmit: runEndpoint,
        note: isRunning ? 'Calling endpoint...' : liveResponse ? '200 OK - execution response' : 'Run the request to execute this API endpoint against the live engine.',
        output: !isRunning && liveResponse ? JSON.stringify(liveResponse, null, 2) : undefined,
      },
    ],
  };
};
