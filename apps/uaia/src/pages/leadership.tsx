import React from 'react';
import { Button, Tag, Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid } from '../components/kit';
import { EMAILS } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const SEATS = [
  { t: 'Founding Chair of the Board', b: 'A globally trusted figure from technology and philanthropy to convene governments, labs and civil society.' },
  { t: 'Chief Science Officer', b: 'A leading machine-learning scientist, the mandate includes operator-learning and simulation-based forecasting expertise of the kind now transforming weather and climate modeling.' },
  { t: 'Chief Policy Officer', b: 'International governance veteran to lead the UN-system engagement program.' },
  { t: 'Chief Assurance Officer', b: 'Audit and safety-case leadership from a high-reliability industry.' },
  { t: 'Scientific Council — 12 seats', b: 'Frontier-safety researchers, evaluators, economists, ethicists. Nominations open.' },
  { t: 'Public Assembly — 24 seats', b: 'Civil society, academia, international observers. Nominations open.' },
];

export const LeadershipPage: React.FC = () => (
  <>
    <Hero
      pattern="leadership"
      label="Leadership & Council"
      title={<>A founding council <span className={s.gradText}>assembled in the open.</span></>}
      sub="UAIA publishes its leadership the same way it publishes its certificates: only what is real, only when it is confirmed. One executive seat is filled today; the remaining founding seats are open and in appointment, each with a public mandate. Names appear here the day their holders accept, never before."
    />

    <Block label="Executive">
      <Glass style={{ marginTop: 16, maxWidth: 720 }}>
        <Tag intent="primary" round style={{ marginBottom: 10, alignSelf: 'flex-start', width: 'fit-content' }}>FOUNDING</Tag>
        <Title level={3}>Batanayi Matuku</Title>
        <Text className={s.mono} style={{ color: 'var(--phi-color-primary)', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Chief Technology Officer
        </Text>
        <Text intent="secondary" style={{ marginTop: 10, lineHeight: 1.7 }}>
          Leads the Technical Directorate: the UAIA-EVAL protocol, the Model Registry, and the
          certification infrastructure. Architect of the agency&rsquo;s evaluation stack and its
          reproducibility-first engineering doctrine.
        </Text>
        <Button variant="outline" className={s.btnGrad} size="sm" style={{ marginTop: 14 }} onClick={() => (window.location.href = `mailto:${EMAILS.hello}`)}>
          {EMAILS.hello}
        </Button>
      </Glass>
    </Block>

    <Block label="Founding seats" title="In appointment — mandates published, names earned." tight>
      <AutoGrid min={300} style={{ marginTop: 22 }}>
        {SEATS.map((seat) => (
          <Glass key={seat.t} seat>
            <Tag minimal round style={{ marginBottom: 10, alignSelf: 'flex-start', width: 'fit-content' }}>IN APPOINTMENT</Tag>
            <Title level={5}>{seat.t}</Title>
            <Text size="sm" intent="secondary" style={{ lineHeight: 1.65 }}>{seat.b}</Text>
            <Text size="sm" style={{ marginTop: 10 }}>
              <a href={`mailto:${EMAILS.careers}`} style={{ color: 'var(--phi-color-primary)', textDecoration: 'none' }}>Nominate / apply →</a>
            </Text>
          </Glass>
        ))}
      </AutoGrid>
    </Block>

    <Block
      label="Stakeholder doctrine"
      title="We convene; we do not speak for."
      intro="UAIA convenes, it does not speak for, the frontier labs, philanthropies, academic groups and international bodies whose work it draws on. Endorsements are listed only when given in writing."
      tight
    />
  </>
);
