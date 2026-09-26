import React from 'react';
import { Tag, Text, Title } from '@pui/components';
import { Hero, Block, Glass, Note } from '../components/kit';
import { EMAILS, FOUNDED } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const PREAMBLE = [
  ['Recalling', 'that every technology of planetary consequence, from civil aviation to the peaceful use of nuclear energy, is admitted to public use through independent authorization,'],
  ['Recognizing', 'that artificial intelligence has crossed the threshold at which such authorization is a matter of common sense rather than exceptional caution,'],
  ['Reaffirming', 'the right of every person to share in the benefits of scientific progress, and the shared duty of the present generation toward those to come,'],
  ['Noting with concern', 'that models of unprecedented capability presently reach billions of people on the strength of internal review alone,'],
] as const;

const OPERATIVE = [
  ['1.', 'Declares the founding of the Unified Artificial Intelligence Agency;'],
  ['2.', 'Decides that the Agency shall evaluate models against public protocols, certify those that meet the bar, and authorize and monitor their presence on the market, and shall do nothing else;'],
  ['3.', 'Affirms the independence of the Agency, whose funding shall be public and capped by source, and whose evaluators answer to evidence alone;'],
  ['4.', 'Expresses its intention to seek engagement with the United Nations system and with national regulators in all regions, and offers its standards, its registry and its infrastructure in service of a common floor for the safety of artificial intelligence;'],
  ['5.', 'Undertakes to publish and to fill its founding seats openly, claiming nothing before it is real, beginning with the present document.'],
] as const;

const STATEMENTS = [
  { id: 'S-001', date: '11 Sep 2026', t: 'On the authorization gap', b: 'Why internal review is no longer sufficient for frontier deployment.' },
  { id: 'S-002', date: '11 Sep 2026', t: 'On proportionality', b: 'The R0–R4 tier philosophy; regulation that scales with risk, not with fear.' },
  { id: 'S-003', date: '12 Sep 2026', t: 'On open weights', b: 'Open release is a deployment surface, not an exemption; the dedicated policy track.' },
  { id: 'S-004', date: '14 Sep 2026', t: 'On the UN engagement program', b: 'Program goals and the status board this site will maintain.' },
  { id: 'S-005', date: '15 Sep 2026', t: 'Call for founding council nominations', b: 'Seats, mandates, and how to nominate.' },
];

export const NewsroomPage: React.FC = () => (
  <>
    <Hero
      pattern="newsroom"
      label="Newsroom & Official Statements"
      title={<>Everything we declare, <span className={s.gradText}>in one place, permanently.</span></>}
    />

    <Block label="UAIA-DECL-001" title="The Founding Declaration.">
      <Glass style={{ marginTop: 18, padding: 'clamp(22px, 4vw, 40px)' }}>
        <Tag intent="primary" round style={{ marginBottom: 18, alignSelf: 'flex-start', width: 'fit-content' }}>{FOUNDED}</Tag>
        <Text style={{ lineHeight: 1.8, fontSize: '1.02rem', marginBottom: 18 }}>
          <em>The founding office of the Unified Artificial Intelligence Agency,</em>
        </Text>
        <div style={{ display: 'grid', gap: 14, marginBottom: 22 }}>
          {PREAMBLE.map(([lead, body]) => (
            <Text key={lead} style={{ lineHeight: 1.8, fontSize: '1.02rem' }}>
              <em style={{ color: 'var(--phi-color-primary)' }}>{lead}</em> {body}
            </Text>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          {OPERATIVE.map(([num, body]) => (
            <div key={num} style={{ display: 'flex', gap: 18 }}>
              <span className={s.mono} style={{ color: 'var(--phi-color-primary)', fontWeight: 700, minWidth: 26 }}>{num}</span>
              <Text style={{ lineHeight: 1.8, fontSize: '1.02rem' }}>
                <em>{body.split(' ')[0]}</em> {body.split(' ').slice(1).join(' ')}
              </Text>
            </div>
          ))}
        </div>
        <Text size="sm" intent="secondary" style={{ marginTop: 24, lineHeight: 1.7 }}>
          Adopted at the founding of the Agency, this eleventh day of September, two thousand and twenty-six.
        </Text>
        <Text size="sm" intent="secondary" style={{ marginTop: 22 }} className={s.mono}>
          ISSUED BY THE FOUNDING OFFICE OF THE AGENCY · {EMAILS.info}
        </Text>
      </Glass>
    </Block>

    <Block label="Inaugural statements" title="S-001 through S-005." tight>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {STATEMENTS.map((st) => (
          <Glass key={st.id}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span className={s.mono} style={{ color: 'var(--phi-color-primary)', fontWeight: 700 }}>{st.id}</span>
              <span className={s.mono} style={{ fontSize: 12, color: 'var(--phi-color-text-secondary)' }}>{st.date}</span>
              <Title level={5} style={{ margin: 0 }}>{st.t}</Title>
            </div>
            <Text size="sm" intent="secondary" style={{ marginTop: 8 }}>{st.b}</Text>
          </Glass>
        ))}
      </div>
    </Block>

    <Block label="Press">
      <Note tone="cyan" title="Media">
        {EMAILS.press} · brand assets (logo pack, usage rules) · fact sheet.
      </Note>
    </Block>
  </>
);
