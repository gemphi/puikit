import React, { createContext, useContext } from 'react';

/** The titles already on screen above this point (a page's title, a column's), so nothing below repeats one. */
const Shown = createContext<string[]>([]);

/** Marks `title` as shown for everything inside: a header below that would only say it again is left out. */
export const ShownTitle: React.FC<{ title?: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => {
  const above = useContext(Shown);
  return <Shown.Provider value={typeof title === 'string' ? [...above, title.trim().toLowerCase()] : above}>{children}</Shown.Provider>;
};

/** Whether `title` is already on screen above (so a header showing it would be a repeat). */
export const useTitleShown = (title: React.ReactNode) => {
  const above = useContext(Shown);
  return typeof title === 'string' && above.includes(title.trim().toLowerCase());
};
