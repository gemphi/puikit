import React from 'react';
import { Box, Tag, Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid, Note } from '../components/kit';
import s from '../styles/uaia.module.scss';

const CLASSES = [
  { id: 'C1', t: 'Certified', intent: 'success' as const, b: 'Meets its tier’s full bar for general market offering.' },
  { id: 'C2', t: 'Certified, Conditional', intent: 'primary' as const, b: 'Authorized with binding conditions: deployment scope, monitoring, mitigations — listed on the certificate face.' },
  { id: 'C3', t: 'Provisional', intent: 'warning' as const, b: 'Time-boxed authorization for staged rollout while designated follow-up evidence accrues.' },
  { id: 'X', t: 'Declined / Revoked', intent: 'error' as const, b: 'Public record with reasons class: capability misstatement, failed track, incident.' },
];

const SAMPLE = [
  { id: 'AURORA-2', dev: 'Illustrative Labs', tier: 'R3', cls: 'C2', due: '2027-03-01' },
  { id: 'HELIOS-MINI', dev: 'Sample Systems', tier: 'R1', cls: 'C1', due: '2027-09-01' },
  { id: 'KITE-70B', dev: 'Placeholder AI', tier: 'R2', cls: '—', due: 'in evaluation' },
  { id: 'VELA-AGENT', dev: 'Example Corp', tier: 'R3', cls: 'C3', due: '2026-12-15' },
];

export const CertificationPage: React.FC = () => (
  <>
    <Hero
      pattern="certification"
      label="Certification & The Model Registry"
      title={<>A public ledger of every model we have judged — <Box as="span" className={s.gradText}>and how.</Box></>}
    />

    <Block label="Classes" title="Four certificate classes.">
      <AutoGrid min={240} style={{ marginTop: 22 }}>
        {CLASSES.map((c) => (
          <Glass key={c.id}>
            <Tag intent={c.intent} round style={{ marginBottom: 8, alignSelf: 'flex-start', width: 'fit-content' }}>{c.id}</Tag>
            <Title level={5}>{c.t}</Title>
            <Text size="sm" intent="secondary">{c.b}</Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block label="Registry" title="Open. Signed. Machine-readable." intro="Each entry carries: model ID, developer, version lineage, risk tier, certificate class and history, conditions, incident log, harness versions, and re-evaluation due date. Published as JSON with signed attestations under STD-500." tight>
      <Glass style={{ marginTop: 20, overflowX: 'auto' }}>
        <Box as="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <Box as="thead">
            <Box as="tr" className={s.mono} style={{ textAlign: 'left', color: 'var(--phi-color-text-secondary)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              <Box as="th" style={{ padding: '8px 12px' }}>Model ID</Box><Box as="th" style={{ padding: '8px 12px' }}>Developer</Box>
              <Box as="th" style={{ padding: '8px 12px' }}>Tier</Box><Box as="th" style={{ padding: '8px 12px' }}>Class</Box>
              <Box as="th" style={{ padding: '8px 12px' }}>Re-eval due</Box>
            </Box>
          </Box>
          <Box as="tbody">
            {SAMPLE.map((r) => (
              <Box as="tr" key={r.id} style={{ borderTop: '1px solid var(--uaia-line)' }}>
                <Box as="td" className={s.mono} style={{ padding: '10px 12px' }}>{r.id}</Box>
                <Box as="td" style={{ padding: '10px 12px' }}>{r.dev}</Box>
                <Box as="td" style={{ padding: '10px 12px' }}><Tag intent="primary" minimal round style={{ width: 'fit-content' }}>{r.tier}</Tag></Box>
                <Box as="td" className={s.mono} style={{ padding: '10px 12px' }}>{r.cls}</Box>
                <Box as="td" style={{ padding: '10px 12px' }}>{r.due}</Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Text size="sm" intent="secondary" style={{ marginTop: 12 }}>Sample data — illustrative of the registry now being built.</Text>
      </Glass>
    </Block>

    <Block label="Lifecycle" title="Certificates live, and can die." tight>
      <Box style={{ marginTop: 16, display: 'grid', gap: 12, maxWidth: 760 }}>
        <Glass><Text>Certificates bind to a model version; a major version or measured capability jump voids inheritance and triggers re-evaluation.</Text></Glass>
        <Glass><Text>Any party may file an incident under STD-400; triage within 72 hours.</Text></Glass>
        <Glass><Text>Suspension is immediate on confirmed critical incident; revocation follows the Assembly-reviewed process. All actions are published within 24 hours.</Text></Glass>
      </Box>
    </Block>

    <Block label="Marks">
      <Note tone="cyan" title={'The "UAIA CERTIFIED" mark'}>
        Exact badge geometry, class always shown, link-back to the registry entry required. Misuse of the mark is grounds for revocation.
      </Note>
    </Block>
  </>
);
