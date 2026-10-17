
import React from 'react';
import { Button, Divider, Frame, Image, Stack, Tag, Text, Title } from '@pui/components';
import { appUrl, assetUrl, type Block } from '../data';

/** Hero band for an app's Home view. */
export const Hero: React.FC<{ b: Block }> = ({ b }) => (
  <Stack direction="row" gap={6} padding={8} rounded="lg" background="gradient-sidebar" wrap align="center">
  <Stack direction="column" gap={3} flex="1 1 22rem" minWidth="0">
    <Title level={1} size="3xl">{b.heading}</Title>
    {b.subtitle ? <Text size="lg" intent="secondary">{b.subtitle}</Text> : null}
    {b.body ? <Text intent="secondary" maxWidth="64ch">{b.body}</Text> : null}
    {Array.isArray(b.actions) && b.actions.length ? (
      <Stack direction="row" gap={2} wrap align="center">{b.actions.map((a: any, i: number) => <Button key={i} variant={i === 0 ? 'primary' : 'outline'} href={a.app ? appUrl(a.app) : a.href || ('#/' + a.view)}>{a.label}</Button>)}</Stack>
    ) : null}
  </Stack>
  {b.image ? <Frame ratio="16/10" rounded="lg" width="min(100%, 26rem)" flex="0 1 26rem"><Image src={assetUrl(b.image)} alt="" fit="cover" fill /></Frame> : null}
  </Stack>
);

/** Dated news / announcement list. */
export const News: React.FC<{ b: Block }> = ({ b }) => (
  <Stack direction="column" gap={3} maxWidth="760px">
    {(b.items || []).map((n: any, i: number) => (
      <Stack key={i} direction="column" gap={2}>
        <Stack direction="row" gap={4} align="start">
          {n.image ? <Frame ratio="4/3" rounded="md" width="8.5rem" flex="none"><Image src={assetUrl(n.image)} alt="" fit="cover" fill loading="lazy" /></Frame> : null}
          <Stack direction="column" gap={1} minWidth="0">
            <Stack direction="row" gap={2} wrap align="center">{n.tag ? <Tag minimal round>{n.tag}</Tag> : null}<Text size="xs" intent="muted" as="span">{n.date}</Text></Stack>
            <Title level={3} size="md">{n.title}</Title>
            <Text size="sm" intent="secondary">{n.body}</Text>
          </Stack>
        </Stack>
        <Divider />
      </Stack>
    ))}
  </Stack>
);

/** Long-form prose sections (About). */
export const Prose: React.FC<{ b: Block }> = ({ b }) => (
  <Stack direction="column" gap={4} maxWidth="70ch">
    {b.lead ? <Text size="lg" intent="secondary">{b.lead}</Text> : null}
    {(b.sections || []).map((sec: any, i: number) => (
      <Stack key={i} direction="column" gap={1}><Title level={2} size="lg">{sec.title}</Title><Text size="sm" intent="secondary">{sec.body}</Text></Stack>
    ))}
  </Stack>
);

/** Question / answer list (FAQ). */
export const Faq: React.FC<{ b: Block }> = ({ b }) => (
  <Stack direction="column" gap={0} maxWidth="70ch">{(b.items || []).map((f: any, i: number) => (
    <Stack key={i} direction="column" gap={1} paddingY={4}>
      <Text weight="bold">{f.q}</Text><Text size="sm" intent="secondary">{f.a}</Text>
      <Divider />
    </Stack>
  ))}</Stack>
);
