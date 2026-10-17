import React, { useState } from 'react';
import { Avatar, Box, Button, Divider, Popover, Pressable, Stack, Tag, Text, TabList } from '@pui/components';
import { usePuiTheme } from '@pui/providers';
import { useStore } from '@pui/store';
import { ChevronDown, ChevronUp, LogIn, LogOut, ShoppingBag, SlidersHorizontal, User, UserCog, Wallet as WalletIcon } from 'lucide-react';
import { appUrl } from '@phi-kit/data';
import { AccountDialog } from '@phi-kit/AccountDialog';
import { accountsEnabled, signOut, useMe } from '@phi-kit/auth';
import { LOOKS } from '@phi-kit/looks';
import { usePhieggLook } from './Appearance';
import { LABEL, USD, fmt, useWallet, type Coin } from '@phi-kit/wallet';
import { me, site, t, usd } from '../../lib/data';
import { useCart } from '../../lib/cart';
import { ONBOARDING, useOnboarding } from '../../lib/onboarding';
import { phieggStore } from '../../state/phieggStore';
import styles from './Header.module.scss';

const COINS: Coin[] = ['usd', 'egg', 'sum', 'eth'];
type IconT = React.ComponentProps<typeof Button>['iconLeft'];
/** A full-width row in the account menu; `end` sits on the right (a balance, a count). */
const Item: React.FC<{ icon: IconT; onClick?: () => void; href?: string; end?: React.ReactNode; children: React.ReactNode }> = ({ icon, onClick, href, end, children }) => {
  const body = <Stack direction="row" justify="between" align="center" width="100%"><Text as="span" size="sm" weight="medium" intent="inherit">{children}</Text>{end}</Stack>;
  return href
    ? <Button variant="ghost" size="sm" iconLeft={icon} href={href} className={styles.item}>{body}</Button>
    : <Button variant="ghost" size="sm" iconLeft={icon} onClick={onClick} className={styles.item}>{body}</Button>;
};
/** Small segmented control (theme, mode). */
const Seg: React.FC<{ opts: { id: string; label: string }[]; value: string; set: (v: string) => void; label: string }> = ({ opts, value, set, label }) => (
  <TabList size="sm" variant="pills" aria-label={label} activeId={value} onChange={set} items={opts.map((o) => ({ id: o.id, label: o.label }))} />
);

/** The one menu in the header: who you are, wallet, cart, theme + mode, appearance, profile, account, sign in / out. */
export const AccountMenu: React.FC = () => {
  const s = useStore(phieggStore); const my = me(); const server = useMe(); const ob = useOnboarding();
  const w = useWallet(); const cartN = useCart().cart.length; const [look, setLook] = usePhieggLook(); const { theme, setTheme } = usePuiTheme();
  const [open, setOpen] = useState(false); const [account, setAccount] = useState(false); const [coins, setCoins] = useState(false);
  const signedIn = accountsEnabled ? !!server && !server.guest : ob.done;
  const total = COINS.reduce((a, c) => a + w[c] * USD[c], 0);
  const go = (f: () => void) => () => { setOpen(false); f(); };
  const out = () => { if (accountsEnabled) void signOut(); ONBOARDING.set({ done: false, provider: '', role: '' }); s.flash(t('siSignedOut')); };
  return (
    <>
      <Popover isOpen={open} onOpenChange={setOpen} placement="bottom-end" contentClassName={styles.pop}
        trigger={<Pressable rounded="full" className={styles.avatar} aria-label={t('hdAccount') + ' · ' + my.name} aria-expanded={open}>
          <Avatar initials={my.initials} size="sm" />{cartN > 0 && <Text as="span" size="xs" weight="bold" color="text-inverse" className={styles.dot} aria-label={t('hdCartN', { n: cartN })}>{cartN}</Text>}
        </Pressable>}>
        <Stack direction="column" gap={2}>
          <Stack direction="row" gap={2} align="center">
            <Avatar initials={my.initials} size="md" />
            <Stack direction="column" gap={0}><Text weight="bold">{my.name}</Text><Text size="xs" intent="muted">@{my.handle}</Text></Stack>
          </Stack>
          {signedIn && ob.role && <Tag round minimal intent="primary">{t('siRole', { role: ob.role })}</Tag>}
          <Divider />
          <Item icon={WalletIcon} onClick={() => setCoins(!coins)} end={<Stack direction="row" gap={1} align="center"><Text size="sm" mono>{usd(w.usd)}</Text>{coins ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</Stack>}>{t('hdWallet')}</Item>
          {coins && <Stack direction="column" gap={1} className={styles.coins}>
            {COINS.map((c) => <Stack key={c} direction="row" justify="between"><Text size="xs" intent="muted">{LABEL[c]}</Text><Text size="xs" mono>{fmt(c, w[c])}{c !== 'usd' ? ' ≈ ' + usd(w[c] * USD[c]) : ''}</Text></Stack>)}
            <Stack direction="row" justify="between"><Text size="xs" weight="bold">{t('hdTotal', { usd: '' }).trim()}</Text><Text size="xs" weight="bold" mono>{usd(total)}</Text></Stack>
            <Box className={styles.coinLinks}>
              <Button size="sm" variant="ghost" onClick={go(() => s.go('coins'))}>{t('hdCoins')}</Button>
              <Button size="sm" variant="ghost" href={appUrl('phidao')}>{t('hdSwap')}</Button>
            </Box>
          </Stack>}
          <Item icon={ShoppingBag} onClick={go(s.openCart)} end={cartN ? <Tag round minimal size="sm" intent="primary">{cartN}</Tag> : undefined}>{t('hdCart')}</Item>
          <Divider />
          <Stack direction="column" gap={1}>
            <Text size="xs" intent="muted" weight="bold">{t('lookStyle')}</Text>
            <Seg label={t('lookStyle')} opts={LOOKS.map((l) => ({ id: l.id, label: l.label }))} value={look.id} set={setLook} />
            <Seg label={t('mode')} opts={site.appearance.themes} value={theme} set={(v) => setTheme(v as typeof theme)} />
          </Stack>
          <Item icon={SlidersHorizontal} onClick={go(() => s.setRail('user'))}>{t('hdAppearance')}</Item>
          <Divider />
          <Item icon={User} onClick={go(() => s.go('profile', { profileId: my.id }))}>{t('hdProfile')}</Item>
          {accountsEnabled && <Item icon={UserCog} onClick={go(() => setAccount(true))}>{t('hdAccount')}</Item>}
          {signedIn ? <Item icon={LogOut} onClick={go(out)}>{t('hdSignOut')}</Item>
            : <Item icon={LogIn} onClick={go(s.openSignIn)}>{t('hdSignIn')}</Item>}
        </Stack>
      </Popover>
      {accountsEnabled && <AccountDialog isOpen={account} onClose={() => setAccount(false)} />}
    </>
  );
};

