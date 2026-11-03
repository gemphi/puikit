import React from 'react';
import { Card, CardHeader, CardBody, Title, Stack, Badge, Button } from '@pui/components';
import { NamespaceDef } from '../../types/docs';

interface DocsSidebarProps {
  namespaces: NamespaceDef[];
  selectedEndpointId: string;
  onSelectEndpoint: (ns: string, id: string) => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({ namespaces, selectedEndpointId, onSelectEndpoint }) => {
  return (
    <Card variant="flat">
      <CardHeader>
        <Title level={5} size="sm">{namespaces.length} namespaces · {namespaces.reduce((n, x) => n + x.endpoints.length, 0)} endpoints</Title>
      </CardHeader>
      <CardBody>
        <Stack direction="column" gap={1}>
          {namespaces.map((ns) => (
            <Stack key={ns.name} direction="column" gap={1}>
              <Badge variant="primary">{ns.title}</Badge>
              {ns.endpoints.map((ep) => (
                <Button
                  key={ep.id}
                  size="sm"
                  variant={ep.id === selectedEndpointId ? 'primary' : 'ghost'}
                  fullWidth
                  onClick={() => onSelectEndpoint(ns.name, ep.id)}
                >
                  {ep.summary}
                </Button>
              ))}
            </Stack>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
};
