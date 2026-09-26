'use client';

import React, { useState, useEffect } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Accordion, AccordionItem } from '../../display/Accordion';
import { MenuItem } from '../Menu';
import { Stack } from '../../layout/Stack';
import { Button } from '../../primitives/Button';
import { Icon } from '../../primitives/Icon';
import styles from './nav.module.scss';

export type SidebarNavItem = { label: string; path: string; };
export type SidebarNavGroup = { label: string; icon: LucideIcon; items: SidebarNavItem[]; };

export type SidebarNavProps = {
  groups: SidebarNavGroup[];
  collapsed?: boolean;
  activePath?: string;
  onItemClick?: (path: string) => void;
  renderLink?: (item: SidebarNavItem, isActive: boolean) => React.ReactNode;
  /**
   * Which groups start expanded. `active` (the default) opens only the group
   * holding the active path — right for a deep product nav. `all` opens every
   * group, which is what a documentation rail wants: nothing is hidden behind
   * a closed accordion the reader has to guess at.
   */
  defaultOpen?: 'active' | 'all';
  className?: string;
};

const isPathActive = (active: string, item: string) => active === item || (item !== '/' && active.startsWith(`${item}/`));

/**
 * The sidebar navigation composition. Layout is delegated to the {@link Stack}
 * primitive and the {@link Accordion} surface; collapsed/expanded appearance is
 * driven by tokens + the `data-collapsed` attribute + class hooks (no inline
 * style, no hardcoded colors).
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  groups,
  collapsed = false,
  activePath = '',
  onItemClick,
  renderLink,
  defaultOpen = 'active',
  className = '',
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach((g) => {
      init[g.label] = defaultOpen === 'all' || g.items.some((i) => isPathActive(activePath, i.path));
    });
    return init;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      groups.forEach((g) => {
        if (g.items.some((i) => isPathActive(activePath, i.path))) next[g.label] = true;
      });
      return next;
    });
  }, [activePath, groups]);

  if (collapsed) {
    return (
      <nav className={cn(styles.sidebarNav, styles.collapsed, className)} data-collapsed="true">
        {groups.map((group) => {
          const isGroupActive = group.items.some((item) => isPathActive(activePath, item.path));
          return (
            <Stack key={group.label} align="center" justify="center" className={styles.collapsedItem}>
              <Button variant={isGroupActive ? 'primary' : 'ghost'} size="sm" className={styles.collapsedBtn} title={group.label}>
                <Icon icon={group.icon} size="sm" />
              </Button>
            </Stack>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn(styles.sidebarNav, className)} data-collapsed="false">
      <Accordion>
        {groups.map((group) => (
          <AccordionItem
            key={group.label}
            title={<span className={styles.groupHeader}><Icon icon={group.icon} size="sm" />{group.label}</span>}
            open={openGroups[group.label]}
            onToggle={() => setOpenGroups((p) => ({ ...p, [group.label]: !p[group.label] }))}
          >
            <Stack direction="column" gap={1} className={styles.groupMenu}>
              {group.items.map((item) => {
                const active = isPathActive(activePath, item.path);
                return renderLink ? (
                  <React.Fragment key={item.path}>{renderLink(item, active)}</React.Fragment>
                ) : (
                  <MenuItem key={item.path} onClick={() => onItemClick?.(item.path)} className={cn(active && styles.activeItem)}>
                    {item.label}
                  </MenuItem>
                );
              })}
            </Stack>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
};
