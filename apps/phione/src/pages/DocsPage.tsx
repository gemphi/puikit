import React from 'react';
import { Page, Stack, Grid, Col, Title, Text, Button } from '@pui/components';
import { useStore } from '@pui/store';
import { docsStore } from '../state/docsStore';
import { DocsSidebar } from '../components/Docs/DocsSidebar';
import { DocsContent } from '../components/Docs/DocsContent';
import { DocsSandbox } from '../components/Docs/DocsSandbox';

export const DocsPage: React.FC = () => {
  const {
    namespaces,
    selectedNamespaceName,
    selectedEndpointId,
    activeLanguage,
    liveResponse,
    isRunning,
    selectEndpoint,
    setLanguage,
    runEndpoint,
  } = useStore(docsStore);

  const currentNs = namespaces.find((n) => n.name === selectedNamespaceName) || namespaces[0];
  const currentEp = currentNs.endpoints.find((e) => e.id === selectedEndpointId) || currentNs.endpoints[0];

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="row" justify="between" align="center" wrap>
          <Stack direction="column" gap={1}>
            <Title level={2} size="xl">API & SDK reference</Title>
            <Text size="md" intent="secondary">
              Interactive tri-pane documentation sandbox with real-time multi-language code generation.
            </Text>
          </Stack>
          <Stack direction="row" gap={1}>
            {(['python', 'ts', 'curl'] as const).map((lang) => (
              <Button
                key={lang}
                size="sm"
                variant={activeLanguage === lang ? 'primary' : 'ghost'}
                onClick={() => setLanguage(lang)}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Grid gap={3} xs={1} sm={1} md={1} lg={12}>
          <Col span={3} xs={12} sm={12} md={4} lg={3}>
            <DocsSidebar
              namespaces={namespaces}
              selectedEndpointId={selectedEndpointId}
              onSelectEndpoint={selectEndpoint}
            />
          </Col>

          <Col span={5} xs={12} sm={12} md={8} lg={5}>
            <DocsContent endpoint={currentEp} activeLanguage={activeLanguage} />
          </Col>

          <Col span={4} xs={12} sm={12} md={12} lg={4}>
            <DocsSandbox
              isRunning={isRunning}
              liveResponse={liveResponse}
              onRunEndpoint={runEndpoint}
            />
          </Col>
        </Grid>
      </Stack>
    </Page>
  );
};
