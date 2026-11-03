import React from 'react';
import { LOOKS, useLook } from './looks';
import { Box, Button, Frame, GradientLevelPicker, Image, PalettePicker, RadiusPicker, Stack, Tag, TabList, Text, Title } from '@pui/components';
import { usePuiTheme, type Theme } from '@pui/providers';
import { APPS, appUrl, assetUrl } from './data';
import { AccountPanel } from './AccountDialog';
import { accountsEnabled } from './auth';
import { useWallet, fmt, LABEL, USD, type Coin } from './wallet';
import type { GridItem } from './blocks';
import s from './kit.module.scss';
import { Profile, type ProfileSpec } from './Profile';

const Head: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <Box as="header"><Title level={1} size="2xl" lineHeight={1.1}>{title}</Title>{sub ? <Text intent="secondary" maxWidth="60ch" marginTop={2}>{sub}</Text> : null}</Box>
);

export const YouView: React.FC<{ profile?: ProfileSpec }> = ({ profile }) => {
  const w = useWallet();
  const coins: Coin[] = ['usd', 'egg', 'sum', 'eth'];
  const total = coins.reduce((a, c) => a + w[c] * USD[c], 0);
  return (
    <>
      <Head title="You" sub={'Wallet worth ' + Math.round(total).toLocaleString('en-US') + ' USD across Phiace.'} />
      <Profile spec={profile} />
      <Stack autoFill="220px" gap={3}>
        {coins.map((c) => (
          <Stack key={c} direction="column" gap={2} surface="card"><Text as="span" size="xs" intent="muted">{LABEL[c]}</Text><Text as="span" font="heading" size="3xl" lineHeight={1}>{fmt(c, w[c])}</Text><Text as="span" size="sm" intent="secondary" flex="1">≈ {Math.round(w[c] * USD[c]).toLocaleString('en-US')} USD</Text></Stack>
        ))}
      </Stack>
      {accountsEnabled && <Stack as="section" maxWidth="560px" direction="column" gap={2} surface="card">
        <Title level={2} size="lg">Account</Title>
        <AccountPanel />
      </Stack>}
      <Stack as="section" direction="column" gap={3}>
        <Title level={2} size="lg">Your apps</Title>
        <Stack direction="row" gap={2} wrap align="center">{APPS.filter((a) => a.built).map((a) => <Button key={a.key} variant="outline" size="sm" href={appUrl(a.key)}>{a.name}</Button>)}</Stack>
      </Stack>
    </>
  );
};

export const SettingsView: React.FC = () => {
  const { theme, setTheme, density, setDensity } = usePuiTheme();
  const [look, setLook] = useLook();
  const seg = <T extends string | number>(cur: T, opts: [T, string][], set: (v: T) => void) => (
    <TabList size="sm" variant="pills" activeId={String(cur)} onChange={(id) => { const o = opts.find(([v]) => String(v) === id); if (o) set(o[0]); }} items={opts.map(([v, l]) => ({ id: String(v), label: l }))} />
  );
  return (
    <>
      <Head title="Settings" sub="Applies to every Phiace app on this device." />
      <Stack as="section" maxWidth="560px" direction="column" gap={2} surface="card">
        <Title level={2} size="lg">Theme</Title>
        {seg<string>(look.id, LOOKS.map((l) => [l.id, l.label] as [string, string]), setLook)}
        <Title level={2} size="lg">Palette</Title>
        <PalettePicker />
        <Title level={2} size="lg">Gradients</Title>
        <GradientLevelPicker />
        <Title level={2} size="lg">Corners</Title>
        <RadiusPicker />
        <Title level={2} size="lg">Mode</Title>
        {seg<Theme>(theme, [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']], setTheme)}
        <Title level={2} size="lg">Density</Title>
        {seg<number>(density, [[0.9, 'Compact'], [1, 'Comfortable'], [1.15, 'Roomy']], setDensity)}
      </Stack>
    </>
  );
};

export const ItemPanel: React.FC<{ it: GridItem; onClose: () => void }> = ({ it, onClose }) => (
  <>
    <Stack direction="row" justify="between" align="center">
      {it.sub ? <Tag minimal round>{it.sub}</Tag> : <Box />}
      <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
    </Stack>
    {it.image ? <Frame ratio="16/10" rounded="lg"><Image src={assetUrl(it.image)} alt="" fit="cover" fill /></Frame> : null}
    <Title level={2} size="2xl">{it.title}</Title>
    {it.body ? <Text as="p" size="sm" intent="secondary">{it.body}</Text> : null}
    {it.fields?.length ? (
      <Stack direction="column" gap={1}>
        {it.fields.map(([k, v]) => (
          <Stack key={k} direction="row" justify="between" gap={3} paddingY={1} className={s.fieldRow}>
            <Text as="span" size="sm" intent="muted">{k}</Text><Text as="span" size="sm" weight="medium" align="right">{v}</Text>
          </Stack>))}
      </Stack>) : null}
    {it.cost ? <Text as="span" size="xs" intent="muted">Cost · {it.cost.toLocaleString('en-US')} USD</Text> : null}
    {it.meta ? <Text as="span" size="xs" intent="muted" mono>{it.meta}</Text> : null}
    {it.app ? <Button variant="primary" href={it.href || appUrl(it.app)}>Open in {it.app[0].toUpperCase() + it.app.slice(1)}</Button> : null}
  </>
);
