import React, { useEffect } from 'react';
import { Tag, Text } from '@pui/components';
import type { Block } from '@phi-kit/data';
import type { GridItem } from '@phi-kit/blocks';
import { hasPhiadk } from '../state/phiadkClient';

/** A line under the head: an error, or what the last action did. */
export type Note = { text: string; intent?: 'warning' | 'danger' | 'secondary' };

/**
 * One console page, as data: the head (title, one line, its controls), the lines under it and the blocks the shared
 * `Block` draws. `onOpen` is what picking a card does; `overlay` is a kit dialog or drawer the page opens.
 */
export type ConsoleView = { title: string; sub?: string; action?: React.ReactNode; noteList?: Note[]; blocks: Block[]; onOpen?: (it: GridItem) => void; overlay?: React.ReactNode };

/** Read again every `ms` while `on`. */
export const usePoll = (on: boolean, run: () => unknown, ms: number) => {
  useEffect(() => {
    if (!on) return undefined;
    void run();
    const id = setInterval(() => void run(), ms);
    return () => clearInterval(id);
  }, [on, run, ms]);
};

/** Where the rows come from: the platform (live or still connecting) or the samples. */
export const sourceTag = (live: boolean) => (
  <Tag key="source" intent={live ? 'success' : hasPhiadk ? 'warning' : undefined} minimal round>{live ? 'Live' : hasPhiadk ? 'Connecting' : 'Sample data'}</Tag>
);

/** A record's data in one mono line. */
export const dataCell = (data: unknown, maxWidth = '18rem') => <Text as="span" size="xs" intent="secondary" mono truncate maxWidth={maxWidth}>{JSON.stringify(data)}</Text>;
export const timeCell = (time: string) => <Text as="span" size="sm" numeric>{time}</Text>;
export const textCell = (text: React.ReactNode) => <Text as="span" size="sm">{text}</Text>;
export const monoCell = (text: React.ReactNode) => <Text as="span" size="sm" mono>{text}</Text>;
