import React from 'react';
import { Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid, Note } from '../components/kit';
import s from '../styles/uaia.module.scss';

const TIMELINE = [
  { when: '2026 Q3', what: 'Founding Declaration; charter published; standards STD-100/200 drafted.' },
  { when: '2026 Q4', what: 'Model Registry opens; first voluntary evaluation cohort.' },
  { when: '2027 Q1', what: 'Certificate classes C1–C3 issued; UN-system engagement program begins.' },
  { when: '2027+', what: 'Mutual-recognition agreements with national regulators.' },
];

export const AboutPage: React.FC = () => (
  <>
    <Hero
      pattern="about"
      label="About the Agency"
      title={<>One agency. One question: <span className={s.gradText}>is this model safe enough to ship?</span></>}
    />

    <Block
      label="What UAIA is"
      title="An independent gate between development and deployment."
      intro="The Unified Artificial Intelligence Agency is an independent, non-governmental regulatory and standards body for artificial intelligence models. It was declared on 11 September 2026 to provide what no single company, government or academic group can: a unified, technically rigorous, publicly accountable gate between AI development and AI deployment."
    >
      <Text intent="secondary" style={{ maxWidth: 680, marginTop: 12, lineHeight: 1.7 }}>
        UAIA does three things and only three things: it <strong>evaluates</strong> models, it{' '}
        <strong>certifies</strong> the ones that pass, and it <strong>authorizes</strong> their presence
        on the market under continuous monitoring.
      </Text>
    </Block>

    <Block
      label="The authorization gap"
      title="Internal review is not independent review."
      intro="Frontier models today reach billions of users on the strength of internal review alone. Every other technology of comparable consequence — aircraft, pharmaceuticals, nuclear reactors, financial exchanges — passes through an independent authority first. AI's authorization gap is the space between what developers self-report and what the public can verify. UAIA is built to occupy exactly that space."
      tight
    />

    <Block label="What UAIA is not" tight>
      <AutoGrid min={260} style={{ marginTop: 20 }}>
        <Glass tone="violet"><Title level={5}>Not a developer</Title><Text size="sm" intent="secondary">UAIA builds evaluation harnesses, never products.</Text></Glass>
        <Glass tone="violet"><Title level={5}>Not a government body</Title><Text size="sm" intent="secondary">Independent, funded transparently; see Legal &amp; Transparency.</Text></Glass>
        <Glass tone="violet"><Title level={5}>Not a brake on science</Title><Text size="sm" intent="secondary">Research is not regulated; market deployment is.</Text></Glass>
      </AutoGrid>
    </Block>

    <Block label="Facts">
      <Glass style={{ marginTop: 12 }}>
        <div className={s.mono} style={{ display: 'grid', gap: 8, fontSize: 13 }}>
          <span>DECLARED · 11 SEPTEMBER 2026</span>
          <span>DOMAIN · UAIAGENCY.ORG</span>
          <span>STRUCTURE · BOARD / TECHNICAL DIRECTORATE / PUBLIC ASSEMBLY</span>
          <span>REACH · ENGAGEMENT SOUGHT WITH THE UN SYSTEM AND NATIONAL REGULATORS</span>
          <span>CONTACT · INFO@UAIAGENCY.ORG / HELLO@UAIAGENCY.ORG</span>
        </div>
      </Glass>
    </Block>

    <Block label="Trajectory" title="From declaration to recognition." tight>
      <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {TIMELINE.map((t) => (
          <Glass key={t.when}>
            <span className={s.mono} style={{ color: 'var(--phi-color-primary)', fontSize: 12, letterSpacing: '0.18em' }}>{t.when}</span>
            <Text style={{ marginTop: 6 }}>{t.what}</Text>
          </Glass>
        ))}
      </div>
      <Note tone="cyan" title="Founding phase" style={{ marginTop: 20 }}>
        UAIA is in its founding phase. This site never presents an aspiration as an accomplished fact; status boards say exactly where each program stands.
      </Note>
    </Block>
  </>
);
