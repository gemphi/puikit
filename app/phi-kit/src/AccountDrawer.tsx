import React, { useState } from 'react';
import { Avatar, Button, Divider, Drawer, Pressable, Stack, TabList, Text } from '@pui/components';
import { usePuiTheme } from '@pui/providers';
import { LogIn, LogOut, User, UserCog } from 'lucide-react';
import { AccountDialog } from './AccountDialog';
import { accountsEnabled, signOut, useMe } from './auth';
import { appUrl } from './data';
import { FONTS, useFont } from './fonts';
import { LOOKS, useLook } from './looks';
import { LABEL, USD, useWallet, type Coin } from './wallet';
import words from './words.json';

const W = words.account;
const COINS: Coin[] = ['usd', 'egg', 'sum', 'eth'];
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * The account drawer: the one thing the header's right-hand button opens, the same in every app, because the account
 * belongs to Phione, not to the app. Who you are, your wallet, the look, mode and font, your account, sign in or out,
 * and a way to Phione. An app may say where its own profile page is (`onProfile`) and pick a look its own way
 * (`onLook`); everything else is shared. Words come from words.json.
 */
export const AccountDrawer: React.FC<{ onProfile?: () => void; onLook?: (id: string) => void }> = ({ onProfile, onLook }) => {
  const me = useMe(); const w = useWallet(); const [look, setLook] = useLook(); const [font, setFont] = useFont();
  const { theme, setTheme } = usePuiTheme();
  const [open, setOpen] = useState(false); const [account, setAccount] = useState(false);
  const name = me && !me.guest ? me.name : W.guest;
  const initials = name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  const total = COINS.reduce((a, c) => a + (w[c] ?? 0) * USD[c], 0);
  const go = (f: () => void) => () => { setOpen(false); f(); };
  return (
    <>
      <Pressable rounded="full" aria-label={W.open} aria-expanded={open} onClick={() => setOpen(true)}><Avatar initials={initials} size="sm" /></Pressable>
      <Drawer isOpen={open} onClose={() => setOpen(false)} position="right" size="md" title={W.title}>
        <Stack direction="column" gap={3}>
          <Stack direction="row" gap={2} align="center"><Avatar initials={initials} size="md" />
            <Stack direction="column" gap={0}><Text weight="medium">{name}</Text>{me?.handle ? <Text size="xs" intent="muted">@{me.handle}</Text> : null}</Stack></Stack>
          <Divider />
          <Stack direction="column" gap={1}>
            <Stack direction="row" justify="between"><Text size="sm" weight="medium">{W.wallet}</Text><Text size="sm" mono>{usd(total)}</Text></Stack>
            {COINS.map((c) => <Stack key={c} direction="row" justify="between"><Text size="xs" intent="muted">{LABEL[c]}</Text><Text size="xs" mono>{(w[c] ?? 0).toLocaleString('en-US')}</Text></Stack>)}
          </Stack>
          <Divider />
          <Text size="xs" intent="muted">{W.look}</Text>
          <TabList size="sm" variant="pills" aria-label={W.look} activeId={look.id} onChange={(id) => (onLook ?? setLook)(id)} items={LOOKS.map((l) => ({ id: l.id, label: l.label }))} />
          <Text size="xs" intent="muted">{W.mode}</Text>
          <TabList size="sm" variant="pills" aria-label={W.mode} activeId={theme} onChange={(v) => setTheme(v as typeof theme)} items={[{ id: 'light', label: W.light }, { id: 'dark', label: W.dark }, { id: 'system', label: W.system }]} />
          <Text size="xs" intent="muted">{W.font}</Text>
          <Stack direction="column" gap={0}>{FONTS.map((f) => <Pressable key={f.id} fill hover selected={f.id === font.id} pad="sm" onClick={() => setFont(f.id)}>{f.label}</Pressable>)}</Stack>
          <Divider />
          {onProfile ? <Button variant="ghost" iconLeft={User} onClick={go(onProfile)}>{W.profile}</Button> : null}
          {accountsEnabled ? <Button variant="ghost" iconLeft={UserCog} onClick={go(() => setAccount(true))}>{W.account}</Button> : null}
          {accountsEnabled && me && !me.guest
            ? <Button variant="ghost" iconLeft={LogOut} onClick={go(() => { void signOut(); })}>{W.signOut}</Button>
            : accountsEnabled ? <Button variant="ghost" iconLeft={LogIn} onClick={go(() => setAccount(true))}>{W.signIn}</Button> : null}
          <Divider />
          <Stack direction="row" justify="between" align="center"><Text size="xs" intent="muted">{W.phione}</Text><Button variant="outline" size="sm" href={appUrl('phione')}>{W.manage}</Button></Stack>
        </Stack>
      </Drawer>
      {accountsEnabled ? <AccountDialog isOpen={account} onClose={() => setAccount(false)} /> : null}
    </>
  );
};
