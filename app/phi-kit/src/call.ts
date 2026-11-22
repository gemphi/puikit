/**
 * A room's call line: how the pages that have one room open find each other (Phiora, `app/phiora-server/src/call.mjs`).
 *
 * A page that opens a room holds its line: an event stream that says who is in the room's call now, and brings the
 * signals other callers send this page. Joining, leaving and sending go to the same path as posts, one at a time and
 * in order, so an offer never arrives after its candidates. The call itself (sound, picture) runs between the browsers
 * (`peer.ts`); the line only introduces them. With no API there is no line and a call stays on its own page.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { apiSend, apiUrl, hasApi } from './api';

/** Someone in a call: the page they are on, and who Phiora says they are. */
export type Caller = { peer: string; name: string; handle: string | null };
/** What one caller sends another: a WebRTC description or candidate, or how they are (muted, which stream is a screen). */
export type Signal = { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; state?: { quiet: boolean; screen: string } };
export type LineState = { roster: Caller[]; ice: RTCIceServer[];
  /** This page is in the call. */
  joined: boolean;
  /** The call service refused or did not answer. */
  fault: boolean };
export type Line = {
  /** This page's name in the room. */
  peer: string;
  get: () => LineState; subscribe: (f: () => void) => () => void;
  join: () => void; leave: () => void;
  send: (to: string, signal: Signal) => void;
  /** Hear the signals sent to this page. */
  listen: (f: (from: string, signal: Signal) => void) => () => void;
  close: () => void;
};

const IDLE: LineState = { roster: [], ice: [], joined: false, fault: false };

const open = (store: string): Line => {
  const peer = crypto.randomUUID();
  const path = '/call/' + store.split('/').map(encodeURIComponent).join('/');
  let state = IDLE;
  const subs = new Set<() => void>(); const ears = new Set<(from: string, signal: Signal) => void>();
  const set = (next: Partial<LineState>) => { state = { ...state, ...next }; subs.forEach((f) => f()); };
  const stream = new EventSource(apiUrl(path + '?peer=' + peer), { withCredentials: true });
  const ready = new Promise<void>((ok) => stream.addEventListener('open', () => ok(), { once: true }));
  // What waits to be posted: whether to be in the call, and the signals, sent together once the last post is back.
  let want: boolean | undefined; let waiting: { to: string; signal: Signal }[] = []; let busy = false;
  const flush = async () => {
    if (busy) return; busy = true; await ready;
    while (want !== undefined || waiting.length) {
      const body = { peer, join: want, send: waiting }; want = undefined; waiting = [];
      const r = await apiSend('POST', path, body);
      if (!r.ok && body.join) set({ joined: false, fault: true });
    }
    busy = false;
  };
  stream.onmessage = (e) => {
    const d = JSON.parse(e.data) as { roster?: Caller[]; ice?: RTCIceServer[]; from?: string; signal?: Signal };
    if (d.roster) set({ roster: d.roster, ice: d.ice ?? state.ice });
    if (d.from && d.signal) ears.forEach((f) => f(d.from as string, d.signal as Signal));
  };
  // The line is up. After a drop the server has forgotten this page, so a page that was in the call joins again.
  stream.onopen = () => { set({ fault: false }); if (state.joined) { want = true; void flush(); } };
  // The line is down (the browser tries again by itself): nobody can be reached until it is back.
  stream.onerror = () => set({ roster: [], fault: true });
  return {
    peer, get: () => state,
    subscribe: (f) => { subs.add(f); return () => { subs.delete(f); }; },
    join: () => { want = true; set({ joined: true, fault: false }); void flush(); },
    leave: () => { want = false; waiting = []; set({ joined: false }); void flush(); },
    send: (to, signal) => { waiting.push({ to, signal }); void flush(); },
    listen: (f) => { ears.add(f); return () => { ears.delete(f); }; },
    close: () => stream.close(),
  };
};

/** One line for a room however many parts of the page ask (the room's head, the call), closed when the last lets go. */
const held = new Map<string, { line: Line; count: number }>();
const hold = (store: string): Line => {
  const h = held.get(store) ?? { line: open(store), count: 0 };
  h.count += 1; held.set(store, h); return h.line;
};
const drop = (store: string) => {
  const h = held.get(store); if (!h) return;
  h.count -= 1; if (h.count <= 0) { h.line.close(); held.delete(store); }
};

const never = () => () => undefined;
/** The line of a room (`<app>/<room>`) while this part of the page is shown; none when there is no API or no room. */
export const useLine = (store: string | null): { line: Line | null; state: LineState } => {
  const [line, setLine] = useState<Line | null>(null);
  useEffect(() => {
    if (!store || !hasApi) return;
    setLine(hold(store));
    return () => { setLine(null); drop(store); };
  }, [store]);
  const state = useSyncExternalStore(line ? line.subscribe : never, line ? line.get : () => IDLE);
  return { line, state };
};
