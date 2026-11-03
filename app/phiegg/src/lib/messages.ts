// Direct-message threads per conversation (data/messages.json threads) + the voice room you are in.
import { persisted } from '@phi-kit/api';
import { D } from './data';
import type { DirectMessage, ID } from '../types/phiegg';

const seed = (): Record<ID, DirectMessage[]> => {
  const out: Record<ID, DirectMessage[]> = { ...(D.messages.threads ?? {}) };
  out[D.messages.thread.conversationId] = D.messages.thread.messages;
  for (const c of D.messages.conversations) if (!out[c.id]?.length) out[c.id] = [{ id: c.id + '_last', authorId: c.userIds[0], at: c.at, text: c.last }];
  return out;
};
export const DMS = persisted<Record<ID, DirectMessage[]>>('dms', seed(), (init, server) => ({ ...init, ...server }));
export const useDms = () => DMS.use();
export const sendDm = (convId: ID, authorId: ID, text: string, at: string) =>
  DMS.set({ ...DMS.get(), [convId]: [...(DMS.get()[convId] ?? []), { id: convId + '_' + Date.now(), authorId, at, text }] });

export type Room = { id: ID | null; muted: boolean; hand: boolean };
export const ROOM = persisted<Room>('voiceRoom', { id: null, muted: true, hand: false });
export const useRoom = () => ROOM.use();
