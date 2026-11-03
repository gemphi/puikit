
import { persisted } from '@phi-kit/api';

/** Cart + offers — Phiora `/state/cartOffers` when VITE_PHI_API is set, localStorage otherwise. */
export type Offer = { lookId: string; usd: number; t: number; status: 'pending' | 'accepted' | 'declined' };
type S = { cart: string[]; offers: Offer[] };
const C = persisted<S>('cartOffers', { cart: [], offers: [] });
const set = (n: S) => C.set(n);
const st = () => C.get();

export const useCart = () => C.use();
export const addToCart = (id: string) => { if (!st().cart.includes(id)) set({ ...st(), cart: [...st().cart, id] }); };
export const removeFromCart = (id: string) => set({ ...st(), cart: st().cart.filter((x) => x !== id) });
export const clearCart = (ids: string[]) => set({ ...st(), cart: st().cart.filter((x) => !ids.includes(x)) });
export const addOffer = (o: Offer) => set({ ...st(), offers: [o, ...st().offers.filter((x) => !(x.lookId === o.lookId && x.status === 'pending'))] });
export const withdrawOffer = (lookId: string) => set({ ...st(), offers: st().offers.filter((x) => !(x.lookId === lookId && x.status === 'pending')) });
