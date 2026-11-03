import React, { useState } from 'react';
import {
  Sidebar, SidebarHeader, SidebarProvider, Avatar, Input, Button,
  Stack, Text, Span, useSidebarContext, PreferencesModal, Box,
} from '@pui/components';
import {
  Compass, Home, MessageCircle, Menu, MoreHorizontal, PanelLeft, PanelRight,
  Plus, Search, Settings, UserCheck, Clock,
} from 'lucide-react';
import { Logo } from '../brand/logo';
import { useRouter } from '../../router';
import { routes } from '../../lib/routes';
import { getNotifications, type Notification } from '../../lib/services';
import { useAsync } from '@pui/shop';
import { t } from '../../locales/t';
import s from '../../styles/phlick.module.scss';

type RailTab = 'home' | 'chat' | 'menu' | 'more';

/** The strip's tabs, as data: header three, then More on its own. */
const TABS: Array<{ id: RailTab; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'home', label: t.nav.home, icon: Home },
  { id: 'chat', label: t.nav.chat, icon: MessageCircle },
  { id: 'menu', label: t.nav.menu, icon: Menu },
];

/** Each tab's entries — routes only, no logic. */
const PANEL: Record<Exclude<RailTab, 'chat'>, Array<{ label: string; to: string; icon?: React.ComponentType<{ size?: number }> }>> = {
  home: [
    { label: t.nav.explore, to: routes.explore(), icon: Compass },
    { label: t.nav.following, to: routes.following(), icon: UserCheck },
    { label: t.nav.recent, to: routes.forYou(), icon: Clock },
  ],
  menu: (['snaps', 'reels', 'shows', 'looks', 'zones', 'shops'] as const).map((n) => ({
    label: t.sections[n], to: routes.section(n),
  })),
  more: [
    ...(['snips', 'zones', 'hosts', 'rides', 'lands'] as const).map((n) => ({
      label: t.sections[n], to: routes.section(n),
    })),
    { label: t.sections.brands, to: routes.brands() },
  ],
};

/**
 * The rail, in two parts like the reference mail client: a narrow icon strip
 * — Home, Chat and Menu at the head, More at the middle, the viewer and
 * Settings at the foot — and beside it the active tab's own panel. Collapsed,
 * only the strip remains, the selected tab still lit. Panel entries are bare
 * text — color is the only state — except the one Sign up call.
 */
const RailContent: React.FC = () => {
  const { path, navigate } = useRouter();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebarContext();
  const [tab, setTab] = useState<RailTab>('home');
  const [q, setQ] = useState('');
  const [prefsOpen, setPrefsOpen] = useState(false);
  const chats = useAsync<Notification[]>(() => getNotifications(), []);

  const openTab = (next: RailTab) => {
    setTab(next);
    if (sidebarCollapsed) setSidebarCollapsed(false);
  };

  const stripTab = ({ id, label, icon: Icon }: (typeof TABS)[number]) => (
    <Stack key={id} direction="column" align="center" gap={0} className={s.stripTab}>
      <Button
        variant={tab === id ? 'primary' : 'ghost'}
        size="sm"
        aria-label={label}
        aria-pressed={tab === id}
        onClick={() => openTab(id)}
        icon={<Icon size={17} />}
      />
      {!sidebarCollapsed && <Span variant="muted" className={s.stripLabel}>{label}</Span>}
    </Stack>
  );

  const textItem = ({ label, to, icon: Icon }: { label: string; to: string; icon?: React.ComponentType<{ size?: number }> }) => (
    <Button
      key={label}
      variant="ghost"
      size="sm"
      className={s.navText}
      aria-current={path === to || undefined}
      onClick={() => navigate(to)}
    >
      <Stack direction="row" align="center" gap={2}>
        {Icon && <Icon size={15} />}
        <Text as="span" className={s.navTextLabel}>{label}</Text>
      </Stack>
    </Button>
  );

  const toggle = (
    <Button
      variant="ghost"
      size="sm"
      className={sidebarCollapsed ? s.logoToggle : undefined}
      aria-label={sidebarCollapsed ? t.nav.expand : t.nav.collapse}
      aria-expanded={!sidebarCollapsed}
      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      icon={
        sidebarCollapsed ? (
          <>
            <Span className={s.logoFace}><Logo size={24} /></Span>
            <Span className={s.togglerFace}><PanelLeft size={16} /></Span>
          </>
        ) : (
          <PanelRight size={16} />
        )
      }
    />
  );

  return (
    <>
      <SidebarHeader>
        <Stack direction="row" align="center" justify={sidebarCollapsed ? 'center' : 'between'} gap={2}>
          {!sidebarCollapsed && (
            <Stack direction="row" align="center" gap={2}>
              <Logo size={26} />
              <Text as="span" className={s.wordmark}>
                phlick<Span className={s.wordmarkAccent}>.</Span>
              </Text>
            </Stack>
          )}
          {toggle}
        </Stack>
      </SidebarHeader>

      <Box className={s.railSplit}>
        {/* The strip: header tabs, More at the middle, viewer at the foot. */}
        <Stack direction="column" align="center" gap={2} className={s.railStrip}>
          {TABS.map(stripTab)}

          <Box className={s.stripSpacer} />

          {stripTab({ id: 'more', label: t.nav.more, icon: MoreHorizontal })}

          <Box className={s.stripSpacer} />

          <Button
            variant="ghost"
            size="sm"
            className={path === routes.creator('aria.moves') ? s.stripOn : undefined}
            aria-label={t.nav.yourProfile}
            aria-pressed={path === routes.creator('aria.moves')}
            onClick={() => navigate(routes.creator('aria.moves'))}
            icon={<Avatar alt={t.nav.yourProfile} initials="AO" size="sm" />}
          />
          <Button
            variant="ghost"
            size="sm"
            className={prefsOpen ? s.stripOn : undefined}
            aria-label={t.nav.settings}
            aria-pressed={prefsOpen}
            onClick={() => setPrefsOpen(true)}
            icon={<Settings size={17} />}
          />
        </Stack>

        {!sidebarCollapsed && (
          <Stack direction="column" gap={3} className={s.railPanel}>
            <Input
              placeholder={t.nav.search}
              aria-label={t.nav.searchLabel}
              icon={<Search size={14} />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q.trim()) navigate(routes.search(q.trim()));
              }}
            />

            {tab === 'chat' ? (
              <Stack direction="column" gap={2} data-chat-panel="true">
                {(chats.data ?? []).map((c) => (
                  <Stack
                    key={c.id}
                    direction="row"
                    align="center"
                    gap={2}
                    data-clickable="true"
                    onClick={() => navigate(routes.creator(c.author.handle))}
                  >
                    <Avatar src={c.author.avatar} alt={c.author.name} initials={c.author.name.slice(0, 2)} size="sm" />
                    <Stack direction="column" gap={0}>
                      <Text as="span" size="sm" weight="semibold">@{c.author.handle}</Text>
                      <Span variant="muted">{c.when}</Span>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Stack direction="column" gap={1} data-rail-panel={tab}>
                {PANEL[tab].map(textItem)}
                {tab === 'home' && (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate(routes.upload())}>
                    {t.nav.create}
                  </Button>
                )}
              </Stack>
            )}

            <Box className={s.stripSpacer} />

            <Button variant="primary">{t.nav.signUp}</Button>
            <Stack direction="column" gap={1}>
              <Span variant="muted">{t.nav.company}</Span>
              <Span variant="muted">{t.nav.terms}</Span>
              <Span variant="muted">{t.brand.disclaimer}</Span>
            </Stack>
          </Stack>
        )}
      </Box>

      <PreferencesModal isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} showArchetype={false} showBrand={false} />
    </>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SidebarProvider collapseBelow={1024}>
    <Box className={s.shell}>
      <Sidebar aria-label={t.brand.name}>
        <RailContent />
      </Sidebar>
      <Box as="main" className={s.stage} data-stage="true">{children}</Box>
    </Box>
  </SidebarProvider>
);
