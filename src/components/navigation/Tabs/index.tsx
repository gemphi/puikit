'use client';

import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import { Stack } from '../../layout/Stack';
import { TabList } from '../TabList';
import styles from './styles.module.scss';

export type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
  /** Count shown after the label. */
  count?: number | string;
};

type TabsProps = {
  items: TabItem[];
  defaultActiveId?: string;
  className?: string;
};

/** A row of tabs with the panel of the one that is on. The row is the kit's one TabList, so it is marked, focused
 *  and counted the same everywhere. */
export const Tabs = ({ items, defaultActiveId, className = '' }: TabsProps) => {
  const [active, setActive] = useState(defaultActiveId ?? items[0]?.id);
  const activeItem = items.find((item) => item.id === active) ?? items[0];

  return (
    <Stack direction="column" className={cn(styles.tabs, className)}>
      <TabList className={styles.list} place="start" activeId={activeItem?.id} onChange={setActive}
        items={items.map(({ id, label, count }) => ({ id, label, count }))} />
      <Stack direction="column" className={styles.panel} role="tabpanel">
        {activeItem?.content}
      </Stack>
    </Stack>
  );
};
