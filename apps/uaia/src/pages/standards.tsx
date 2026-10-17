import React from 'react';
import { Box, Tag, Text } from '@pui/components';
import { Hero, Block, Glass, Note } from '../components/kit';
import { EMAILS } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const CATALOG = [
  { id: 'STD-100', t: 'Model Disclosure', v: 'v1.0', b: 'What a Model Notification must contain: compute, data lineage classes, capability claims, eval hooks.' },
  { id: 'STD-110', t: 'Versioning & Lineage', v: 'v1.0', b: 'What counts as a "new model"; capability-jump triggers for re-evaluation.' },
  { id: 'STD-200', t: 'Evaluation Reproducibility', v: 'v1.0', b: 'Harness pinning, tolerance bands, contamination screening, third-party re-run accreditation.' },
  { id: 'STD-210', t: 'Red-Team Practice', v: 'v0.9 draft', b: 'Expert-hour floors per tier, domain coverage, disclosure handling.' },
  { id: 'STD-300', t: 'Deployment Conditions', v: 'v1.0', b: 'Condition taxonomy for C2 certificates: scope limits, agentic ceilings, human-oversight requirements.' },
  { id: 'STD-310', t: 'Provenance & Watermarking', v: 'v0.9 draft', b: 'Output provenance signals and verification APIs.' },
  { id: 'STD-400', t: 'Incident Reporting', v: 'v1.0', b: 'Severity ladder SEV-0…SEV-4, 72h triage, public postmortems for SEV-0/1.' },
  { id: 'STD-410', t: 'Monitoring Telemetry', v: 'v0.8 draft', b: 'Minimum deployment telemetry and privacy-preserving aggregation.' },
  { id: 'STD-500', t: 'Registry Interchange', v: 'v1.0', b: 'JSON schema + signature format for registry mirrors and national regulators.' },
];

export const StandardsPage: React.FC = () => (
  <>
    <Hero
      pattern="standards"
      label="UAIA-STD Series"
      title={<>Standards <Box as="span" className={s.gradText}>you can diff.</Box></>}
      sub="Every UAIA standard is versioned, public, and published as both prose and machine-readable schema. Comment periods are open to anyone."
    />

    <Block label="Catalog" title="The UAIA-STD series.">
      <Box style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {CATALOG.map((std) => (
          <Glass key={std.id}>
            <Box style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <Box as="span" className={s.mono} style={{ color: 'var(--phi-color-primary)', fontWeight: 700, minWidth: 84 }}>{std.id}</Box>
              <Box as="strong" style={{ fontFamily: 'var(--uaia-font-display)' }}>{std.t}</Box>
              <Tag minimal round intent={std.v.includes('draft') ? 'warning' : 'success'}>{std.v}</Tag>
            </Box>
            <Text size="sm" intent="secondary" style={{ marginTop: 8 }}>{std.b}</Text>
          </Glass>
        ))}
      </Box>
    </Block>

    <Block
      label="Process"
      title="Draft → comment → ratify → publish."
      intro="Draft, 60-day public comment, Directorate revision, Board ratification, Assembly review — then publication with a changelog. All comments are public."
      tight
    />

    <Block label="Downloads">
      <Note tone="cyan" title="Every standard ships as PDF + JSON schema + changelog">
        Join a working group: {EMAILS.standards}
      </Note>
    </Block>
  </>
);
