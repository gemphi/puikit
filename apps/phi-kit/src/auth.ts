/**
 * Who is signed in to Phiora. Every visitor starts as a guest; registering keeps the guest's
 * wallet, looks and saved state. After any change of user, every persisted document is re-read.
 * Without VITE_PHI_API there are no accounts and useMe() stays undefined.
 */
import { useSyncExternalStore } from 'react';
import { apiGet, apiSend, hasApi, refreshAll, type ApiResult } from './api';

export type Me = { id: string; name: string; handle: string | null; guest: boolean; canDemo?: boolean };
export type DemoUser = { id: string; name: string; handle: string };

let me: Me | undefined;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export const loadMe = () => apiGet<Me>('/me').then((v) => { me = v; emit(); return v; });
if (hasApi) void loadMe();

/** The signed-in user right now (outside React). */
export const currentMe = () => me;
export const useMe = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => me);
export const accountsEnabled = hasApi;

const switched = async <T>(r: ApiResult<T>) => { if (r.ok) { await loadMe(); await refreshAll(); } return r; };
export const register = (handle: string, name: string, password: string) => apiSend<Me>('POST', '/auth/register', { handle, name, password }).then(switched);
export const signIn = (handle: string, password: string) => apiSend<Me>('POST', '/auth/signin', { handle, password }).then(switched);
export const demoSignIn = (userId: string) => apiSend<Me>('POST', '/auth/demo', { userId }).then(switched);
export const signOut = () => apiSend<{ ok: boolean }>('POST', '/auth/logout').then(switched);
export const demoUsers = () => apiGet<DemoUser[]>('/auth/demo-user').then((v) => v ?? []);
