import React from 'react';
import { Page, Stack, Grid, Col, Card, CardHeader, CardBody, Title, Text, Badge, Button, Icon } from '@pui/components';
import { useStore } from '@pui/store';
import { ontologyStore } from '../state/ontologyStore';
import { loadInstances } from '../state/phiadk';
import { OntologyTable } from '../components/Ontology/OntologyTable';
import { OntologyDrawer } from '../components/Ontology/OntologyDrawer';
import { Layers } from 'lucide-react';

export const OntologyPage: React.FC = () => {
  const { objectTypes, linkTypes, actions, selectedTypeId, selectedInstance, selectType, selectInstance, instances, loadingType } = useStore(ontologyStore);
  const currentType = objectTypes.find((t) => t.id === selectedTypeId) || objectTypes[0];

  React.useEffect(() => { if (currentType) void loadInstances(currentType.id); }, [currentType?.id]);
  if (!currentType) return null;

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="between" align="center" wrap>
          <Stack direction="column" gap={1}>
            <Title level={2} size="xl">Ontology</Title>
            <Text size="md" intent="secondary">Object types, links and actions of the Phient core ontology.</Text>
          </Stack>
          <Stack direction="row" gap={2} wrap>
            {objectTypes.map((t) => (
              <Button
                key={t.id}
                variant={t.id === selectedTypeId ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => selectType(t.id)}
              >
                {t.displayName}{instances[t.id] ? ` · ${instances[t.id]!.length}` : ''}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Grid gap={3} xs={1} sm={1} md={1} lg={12}>
          <Col span={8} xs={12} sm={12} md={12} lg={8}>
            <OntologyTable currentType={currentType} rows={instances[currentType.id]} loading={loadingType === currentType.id} onSelectInstance={selectInstance} />
          </Col>

          <Col span={4} xs={12} sm={12} md={12} lg={4}>
            <Card variant="flat" padding="sm">
              <CardHeader>
                <Stack direction="row" align="center" gap={2}>
                  <Icon icon={Layers} size="sm" />
                  <Title level={4} size="md">Links</Title>
                </Stack>
              </CardHeader>
              <CardBody>
                <Stack direction="column" gap={2}>
                  {linkTypes.map((link) => (
                    <Card key={link.id} variant="compact" padding="sm">
                      <CardBody>
                        <Stack direction="row" justify="between" align="center">
                          <Stack direction="column" gap={0}><Text size="sm" weight="medium">{link.sourceType} → {link.targetType}</Text><Text size="xs" variant="muted">{link.displayName}</Text></Stack>
                          <Badge variant="secondary">{link.cardinality}</Badge>
                        </Stack>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </Col>
        </Grid>
      </Stack>

      <OntologyDrawer
        selectedInstance={selectedInstance}
        actions={actions}
        onClose={() => selectInstance(null)}
      />
    </Page>
  );
};
