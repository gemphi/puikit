import React from 'react';
import { Box, Link, Tag, Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid, Note } from '../components/kit';
import { EMAILS } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const ROLES = [
  'Evaluation Engineer — Harness Infrastructure (Directorate)',
  'Red-Team Lead — Autonomy & Agentic Systems',
  'Research Scientist — Capability Forecasting',
  'Registry Platform Engineer — TypeScript/React (the registry runs on the same puijs stack as this site)',
  'Standards Program Manager — STD-200/210',
  'Policy Analyst — UN Engagement Program',
  'Communications Lead — Newsroom & Transparency',
];

const SEATS = [
  'Founding Chair of the Board',
  'Chief Science Officer',
  'Chief Policy Officer',
  'Chief Assurance Officer',
  'Scientific Council (12 seats)',
  'Public Assembly (24 seats)',
];

export const CareersPage: React.FC = () => (
  <>
    <Hero
      pattern="careers"
      label="Careers & Open Seats"
      title={<>Build the institution <Box as="span" className={s.gradText}>the next decade needs.</Box></>}
      sub="The mission is the compensation's headline: your evaluations decide what intelligence reaches the world. Small teams, deep technical work, public output, zero product pressure."
    />

    <Block label="Founding seats" title="Council seats, in appointment.">
      <AutoGrid min={260} style={{ marginTop: 20 }}>
        {SEATS.map((seat) => (
          <Glass key={seat} seat>
            <Tag minimal round style={{ marginBottom: 8, alignSelf: 'flex-start', width: 'fit-content' }}>OPEN</Tag>
            <Title level={5}>{seat}</Title>
            <Text size="sm">
              <Link href={`mailto:${EMAILS.careers}`} style={{ color: 'var(--phi-color-primary)', textDecoration: 'none' }}>Nominate or apply →</Link>
            </Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block label="Open roles" title="Initial openings." tight>
      <Box style={{ marginTop: 18, display: 'grid', gap: 10 }}>
        {ROLES.map((r, i) => (
          <Glass key={r}>
            <Box as="span" className={s.mono} style={{ color: 'var(--phi-color-primary)', marginRight: 12, fontSize: 12 }}>{`ROLE-${String(i + 1).padStart(2, '0')}`}</Box>
            {r}
          </Glass>
        ))}
      </Box>
    </Block>

    <Block label="Fellowship" tight>
      <Glass style={{ marginTop: 12, maxWidth: 760 }}>
        <Title level={5}>The UAIA Fellowship</Title>
        <Text size="sm" intent="secondary" style={{ lineHeight: 1.65 }}>
          12-month fellowship in evaluation science; open globally; relocation and remote tracks;
          fee-waived visiting posts for researchers from under-resourced ecosystems.
        </Text>
      </Glass>
    </Block>

    <Block
      label="How we hire"
      title="Work-sample first, credentials second."
      intro="Evaluator conflict-of-interest screening (Charter Art. 5) is explained up front, and every offer includes the public-integrity terms."
      tight
    />

    <Block label="Apply">
      <Note tone="cyan" title="Apply">
        {EMAILS.careers} — include the seat or role code in the subject line.
      </Note>
    </Block>
  </>
);
