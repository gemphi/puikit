import React from 'react';
import { Card, CardHeader, CardBody, Title, Tag, Badge, Button, Icon, Table, Thead, Tbody, Tr, Th, Td, Stack, EmptyState, Spinner, Text } from '@pui/components';
import { Database, Inbox } from 'lucide-react';
import { ObjectTypeDef } from '../../types/ontology';

interface OntologyTableProps {
  currentType: ObjectTypeDef;
  rows: Record<string, any>[] | undefined;
  loading?: boolean;
  onSelectInstance: (inst: Record<string, any>) => void;
}

const STATUS_INTENT: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success', en_route: 'success', healthy: 'success', boarding: 'warning', pending: 'warning', delayed: 'error', disabled: 'error', inactive: 'error',
};

/** Columns come from the object type's properties; the primary key leads. */
export const OntologyTable: React.FC<OntologyTableProps> = ({ currentType, rows, loading, onSelectInstance }) => {
  const pk = currentType.primaryKey;
  const props = [...currentType.properties].sort((a, b) => Number(b.name === pk) - Number(a.name === pk))
    .filter((p) => p.type !== 'timeseries' && p.type !== 'ciphertext' && p.type !== 'attachment');
  const cell = (name: string, v: unknown) => {
    if (v == null || v === '') return <Text size="sm" variant="muted">—</Text>;
    if (name === pk) return <Badge variant="primary">{String(v)}</Badge>;
    if (name === 'status') return <Tag intent={STATUS_INTENT[String(v).toLowerCase()]} minimal round size="sm">{String(v)}</Tag>;
    if (typeof v === 'boolean') return <Tag intent={v ? 'success' : undefined} minimal round size="sm">{v ? 'Yes' : 'No'}</Tag>;
    if (typeof v === 'number') return v.toLocaleString();
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  };

  return (
    <Card variant="default">
      <CardHeader action={<Tag intent="primary" minimal round>{rows ? `${rows.length} instances` : '—'}</Tag>}>
        <Stack direction="row" align="center" gap={2}>
          <Icon icon={Database} size="sm" />
          <Title level={4} size="sm">{currentType.displayName}</Title>
        </Stack>
      </CardHeader>
      <CardBody>
        {loading || rows === undefined ? (
          <Stack direction="row" justify="center" padding={8}><Spinner size="sm" /></Stack>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={`No ${currentType.displayName} instances served yet`}
            description={`The ontology defines ${currentType.properties.length} properties for ${currentType.apiName}, but the Phient API has no list endpoint for it.`}
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                {props.map((p) => <Th key={p.name}>{p.name.replace(/_/g, ' ')}</Th>)}
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row, i) => (
                <Tr key={String(row[pk] ?? i)}>
                  {props.map((p) => <Td key={p.name}>{cell(p.name, row[p.name])}</Td>)}
                  <Td><Button size="sm" variant="ghost" onClick={() => onSelectInstance(row)}>Inspect</Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
};
