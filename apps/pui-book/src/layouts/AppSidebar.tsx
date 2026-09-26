'use client';

import React, { useMemo } from 'react';
import {
  Sidebar,
  SidebarBody,
  SidebarNav,
  MenuItem,
  Stack,
  Tag,
  Text,
  type SidebarNavGroup,
} from '@pui/components';
import { BookOpen, Boxes, Database, FlaskConical, Layers } from 'lucide-react';
import { DOCS_NAV_GROUPS, NavItem } from '../content/navigation';

interface AppSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

/** Group id -> the icon `SidebarNav` renders beside the group label. */
const GROUP_ICONS: Record<string, typeof BookOpen> = {
  'getting-started': BookOpen,
  architecture: Database,
  components: Boxes,
  patterns: Layers,
  playground: FlaskConical,
};

/**
 * The docs rail, composed from the library's own `Sidebar` + `SidebarNav`.
 *
 * Every entry is a real `MenuItem` button, so the rail is keyboard-reachable
 * and announces its active item — the previous hand-rolled version used
 * clickable `<div>`s with an inline style bag, which neither focus nor a
 * screen reader could reach. Badges keep their `Tag`, threaded through the
 * `renderLink` seam so `SidebarNav` stays generic.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({ currentPath, onNavigate }) => {
  const groups = useMemo<SidebarNavGroup[]>(
    () =>
      DOCS_NAV_GROUPS.map((group) => ({
        label: group.title,
        icon: GROUP_ICONS[group.id] ?? BookOpen,
        items: group.items.map((item: NavItem) => ({ label: item.label, path: item.path })),
      })),
    []
  );

  /** Badge lookup by path, so the renderer stays data-driven. */
  const badges = useMemo(() => {
    const map: Record<string, string> = {};
    DOCS_NAV_GROUPS.forEach((g) => g.items.forEach((i) => { if (i.badge) map[i.path] = i.badge; }));
    return map;
  }, []);

  return (
    <Sidebar aria-label="Documentation">
      <SidebarBody>
        <SidebarNav
          groups={groups}
          activePath={currentPath}
          defaultOpen="all"
          onItemClick={onNavigate}
          renderLink={(item, isActive) => (
            <MenuItem active={isActive} onClick={() => onNavigate(item.path)} aria-current={isActive ? 'page' : undefined}>
              <Stack direction="row" align="center" justify="between" gap={2}>
                <Text as="span" size="sm" weight={isActive ? 'semibold' : 'normal'}>
                  {item.label}
                </Text>
                {badges[item.path] && (
                  <Tag intent={isActive ? 'primary' : 'none'} minimal size="sm">
                    {badges[item.path]}
                  </Tag>
                )}
              </Stack>
            </MenuItem>
          )}
        />
      </SidebarBody>
    </Sidebar>
  );
};
