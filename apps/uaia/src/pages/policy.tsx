import React from 'react';
import { Tag, Text, Title } from '@pui/components';
import { Hero, Block, AutoGrid, Glass, Note } from '../components/kit';
import { EMAILS } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const TRACKS = [
  { id: 'P-01', t: 'Frontier safety cases', b: 'Before R3/R4 deployment, developers present a structured safety case; UAIA’s role is adversarial review, not rubber stamps.' },
  { id: 'P-02', t: 'Compute thresholds & notification', b: 'Training-compute triggers for mandatory notification; why FLOP thresholds are a tripwire, not a verdict.' },
  { id: 'P-03', t: 'Responsible scaling', b: 'Tier-gated capability commitments: what must be true, and demonstrated, before the next scale-up ships.' },
  { id: 'P-04', t: 'Provenance & watermarking', b: 'Content authenticity infrastructure as a public good; STD-310 as the interoperable floor.' },
  { id: 'P-05', t: 'Open-weights policy', b: 'Open release evaluated as a deployment surface with irreversible-diffusion analysis, neither exempt nor banned.' },
  { id: 'P-06', t: 'AI for global health & climate', b: 'Fast-track evaluation lanes for models serving vaccination logistics, disease surveillance, agricultural resilience and climate forecasting: rigor without delay where AI can save lives; equity of access as a certification consideration.' },
  { id: 'P-07', t: 'Agentic systems in the economy', b: 'Autonomy ceilings by deployment context; audit trails for consequential automated decisions.' },
  { id: 'P-08', t: 'Evaluation access & national capacity', b: 'Shared eval infrastructure so that safety oversight is not a privilege of the largest economies.' },
];

export const PolicyPage: React.FC = () => (
  <>
    <Hero
      pattern="policy"
      label="Policy Topics"
      title={<>The agenda the frontier era <span className={s.gradText}>demands.</span></>}
      sub="These are the policy tracks UAIA works, the questions that the global AI-safety community, from frontier labs to philanthropies to international bodies, has pushed to the front of the agenda. On each, UAIA publishes its own position and the strongest opposing view."
    />

    <Block label="Tracks" title="Eight policy tracks.">
      <AutoGrid min={300} style={{ marginTop: 22 }}>
        {TRACKS.map((p) => (
          <Glass tone="violet" key={p.id}>
            <Tag intent="primary" minimal round style={{ marginBottom: 8, alignSelf: 'flex-start', width: 'fit-content' }}>{p.id}</Tag>
            <Title level={5}>{p.t}</Title>
            <Text size="sm" intent="secondary" style={{ lineHeight: 1.65 }}>{p.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block
      label="Method"
      title="How positions are made."
      intro="Draft position → public comment → Assembly review → published with dissents. Every position page carries a strongest-counter-argument section, on principle."
      tight
    />

    <Block label="Engage">
      <Note tone="cyan" title="Engage a track">
        Working groups are open: {EMAILS.standards}
      </Note>
    </Block>
  </>
);
