import React from 'react';
import { Box, Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid } from '../components/kit';
import s from '../styles/uaia.module.scss';

const CHAMBERS = [
  { t: 'The Board', b: 'Sets strategy, ratifies standards, appoints the Directorate. Founding seats are in appointment. No sitting executive of a model developer may hold a Board seat.' },
  { t: 'The Technical Directorate', b: 'Runs UAIA-EVAL, the Registry and certification. Led by the Chief Technology Officer. Evaluators are firewalled from funding and from the entities they evaluate.' },
  { t: 'The Public Assembly', b: 'A rotating council of civil-society, academic and international observers that reviews decisions, publishes dissents, and can force a re-evaluation with a two-thirds vote.' },
];

const ARTICLES = [
  { a: 'Art. 1 — Mandate', b: 'Evaluate, certify, authorize; nothing else.' },
  { a: 'Art. 3 — Independence', b: 'Funding is disclosed quarterly; no single source may exceed 15% of the annual budget after year two.' },
  { a: 'Art. 5 — Conflicts', b: 'Evaluators recuse from any model they contributed to within five years.' },
  { a: 'Art. 7 — Publicity', b: 'Certificates, revocations and standards are public by default; only narrow security-sensitive eval details may be sealed, with the Assembly’s countersignature.' },
  { a: 'Art. 9 — Revision', b: 'The charter itself is versioned and amendable only with Board supermajority plus Assembly assent.' },
];

const FLOW = ['Developer submission', 'Directorate evaluation', 'Certification decision', 'Assembly review window (14 days)', 'Registry publication', 'Continuous monitoring', 'Incident → review → amend / suspend / revoke'];

export const GovernancePage: React.FC = () => (
  <>
    <Hero
      pattern="governance"
      label="Governance & Charter"
      title={<>Structured so that no one — <Box as="span" className={s.gradText}>including us</Box> — has to be trusted blindly.</>}
    />

    <Block label="Structure" title="The three chambers.">
      <AutoGrid min={280} style={{ marginTop: 22 }}>
        {CHAMBERS.map((c) => (
          <Glass tone="violet" key={c.t}>
            <Title level={4}>{c.t}</Title>
            <Text size="sm" intent="secondary">{c.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block label="Charter" title="Key articles, summarized." tight>
      <Box style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {ARTICLES.map((x) => (
          <Glass key={x.a}>
            <Box as="span" className={s.mono} style={{ color: 'var(--phi-color-primary)', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{x.a}</Box>
            <Text style={{ marginTop: 6 }}>{x.b}</Text>
          </Glass>
        ))}
      </Box>
    </Block>

    <Block label="Decision flow" title="From submission to standing oversight.">
      <Glass style={{ marginTop: 16 }}>
        <Box as="ol" style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10 }}>
          {FLOW.map((step, i) => (
            <Box as="li" key={step}>
              <Box as="span" className={s.mono} style={{ color: 'var(--phi-color-primary)', marginRight: 10, fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</Box>
              {step}
            </Box>
          ))}
        </Box>
      </Glass>
    </Block>

    <Block
      label="Accountability"
      title="Named officers. Machine-readable evidence."
      intro="Annual external audit; public minutes; every authorization decision carries a named responsible officer and a machine-readable evidence bundle."
      tight
    />
  </>
);
