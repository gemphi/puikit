// Every action a person takes is recorded: viewing an item, turning it, carting, offering, buying, swapping, joining
// quests, coins and stakes, follows, RSVPs, likes, comments and chats. Newest first, capped. With VITE_PHI_API the
// events go to Phiora in small batches (POST /activity) and the server-owned `/state/activity` document is the record;
// without it they live in localStorage.
import { apiPost, hasApi, persisted } from '@phi-kit/api';
import type { ID } from '../types/phiegg';

export type ActivityKind =
  | 'view' | 'angle' | 'cart.add' | 'cart.remove' | 'offer' | 'offer.withdraw' | 'buy' | 'checkout' | 'swap' | 'lot.buy'
  | 'quest.join' | 'quest.leave' | 'coin.buy' | 'coin.sell' | 'stake' | 'unstake'
  | 'follow' | 'unfollow' | 'rsvp' | 'unrsvp' | 'like' | 'unlike' | 'save' | 'unsave' | 'share' | 'comment' | 'chat' | 'open';
export type ActivityEvent = { id: string; kind: ActivityKind; ref: ID; refKind?: string; at: number; usd?: number; note?: string; with?: ID };

const MAX = 1000;
export const ACTIVITY = persisted<{ events: ActivityEvent[] }>('activity', { events: [] }, undefined, { serverOwned: true });
export const useActivity = () => ACTIVITY.use();
let seq = 0;
export function record(kind: ActivityKind, ref: ID, extra: Omit<Partial<ActivityEvent>, 'id' | 'kind' | 'ref'> = {}) {
  const at = Date.now(); const e: ActivityEvent = { id: `a${at.toString(36)}${(seq++).toString(36)}`, kind, ref, at, ...extra };
  ACTIVITY.set({ events: [e, ...ACTIVITY.get().events].slice(0, MAX) });
  if (hasApi) { queue.push(e); if (!timer) timer = setTimeout(flush, 1500); }
  return e;
}
// Batch to Phiora: one POST per 1.5 s at most, up to 100 events each; failed batches go back on the queue once.
let queue: ActivityEvent[] = []; let timer: ReturnType<typeof setTimeout> | undefined;
async function flush() {
  timer = undefined; const batch = queue.splice(0, 100); if (!batch.length) return;
  const ok = await apiPost<{ added: number }>('/activity', { events: batch });
  if (!ok) queue = [...batch.filter((e) => !(e as { retried?: boolean }).retried).map((e) => ({ ...e, retried: true })), ...queue];
  if (queue.length && !timer) timer = setTimeout(flush, 1500);
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { if (hasApi && queue.length) void flush(); });
export const activityOf = (ref: ID) => ACTIVITY.get().events.filter((e) => e.ref === ref || e.with === ref);
