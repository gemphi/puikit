/**
 * The bag: what the viewer picked in an app's shops and has not paid for, and what they bought. Both are kept like
 * every user document. Paying takes the total from the wallet's dollars: looks go through the one call site every
 * app buys looks by (`shop.ts`, where Phiora prices them itself), everything else (a theme, a PFT) is a plain spend.
 * A thing that can be worn (a theme) is put on as it is paid for.
 * The lines and the summary are the kit's own shop parts.
 */
import React from 'react';
import { Box, CartList, CartSummary, Stack, Text, Title } from '@pui/components';
import { persisted } from './api';
import { assetUrl } from './data';
import type { GridItem } from './blocks/Grid';
import { useWear, type Wear } from './looks';
import { purchase } from './shop';
import { balance, fmt, spend, useWallet } from './wallet';
import words from './words.json';

const W = words.shop;
const say = (s: string, n: string) => s.replace('{n}', n);

/** A thing in the bag: enough to show it and to pay for it. `look` says Phiora knows its price. */
export type Line = { id: string; shop: string; title: string; cost: number; image?: string; look?: boolean; wear?: Wear; at?: number };
const BAG = persisted<Record<string, Line[]>>('shop-bag', {});
const BOUGHT = persisted<Record<string, Line[]>>('shop-owned', {});

export const useBag = (app: string) => ({ bag: BAG.use()[app] ?? [], bought: BOUGHT.use()[app] ?? [] });
const put = (app: string, bag: Line[]) => BAG.set({ ...BAG.get(), [app]: bag });
/** Put a product in the bag, or take it out again; one that is bought stays bought. */
export const toggleBag = (app: string, shop: string, it: GridItem & { look?: boolean }) => {
  const id = it.id ?? it.title; const bag = BAG.get()[app] ?? [];
  if ((BOUGHT.get()[app] ?? []).some((l) => l.id === id)) return;
  put(app, bag.some((l) => l.id === id) ? bag.filter((l) => l.id !== id) : [...bag, { id, shop, title: it.title, cost: it.cost ?? 0, image: it.image, look: it.look, wear: it.wear }]);
};
const sum = (list: Line[]) => list.reduce((a, l) => a + l.cost, 0);
/** Pay for the bag from the wallet, and say what was paid for. Nothing is taken when the wallet holds less than the
 *  whole bag. */
const pay = (app: string): Line[] | null => {
  const bag = BAG.get()[app] ?? [];
  if (!bag.length || balance('usd') < sum(bag)) return null;
  const looks = bag.filter((l) => l.look), rest = bag.filter((l) => !l.look);
  const label = say(W.paid, String(bag.length));
  if (looks.length && !purchase(looks.map((l) => l.id), sum(looks), label, () => undefined)) return null;
  if (rest.length && !spend('usd', sum(rest), label)) return null;
  const now = Date.now();
  BOUGHT.set({ ...BOUGHT.get(), [app]: [...bag.map((l) => ({ ...l, at: now })), ...(BOUGHT.get()[app] ?? [])] });
  put(app, []);
  return bag;
};

const lines = (list: Line[], onRemove?: (id: string) => void) => list.map((l) => ({ id: l.id, title: l.title, price: l.cost, quantity: 1, image: assetUrl(l.image),
  ...(onRemove ? { onRemove: () => onRemove(l.id) } : {}) }));

/** The bag's page: its lines, the total, paying from the wallet, and under it what was bought. */
export const Bag: React.FC<{ app: string }> = ({ app }) => {
  const { bag, bought } = useBag(app);
  const wallet = useWallet();
  const wear = useWear();
  const [short, setShort] = React.useState(false);
  // Paid: the last thing of the bag that can be worn is put on.
  const checkout = () => { const paid = pay(app); setShort(!paid); wear.put(paid?.filter((l) => l.wear).pop()?.wear); };
  React.useEffect(() => { setShort(false); }, [bag.length]);
  return (
    <Stack direction="column" gap={4}>
      <Box className="phi-region">
        <Stack direction="column" gap={3}>
          <Title level={2}>{W.bag}</Title>
          <CartList items={lines(bag, (id) => put(app, bag.filter((l) => l.id !== id)))} empty={{ title: W.empty, description: W.emptylead }} />
          {bag.length > 0 && <CartSummary subtotal={sum(bag)} currency="USD" onCheckout={checkout}
            labels={{ subtotal: W.subtotal, shipping: W.delivery, free: W.free, total: W.total, checkout: W.pay }} />}
          <Text size="sm" intent="muted" numeric>{say(W.wallet, fmt('usd', wallet.usd))}</Text>
          {short && <Text size="sm" intent="danger">{W.short}</Text>}
        </Stack>
      </Box>
      {bought.length > 0 && (
        <Box className="phi-region">
          <Stack direction="column" gap={3}>
            <Title level={2}>{W.yours}</Title>
            <CartList variant="readonly" items={lines(bought)} />
          </Stack>
        </Box>)}
    </Stack>
  );
};
