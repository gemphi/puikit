import React from 'react';
import { Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid, Note } from '../components/kit';
import s from '../styles/uaia.module.scss';

const COMMITMENTS = [
  { t: 'Funding', b: 'Quarterly disclosure of all funding sources and amounts; 15% single-source cap from year two (Charter Art. 3).' },
  { t: 'Decisions', b: 'Every certification, condition, suspension and revocation published within 24 hours with a named responsible officer.' },
  { t: 'Minutes', b: 'Board and Assembly minutes published, redactions justified in-line.' },
  { t: 'Annual report', b: 'Finances, evaluation statistics, incident summaries, audit letter.' },
];

export const LegalPage: React.FC = () => (
  <>
    <Hero
      pattern="legal"
      label="Legal & Transparency"
      title={<>An agency that inspects others <span className={s.gradText}>must be glass itself.</span></>}
    />

    <Block label="Transparency" title="Standing commitments.">
      <AutoGrid min={260} style={{ marginTop: 20 }}>
        {COMMITMENTS.map((c) => (
          <Glass key={c.t}>
            <Title level={5}>{c.t}</Title>
            <Text size="sm" intent="secondary" style={{ lineHeight: 1.6 }}>{c.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block
      label="Conflicts"
      title="Conflict-of-interest policy."
      intro="Five-year recusal rule for evaluators; divestment requirements for Directorate leadership; a public COI register for all council members."
      tight
    />

    <Block label="Terms of use" tight>
      <div style={{ marginTop: 14, display: 'grid', gap: 12, maxWidth: 760 }}>
        <Glass><Text><strong>Registry data.</strong> Open under CC-BY-4.0 with attribution &ldquo;UAIA Model Registry&rdquo;.</Text></Glass>
        <Glass><Text><strong>Certification marks.</strong> Licensed, revocable, class always visible.</Text></Glass>
        <Glass><Text><strong>Site content.</strong> May be quoted with link-back.</Text></Glass>
      </div>
    </Block>

    <Block label="Privacy" tight>
      <div style={{ marginTop: 14, display: 'grid', gap: 12, maxWidth: 760 }}>
        <Glass><Text>Minimal collection: inquiry data is used solely to respond.</Text></Glass>
        <Glass><Text>No ad trackers; analytics self-hosted and aggregate.</Text></Glass>
        <Glass><Text>Incident-report identities protected; the whistleblower channel is sealed from all non-triage staff.</Text></Glass>
      </div>
    </Block>

    <Block label="Status of this site">
      <Note tone="cyan" title="Founding phase">
        UAIA was declared on 11 September 2026 and is in its founding phase. Pages marked
        &ldquo;illustrative&rdquo; contain sample data demonstrating planned infrastructure. This site never
        presents an aspiration as an accomplished fact; see the status boards on Partnerships.
      </Note>
    </Block>
  </>
);
