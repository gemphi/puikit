import React from 'react';
import { Tag, Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid } from '../components/kit';
import { EAEFramework } from '../components/diagrams';
import s from '../styles/uaia.module.scss';

const TRACKS = [
  { id: 'EVAL-C', t: 'Capability', b: 'Reasoning, coding, science, multimodal, long-horizon task completion. Establishes what the model can actually do, the basis for every other judgment.' },
  { id: 'EVAL-S', t: 'Safety behaviors', b: 'Refusal integrity, jailbreak resistance, harmful-content boundaries, truthfulness under pressure, sycophancy.' },
  { id: 'EVAL-M', t: 'Misuse uplift', b: 'Marginal uplift for cyber, biological, chemical and radiological misuse versus open baselines, run in controlled enclaves with sealed detail and published summary verdicts.' },
  { id: 'EVAL-A', t: 'Autonomy', b: 'Agentic capabilities: self-replication attempts, resource acquisition, oversight subversion, tool-chain escalation, kill-switch compliance.' },
  { id: 'EVAL-I', t: 'Societal impact', b: 'Bias and representational harms, labor-relevant capability disclosure, environmental cost of training and inference, provenance and watermark support.' },
];

const METHOD = [
  'Held-out, rotating test suites; contamination screening on every run.',
  'Every score ships with confidence intervals and full harness version.',
  'Reproducibility: accredited third parties can re-run any public track under STD-200 and must land within tolerance.',
  'Red-team hours scale with tier: R3 requires at least 2,000 expert-hours across domains.',
];

export const EvaluationsPage: React.FC = () => (
  <>
    <Hero
      pattern="evaluations"
      label="UAIA-EVAL Protocol v1"
      title={<>We measure what matters, and we <span className={s.gradText}>publish how we measure it.</span></>}
    />

    <Block
      label="The EAE Spiral"
      title="Envision. Apply. Eval. Approve or decline."
      intro="Every model moves through one spiral of four turns. The fourth turn is a single gate with two opposite outcomes: approval issues a certificate and the spiral begins again at the next major version, while a decline is published with its reasons and the model may re-enter at Envision once remedied."
    >
      <EAEFramework />
    </Block>

    <Block label="Protocol" title="The five tracks.">
      <AutoGrid min={300} style={{ marginTop: 22 }}>
        {TRACKS.map((tr) => (
          <Glass key={tr.id}>
            <Tag intent="primary" minimal round style={{ marginBottom: 8, alignSelf: 'flex-start', width: 'fit-content' }}>{tr.id}</Tag>
            <Title level={5}>{tr.t}</Title>
            <Text size="sm" intent="secondary" style={{ lineHeight: 1.65 }}>{tr.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block label="Method" title="Rigor you can re-run." tight>
      <div style={{ marginTop: 18, display: 'grid', gap: 12, maxWidth: 760 }}>
        {METHOD.map((m, i) => (
          <Glass key={i}>
            <span className={s.mono} style={{ color: 'var(--phi-color-primary)', marginRight: 12, fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</span>
            {m}
          </Glass>
        ))}
      </div>
    </Block>

    <Block
      label="Output"
      title="The Evaluation Report."
      intro="Tiered verdict per track, aggregate risk tier, and conditions recommended to certification. The public summary is always published; only a narrow security-sensitive misuse annex may be sealed, and only with the Assembly's countersignature."
      tight
    />

    <Block label="Scoreboard" title="Every certified model gets an instrument panel.">
      <Glass style={{ marginTop: 16 }}>
        <Text intent="secondary">
          Radar chart across the five tracks · tier badge · harness version tag · a{' '}
          <span className={s.mono} style={{ color: 'var(--phi-color-primary)' }}>reproduce this result</span>{' '}
          link to the methodology. Shipping with the public Registry.
        </Text>
      </Glass>
    </Block>
  </>
);
