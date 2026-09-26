import React from 'react';
import { Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid } from '../components/kit';
import s from '../styles/uaia.module.scss';

const PRINCIPLES = [
  { n: '01', t: 'Independence', b: "No developer, state or funder directs an evaluation's outcome." },
  { n: '02', t: 'Evidence over assurance', b: 'We measure; we do not take anyone’s word.' },
  { n: '03', t: 'Proportionality', b: 'Obligations scale with risk tier, a toy is not a frontier system.' },
  { n: '04', t: 'Transparency', b: 'Every certificate, standard and revocation is public.' },
  { n: '05', t: 'Reproducibility', b: 'Any qualified third party can re-run our evaluations.' },
  { n: '06', t: 'Global equity', b: 'Safety must not become a moat; access programs keep certification reachable for labs outside the largest ecosystems.' },
  { n: '07', t: 'Humility', b: 'Standards version; science moves; UAIA revises in public.' },
];

export const MissionPage: React.FC = () => (
  <>
    <Hero
      pattern="mission"
      label="Mission & Vision"
      title={<>The market for intelligence <span className={s.gradText}>must be earned.</span></>}
    />

    <Block label="Mission">
      <Glass style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', lineHeight: 1.65, fontFamily: 'var(--uaia-font-display)' }}>
          To ensure that every artificial intelligence model offered to the public has been independently
          evaluated, transparently certified, and is continuously monitored, so that the benefits of AI
          compound and its failures never do.
        </Text>
      </Glass>
    </Block>

    <Block
      label="Vision 2030"
      title={'"UAIA-certified", understood the way "airworthy" is.'}
      intro="By 2030, UAIA certification is a claim no serious deployer ships without, verified by an authority no single interest controls, recognized across borders through agreements with the United Nations system and national regulators."
      tight
    />

    <Block label="Doctrine" title="The Seven Principles.">
      <AutoGrid min={280} style={{ marginTop: 22 }}>
        {PRINCIPLES.map((p) => (
          <Glass key={p.n}>
            <span className={s.mono} style={{ color: 'var(--phi-color-primary)', fontSize: 12, letterSpacing: '0.2em' }}>{p.n}</span>
            <Title level={5} style={{ marginTop: 6 }}>{p.t}</Title>
            <Text size="sm" intent="secondary">{p.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block label="Success" title="What success looks like." tight>
      <div style={{ marginTop: 16, display: 'grid', gap: 12, maxWidth: 720 }}>
        <Glass><Text>A public registry the world checks before it deploys.</Text></Glass>
        <Glass><Text>Incidents that fall year over year while certified deployments rise.</Text></Glass>
        <Glass><Text>A generation of models where safety work is a market advantage, not a tax.</Text></Glass>
      </div>
    </Block>
  </>
);
