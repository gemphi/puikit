import React from 'react';
import { Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid } from '../components/kit';
import s from '../styles/uaia.module.scss';

const AGENDA = [
  { n: '01', t: 'Forecast-grade evaluation', b: 'Moving from "what can it do today" to calibrated prediction of capability at the next compute scale, drawing on the operator-learning and simulation methods transforming forecasting in the physical sciences.' },
  { n: '02', t: 'Autonomy metrology', b: 'Standard units for agentic capability: task horizon, oversight-subversion resistance, kill-switch latency.' },
  { n: '03', t: 'Reproducibility at frontier scale', b: 'Tolerance bands when inference is stochastic and hardware heterogeneous.' },
  { n: '04', t: 'Societal-impact instrumentation', b: 'Measuring labor and information-ecosystem effects with the rigor of capability benchmarks.' },
];

export const ResearchPage: React.FC = () => (
  <>
    <Hero
      pattern="research"
      label="Research & Publications"
      title={<>Our evaluations are only as good <span className={s.gradText}>as our science.</span></>}
    />

    <Block label="Tracks" title="Three publication tracks.">
      <AutoGrid min={280} style={{ marginTop: 20 }}>
        <Glass tone="violet">
          <Title level={5}>Technical Reports (UAIA-TR)</Title>
          <Text size="sm" intent="secondary">Full methodology of each UAIA-EVAL track; harness architecture; contamination-screening methods.</Text>
        </Glass>
        <Glass tone="violet">
          <Title level={5}>The State of Model Safety</Title>
          <Text size="sm" intent="secondary">Annual: aggregate registry findings: tier distributions, incident statistics, year-over-year safety trends.</Text>
        </Glass>
        <Glass tone="violet">
          <Title level={5}>Working Papers</Title>
          <Text size="sm" intent="secondary">Open problems: agentic evaluation, capability forecasting, eval saturation, sealed-annex governance.</Text>
        </Glass>
      </AutoGrid>
    </Block>

    <Block label="Agenda" title="The research agenda." tight>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {AGENDA.map((a) => (
          <Glass key={a.n}>
            <span className={s.mono} style={{ color: 'var(--phi-color-primary)', fontSize: 12, letterSpacing: '0.2em' }}>{a.n}</span>
            <Title level={5} style={{ marginTop: 6 }}>{a.t}</Title>
            <Text size="sm" intent="secondary" style={{ lineHeight: 1.65 }}>{a.b}</Text>
          </Glass>
        ))}
      </div>
    </Block>

    <Block
      label="Open infrastructure"
      title="Harnesses go public."
      intro="Harnesses and public test suites are released under open licenses after each rotation cycle. Accredited re-runners get early access under STD-200."
      tight
    />

    <Block
      label="Fellows"
      title="The UAIA Fellowship."
      intro="12-month posts for researchers in evaluation science; see Careers. Publications carry author names and full data-availability statements."
    />
  </>
);
