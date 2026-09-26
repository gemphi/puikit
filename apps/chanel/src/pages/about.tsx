import React from 'react';
import { Section, Container, Stack, Title, Text } from '@pui/components';
import { t } from '../locales/t';
import s from '../styles/chanel.module.scss';

export const AboutPage: React.FC = () => (
  <Section>
    <Container size="md">
      <Stack direction="column" gap={3}>
        <Title level={1} className={`${s.display} ${s['display--lg']}`}>
          {t.about.title}
        </Title>
        <Text size="lg" intent="secondary">
          {t.about.lead}
        </Text>
        <Text>{t.about.body}</Text>
      </Stack>
    </Container>
  </Section>
);
