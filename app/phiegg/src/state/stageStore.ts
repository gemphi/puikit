import { createStore } from '@pui/store';

/** The sidebar's open state outlives a visit; the key is the one the panel always used. */
const KEY = 'phi-panel-closed';
const readOpen = () => { try { return window.localStorage.getItem(KEY) !== '1'; } catch { return true; } };

/**
 * The shell's own state, apart from the pages'. `open`: the sidebar's panel on wide screens, kept across visits.
 * `float`: the panel floating over the content on compact screens, closed after each pick. `docked`: open, wide, and
 * the current rail item has a panel, which sets the width of the header's brand cell above it.
 */
export interface StageState {
  open: boolean; float: boolean; docked: boolean;
  setOpen: (open: boolean) => void; setFloat: (float: boolean) => void; setDocked: (docked: boolean) => void;
}

export const stageStore = createStore<StageState>((set) => ({
  open: readOpen(), float: false, docked: false,
  setOpen: (open) => { set({ open }); try { window.localStorage.setItem(KEY, open ? '0' : '1'); } catch { /* storage blocked: it still applies for this visit */ } },
  setFloat: (float) => set({ float }),
  setDocked: (docked) => set({ docked }),
}));
