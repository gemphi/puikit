import React, { createContext, useContext } from 'react';

/**
 * What the shell tells the components inside it, so pages never have to: whether its menu panel is open beside the
 * content. A slider shows fewer slides while it is open, for one. The puikit AppShell provides it; a shell of its own
 * provides it with ShellProvider. Outside any shell the panel counts as closed.
 */
export type ShellState = { navOpen: boolean };
const Shell = createContext<ShellState>({ navOpen: false });
export const ShellProvider: React.FC<{ navOpen: boolean; children: React.ReactNode }> = ({ navOpen, children }) => (
  <Shell.Provider value={{ navOpen }}>{children}</Shell.Provider>
);
export const useShell = () => useContext(Shell);
