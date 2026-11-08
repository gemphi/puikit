import { useState } from 'react';

/** The Light faces a person can read the apps in. `theme` keeps the look's own face. Condensed cuts are left out: they
 *  go against the wider letters this list is for. */
export type FontChoice = { id: string; label: string; family?: string };
export const FONTS: FontChoice[] = [
  { id: 'theme', label: 'Theme font' },
  { id: 'phifing', label: 'Phifing', family: 'Phifing' },
  { id: 'phifing-1', label: 'Phifing 1', family: 'Phifing 1' },
  { id: 'phifing-2', label: 'Phifing 2', family: 'Phifing 2' },
  { id: 'phifing-3', label: 'Phifing 3', family: 'Phifing 3' },
  { id: 'phifing-4', label: 'Phifing 4', family: 'Phifing 4' },
  { id: 'phifing-5', label: 'Phifing 5', family: 'Phifing 5' },
  { id: 'barlow', label: 'Barlow', family: 'Barlow' },
  { id: 'phiber', label: 'Phiber', family: 'Phiber' },
  { id: 'soft', label: 'Phi-Soft', family: 'Phi-Soft' },
  { id: 'walt', label: 'Phi-Walt', family: 'Phi-Walt' },
  { id: 'hard', label: 'Phi-Hard', family: 'Phi-Hard' },
  { id: 'pill', label: 'Phi-Pill', family: 'Phi-Pill' },
  { id: 'pill-open', label: 'Phi-Pill Open', family: 'Phi-Pill Open' },
  { id: 'sans', label: 'Phi-Sans', family: 'Phi-Sans' },
  { id: 'serif', label: 'Phi-Serif', family: 'Phi-Serif' },
  { id: 'chatty', label: 'Chatty Whims', family: 'Chatty Whims' },
  { id: 'spark', label: "Lora's Spark", family: "Lora's Spark" },
];

const KEY = 'phi-font';
const FALLBACK = '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif';

/** What an app reads in until a person picks: the look's own face, unless the app names one at mount. */
let fallbackId = 'theme';

const read = (): string => {
  try { return window.localStorage.getItem(KEY) ?? fallbackId; } catch { return fallbackId; }
};

/** Inline on the root, so it wins over any look; `theme` clears it and the look's own face returns. */
export function applyFont(id: string): void {
  const root = document.documentElement.style;
  const family = FONTS.find((f) => f.id === id)?.family;
  if (!family) {
    root.removeProperty('--phi-font-family');
    root.removeProperty('--phi-font-heading');
    return;
  }
  const stack = `"${family}", ${FALLBACK}`;
  root.setProperty('--phi-font-family', stack);
  root.setProperty('--phi-font-heading', stack);
}

/** Put the saved choice back on boot; with nothing saved, the app's own default (`defaultId`), else the look's face. */
export const applySavedFont = (defaultId?: string): void => {
  fallbackId = FONTS.some((f) => f.id === defaultId) ? defaultId! : 'theme';
  applyFont(read());
};

export function useFont(): [FontChoice, (id: string) => void] {
  const [id, setId] = useState(read);
  const set = (next: string) => {
    setId(next);
    applyFont(next);
    try { window.localStorage.setItem(KEY, next); } catch { /* storage blocked: it still applies for this visit */ }
  };
  return [FONTS.find((f) => f.id === id) ?? FONTS[0], set];
}
