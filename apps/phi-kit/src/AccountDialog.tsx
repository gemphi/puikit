import React from 'react';
import { Avatar, Button, Divider, FormGroup, Input, Modal, Stack, TabList, Tag, Text, Title } from '@pui/components';
import { demoSignIn, demoUsers, signIn, signOut, useMe, accountsEnabled, type DemoUser } from './auth';
import { changePassword, deleteAccount, exportUrl, forgotPassword, listSessions, readAccountLink, registerAccount, resetPassword, revokeOtherSessions, revokeSession, setEmail, verifyEmail, type Account, type AccountLink, type SessionInfo } from './account';

type Mode = 'signin' | 'register' | 'demo' | 'forgot' | 'reset';
type Result = { ok: boolean; message?: string; body?: unknown };
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const devLinkOf = (r: Result) => (r.ok && r.body && typeof r.body === 'object' && 'devLink' in r.body ? String((r.body as { devLink?: string }).devLink ?? '') : '');

/** Dev only: Phiora returns the emailed link when no mail transport is set up. */
const DevLink: React.FC<{ href: string }> = ({ href }) => (href ? (
  <Stack direction="row" gap={2} align="center" wrap>
    <Tag minimal round intent="warning">Dev mail</Tag>
    <Button size="sm" variant="outline" href={href}>Open the emailed link</Button>
  </Stack>) : null);

/** Sign in, create an account (email optional), forgot / reset password, demo members, or, signed in, email + password + sign out. */
export const AccountPanel: React.FC<{ onDone?: () => void; link?: AccountLink | null }> = ({ onDone, link }) => {
  const me = useMe() as Account | undefined;
  const [mode, setMode] = React.useState<Mode>(link?.kind === 'reset' ? 'reset' : 'signin');
  const [handle, setHandle] = React.useState(''); const [name, setName] = React.useState(''); const [password, setPassword] = React.useState('');
  const [email, setEmailField] = React.useState(''); const [current, setCurrent] = React.useState('');
  const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState(''); const [note, setNote] = React.useState('');
  const [dev, setDev] = React.useState(''); const [demo, setDemo] = React.useState<DemoUser[]>([]);
  const [editEmail, setEditEmail] = React.useState(false); const [editPassword, setEditPassword] = React.useState(false);
  const [sessions, setSessions] = React.useState<SessionInfo[] | null>(null); const [danger, setDanger] = React.useState(false); const [confirm, setConfirm] = React.useState('');
  const loadSessions = () => void listSessions().then(setSessions);
  React.useEffect(() => { if (mode === 'demo' && !demo.length) void demoUsers().then(setDemo); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (p: Promise<Result>, then?: (r: Result) => void) => {
    setBusy(true); setError(''); setNote(''); setDev('');
    const r = await p; setBusy(false);
    if (r.ok) { setPassword(''); setCurrent(''); setDev(devLinkOf(r)); then ? then(r) : onDone?.(); } else setError(r.message ?? 'Something went wrong.');
  };
  const go = (m: Mode) => { setMode(m); setError(''); setNote(''); setDev(''); };

  if (!me) return <Text intent="muted">Connecting to Phiora…</Text>;

  if (me.guest) return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={2} align="center"><Tag minimal round>Guest</Tag><Text size="sm" intent="muted">Create an account to keep what you buy and save here.</Text></Stack>
      {mode !== 'reset' && <TabList size="sm" variant="pills" aria-label="Account" activeId={mode} onChange={(id) => go(id as typeof mode)}
        items={[{ id: 'signin', label: 'Sign in' }, { id: 'register', label: 'Create account' }, ...(me.canDemo ? [{ id: 'demo', label: 'Demo members' }] : [])]} />}

      {(mode === 'signin' || mode === 'register') && <Stack direction="column" gap={2}>
        <FormGroup label={mode === 'signin' ? 'Handle or email' : 'Handle'}><Input value={handle} autoComplete="username" onChange={(e) => setHandle(e.target.value)} placeholder={mode === 'signin' ? 'noor.hale or you@example.com' : 'e.g. noor.hale'} /></FormGroup>
        {mode === 'register' && <FormGroup label="Name"><Input value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} /></FormGroup>}
        {mode === 'register' && <FormGroup label="Email" helperText="Optional, needed to reset a forgotten password."><Input type="email" value={email} autoComplete="email" onChange={(e) => setEmailField(e.target.value)} placeholder="you@example.com" /></FormGroup>}
        <FormGroup label="Password" helperText={mode === 'register' ? 'At least 8 characters.' : undefined}>
          <Input type="password" value={password} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && handle && password && mode === 'signin') void run(signIn(handle, password)); }} />
        </FormGroup>
        <Stack direction="row" gap={2} align="center" justify="between" wrap>
          <Button variant="primary" disabled={busy || !handle || !password || (mode === 'register' && !name)}
            onClick={() => void run(mode === 'register' ? registerAccount(handle, name, password, email.trim() || undefined) : signIn(handle, password),
              (r) => { if (mode === 'register' && email.trim()) setNote('Check your inbox to confirm ' + email.trim() + '.'); if (!devLinkOf(r)) onDone?.(); })}>
            {mode === 'register' ? 'Create account' : 'Sign in'}</Button>
          {mode === 'signin' && <Button variant="ghost" size="sm" onClick={() => go('forgot')}>Forgot password?</Button>}
        </Stack>
      </Stack>}

      {mode === 'forgot' && <Stack direction="column" gap={2}>
        <Text size="sm">Enter your handle or email. If the account has an email, we send a link to choose a new password (valid 30 minutes).</Text>
        <FormGroup label="Handle or email"><Input value={handle} autoComplete="username" onChange={(e) => setHandle(e.target.value)} /></FormGroup>
        <Stack direction="row" gap={2}>
          <Button variant="primary" disabled={busy || !handle} onClick={() => void run(forgotPassword(handle), () => setNote('If that account has an email, a reset link is on its way.'))}>Send reset link</Button>
          <Button variant="ghost" onClick={() => go('signin')}>Back to sign in</Button>
        </Stack>
      </Stack>}

      {mode === 'reset' && <Stack direction="column" gap={2}>
        <Title level={4} size="sm">Choose a new password</Title>
        <FormGroup label="New password" helperText="At least 8 characters. Every other browser is signed out."><Input type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} /></FormGroup>
        <Stack direction="row" gap={2}>
          <Button variant="primary" disabled={busy || password.length < 8 || !link?.token} onClick={() => void run(resetPassword(link!.token, password))}>Save and sign in</Button>
          <Button variant="ghost" onClick={() => go('forgot')}>Send a new link</Button>
        </Stack>
      </Stack>}

      {mode === 'demo' && <Stack direction="column" gap={1}>
        <Text size="xs" intent="muted">Seeded members, no password, for trying the apps.</Text>
        {demo.map((u) => <Button key={u.id} size="sm" variant="ghost" align="start" disabled={busy} onClick={() => void run(demoSignIn(u.id))}>{u.name} · @{u.handle}</Button>)}
      </Stack>}

      {note && <Text size="sm" intent="success" role="status">{note}</Text>}
      <DevLink href={dev} />
      {error && <Text size="sm" intent="danger" role="alert">{error}</Text>}
    </Stack>
  );

  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={3} align="center">
        <Avatar initials={initials(me.name)} size="lg" />
        <Stack direction="column" gap={0}><Title level={4} size="md">{me.name}</Title><Text size="sm" intent="muted">{me.handle ? '@' + me.handle : me.id}</Text></Stack>
      </Stack>
      <Text size="sm">Your wallet, looks and saved state follow this account to every Phiace app and browser.</Text>
      <Divider />

      <Stack direction="column" gap={2}>
        <Stack direction="row" gap={2} align="center" justify="between" wrap>
          <Stack direction="column" gap={0}><Text size="xs" intent="muted" weight="bold">Email</Text>
            <Stack direction="row" gap={2} align="center">
              <Text size="sm">{me.email ?? 'Not set, add one so you can reset your password.'}</Text>
              {me.email && <Tag minimal round size="sm" intent={me.emailVerified ? 'success' : 'warning'}>{me.emailVerified ? 'Confirmed' : 'Not confirmed'}</Tag>}
            </Stack></Stack>
          <Stack direction="row" gap={1}>
            {me.email && !me.emailVerified && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(setEmail(me.email!), () => setNote('Confirmation sent to ' + me.email + '.'))}>Resend link</Button>}
            <Button size="sm" variant="ghost" onClick={() => { setEditEmail(!editEmail); setEmailField(me.email ?? ''); }}>{me.email ? 'Change' : 'Add email'}</Button>
          </Stack>
        </Stack>
        {editEmail && <Stack direction="row" gap={2} align="end">
          <FormGroup label="New email"><Input type="email" value={email} autoComplete="email" onChange={(e) => setEmailField(e.target.value)} /></FormGroup>
          <Button variant="primary" size="sm" disabled={busy || !email.trim()} onClick={() => void run(setEmail(email.trim()), () => { setEditEmail(false); setNote('Check your inbox to confirm ' + email.trim() + '.'); })}>Save</Button>
        </Stack>}
      </Stack>

      <Stack direction="column" gap={2}>
        <Stack direction="row" justify="between" align="center"><Text size="xs" intent="muted" weight="bold">Password</Text>
          <Button size="sm" variant="ghost" onClick={() => setEditPassword(!editPassword)}>{editPassword ? 'Cancel' : 'Change password'}</Button></Stack>
        {editPassword && <Stack direction="column" gap={2}>
          <FormGroup label="Current password"><Input type="password" value={current} autoComplete="current-password" onChange={(e) => setCurrent(e.target.value)} /></FormGroup>
          <FormGroup label="New password" helperText="At least 8 characters. Other browsers are signed out."><Input type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} /></FormGroup>
          <Button variant="primary" size="sm" disabled={busy || !current || password.length < 8} onClick={() => void run(changePassword(current, password), () => { setEditPassword(false); setNote('Password changed.'); })}>Save password</Button>
        </Stack>}
      </Stack>

      <Stack direction="column" gap={2}>
        <Stack direction="row" justify="between" align="center"><Text size="xs" intent="muted" weight="bold">Signed-in browsers</Text>
          <Button size="sm" variant="ghost" onClick={() => (sessions ? setSessions(null) : loadSessions())}>{sessions ? 'Hide' : 'Show'}</Button></Stack>
        {sessions && <Stack direction="column" gap={1}>
          {sessions.map((x) => (
            <Stack key={x.id} direction="row" justify="between" align="center" gap={2}>
              <Stack direction="column" gap={0}><Text size="sm" weight="bold">{x.browser}{x.current ? ' · this browser' : ''}</Text>
                <Text size="xs" intent="muted">Since {new Date(x.created).toLocaleDateString()} · last seen {new Date(x.lastSeen).toLocaleString()}</Text></Stack>
              {!x.current && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(revokeSession(x.id), loadSessions)}>Sign out</Button>}
            </Stack>))}
          {sessions.length > 1 && <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(revokeOtherSessions(), loadSessions)}>Sign out all other browsers</Button>}
        </Stack>}
      </Stack>

      {note && <Text size="sm" intent="success" role="status">{note}</Text>}
      <DevLink href={dev} />
      {error && <Text size="sm" intent="danger" role="alert">{error}</Text>}
      <Divider />
      <Stack direction="row" gap={2} wrap>
        <Button variant="outline" disabled={busy} onClick={() => void run(signOut())}>Sign out</Button>
        <Button variant="ghost" href={exportUrl()}>Download my data</Button>
        <Button variant="ghost" onClick={() => setDanger(!danger)}>Delete account…</Button>
      </Stack>
      {danger && <Stack direction="column" gap={2}>
        <Text size="sm" intent="danger">This deletes your account, wallet, looks and saved state for good. Your handle and email become free again.</Text>
        <FormGroup label={'Type your handle (' + (me.handle ?? '') + ') to confirm'}><Input value={confirm} onChange={(e) => setConfirm(e.target.value)} /></FormGroup>
        <FormGroup label="Password"><Input type="password" value={current} autoComplete="current-password" onChange={(e) => setCurrent(e.target.value)} /></FormGroup>
        <Button variant="danger" disabled={busy || confirm.toLowerCase() !== (me.handle ?? '') || !current} onClick={() => void run(deleteAccount(current, confirm))}>Delete my account</Button>
      </Stack>}
    </Stack>
  );
};

export const AccountDialog: React.FC<{ isOpen: boolean; onClose: () => void; link?: AccountLink | null }> = ({ isOpen, onClose, link }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Your Phiace account" size="sm"><AccountPanel onDone={onClose} link={link} /></Modal>
);

/** Mounted once per app (mountWith): finishes an emailed link, confirms the email, or opens "choose a new password". */
export const AccountLinks: React.FC = () => {
  const [link] = React.useState(() => (accountsEnabled ? readAccountLink() : null));
  const [state, setState] = React.useState<'idle' | 'verifying' | 'verified' | 'failed' | 'reset'>(link ? (link.kind === 'verify' ? 'verifying' : 'reset') : 'idle');
  const [msg, setMsg] = React.useState('');
  React.useEffect(() => {
    if (link?.kind !== 'verify') return;
    void verifyEmail(link.token).then((r) => { if (r.ok) { setState('verified'); setMsg((r.body as { email?: string } | undefined)?.email ?? ''); } else { setState('failed'); setMsg(r.message ?? ''); } });
  }, [link]);
  if (state === 'idle') return null;
  if (state === 'reset') return <AccountDialog isOpen onClose={() => setState('idle')} link={link} />;
  return (
    <Modal isOpen onClose={() => setState('idle')} title="Email confirmation" size="sm"
      footer={<Button variant="primary" onClick={() => setState('idle')}>Continue</Button>}>
      <Text>{state === 'verifying' ? 'Confirming your email…' : state === 'verified' ? `${msg || 'Your email'} is confirmed. You can now reset your password with it.` : msg || 'This link has expired or was already used.'}</Text>
    </Modal>
  );
};
