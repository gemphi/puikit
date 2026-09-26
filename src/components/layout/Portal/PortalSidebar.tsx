import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeftClose } from 'lucide-react';
import { MenuItem } from '../../navigation/Menu';
import { Sidebar, SidebarBody, SidebarHeader } from '../../navigation/sidebar';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Box } from '../Box';
import type { PortalSection } from './types';
import styles from './PortalSidebar.module.scss';

export interface PortalSidebarProps {
  title: string;
  sections: PortalSection[];
  activeItemId?: string;
  onSelectItem: (id: string) => void;
  onToggleSidebar?: () => void;
  className?: string;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  title,
  sections,
  activeItemId,
  onSelectItem,
  onToggleSidebar,
  className = '',
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  };

  return (
    <Sidebar defaultCollapsed={false} disableSpacer={true} className={className}>
      <SidebarHeader>
        <Box className={styles.header}>
          <Text size="sm" weight="semibold">{title}</Text>
          {onToggleSidebar && (
            <Button
              variant="icon"
              size="sm"
              onClick={onToggleSidebar}
              aria-label="Collapse sidebar"
              iconLeft={PanelLeftClose}
            />
          )}
        </Box>
      </SidebarHeader>
      <SidebarBody>
        <Box className={styles.body}>
          {sections.map((section) => {
            const collapsed = Boolean(collapsedSections[section.title]);
            return (
              <nav key={section.title} className={styles.group}>
                <button
                  type="button"
                  className={styles.groupHeader}
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={!collapsed}
                >
                  <span className={styles.groupTitle}>{section.title}</span>
                  {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsed && (
                  <Box className={styles.groupItems}>
                    {section.items.map((item) => (
                      <MenuItem key={item.id} active={item.id === activeItemId} onClick={() => onSelectItem(item.id)}>
                        <Text as="span" size="sm">{item.title}</Text>
                      </MenuItem>
                    ))}
                  </Box>
                )}
              </nav>
            );
          })}
        </Box>
      </SidebarBody>
    </Sidebar>
  );
};
