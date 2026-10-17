import React from 'react';
import { Box, Button, Stack, Tag, Text, Title } from '@pui/components';
import { ArrowRight, Scale, ShieldCheck, Radar } from 'lucide-react';
import { Hero, Block, Glass, AutoGrid } from '../components/kit';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const MANDATES = [
  { icon: Radar, title: 'EVALUATE', body: 'Every frontier model is measured against the UAIA-EVAL protocol: capability, safety, misuse resistance, autonomy and societal impact.' },
  { icon: ShieldCheck, title: 'CERTIFY', body: 'Models that meet the bar receive a public, revocable certificate tied to an entry in the open Model Registry.' },
  { icon: Scale, title: 'AUTHORIZE', body: 'Market access follows certification — scoped to risk tier, deployment context and monitoring obligations.' },
];

const REGISTRY_TEASER = [
  { id: 'AURORA-2', dev: 'Illustrative Labs', tier: 'R3', status: 'CERTIFIED', cls: 'C2' },
  { id: 'HELIOS-MINI', dev: 'Sample Systems', tier: 'R1', status: 'ATTESTED', cls: 'C1' },
  { id: 'KITE-70B', dev: 'Placeholder AI', tier: 'R2', status: 'IN EVALUATION', cls: '—' },
];

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  return (
    <>
      <Hero
        label="Unified Artificial Intelligence Agency — Est. 2026"
        title={<>Intelligence,<Box as="br" /><Box as="span" className={s.gradText}>admitted responsibly.</Box></>}
        sub="UAIA is the independent authority that evaluates, certifies and authorizes artificial intelligence models before they reach the market, and keeps watching after they do."
      >
        <Stack direction="row" gap={3} style={{ marginTop: 28, flexWrap: 'wrap' }}>
          <Button variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate(routes.newsroom())}>
            Read the Founding Declaration
          </Button>
          <Button variant="outline" className={s.btnGrad} size="lg" onClick={() => navigate(routes.framework())}>
            Explore the Framework
          </Button>
        </Stack>
        <Box className={s.statusStrip}>
          <Box as="span"><Box as="span" className={s.statusDot} />System: Operational</Box>
          <Box as="span">Models under review: 12</Box>
          <Box as="span">Standards published: 9</Box>
          <Box as="span">Declaration: 2026-09-11</Box>
        </Box>
      </Hero>

      <Block label="Mandate" title="Three verbs. Nothing else.">
        <AutoGrid min={260} style={{ marginTop: 24 }}>
          {MANDATES.map(({ icon: Icon, title, body }) => (
            <Glass key={title}>
              <Icon size={22} style={{ color: 'var(--phi-color-primary)', marginBottom: 10 }} />
              <Title level={4} className={s.mono}>{title}</Title>
              <Text size="sm" intent="secondary">{body}</Text>
            </Glass>
          ))}
        </AutoGrid>
      </Block>

      <Block
        label="Why UAIA exists"
        title="Every consequential technology answers to an authority. Except one."
        intro="Aviation has its authority. Medicine has its agencies. Nuclear energy has its inspectorate. Artificial intelligence, the most general technology ever built — has had none. UAIA exists to close that gap: one unified, technically sovereign body whose only product is trust."
      />

      <Block label="Model Registry" title="A public ledger of judged intelligence." tight>
        <Glass style={{ marginTop: 20, overflowX: 'auto' }}>
          <Box as="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <Box as="thead">
              <Box as="tr" className={s.mono} style={{ textAlign: 'left', color: 'var(--phi-color-text-secondary)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                <Box as="th" style={{ padding: '8px 12px' }}>Model ID</Box><Box as="th" style={{ padding: '8px 12px' }}>Developer</Box>
                <Box as="th" style={{ padding: '8px 12px' }}>Risk tier</Box><Box as="th" style={{ padding: '8px 12px' }}>Status</Box>
                <Box as="th" style={{ padding: '8px 12px' }}>Certificate</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {REGISTRY_TEASER.map((r) => (
                <Box as="tr" key={r.id} style={{ borderTop: '1px solid var(--uaia-line)' }}>
                  <Box as="td" className={s.mono} style={{ padding: '10px 12px' }}>{r.id}</Box>
                  <Box as="td" style={{ padding: '10px 12px' }}>{r.dev}</Box>
                  <Box as="td" style={{ padding: '10px 12px' }}><Tag intent="primary" minimal round style={{ width: 'fit-content' }}>{r.tier}</Tag></Box>
                  <Box as="td" style={{ padding: '10px 12px' }}>{r.status}</Box>
                  <Box as="td" className={s.mono} style={{ padding: '10px 12px' }}>{r.cls}</Box>
                </Box>
              ))}
            </Box>
          </Box>
          <Stack direction="row" justify="between" align="center" style={{ marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
            <Text size="sm" intent="secondary">Sample data — illustrative of the registry now being built.</Text>
            <Button variant="outline" className={s.btnGrad} size="sm" icon={<ArrowRight size={14} />} onClick={() => navigate(routes.certification())}>
              Open the Model Registry
            </Button>
          </Stack>
        </Glass>
      </Block>

      <Block label="Declaration">
        <Glass style={{ marginTop: 10 }}>
          <Box as="blockquote" style={{ margin: 0, fontFamily: 'var(--uaia-font-display)', fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)', lineHeight: 1.55 }}>
            "On 11 September 2026, we declare the founding of the Unified Artificial Intelligence Agency —
            because the market for intelligence must be earned, not assumed."
          </Box>
          <Stack direction="row" justify="between" align="center" style={{ marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
            <Text size="sm" intent="secondary" className={s.mono}>FOUNDING DECLARATION · §1</Text>
            <Button variant="primary" size="sm" onClick={() => navigate(routes.newsroom())}>Read the full Declaration</Button>
          </Stack>
        </Glass>
      </Block>

      <Block label="Global posture" tight>
        <Glass style={{ marginTop: 10 }}>
          <Stack direction="row" justify="between" align="center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <Text intent="secondary" style={{ maxWidth: 620 }}>
              Built to work alongside the United Nations system, national regulators, and the laboratories that build the frontier.
            </Text>
            <Button variant="outline" className={s.btnGrad} size="sm" onClick={() => navigate(routes.partnerships())}>Partnerships →</Button>
          </Stack>
        </Glass>
      </Block>
    </>
  );
};
