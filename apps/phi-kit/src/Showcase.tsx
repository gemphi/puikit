import React from 'react';
import { Box, Button, Card, Frame, Image, Stack, Tag, Text, Title } from '@pui/components';
import { assetUrl } from './data';

/** One feature in a landing showcase: a big product screenshot (or, with none, a tinted poster) beside a headline,
 *  blurb and (optional) call to action. */
export type Feature = {
  eyebrow?: string;
  title: string;
  body?: string;
  image?: string;
  tint?: string;
  bullets?: string[];
  cta?: { label: string; onClick?: () => void; href?: string };
};

const Shot: React.FC<{ src?: string; alt: string; tint?: string; label?: string }> = ({ src, alt, tint, label }) => (
  <Card variant="flat" flush style={{ overflow: 'hidden' }}>
    <Frame ratio="16/10" rounded="lg">
      {src
        ? <Image src={assetUrl(src)} alt={alt} fit="cover" fill loading="lazy" />
        : <Box style={{ position: 'absolute', inset: 0, background: tint ? `linear-gradient(135deg, ${tint} 0%, transparent 80%), var(--phi-color-background-secondary)` : 'var(--phi-color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text as="span" font="heading" size="2xl" intent="muted" align="center" style={{ padding: '1rem', opacity: 0.7 }}>{label ?? alt}</Text>
          </Box>}
    </Frame>
  </Card>
);

/**
 * The marketing welcome, Meta/Muse style: a full-width hero, then alternating feature rows — a framed screenshot on
 * one side, a headline and blurb on the other — and a closing call to action. One shared component; every app's
 * landing uses it and differs only by its data (its copy, its screenshots) and its theme, so each app reads as itself
 * while they all share the house look. Built only from puijs components — no bespoke layout.
 */
export const FeatureShowcase: React.FC<{
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  hero?: string;
  features: Feature[];
  close?: { title: string; body?: string; actions?: React.ReactNode };
}> = ({ eyebrow, title, lede, actions, hero, features, close }) => (
  <Stack direction="column" gap={8} align="center" width="100%">
    {/* Hero */}
    <Box width="100%" maxWidth="68rem">
      <Stack direction="column" gap={5} align="center" width="100%" paddingY={6}>
        <Stack direction="column" gap={3} align="center">
          {eyebrow ? <Tag round size="sm">{eyebrow}</Tag> : null}
          <Box maxWidth="40rem"><Title level={1} size="3xl" style={{ textAlign: 'center', lineHeight: 1.08 }}>{title}</Title></Box>
          {lede ? <Text size="lg" intent="secondary" align="center" maxWidth="42rem">{lede}</Text> : null}
        </Stack>
        {actions ? <Stack direction="row" gap={2} wrap justify="center">{actions}</Stack> : null}
        {hero ? <Frame ratio="16/9" rounded="lg" width="100%"><Image src={assetUrl(hero)} alt="" fit="cover" fill /></Frame> : null}
      </Stack>
    </Box>

    {/* Alternating feature rows */}
    <Box width="100%" maxWidth="72rem">
      <Stack direction="column" gap={8} width="100%">
        {features.map((f, i) => {
          const media = <Box flex="1.15" minWidth="20rem" width="100%"><Shot src={f.image} alt={f.title} tint={f.tint} label={f.title} /></Box>;
          const copy = (
            <Stack direction="column" gap={3} flex="1" minWidth="17rem" paddingY={2}>
              {f.eyebrow ? <Box><Tag minimal round size="sm">{f.eyebrow}</Tag></Box> : null}
              <Title level={2} size="2xl">{f.title}</Title>
              {f.body ? <Text size="md" intent="secondary">{f.body}</Text> : null}
              {f.bullets?.length ? (
                <Stack direction="column" gap={2}>
                  {f.bullets.map((b) => (
                    <Stack key={b} direction="row" gap={2} align="start">
                      <Text as="span" intent="primary" weight="bold">—</Text>
                      <Text as="span" size="sm">{b}</Text>
                    </Stack>
                  ))}
                </Stack>
              ) : null}
              {f.cta ? <Box><Button variant="primary" onClick={f.cta.onClick} href={f.cta.href}>{f.cta.label}</Button></Box> : null}
            </Stack>
          );
          // Alternate which side the screenshot sits on; on narrow widths the row wraps to a column (media first).
          return (
            <Stack key={f.title} direction="row" gap={6} align="center" wrap justify="between">
              {i % 2 === 0 ? <>{media}{copy}</> : <>{copy}{media}</>}
            </Stack>
          );
        })}
      </Stack>
    </Box>

    {/* Closing call to action */}
    {close ? (
      <Box width="100%" maxWidth="72rem">
        <Card variant="hero">
          <Stack direction="column" gap={3} align="center" paddingY={6}>
            <Box maxWidth="40rem"><Title level={2} size="3xl" style={{ textAlign: 'center' }}>{close.title}</Title></Box>
            {close.body ? <Text size="md" intent="secondary" align="center" maxWidth="42rem">{close.body}</Text> : null}
            {close.actions ? <Stack direction="row" gap={2} wrap justify="center">{close.actions}</Stack> : null}
          </Stack>
        </Card>
      </Box>
    ) : null}
  </Stack>
);
