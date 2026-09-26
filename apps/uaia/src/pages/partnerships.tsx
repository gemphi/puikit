import React from 'react';
import { Tag, Text, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid, Note } from '../components/kit';
import { EMAILS } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const UN_GOALS = [
  { n: '01', b: 'Observer participation in UN AI-governance dialogues and the bodies emerging from them.', status: 'INITIATED' },
  { n: '02', b: 'Alignment of UAIA-STD with UN-endorsed AI principles, mapped clause by clause and published.', status: 'INITIATED' },
  { n: '03', b: 'A mutual-recognition pathway so UAIA certificates can serve member states that lack national evaluation capacity.', status: 'INITIATED' },
  { n: '04', b: 'A standing offer: UAIA-EVAL infrastructure, at cost, for any UN program assessing AI systems used in humanitarian and development work.', status: 'INITIATED' },
];

export const PartnershipsPage: React.FC = () => (
  <>
    <Hero
      pattern="partnerships"
      label="Global Partnerships"
      title={<>Safety that stops at a border <span className={s.gradText}>is not safety.</span></>}
    />

    <Block
      label="United Nations Engagement Program"
      title="A declared plan, tracked in the open."
      intro="UAIA's founding declaration commits the agency to seek formal engagement with the United Nations system. Stated plainly: this is a program we are pursuing, not a partnership already concluded, and this page will always say exactly which it is."
    >
      <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {UN_GOALS.map((g) => (
          <Glass key={g.n}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span className={s.mono} style={{ color: 'var(--phi-color-primary)', fontWeight: 700 }}>{g.n}</span>
              <Text style={{ flex: 1, minWidth: 240 }}>{g.b}</Text>
              <Tag minimal round intent="primary">STATUS: {g.status}</Tag>
            </div>
          </Glass>
        ))}
      </div>
      <Text size="sm" intent="secondary" style={{ marginTop: 12 }}>
        Status ladder: INITIATED → IN DIALOGUE → AGREED. Every change is dated in the Newsroom.
      </Text>
    </Block>

    <Block label="National regulators" title="Evaluated once, understood everywhere." intro="The mutual-recognition doctrine: UAIA seeks bilateral technical agreements: shared harnesses under STD-200, registry mirroring under STD-500, so a model evaluated once is understood everywhere." tight />

    <Block label="Labs & academia" tight>
      <AutoGrid min={280} style={{ marginTop: 16 }}>
        <Glass>
          <Title level={5}>Developers</Title>
          <Text size="sm" intent="secondary">Join through the evaluation program itself, the pipeline is the partnership.</Text>
        </Glass>
        <Glass>
          <Title level={5}>Academic groups</Title>
          <Text size="sm" intent="secondary">Join through harness contributions and the reproducibility network. Contributions are credited on the registry; endorsements are never implied.</Text>
        </Glass>
      </AutoGrid>
    </Block>

    <Block label="Global equity track">
      <Note tone="violet" title="Certification as a bridge, not a moat">
        Fee waivers and evaluation-capacity grants for laboratories in under-resourced ecosystems.
        Institutional inquiries: {EMAILS.info}
      </Note>
    </Block>
  </>
);
