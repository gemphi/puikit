'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Span,
  Stack,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Title,
  Tr,
} from '@pui/components';
import { Package, Search } from 'lucide-react';
import { PageShell } from '../layouts/PageShell';
import {
  ComponentDocEntry,
  getComponentDoc,
  getDocsManifest,
  getDocumentedComponents,
} from '../services/docsService';

/**
 * Generated documentation viewer.
 *
 * Composed exclusively from puijs primitives + lucide-react. There are no raw
 * `<Box>` wrappers, no inline `<Box as="button">` styling, no ad-hoc CSS. The list is
 * filterable so 100+ components are actually navigable, and each entry is
 * rendered with a proper `Card` header/body composition so titles, badges,
 * and props sit on structured surfaces rather than plain text on a card face.
 */

// --- Sidebar list --------------------------------------------------------

interface ComponentListProps {
  components: { name: string; source: string }[];
  selected: string | null;
  onSelect: (name: string) => void;
}

const ComponentList: React.FC<ComponentListProps> = ({ components, selected, onSelect }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      components.filter((c) =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [components, query],
  );

  return (
    <Card>
      <CardHeader>
        <Stack direction="row" align="center" gap={2}>
          <Package size={16} />
          <Title level={6} style={{ margin: 0 }}>
            Components
          </Title>
          <Tag intent="none" minimal round size="sm">
            {components.length}
          </Tag>
        </Stack>
      </CardHeader>
      <CardBody>
        <Stack direction="column" gap={2}>
          <Input
            placeholder="Filter components…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search size={12} />}
          />
          <Stack direction="column" gap={1}>
            {filtered.map((c) => (
              <Button
                key={c.name}
                variant={selected === c.name ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onSelect(c.name)}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                {c.name}
              </Button>
            ))}
            {filtered.length === 0 && (
              <Text variant="secondary">No matches for “{query}”.</Text>
            )}
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
};

// --- Props table ----------------------------------------------------------

const PropsTable: React.FC<{ doc: ComponentDocEntry }> = ({ doc }) => {
  if (doc.props.length === 0) {
    return (
      <Text variant="secondary">
        No props type was extracted for this component. It may use inline props
        or extend a base type (see "extends" above).
      </Text>
    );
  }
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Prop</Th>
          <Th>Type</Th>
          <Th>Required</Th>
          <Th>Description</Th>
        </Tr>
      </Thead>
      <Tbody>
        {doc.props.map((p) => (
          <Tr key={p.name}>
            <Td>
              <Span variant="code">{p.name}</Span>
            </Td>
            <Td>
              <Span variant="code">{p.type}</Span>
            </Td>
            <Td>
              {p.optional ? (
                <Tag intent="none" minimal size="sm">optional</Tag>
              ) : (
                <Tag intent="primary" minimal size="sm">required</Tag>
              )}
            </Td>
            <Td>
              {p.description ? p.description : <Text variant="secondary">—</Text>}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

// --- Detail view ----------------------------------------------------------

const ComponentDetail: React.FC<{ name: string }> = ({ name }) => {
  const doc = getComponentDoc(name);
  if (!doc) {
    return (
      <Card>
        <Text variant="secondary">No generated documentation for “{name}”.</Text>
      </Card>
    );
  }

  return (
    <Stack direction="column" gap={4}>
      <Card flush>
        <CardHeader
          action={
            <Stack direction="row" gap={2} align="center">
              {doc.propsInterface && (
                <Tag intent="primary" minimal round size="sm">
                  {doc.propsInterface}
                </Tag>
              )}
              {doc.stories && (
                <Tag intent="success" minimal round size="sm">
                  {doc.stories.examples.length} example{doc.stories.examples.length === 1 ? '' : 's'}
                </Tag>
              )}
            </Stack>
          }
        >
          <Stack direction="column" gap={1}>
            <Title level={4} style={{ margin: 0 }}>
              {doc.name}
            </Title>
            <Span variant="code" style={{ fontSize: '0.75rem', color: 'var(--phi-color-text-muted)' }}>
              {doc.source}
            </Span>
          </Stack>
        </CardHeader>
        <CardBody>
          {doc.description ? (
            <Text style={{ whiteSpace: 'pre-line' }}>{doc.description}</Text>
          ) : (
            <Text variant="secondary">No description metadata found in source.</Text>
          )}
          {doc.extendsBases && doc.extendsBases.length > 0 && (
            <Box style={{ marginTop: 'var(--phi-space-3)' }}>
              <Stack direction="row" gap={2} align="center" wrap>
                <Text variant="secondary" size="sm">extends:</Text>
                {doc.extendsBases.map((b) => (
                  <Tag key={b} intent="none" minimal size="sm">
                    {b}
                  </Tag>
                ))}
              </Stack>
            </Box>
          )}
        </CardBody>
      </Card>

      <Card flush>
        <CardHeader>
          <Title level={5} style={{ margin: 0 }}>
            Props
          </Title>
        </CardHeader>
        <CardBody>
          <PropsTable doc={doc} />
        </CardBody>
      </Card>

      {doc.stories && doc.stories.examples.length > 0 && (
        <Card flush>
          <CardHeader>
            <Title level={5} style={{ margin: 0 }}>
              Examples
            </Title>
          </CardHeader>
          <CardBody>
            <Stack direction="row" gap={2} wrap>
              {doc.stories.examples.map((ex) => (
                <Tag key={ex} intent="none" minimal>
                  {ex}
                </Tag>
              ))}
            </Stack>
          </CardBody>
        </Card>
      )}
    </Stack>
  );
};

// --- Page ----------------------------------------------------------------

export const GeneratedDocsPage: React.FC = () => {
  const manifest = getDocsManifest();
  const components = useMemo(() => getDocumentedComponents(), []);
  const [selected, setSelected] = useState<string | null>(components[0]?.name ?? null);

  if (!manifest || components.length === 0) {
    return (
      <PageShell
        title="Generated Documentation"
        description="Auto-generated component documentation surfaced from site/docs."
      >
        <Card>
          <Text variant="secondary">
            No generated documentation was found. Run{' '}
            <Span variant="code">npm run docs:generate</Span> to emit{' '}
            <Span variant="code">site/docs/</Span>.
          </Text>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Generated Documentation"
      description="Auto-generated from component source and kept in sync via site/docs."
      badge={
        <Tag intent="primary" round>
          {manifest.total} Documented
        </Tag>
      }
    >
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 'var(--phi-space-5)',
          alignItems: 'start',
        }}
      >
        <ComponentList
          components={components}
          selected={selected}
          onSelect={setSelected}
        />
        <Box>{selected && <ComponentDetail name={selected} />}</Box>
      </Box>
    </PageShell>
  );
};
