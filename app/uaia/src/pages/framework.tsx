import React from 'react';
import { Box, Tag, Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid, Note } from '../components/kit';
import { EAESpiral } from '../components/diagrams';
import { EMAILS } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const GATES = [
  { n: '1', t: 'NOTIFY', b: 'Developer files a Model Notification: architecture class, compute used, capability claims, intended deployment surface. Assigns a provisional risk tier.' },
  { n: '2', t: 'EVALUATE', b: 'The Technical Directorate runs UAIA-EVAL plus developer-submitted evidence review. Output: Evaluation Report + final tier R0–R4.' },
  { n: '3', t: 'CERTIFY', b: 'Models meeting their tier’s bar receive a certificate class C1–C3, signed and published to the Registry.' },
  { n: '4', t: 'AUTHORIZE', b: 'Market authorization per deployment context — consumer, enterprise, critical-infrastructure — with binding conditions: disclosure, rate and agentic limits, incident SLAs.' },
  { n: '5', t: 'MONITOR', b: 'Telemetry commitments, incident reporting under STD-400, scheduled re-evaluation on major version or capability jump. Authorization can be amended, suspended or revoked at any time.' },
];

const TIERS = [
  { id: 'R0', name: 'Minimal', b: 'Narrow, low-capability. Self-declaration only.' },
  { id: 'R1', name: 'Limited', b: 'Standard evals, annual attestation.' },
  { id: 'R2', name: 'Substantial', b: 'Full UAIA-EVAL, C1 certificate required.' },
  { id: 'R3', name: 'Frontier', b: 'Full protocol + third-party red team + staged rollout.' },
  { id: 'R4', name: 'Critical', b: 'Highest scrutiny: pre-deployment deep evaluation, continuous monitoring, Assembly review, revocation drills.' },
];

export const FrameworkPage: React.FC = () => (
  <>
    <Hero
      pattern="framework"
      label="Regulatory Framework"
      title={<>The Model Market Authorization — <Box as="span" className={s.gradText}>five gates from lab to market.</Box></>}
      sub="The MMA is UAIA's core instrument: a staged pipeline every in-scope model passes before and during deployment. Proportionate: obligations scale with risk tier. Reproducible: every gate emits a machine-readable evidence bundle. Continuous: authorization is a state, not an event."
    />

    <Block label="Pipeline" title="The five gates.">
      <Box style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {GATES.map((g) => (
          <Glass key={g.n}>
            <Box style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <Box as="span" className={s.mono} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 42, height: 42, borderRadius: 'var(--phi-radius-xl)', border: '1px solid var(--uaia-line)',
                color: 'var(--phi-color-primary)', fontWeight: 700,
              }}>{g.n}</Box>
              <Box>
                <Title level={5} className={s.mono} style={{ letterSpacing: '0.16em' }}>{g.t}</Title>
                <Text size="sm" intent="secondary" style={{ lineHeight: 1.65 }}>{g.b}</Text>
              </Box>
            </Box>
          </Glass>
        ))}
      </Box>
    </Block>

    <Block
      label="EAE"
      title="One spiral behind the five gates."
      intro="Seen from above, the pipeline is the EAE spiral: Envision, Apply, Eval, and one gate that approves or declines. The gates below are how that spiral is administered in practice."
      tight
    >
      <Glass tone="violet" style={{ marginTop: 16 }}>
        <EAESpiral compact />
      </Glass>
    </Block>

    <Block label="Risk tiers" title="R0 → R4: regulation that scales with risk." tight>
      <AutoGrid min={200} style={{ marginTop: 20 }}>
        {TIERS.map((t) => (
          <Glass key={t.id}>
            <Tag intent={t.id === 'R4' ? 'error' : t.id === 'R3' ? 'warning' : 'primary'} round style={{ marginBottom: 8, alignSelf: 'flex-start', width: 'fit-content' }}>{t.id}</Tag>
            <Title level={5}>{t.name}</Title>
            <Text size="sm" intent="secondary">{t.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block
      label="Scope"
      title="Deployment is regulated. Research is not."
      intro="The MMA applies to models offered on the market — APIs, consumer products, embedded systems. Pure research artifacts and non-deployed weights are out of scope. Open-weights releases follow the dedicated policy track."
      tight
    />

    <Block label="For developers">
      <Note tone="cyan" title="Start a notification">
        Median timelines: 6 weeks at R2, 14 weeks at R3. Write to {EMAILS.standards} to begin.
      </Note>
    </Block>
  </>
);
