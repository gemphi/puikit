// Cart, offers and owned looks for the shop. With VITE_PHI_API, Phiora prices and settles every purchase
// (/shop/buy, /shop/offer) and owns `owned`; the cart itself is a normal /state/cartOffers document.
// Without it, everything is local (same documents phiegg-v1 uses, so both apps agree).
import { persisted } from '@phi-kit/api';
import { OWNED } from '@phi-kit/wallet';
import { placeOffer, purchase } from '@phi-kit/shop';
import type { ID, ShopLook } from '../types/phiegg';
import { record } from './activity';

export type Offer = { lookId: ID; usd: number; t: number; status: 'pending' | 'accepted' | 'declined' };
type S = { cart: ID[]; offers: Offer[] };
const C = persisted<S>('cartOffers', { cart: [], offers: [] });

export const useCart = () => C.use();
export const useOwned = () => OWNED.use();
export const toggleCart = (id: ID) => { const s = C.get(); record(s.cart.includes(id) ? 'cart.remove' : 'cart.add', id, { refKind: 'look' }); C.set({ ...s, cart: s.cart.includes(id) ? s.cart.filter((x) => x !== id) : [...s.cart, id] }); };
export const removeFromCart = (id: ID) => { const s = C.get(); record('cart.remove', id, { refKind: 'look' }); C.set({ ...s, cart: s.cart.filter((x) => x !== id) }); };
export const withdrawOffer = (id: ID) => { const s = C.get(); record('offer.withdraw', id, { refKind: 'look' }); C.set({ ...s, offers: s.offers.filter((o) => !(o.lookId === id && o.status === 'pending')) }); };
const ownLocal = (ids: ID[]) => {
  OWNED.replace({ ...OWNED.get(), ...Object.fromEntries(ids.map((id) => [id, Date.now()])) });
  const s = C.get(); C.set({ ...s, cart: s.cart.filter((x) => !ids.includes(x)) });
};

/** Buy at list price from the USD wallet. */
export const buy = (l: ShopLook, label: string) => purchase([l.id], l.usd, label, () => { ownLocal([l.id]); record('buy', l.id, { refKind: 'look', usd: l.usd }); });

/** Offers at or above floor are accepted at once; lower ones wait for the seller. */
export const makeOffer = (l: ShopLook, amount: number, label: string): Offer['status'] | 'funds' =>
  placeOffer(l.id, amount, l.floor, label, (o) => {
    const s = C.get(); const rest = s.offers.filter((x) => !(x.lookId === l.id && x.status === 'pending'));
    C.set({ ...s, offers: [{ lookId: l.id, usd: amount, t: Date.now(), status: o }, ...rest] }); record('offer', l.id, { refKind: 'look', usd: amount, note: o });
    if (o === 'accepted') ownLocal([l.id]);
  });

/** Checkout everything in the cart in one payment. */
export const checkout = (looks: ShopLook[], label: string) =>
  purchase(looks.map((l) => l.id), looks.reduce((a, l) => a + l.usd, 0), label, () => { ownLocal(looks.map((l) => l.id)); looks.forEach((l) => record('checkout', l.id, { refKind: 'look', usd: l.usd })); });
