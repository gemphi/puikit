import React, { useEffect, useState } from 'react';
import { Avatar, Badge, Button, Drawer, Icon, Stack, Tag, Text } from '@pui/components';
import { useStore } from '@pui/store';
import { KeyRound, Link2, RefreshCw, UserPlus } from 'lucide-react';
import { useMe } from '@phi-kit/auth';
import { AccountDialog } from '@phi-kit/AccountDialog';
import { Block } from '@phi-kit/blocks';
import { identityStore, issueDelegation, linkIdentity, loadLink, phioraOn, requestIdentity, resolveIdentity, unlinkIdentity, type DelegationClaims } from '../state/identityStore';
import { hasPhiadk } from '../state/phiadkClient';
import type { ConsoleView } from './part';

const left = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`; };
const CLAIM: [keyof DelegationClaims, string][] = [['sub', 'Phiora user'], ['name', 'Name'], ['handle', 'Handle'], ['email', 'Email'], ['email_verified', 'Email verified'], ['guest', 'Guest'], ['aud', 'For'], ['sid', 'Session'], ['exp', 'Expires']];
const MODE = { local: 'Checked with the shared secret', remote: 'Checked by Phiora', off: 'Delegation off' };
const initialsOf = (name: string) => name.split(' ').map((x) => x[0]).join('').slice(0, 2);
const mono = (text: string) => <Text as="span" size="sm" mono truncate>{text}</Text>;
const tagRow = (list: string[], intent?: 'primary') => <Stack direction="row" gap={1} wrap>{list.map((g) => <Tag key={g} intent={intent} minimal round size="sm">{g}</Tag>)}</Stack>;
const person = (seed: string, name: string, line: string) => (
  <Stack direction="row" gap={3} align="center"><Avatar size="md" seed={seed} initials={initialsOf(name)} /><Stack direction="column" gap={0}><Text weight="bold">{name}</Text><Text size="xs" intent="muted">{line}</Text></Stack></Stack>
);

/** Enrol a PhiOne identity: register, address and payment as data for the shared form block. */
const ENROL_STEP = [
  { id: 'account', label: 'Register', icon: 'user', lede: 'Who the identity is on PhiOne.', fields: [
    { id: 'displayName', label: 'Display name', placeholder: 'Noor Hale' },
    { id: 'handle', label: 'Handle', placeholder: 'noor.hale' },
    { id: 'email', label: 'Email', placeholder: 'noor@maisonopal.phi', full: true },
  ] },
  { id: 'address', label: 'Address', icon: 'pin', lede: 'Where the identity is based.', fields: [
    { id: 'line1', label: 'Address line', placeholder: '12 Opal Row', full: true },
    { id: 'city', label: 'City', placeholder: 'Opalia' },
    { id: 'region', label: 'Region', control: 'select', options: ['Opalia', 'Lora Land', 'Lumen', 'Satin Reach', 'Velour'], value: 'Opalia' },
    { id: 'postcode', label: 'Postcode', placeholder: 'OP-2211' },
  ] },
  { id: 'payment', label: 'Payment', icon: 'card', lede: 'How the identity settles on Phiora.', fields: [
    { id: 'method', label: 'Method', control: 'radio', options: ['PhiWallet', 'Card', 'Bank transfer'], value: 'PhiWallet', full: true },
    { id: 'reference', label: 'Reference', control: 'textarea', placeholder: 'Wallet address or account reference' },
  ] },
  { id: 'review', label: 'Review', icon: 'clipboard', lede: 'Confirm and enrol.', review: true },
];

/**
 * Identity: who you are on Phiora, the delegation Phiora gives Phient for you, and the PhiOne identity Phient maps it
 * to. The link is kept on Phiora, so it follows the account to every device.
 */
export const useIdentityView = (): ConsoleView => {
  const me = useMe() as (ReturnType<typeof useMe> & { email?: string | null }) | undefined;
  const { delegation, identity, mode, link, request, busy, error } = useStore(identityStore);
  const [account, setAccount] = useState(false);
  const [enrol, setEnrol] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { void loadLink(); }, [me?.id]);
  const expired = !!delegation && delegation.expiresAt <= now;
  const linked = !!link && !!identity && link.email === identity.email;
  const signedIn = !!me && !me.guest;

  const accountRows: React.ReactNode[][] = !phioraOn ? [['Phiora', 'Set VITE_PHI_API to the Phiora API (http://localhost:4300) to sign in here.']]
    : !me ? [['Phiora', 'Reaching Phiora…']]
    : [['Account', person(me.id, me.name, (me.handle ? '@' + me.handle : me.id) + (me.email ? ' · ' + me.email : ''))], ...(me.guest ? [['Status', <Tag key="g" intent="warning" minimal round size="sm">Guest</Tag>]] : [])];

  const delegationRows: React.ReactNode[][] = delegation ? [
    ['Status', <Stack key="s" direction="row" gap={1} wrap><Tag intent={expired ? 'error' : 'success'} minimal round size="sm">{expired ? 'Expired' : 'Valid ' + left(delegation.expiresAt - now)}</Tag>{delegation.ephemeral && <Tag minimal round size="sm">Per-process key</Tag>}</Stack>],
    ...CLAIM.map(([k, l]) => [l, mono(k === 'exp' ? new Date(delegation.claims.exp * 1000).toISOString().slice(11, 19) + ' UTC' : String(delegation.claims[k] ?? '·'))]),
    ['Token', mono(delegation.token.slice(0, 48) + '…')],
    ['Use', 'Phione sends this as Authorization: Bearer on every Phient call. Phient checks it with PHI_DELEGATION_SECRET (shared with Phiora) or by asking Phiora (PHIORA_URL).'],
  ] : [['Status', 'A short-lived signed statement from Phiora of who is signed in, for the Phient platform. Nothing is shared until you issue one.']];

  const stateRow: React.ReactNode[][] = [
    ...(mode || linked ? [['Check', <Stack key="c" direction="row" gap={1} wrap>{mode && <Tag minimal round size="sm">{MODE[mode]}</Tag>}{linked && <Tag intent="success" minimal round size="sm">Linked</Tag>}</Stack>]] : []),
    ...(request ? [['Request', <Stack key="r" direction="row" gap={2} align="center"><Tag intent={request.status === 'needs_approval' ? 'warning' : 'success'} minimal round size="sm">{request.status === 'needs_approval' ? 'Waiting for approval' : request.status}</Tag><Text as="span" size="xs" intent="muted" mono>{request.morphism_type} · {request.morphism_id.slice(0, 8)}</Text></Stack>]] : []),
  ];
  const identityRows: React.ReactNode[][] = !hasPhiadk ? [['PhiOne', 'Set VITE_PHIADK_API to the Phient API to look up your identity.']]
    : !identity ? [['PhiOne', delegation?.claims.email ? 'Look up maps your Phiora email to a PhiOne identity.' : 'Your Phiora account has no email yet, so there is nothing to look up: add one in Account.'], ...stateRow]
    : [
      ['Identity', person(identity.email, identity.display_name, identity.email)],
      ['Role', [identity.job_title, identity.department, identity.office_location].filter((x) => x && x !== 'N/A').join(' · ') || '·'],
      ['Account', <Badge key="a" variant={identity.account_enabled === false ? 'secondary' : 'primary'}>{identity.account_enabled === false ? 'Disabled' : 'Enabled'}</Badge>],
      ...(identity.groups?.length ? [['Groups', tagRow(identity.groups)]] : []),
      ...(identity.licenses?.length ? [['Licenses', tagRow(identity.licenses, 'primary')]] : []),
      ...(link ? [['Linked', `${new Date(link.linkedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC, kept on Phiora.`]] : []),
      ...stateRow,
    ];

  const enrolForm = {
    kind: 'form', steps: ENROL_STEP, submitLabel: 'Enrol', sub: 'Register, address and payment, on the shared form.',
    doneTitle: 'Enrolled', done: 'The request is with PhiOne; its status shows under PhiOne identity.', againLabel: 'Enrol another',
    onSubmit: (f: Record<string, string>) => { if (phioraOn && f.email) return requestIdentity(f.displayName || f.handle || 'New identity', f.email); return undefined; },
  };

  return {
    title: 'Identity',
    sub: 'Your Phiora account, the delegation Phiora gives the Phient platform for you, and the PhiOne identity it maps to.',
    action: <>
      <Button size="sm" variant="primary" icon={<Icon icon={UserPlus} size="xs" />} onClick={() => setEnrol(true)}>Enrol</Button>
      {phioraOn ? <Button size="sm" variant="outline" onClick={() => setAccount(true)}>{signedIn ? 'Account' : 'Sign in'}</Button> : null}
      <Button size="sm" variant={delegation && !expired ? 'outline' : 'primary'} disabled={!phioraOn} loading={busy === 'delegate'} onClick={() => void issueDelegation()} icon={<Icon icon={KeyRound} size="xs" />}>{delegation ? 'Renew delegation' : 'Issue delegation'}</Button>
      <Button size="sm" variant="outline" disabled={!hasPhiadk || !phioraOn} loading={busy === 'resolve'} onClick={() => void resolveIdentity()} icon={<Icon icon={RefreshCw} size="xs" />}>Look up identity</Button>
      {identity && (linked
        ? <Button size="sm" variant="ghost" onClick={() => void unlinkIdentity()}>Unlink identity</Button>
        : <Button size="sm" variant="primary" onClick={() => void linkIdentity()} icon={<Icon icon={Link2} size="xs" />}>Link identity</Button>)}
      {hasPhiadk && !identity && signedIn && me.email ? <Button size="sm" variant="outline" loading={busy === 'request'} onClick={() => void requestIdentity(me.name, me.email!)}>Request an identity</Button> : null}
    </>,
    noteList: error ? [{ text: error, intent: 'danger' }] : [],
    blocks: [
      { kind: 'table', title: 'Phiora account', rows: accountRows },
      { kind: 'table', title: 'Delegation to Phient', rows: delegationRows },
      { kind: 'table', title: 'PhiOne identity', rows: identityRows },
    ],
    overlay: <>
      {phioraOn && <AccountDialog isOpen={account} onClose={() => setAccount(false)} />}
      {enrol && <Drawer isOpen onClose={() => setEnrol(false)} position="right" size="lg" expandable title="Enrol identity"><Block b={enrolForm} onOpen={() => undefined} /></Drawer>}
    </>,
  };
};
