import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { Box } from './Box';
import styles from './HeadTools.module.scss';

/** Where a tool stands in a header: `start` right after its title, `center` in the room between, `end` at its far end. */
export type HeadPlace = 'start' | 'center' | 'end';
type Place<T> = Record<HeadPlace, T>;

/**
 * A header's room, kept for the tools of what it heads. A header that takes tools wraps itself and its content in
 * `WithHeadTools` and lays the three slots it is handed after its title: `start`, `center` (which takes the room that
 * is left), `end`. A list below then puts its total and layout, its search and tabs, its filter and sort there with
 * `HeadTools`, so every header carries the same controls in the same places and no page wires them.
 * `undefined` is "no such header above" (the tools stay where they are written); a `null` slot is not on the page yet.
 */
const Slot = createContext<Place<HTMLElement | null> | undefined>(undefined);

export const WithHeadTools = ({ children }: { children: (slot: Place<React.ReactNode>) => React.ReactNode }) => {
  const [start, setStart] = useState<HTMLElement | null>(null);
  const [center, setCenter] = useState<HTMLElement | null>(null);
  const [end, setEnd] = useState<HTMLElement | null>(null);
  const node = useMemo(() => ({ start, center, end }), [start, center, end]);
  return <Slot.Provider value={node}>{children({ start: <HeadPart place="start" ref={setStart} />, center: <HeadPart place="center" ref={setCenter} />, end: <HeadPart place="end" ref={setEnd} /> })}</Slot.Provider>;
};

/** One of a header's three parts, laid the one way everywhere (a slot of `WithHeadTools`, or a bar that is its own header). */
export const HeadPart = React.forwardRef<HTMLElement, { place: HeadPlace; children?: React.ReactNode }>(({ place, children }, ref) => (
  <Box as="span" ref={ref} className={cn(styles.slot, styles[place])} data-head-tools={place}>{children}</Box>
));
HeadPart.displayName = 'HeadPart';

/** True under a header that takes tools: what is below need not draw a bar of its own. */
export const useHeadSlot = () => useContext(Slot) !== undefined;

/** Tools for the header above: drawn in its slot (`at`, the end unless said) when there is one, else where they are written. */
export const HeadTools = ({ at = 'end', children }: { at?: HeadPlace; children: React.ReactNode }) => {
  const slot = useContext(Slot);
  if (slot === undefined) return <>{children}</>;
  const node = slot[at];
  return node ? createPortal(children, node) : null;
};
