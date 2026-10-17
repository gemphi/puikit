import React, { useState } from 'react';
import { Box, Button, Divider, Input, Modal, ProgressSteps, Stack, Tag, Text, TabList } from '@pui/components';
import { useStore } from '@pui/store';
import { Bot, Mail, Wallet as WalletIcon, type LucideIcon } from 'lucide-react';
import { AccountPanel } from '@phi-kit/AccountDialog';
import { accountsEnabled } from '@phi-kit/auth';
import { D, clubOf, me, site, t } from '../../lib/data';
import { ONBOARDING } from '../../lib/onboarding';
import { phieggStore } from '../../state/phieggStore';

const PROVIDER_ICON: Record<string, LucideIcon> = { wallet: WalletIcon, email: Mail, agent: Bot };

/** The prototype's sign-in: pick a provider → verify PFTs → pick a role → say hi in your host's lobby (data/site.json signin). */
export const SignIn: React.FC = () => {
  const s = useStore(phieggStore);
  const [step, setStep] = useState(0); const [provider, setProvider] = useState(''); const [role, setRole] = useState('');
  const [hello, setHello] = useState(''); const [account, setAccount] = useState(false);
  if (s.overlay.kind !== 'signin') return null;
  const si = site.signin; const my = me();
  const host = D.hosts.hosts.find((h) => !!h.clubId && my.clubIds.includes(h.clubId)) ?? D.hosts.hosts[0];
  const lobby = s.nests.find((n) => n.hostId === host.id && n.kind === 'channel');
  const prov = si.providers.find((p) => p.id === provider);
  const steps = [{ id: 'provider', label: t('hdSignIn'), description: prov?.label }, ...si.steps.map((x, i) => ({ id: x.id, label: x.title, description: i === 1 && role ? role : undefined }))];
  const last = steps.length - 1;
  const close = () => { s.close(); setStep(0); setAccount(false); };
  const finish = () => {
    if (hello.trim() && lobby) s.nestMsg(lobby.id, hello.trim());
    ONBOARDING.set({ done: true, provider, role });
    s.flash(t('siSent', { host: host.name, name: my.name })); close();
  };
  const body = (() => {
    if (step === 0) return (
      <Stack direction="column" gap={2}>
        {si.providers.map((p) => (
          <Button key={p.id} variant={p.id === provider ? 'primary' : 'outline'} iconLeft={PROVIDER_ICON[p.id] ?? Bot} align="start" tall
            onClick={() => { setProvider(p.id); setStep(1); }}>
            <Stack direction="column" gap={0} align="start"><Text weight="bold">{p.label}</Text><Text size="xs" intent="muted">{p.hint}</Text></Stack>
          </Button>))}
        {accountsEnabled && <><Divider /><Button variant="ghost" size="sm" onClick={() => setAccount(!account)}>{t('siAccount')}</Button>{account && <AccountPanel onDone={close} />}</>}
      </Stack>);
    const x = si.steps[step - 1];
    return (
      <Stack direction="column" gap={3}>
        <Text intent="secondary">{x.body}</Text>
        {x.id === 'verify' && <Stack direction="row" gap={1} wrap>{my.clubIds.map((id) => <Tag key={id} round minimal intent="primary">{clubOf(id)?.name ?? id}</Tag>)}
          {prov && <Tag round minimal>{t('siVia', { provider: prov.label })}</Tag>}</Stack>}
        {x.id === 'role' && <Stack direction="row" gap={1} wrap><TabList size="sm" variant="pills" activeId={role} onChange={setRole} items={si.roles.map((r) => ({ id: r, label: r }))} /></Stack>}
        {x.id === 'hello' && <Input value={hello} autoFocus placeholder={t('siHello', { host: lobby ? '#' + lobby.name : host.name })} aria-label={x.title}
          onChange={(e) => setHello(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') finish(); }} />}
      </Stack>);
  })();
  return (
    <Modal isOpen onClose={close} size="md" title={si.title}
      footer={<Stack direction="row" justify="between" align="center" width="100%">
        <Text size="xs" intent="muted">{t('siStepN', { n: step + 1, m: steps.length })}</Text>
        <Stack direction="row" gap={2}>
          {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>{t('siBack')}</Button>}
          {step > 0 && step < last && <Button variant="primary" disabled={si.steps[step - 1].id === 'role' && !role} onClick={() => setStep(step + 1)}>{t('siContinue')}</Button>}
          {step === last && <Button variant="primary" onClick={finish}>{t('siDone')}</Button>}
        </Stack></Stack>}>
      <Stack direction="column" gap={4}>
        <Text intent="secondary">{si.sub}</Text>
        <ProgressSteps steps={steps} activeIndex={step} onStepClick={(i) => setStep(i)} />
        <Box>{body}</Box>
      </Stack>
    </Modal>
  );
};
