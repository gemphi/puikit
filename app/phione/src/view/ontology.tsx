import React, { useEffect } from 'react';
import { Badge, Button, Tag, type DataTableColumn } from '@pui/components';
import { useStore } from '@pui/store';
import type { GridItem } from '@phi-kit/blocks';
import { ontologyStore, type OntologyStoreState } from '../state/ontologyStore';
import { loadInstances } from '../state/phiadk';
import type { ObjectTypeDef } from '../types/ontology';
import { textCell, type ConsoleView } from './part';

type Row = Record<string, any>;
const STATUS_INTENT: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success', en_route: 'success', healthy: 'success', boarding: 'warning', pending: 'warning', delayed: 'error', disabled: 'error', inactive: 'error',
};

const cell = (pk: string, name: string, v: unknown): React.ReactNode => {
  if (v == null || v === '') return textCell('·');
  if (name === pk) return <Badge variant="primary">{String(v)}</Badge>;
  if (name === 'status') return <Tag intent={STATUS_INTENT[String(v).toLowerCase()]} minimal round size="sm">{String(v)}</Tag>;
  if (typeof v === 'boolean') return <Tag intent={v ? 'success' : undefined} minimal round size="sm">{v ? 'Yes' : 'No'}</Tag>;
  if (typeof v === 'number') return v.toLocaleString();
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
};

/** Columns come from the object type's properties; the primary key leads, Inspect ends the row. */
const columnsOf = (type: ObjectTypeDef, onInspect: (row: Row) => void): DataTableColumn<Row>[] => {
  const pk = type.primaryKey;
  const shown = [...type.properties].sort((a, b) => Number(b.name === pk) - Number(a.name === pk))
    .filter((p) => p.type !== 'timeseries' && p.type !== 'ciphertext' && p.type !== 'attachment');
  return [
    ...shown.map((p): DataTableColumn<Row> => ({ id: p.name, header: p.name.replace(/_/g, ' '), cell: (row) => cell(pk, p.name, row[p.name]), sortValue: (row) => (typeof row[p.name] === 'number' ? row[p.name] : String(row[p.name] ?? '')) })),
    { id: '_inspect', header: '', cell: (row) => <Button size="sm" variant="ghost" onClick={() => onInspect(row)}>Inspect</Button>, align: 'right' },
  ];
};

const typeOf = (s: Pick<OntologyStoreState, 'objectTypes' | 'selectedTypeId'>) => s.objectTypes.find((t) => t.id === s.selectedTypeId) || s.objectTypes[0];

/** The object picked in the table, for the shell's side panel: its properties, then the actions it can take. */
export const inspectedItem = (s: OntologyStoreState): GridItem | null => {
  const inst = s.selectedInstance; const type = typeOf(s);
  if (!inst || !type) return null;
  const plain = Object.entries(inst).filter(([, v]) => v != null && typeof v !== 'object');
  return {
    title: String(inst[type.primaryKey] ?? inst.id ?? type.displayName), sub: type.displayName,
    body: 'Live object properties, then the morphism actions the ontology defines.',
    fields: [...plain.map(([k, v]): [string, string] => [k.replace(/_/g, ' '), String(v)]), ...s.actions.map((a): [string, string] => ['Action: ' + a.displayName, a.morphismType])],
  };
};

/** Ontology: the object types of the Phient core ontology, the instances of the one picked, and the link types. */
export const useOntologyView = (): ConsoleView => {
  const state = useStore(ontologyStore);
  const { objectTypes, linkTypes, selectedTypeId, selectType, selectInstance, instances, loadingType } = state;
  const type = typeOf(state);
  useEffect(() => { if (type) void loadInstances(type.id); }, [type?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = type ? instances[type.id] : undefined;
  return {
    title: 'Ontology',
    sub: 'Object types, links and actions of the Phient core ontology.',
    blocks: type ? [
      {
        kind: 'table', key: type.id, title: rows ? `${type.displayName} (${rows.length} instances)` : type.displayName,
        columns: columnsOf(type, selectInstance), items: rows ?? [], getKey: (row: Row, i: number) => String(row[type.primaryKey] ?? i), loading: loadingType === type.id || rows === undefined,
        tabs: { label: 'Object types', activeId: selectedTypeId, onChange: selectType, items: objectTypes.map((t) => ({ id: t.id, label: t.displayName + (instances[t.id] ? ` · ${instances[t.id]!.length}` : '') })) },
        empty: { title: `No ${type.displayName} instances served yet`, description: `The ontology defines ${type.properties.length} properties for ${type.apiName}, but the Phient API has no list endpoint for it.` },
      },
      {
        kind: 'table', title: 'Links', cols: ['Link', 'Name', 'Cardinality'],
        rows: linkTypes.map((l) => [`${l.sourceType} → ${l.targetType}`, l.displayName, <Badge key={l.id} variant="secondary">{l.cardinality}</Badge>]),
      },
    ] : [],
  };
};
