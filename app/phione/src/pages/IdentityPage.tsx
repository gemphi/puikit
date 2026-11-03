import React, { useEffect, useState } from 'react';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Icon, Page, Stack, Tag, Text, Title } from '@pui/components';
import { useStore } from '@pui/store';
import { BadgeCheck, KeyRound, Link2, RefreshCw, UserPlus, UserRound } from 'lucide-react';
import { EnrollFlow } from '../components/Enroll/EnrollFlow';
import { useMe } from '@phi-kit/auth';
import { AccountDialog } from '@phi-kit/AccountDialog';
import { identityStore, issueDelegation, linkIdentity, loadLink, phioraOn, requestIdentity, resolveIdentity, unlinkIdentity, type DelegationClaims } from '../state/identityStore';
import { hasPhiadk } from '../state/phiadkClient';

const left = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`; };
const CLAIMS: [keyof DelegationClaims, string][] = [['sub', 'Phiora user'], ['name', 'Name'], ['handle', 'Handle'], ['email', 'Email'], ['email_verified', 'Email verified'], ['guest', 'Guest'], ['aud', 'For'], ['sid', 'Session'], ['exp', 'Expires']];

/**
 * Identity: who you are on Phiora, the delegation Phiora gives Phient for you, and the PhiOne identity Phient maps it
 * to. The link is kept on Phiora, so it follows the account to every device.
 */
export const IdentityPage: React.FC = () => {
  const me = useMe() as (ReturnType<typeof useMe> & { email?: string | null }) | undefined;
  const { delegation, identity, mode, link, request, busy, error } = useStore(identityStore);
  const [account, setAccount] = useState(false);
  const [enroll, setEnroll] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { void loadLink(); }, [me?.id]);
  const expired = !!delegation && delegation.expiresAt <= now;
  const rows = delegation ? CLAIMS.map(([k, l]) => ({ k, l, v: k === 'exp' ? new Date(delegation.claims.exp * 1000).toISOString().slice(11, 19) + ' UTC' : String(delegation.claims[k] ?? '·') })) : [];
  const linked = !!link && !!identity && link.email === identity.email;

  return (
    <Page>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Title level={2} size="xl">Identity</Title>
          <Text intent="secondary">Your Phiora account, the delegation Phiora gives the Phient platform for you, and the PhiOne identity it maps to.</Text>
        </Stack>
        {error && <Text size="sm" intent="danger" role="alert">{error}</Text>}

        <Card variant="default">
          <CardHeader action={<Stack direction="row" gap={2}><Button size="sm" variant="primary" icon={<Icon icon={UserPlus} size="xs" />} onClick={() => setEnroll(true)}>Enrol</Button>{phioraOn ? <Button size="sm" variant="outline" onClick={() => setAccount(true)}>{me && !me.guest ? 'Account' : 'Sign in'}</Button> : null}</Stack>}>
            <Stack direction="row" align="center" gap={2}><Icon icon={UserRound} size="sm" /><Title level={4} size="md">Phiora account</Title></Stack>
          </CardHeader>
          <CardBody>
            {!phioraOn ? <Text size="sm" intent="secondary">Set VITE_PHI_API to the Phiora API (http://localhost:4300) to sign in here.</Text>
              : !me ? <Text size="sm" intent="muted">Reaching Phiora…</Text>
              : <Stack direction="row" gap={3} align="center">
                  <Avatar size="md" seed={me.id} initials={me.name.split(' ').map((x) => x[0]).join('').slice(0, 2)} />
                  <Stack direction="column" gap={0}><Text weight="bold">{me.name}</Text><Text size="xs" intent="muted">{me.handle ? '@' + me.handle : me.id}{me.email ? ' · ' + me.email : ''}</Text></Stack>
                  {me.guest && <Tag intent="warning" minimal round size="sm">Guest</Tag>}
                </Stack>}
          </CardBody>
        </Card>

        <Card variant="default">
          <CardHeader action={<Button size="sm" variant={delegation && !expired ? 'outline' : 'primary'} disabled={!phioraOn} loading={busy === 'delegate'} onClick={() => void issueDelegation()} icon={<Icon icon={KeyRound} size="xs" />}>{delegation ? 'Renew' : 'Issue'}</Button>}>
            <Stack direction="row" align="center" gap={2}><Icon icon={KeyRound} size="sm" /><Title level={4} size="md">Delegation to Phient</Title>
              {delegation && <Tag intent={expired ? 'error' : 'success'} minimal round size="sm">{expired ? 'Expired' : 'Valid ' + left(delegation.expiresAt - now)}</Tag>}
              {delegation?.ephemeral && <Tag minimal round size="sm">Per-process key</Tag>}</Stack>
          </CardHeader>
          <CardBody>
            {delegation ? <Stack direction="column" gap={2}>
              <Stack autoFill="11rem" gap={2}>{rows.map((r) => (
                <Stack key={r.k} direction="column" gap={0.5} surface="sunken" paddingY={2} paddingX={3}><Text as="span" size="xs" intent="muted">{r.l}</Text><Text as="span" size="sm" mono truncate>{r.v}</Text></Stack>))}</Stack>
              <Text size="xs" intent="muted" mono truncate>{delegation.token.slice(0, 48)}…</Text>
              <Text size="xs" intent="secondary">Phione sends this as Authorization: Bearer on every Phient call. Phient checks it with PHI_DELEGATION_SECRET (shared with Phiora) or by asking Phiora (PHIORA_URL).</Text>
            </Stack> : <Text size="sm" intent="secondary">A short-lived signed statement from Phiora of who is signed in, for the Phient platform. Nothing is shared until you issue one.</Text>}
          </CardBody>
        </Card>

        <Card variant="default">
          <CardHeader action={<Stack direction="row" gap={2}>
            <Button size="sm" variant="outline" disabled={!hasPhiadk || !phioraOn} loading={busy === 'resolve'} onClick={() => void resolveIdentity()} icon={<Icon icon={RefreshCw} size="xs" />}>Look up</Button>
            {identity && (linked
              ? <Button size="sm" variant="ghost" onClick={() => void unlinkIdentity()}>Unlink</Button>
              : <Button size="sm" variant="primary" onClick={() => void linkIdentity()} icon={<Icon icon={Link2} size="xs" />}>Link</Button>)}
          </Stack>}>
            <Stack direction="row" align="center" gap={2}><Icon icon={BadgeCheck} size="sm" /><Title level={4} size="md">PhiOne identity</Title>
              {mode && <Tag minimal round size="sm">{mode === 'local' ? 'Checked with the shared secret' : mode === 'remote' ? 'Checked by Phiora' : 'Delegation off'}</Tag>}
              {linked && <Tag intent="success" minimal round size="sm">Linked</Tag>}</Stack>
          </CardHeader>
          <CardBody>
            {!hasPhiadk ? <Text size="sm" intent="secondary">Set VITE_PHIADK_API to the Phient API to look up your identity.</Text>
              : !identity ? <Stack direction="column" gap={2}>
                  <Text size="sm" intent="secondary">{delegation?.claims.email ? 'Look up maps your Phiora email to a PhiOne identity.' : 'Your Phiora account has no email yet, so there is nothing to look up: add one in Account.'}</Text>
                  {me && !me.guest && me.email && <Button size="sm" variant="outline" loading={busy === 'request'} onClick={() => void requestIdentity(me.name, me.email!)}>Request an identity</Button>}
                </Stack>
              : <Stack direction="column" gap={3}>
                  <Stack direction="row" gap={3} align="center">
                    <Avatar size="md" seed={identity.email} initials={identity.display_name.split(' ').map((x) => x[0]).join('').slice(0, 2)} />
                    <Stack direction="column" gap={0}><Text weight="bold">{identity.display_name}</Text><Text size="xs" intent="muted">{identity.email}</Text>
                      <Text size="xs" intent="secondary">{[identity.job_title, identity.department, identity.office_location].filter((x) => x && x !== 'N/A').join(' · ')}</Text></Stack>
                    <Badge variant={identity.account_enabled === false ? 'secondary' : 'primary'}>{identity.account_enabled === false ? 'Disabled' : 'Enabled'}</Badge>
                  </Stack>
                  {!!identity.groups?.length && <Stack direction="row" gap={1} wrap>{identity.groups.map((g) => <Tag key={g} minimal round size="sm">{g}</Tag>)}</Stack>}
                  {!!identity.licenses?.length && <Stack direction="row" gap={1} wrap>{identity.licenses.map((g) => <Tag key={g} intent="primary" minimal round size="sm">{g}</Tag>)}</Stack>}
                  {link && <Text size="xs" intent="muted">Linked {new Date(link.linkedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC, kept on Phiora.</Text>}
                </Stack>}
            {request && <Stack direction="row" gap={2} align="center" paddingTop={3}><Tag intent={request.status === 'needs_approval' ? 'warning' : 'success'} minimal round size="sm">{request.status === 'needs_approval' ? 'Waiting for approval' : request.status}</Tag><Text as="span" size="xs" intent="muted" mono>{request.morphism_type} · {request.morphism_id.slice(0, 8)}</Text></Stack>}
          </CardBody>
        </Card>
      </Stack>
      {phioraOn && <AccountDialog isOpen={account} onClose={() => setAccount(false)} />}
      <EnrollFlow isOpen={enroll} onClose={() => setEnroll(false)} busy={busy === 'request'} onDone={(f) => { setEnroll(false); if (phioraOn && f.email) void requestIdentity(f.displayName || f.handle || 'New identity', f.email); }} />
    </Page>
  );
};
