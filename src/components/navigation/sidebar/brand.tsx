'use client';

import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Plus,
  MessageSquare,
  History,
} from 'lucide-react';
import { Sidebar, SidebarHeader, SidebarBody, SidebarFooter } from './sidebar';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Icon } from '../../primitives/Icon';
import { Stack } from '../../layout/Stack';
import { MenuItem } from '../Menu';
import { Avatar } from '../../media/Avatar';
import { usePuiTheme } from '../../../providers';

/**
 * A single addressable entry rendered by the {@link SidebarBrand} sections
 * (Automations and recent sessions). Kept intentionally minimal so the
 * composition drives appearance from tokens/variants rather than per-item
 * styling.
 */
export type SidebarSession = {
  id: string;
  label: string;
};

export type SidebarBrandAccount = {
  name: string;
  avatarUrl?: string;
};

export interface SidebarBrandProps {
  /** Brand/logo label shown in the header row (hidden when collapsed). */
  logoLabel: string;
  /** Entries rendered in the "Automations" section. */
  automations: SidebarSession[];
  /** Entries rendered in the recent-sessions panel. */
  recentSessions: SidebarSession[];
  /** Footer account descriptor; avatar is used when available, else initial. */
  account: SidebarBrandAccount;
  /** Initial collapsed state; mirrored as `data-collapsed` on the sidebar root. */
  defaultCollapsed?: boolean;
  /** Invoked when the "New session" control is activated. */
  onNewSession?: () => void;
  /** Invoked with the session id when a session/automation entry is selected. */
  onSelectSession?: (id: string) => void;
  /**
   * Archetype-driven appearance variant. Emitted as `data-variant` on the
   * sidebar root; per-archetype appearance is token- and data-attribute-driven.
   * Defaults to the active `archetypeId` (from {@link usePuiTheme}) when
   * omitted, so the sidebar structurally matches the active Site_Archetype.
   */
  variant?: string;
  className?: string;
}

/** First letter of the account name, upper-cased, used when no avatar is set. */
const accountInitial = (name: string): string =>
  name.trim().charAt(0).toUpperCase() || '?';

/**
 * `SidebarBrand` — a puijs-native, Kiro-style collapsible AppShell sidebar
 * composed **exclusively** from existing puijs (puikit family) components
 * ({@link Sidebar}, {@link SidebarHeader}, {@link SidebarBody},
 * {@link SidebarFooter}, {@link Button}, {@link Text}, {@link MenuItem},
 * {@link Avatar}, plus the {@link Stack} layout primitive and {@link Icon}) and
 * `lucide-react` icons.
 *
 * Structure: a logo row + collapse control, an Automations section, a New
 * Session action, a recent-sessions panel, and a footer account menu. Open
 * state renders labels; collapsed state renders icon-only controls.
 *
 * Appearance is driven by tokens + variants + data attributes only — there are
 * no raw layout `<div>`s, no per-component `.module.scss`, no inline `style`,
 * and no hardcoded colors here. The collapse control toggles internal state and
 * mirrors it as `data-collapsed="true"|"false"` on the sidebar root (via the
 * {@link Sidebar} rest-prop forwarding); open state renders labels while
 * collapsed state renders icon-only controls.
 *
 * Theming is automatic: the component consumes {@link usePuiTheme}, so the
 * active theme mode/style/brand and gradient-by-default (applied by
 * `PuiProvider` on the document root) flow through the shared `--phi-*` tokens
 * and data attributes. The archetype `variant` is emitted as
 * `data-variant="<archetypeId>"`, defaulting to the active `archetypeId` when
 * omitted; all per-archetype appearance is token- and data-attribute-driven.
 */
export const SidebarBrand: React.FC<SidebarBrandProps> = ({
  logoLabel,
  automations,
  recentSessions,
  account,
  defaultCollapsed = false,
  onNewSession,
  onSelectSession,
  variant,
  className,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const toggle = () => setCollapsed((c) => !c);

  // Theme mode/style/brand and gradient-by-default apply automatically because
  // this composition consumes `usePuiTheme`; `PuiProvider` applies those to the
  // document root as data attributes + `--phi-*` tokens (Requirement 12.6).
  // `usePuiTheme` returns safe context defaults (including the default
  // `archetypeId`) when rendered outside a `PuiProvider`, so this is safe in
  // isolated tests. When the `variant` prop is omitted, appearance follows the
  // ACTIVE Site_Archetype by defaulting `data-variant` to `archetypeId`.
  const { archetypeId } = usePuiTheme();
  const resolvedVariant = variant ?? archetypeId;

  return (
    <Sidebar
      defaultCollapsed={defaultCollapsed}
      className={className}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-variant={resolvedVariant}
    >
      <SidebarHeader>
        <Stack direction="row" align="center" justify="between" gap={2}>
          {!collapsed && (
            <Stack direction="row" align="center" gap={2}>
              <Icon icon={Sparkles} size="md" />
              <Text as="span" weight="semibold" size="md">
                {logoLabel}
              </Text>
            </Stack>
          )}
          <Button
            variant="icon"
            size="sm"
            iconLeft={collapsed ? PanelLeftOpen : PanelLeftClose}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={toggle}
          />
        </Stack>
      </SidebarHeader>

      <SidebarBody>
        <Stack direction="column" gap={4}>
          {/* Automations section */}
          <Stack direction="column" gap={1}>
            {!collapsed && (
              <Text as="span" intent="muted" size="xs" weight="medium">
                Automations
              </Text>
            )}
            {automations.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => onSelectSession?.(item.id)}
                title={item.label}
                aria-label={item.label}
              >
                <Stack direction="row" align="center" gap={2}>
                  <Icon icon={Sparkles} size="sm" />
                  {!collapsed && <Text as="span" size="sm">{item.label}</Text>}
                </Stack>
              </MenuItem>
            ))}
          </Stack>

          {/* New session action */}
          <Button
            variant="secondary"
            size="sm"
            fullWidth={!collapsed}
            iconLeft={Plus}
            aria-label="New session"
            title="New session"
            onClick={() => onNewSession?.()}
          >
            {!collapsed && 'New session'}
          </Button>

          {/* Recent sessions panel */}
          <Stack direction="column" gap={1}>
            {!collapsed && (
              <Stack direction="row" align="center" gap={2}>
                <Icon icon={History} size="sm" />
                <Text as="span" intent="muted" size="xs" weight="medium">
                  Recent sessions
                </Text>
              </Stack>
            )}
            {recentSessions.map((session) => (
              <MenuItem
                key={session.id}
                onClick={() => onSelectSession?.(session.id)}
                title={session.label}
                aria-label={session.label}
              >
                <Stack direction="row" align="center" gap={2}>
                  <Icon icon={MessageSquare} size="sm" />
                  {!collapsed && <Text as="span" size="sm">{session.label}</Text>}
                </Stack>
              </MenuItem>
            ))}
          </Stack>
        </Stack>
      </SidebarBody>

      <SidebarFooter>
        <MenuItem title={account.name} aria-label={account.name}>
          <Stack direction="row" align="center" gap={2}>
            <Avatar
              size="sm"
              src={account.avatarUrl}
              alt={account.name}
              initials={accountInitial(account.name)}
            />
            {!collapsed && <Text as="span" size="sm">{account.name}</Text>}
          </Stack>
        </MenuItem>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarBrand;
