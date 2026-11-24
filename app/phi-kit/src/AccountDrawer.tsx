import React, { useState } from 'react';
import { Accordion, AccordionItem, Avatar, Button, Drawer, PalettePicker, Pressable, Stack, TabList, Text } from '@pui/components';
import { usePuiTheme } from '@pui/providers';
import { LogIn, LogOut, User, UserCog } from 'lucide-react';
import { AccountDialog } from './AccountDialog';
import { accountsEnabled, signOut, useMe } from './auth';
import { appUrl } from './data';
import { FONTS, useFont } from './fonts';
import { LOOKS, useLook } from './looks';
import { SettingsView } from './settings';
import { LABEL, USD, useWallet, type Coin } from './wallet';
import { ProfileView } from './ProfileView';
import words from './words.json';
import kit from './kit.module.scss';

const W = words.account;
const COINS: Coin[] = ['usd', 'egg', 'sum', 'eth'];
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * The account drawer: the one thing the header's right-hand button opens, the same in every app, because the account
 * belongs to Phione, not to the app. Its parts — wallet, look, mode, font, account — are glass accordions, the same
 * expandable pane as the sidebar's groups, so one fold pattern runs through the whole app. An app may say where its
 * own profile page is (`onProfile`) and pick a look its own way (`onLook`); everything else is shared.
 */
export const AccountDrawer: React.FC<{ onProfile?: () => void; onLook?: (id: string) => void }> = ({ onProfile, onLook }) => {
  const me = useMe(); const w = useWallet(); const [look, setLook] = useLook(); const [font, setFont] = useFont();
  const { theme, setTheme } = usePuiTheme();
  const [open, setOpen] = useState(false); const [account, setAccount] = useState(false);
  // Which sections are folded open; the look is open first, the rest a tap away. Several may be open at once.
  const [shown, setShown] = useState<Record<string, boolean>>({ look: true, colour: true });
  const fold = (k: string) => setShown((s) => ({ ...s, [k]: !s[k] }));
  const name = me && !me.guest ? me.name : W.guest;
  const initials = name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  const total = COINS.reduce((a, c) => a + (w[c] ?? 0) * USD[c], 0);
  const go = (f: () => void) => () => { setOpen(false); f(); };
  const canSignOut = accountsEnabled && me && !me.guest;
  return (
    <>
      <Pressable rounded="full" aria-label={W.open} aria-expanded={open} onClick={() => setOpen(true)}
        style={{ width: 'var(--pui-shell-control, 2.25rem)', height: 'var(--pui-shell-control, 2.25rem)', padding: 0, display: 'grid', placeItems: 'center', flex: 'none', minWidth: 'var(--pui-shell-control, 2.25rem)' }}>
        <Avatar initials={initials} size="md" className={kit.fill} /></Pressable>
      <Drawer isOpen={open} onClose={() => setOpen(false)} position="right" size="md" title={W.title}>
        <Stack direction="column" gap={3}>
          <ProfileView variant="line" record={{ id: me?.id ?? 'guest', name, handle: me?.handle ?? undefined, avatar: <Avatar initials={initials} seed={me?.id} size="md" />,
            actions: onProfile ? [{ id: 'profile', label: W.profile, icon: User, onClick: go(onProfile) }] : [] }} />

          <Accordion>
            <AccordionItem open={!!shown.wallet} onToggle={() => fold('wallet')}
              title={<><Text as="span" size="sm" weight="medium">{W.wallet}</Text> <Text as="span" size="xs" mono intent="muted">{usd(total)}</Text></>}>
              <Stack direction="column" gap={1}>
                {COINS.map((c) => <Stack key={c} direction="row" justify="between"><Text size="xs" intent="muted">{LABEL[c]}</Text><Text size="xs" mono>{(w[c] ?? 0).toLocaleString('en-US')}</Text></Stack>)}
              </Stack>
            </AccordionItem>

            <AccordionItem title={W.look} open={!!shown.look} onToggle={() => fold('look')}>
              <TabList size="sm" variant="pills" aria-label={W.look} activeId={look.id} onChange={(id) => (onLook ?? setLook)(id)} items={LOOKS.map((l) => ({ id: l.id, label: l.label }))} />
            </AccordionItem>

            <AccordionItem title={W.colour} open={!!shown.colour} onToggle={() => fold('colour')}>
              <PalettePicker noneLabel={W.own} />
            </AccordionItem>

            <AccordionItem title={W.mode} open={!!shown.mode} onToggle={() => fold('mode')}>
              <TabList size="sm" variant="pills" aria-label={W.mode} activeId={theme} onChange={(v) => setTheme(v as typeof theme)} items={[{ id: 'light', label: W.light }, { id: 'dark', label: W.dark }, { id: 'system', label: W.system }]} />
            </AccordionItem>

            {/* The layout every app follows (prefs.json `shared`): the feed and the tabs, chosen by their pictures. */}
            <AccordionItem title={W.layout} open={!!shown.layout} onToggle={() => fold('layout')}>
              <SettingsView shared />
            </AccordionItem>

            <AccordionItem title={W.font} open={!!shown.font} onToggle={() => fold('font')}>
              <Stack direction="column" gap={0}>{FONTS.map((f) => <Pressable key={f.id} fill hover selected={f.id === font.id} pad="sm" onClick={() => setFont(f.id)}>{f.label}</Pressable>)}</Stack>
            </AccordionItem>

            <AccordionItem title={W.account} open={!!shown.account} onToggle={() => fold('account')}>
              <Stack direction="column" gap={0}>
                {onProfile ? <Button variant="glass" iconLeft={User} onClick={go(onProfile)}>{W.profile}</Button> : null}
                {accountsEnabled ? <Button variant="glass" iconLeft={UserCog} onClick={go(() => setAccount(true))}>{W.account}</Button> : null}
                {canSignOut
                  ? <Button variant="glass" iconLeft={LogOut} onClick={go(() => { void signOut(); })}>{W.signOut}</Button>
                  : accountsEnabled ? <Button variant="glass" iconLeft={LogIn} onClick={go(() => setAccount(true))}>{W.signIn}</Button> : null}
              </Stack>
            </AccordionItem>
          </Accordion>

          <Stack direction="row" justify="between" align="center"><Text size="xs" intent="muted">{W.phione}</Text><Button variant="glass" href={appUrl('phione')}>{W.manage}</Button></Stack>
        </Stack>
      </Drawer>
      {accountsEnabled ? <AccountDialog isOpen={account} onClose={() => setAccount(false)} /> : null}
    </>
  );
};
