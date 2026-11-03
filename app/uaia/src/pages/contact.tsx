import React from 'react';
import { Box, Button, Input, Link, Select, Text, Textarea, Title } from '@pui/components';
import { Hero, Block, Glass, AutoGrid, Note } from '../components/kit';
import { EMAILS } from '../lib/routes';
import s from '../styles/uaia.module.scss';

const CHANNELS = [
  { t: 'General', e: EMAILS.info },
  { t: 'Say hello / everything else', e: EMAILS.hello },
  { t: 'Press & media', e: EMAILS.press },
  { t: 'Standards & working groups', e: EMAILS.standards },
  { t: 'Certification & notifications', e: EMAILS.certification },
  { t: 'Careers & council seats', e: EMAILS.careers },
  { t: 'Legal & transparency requests', e: EMAILS.legal },
  { t: 'Incident reports (STD-400) — 24/7, 72h SLA', e: EMAILS.incidents },
];

export const ContactPage: React.FC = () => {
  const [sent, setSent] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [channel, setChannel] = React.useState<string>(EMAILS.info);

  const submit = () => {
    const ref = `UAIA-INQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setSent(ref);
    window.location.href = `mailto:${channel}?subject=${encodeURIComponent(`[${ref}] ${subject}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <Hero
        label="Contact"
        title={<>Every channel is answered. <Box as="span" className={s.gradText}>Every answer is on the record.</Box></>}
      />

      <Block label="Channels" title="Write to the right desk.">
        <AutoGrid min={260} style={{ marginTop: 20 }}>
          {CHANNELS.map((c) => (
            <Glass tone="violet" key={c.e + c.t}>
              <Title level={6} style={{ marginBottom: 6 }}>{c.t}</Title>
              <Link className={s.mono} href={`mailto:${c.e}`} style={{ color: 'var(--phi-color-primary)', textDecoration: 'none', fontSize: 13 }}>{c.e}</Link>
            </Glass>
          ))}
        </AutoGrid>
      </Block>

      <Block label="Inquiry" title="Or start here." tight>
        <Glass style={{ marginTop: 18, maxWidth: 720 }}>
          <Box style={{ display: 'grid', gap: 14 }}>
            <Select value={channel} onChange={(e: { target: { value: string } }) => setChannel(e.target.value)}
              options={CHANNELS.map((c) => ({ value: c.e, label: c.t }))} />
            <Input placeholder="Subject" value={subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} />
            <Textarea placeholder="Message" rows={6} value={body} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)} />
            <Box>
              <Button variant="primary" onClick={submit}>Send inquiry</Button>
            </Box>
            {sent && (
              <Note tone="violet" title={`Reference ${sent}`}>
                Your mail client has been opened with this reference attached. Quote it in any follow-up.
              </Note>
            )}
          </Box>
        </Glass>
      </Block>

      <Block
        label="Secure contact"
        title="Responsible disclosure."
        intro="A PGP key for incidents@ will be published here before launch, with guidance for responsible disclosure of evaluation-relevant vulnerabilities."
        tight
      />

      <Block
        label="Offices"
        title="A distributed agency."
        intro="UAIA operates as a distributed agency. The registered address will be published with the first transparency report."
      />
    </>
  );
};
