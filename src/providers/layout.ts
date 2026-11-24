import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { usePuiTheme } from './PuiProvider';
import { loadUserPreference, persistUserPreference } from './preferences';

/**
 * The person's layout choices: how a feed is laid, where tabs stand, what ground the window wears, and any choice an
 * app's settings name. One mechanism for all of them, so every app listens to the same choices: each is kept per
 * person (`phi-layout-<key>::<user>`, as every preference is) and written on the root as `data-phi-<key>`, which the
 * kit's styles answer (tokens/_ground.scss, Tabs) without an app doing anything. A component that lays itself out by
 * a choice reads it with {@link useLayout}. The keys and their values are the apps' data, never this file's.
 */
const PREFIX = 'phi-layout-';
const heard = new Set<() => void>();
const tell = () => heard.forEach((one) => one());
const listen = (one: () => void) => { heard.add(one); return () => { heard.delete(one); }; };

const root = () => (typeof document === 'undefined' ? null : document.documentElement);

/** Put a choice on the root, or take it off when it is the default (nothing chosen). */
export function writeLayout(key: string, value: string): void {
  const el = root();
  if (!el) return;
  if (value) el.setAttribute('data-phi-' + key, value);
  else el.removeAttribute('data-phi-' + key);
}

/** Every choice this person kept, on the root: run when the app starts and when the person changes. */
export function writeLayoutRoot(userId: string): void {
  if (typeof window === 'undefined') return;
  const el = root();
  if (!el) return;
  for (const name of Array.from(el.getAttributeNames())) if (name.startsWith('data-phi-')) el.removeAttribute(name);
  try {
    const store = window.localStorage;
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      const match = key && key.startsWith(PREFIX) && key.endsWith('::' + userId) ? key.slice(PREFIX.length, -(userId.length + 2)) : '';
      if (match) writeLayout(match, store.getItem(key!) ?? '');
    }
  } catch { /* storage blocked: the defaults stand */ }
  tell();
}

/** Keep the root in step with the person: mounted once by the shell every app wears (AppShell). */
export function useLayoutRoot(userId: string): void {
  useEffect(() => writeLayoutRoot(userId), [userId]);
}

/** A choice and the way to make it: `[value, set]`, `fallback` when the person chose nothing. Setting it keeps it,
 *  puts it on the root and tells every reader, in every part of every app on the page. */
export function useLayout(key: string, fallback = ''): [string, (value: string) => void] {
  const { userId } = usePuiTheme();
  const value = useSyncExternalStore(listen, () => loadUserPreference(PREFIX + key, userId, fallback), () => fallback);
  const set = useCallback((next: string) => {
    persistUserPreference(PREFIX + key, userId, next);
    writeLayout(key, next);
    tell();
  }, [key, userId]);
  return [value, set];
}
