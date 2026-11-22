/**
 * An app's shops: the ones there are (the index its data names, `"shop": "data/shop.json"`), the ones the viewer has
 * open, and the pages of each. An open shop is a group of the menu: its landing first, then its own menu (departments
 * as headings, their categories as pages), so the second column is the shop's. A shop's file holds its products once;
 * a page names its products by their place in that list, and is drawn by the blocks every page is drawn by. The bag
 * (`bag.tsx`) closes every open shop's menu. A product has a page of its own (`<shop>/<product>`, the `product`
 * module), which a press of its card goes to. A bought thing that can be worn (a theme) is put on, and taken off
 * again, by the same press that put it in the bag.
 */
import React from 'react';
import { Box, Button, Input, Label, Stack, Text, Title } from '@pui/components';
import { Search } from 'lucide-react';
import { persisted } from './api';
import { toggleBag, useBag, type Line } from './bag';
import { assetUrl, type AppData, type Block, type NavItem, type View } from './data';
import type { GridItem } from './blocks/Grid';
import { NavIcon } from './icons';
import { useWear } from './looks';
import words from './words.json';

const W = words.shop;
const say = (s: string, n: number) => s.replace('{n}', n.toLocaleString('en-US'));

/** A page of a shop's menu: an entry of the menu, and the places of its products in the shop's list. */
type Page = NavItem & { at?: number[]; items?: Page[] };
type Shop = { id: string; label: string; sub?: string; icon: string; count: number; menu: Page[]; product: GridItem[]; landing: Block[] };
type Index = { folder: string; open: string[]; shop: Pick<Shop, 'id' | 'label' | 'sub' | 'icon' | 'count'>[] };

/** Which shops the viewer opened or closed (by `<app>/<shop>`), kept like every user document. */
const IN = persisted<Record<string, boolean>>('shop-in', {});
const cache = new Map<string, Promise<unknown>>();
const load = <T,>(ref: string): Promise<T> => { const src = assetUrl(ref); if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.json())); return cache.get(src) as Promise<T>; };

/** What the viewer holds in an app's shops: the bag, what is bought, and what of it is worn. */
type Held = { app: string; bag: Line[]; bought: Line[]; wear: ReturnType<typeof useWear> };
/** A grid that names its products by place takes them from the shop's list. Each card says how it stands (to add, in
 *  the bag, owned; a bought thing that can be worn: to put on, worn), and a press of that does the next thing. */
const filled = (b: Block, shop: Shop, held: Held): Block => {
  if (!Array.isArray(b.at)) return b;
  const { app, bag, bought, wear } = held;
  const has = (list: Line[], p: GridItem) => list.some((l) => l.id === p.id);
  const worn = (p: GridItem) => has(bought, p) && wear.on(p.wear);
  const stands = (p: GridItem) => (!has(bought, p) ? (has(bag, p) ? W.inbag : W.put) : !p.wear ? W.owned : worn(p) ? W.worn : W.wear);
  const act = (it: GridItem) => { if (!has(bought, it) || !it.wear) toggleBag(app, shop.id, it); else if (worn(it)) wear.off(); else wear.put(it.wear); };
  return { ...b, onAct: act,
    items: (b.at as number[]).map((i) => shop.product[i]).filter(Boolean).map((p) => ({ ...p, route: shop.id + '/' + p.id, selected: has(bag, p) || worn(p), action: stands(p) })) };
};
const leaves = (menu: Page[]): Page[] => menu.flatMap((m) => (m.items ? leaves(m.items) : [m]));

export const useShops = (data: AppData | null) => {
  const [index, setIndex] = React.useState<Index | null>(null);
  const [file, setFile] = React.useState<Record<string, Shop>>({});
  const within = IN.use();
  const ref = data?.shop; const app = data?.app ?? '';
  const held: Held = { app, ...useBag(app), wear: useWear() };
  React.useEffect(() => { if (ref) void load<Index>(ref).then(setIndex); }, [ref]);
  const open = (id: string) => within[app + '/' + id] ?? !!index?.open.includes(id);
  const chosen = (index?.shop ?? []).filter((s) => open(s.id));
  const want = chosen.map((s) => s.id).join(' ');
  // An open shop's own file is read once it is open.
  React.useEffect(() => {
    if (!index) return;
    want.split(' ').filter(Boolean).forEach((id) => void load<Shop>(index.folder + '/' + id + '.json').then((s) => setFile((f) => (f[id] ? f : { ...f, [id]: s }))));
  }, [index, want]);
  const shops = chosen.map((s) => file[s.id]).filter(Boolean);
  return {
    on: !!ref, index, open,
    /** Is this name a shop's (so a second part of an address is one of its products)? Yes too while the index is read. */
    owns: (id: string) => !!ref && (!index || index.shop.some((s) => s.id === id)),
    choose: (id: string, on: boolean) => IN.set({ ...within, [app + '/' + id]: on }),
    /** The open shops as groups of the menu: the landing, then the shop's own menu. */
    nav: shops.map((s) => ({ id: s.id, label: s.label, icon: s.icon, items: [{ id: s.id, label: W.home, icon: 'home' }, ...s.menu, { id: '_bag', label: W.bag, icon: 'bag', count: held.bag.length || undefined }] })) as NavItem[],
    /** The page of a shop an address names: its landing, a page of its menu, or one product's own page (`sub`): the
     *  product, where it stands, and more from the page of the menu it is on. */
    view: (cur: string, sub?: string): View | undefined => {
      const s = shops.find((x) => cur === x.id || cur.startsWith(x.id + '.'));
      if (!s) return undefined;
      const at = sub ? s.product.findIndex((p) => p.id === sub) : -1;
      if (cur === s.id && at >= 0) {
        const on = leaves(s.menu).find((p) => p.at?.includes(at));
        const one = filled({ kind: 'grid', at: [at] }, s, held);
        const near = (on?.at ?? s.product.map((_, i) => i)).filter((i) => i !== at).slice(0, 8);
        return { title: '', blocks: [
          { kind: 'product', item: one.items[0], onAct: one.onAct, trail: [{ label: s.label, view: s.id }, ...(on ? [{ label: on.label, view: on.id }] : []), { label: s.product[at].title }] },
          ...(near.length ? [filled({ kind: 'grid', title: W.more, at: near }, s, held)] : [])] };
      }
      if (cur === s.id) return { title: '', blocks: s.landing.map((b) => filled(b, s, held)) };
      const page = leaves(s.menu).find((p) => p.id === cur);
      return page && { title: page.label, sub: s.label, blocks: [filled({ kind: 'grid', at: page.at ?? [] }, s, held)] };
    },
  };
};

/** The page a person picks a shop from: every shop of the index, the first that match what is typed. An open shop
 *  stands in the menu until it is closed here. */
export const Shops: React.FC<{ shops: ReturnType<typeof useShops>; go: (id: string) => void }> = ({ shops, go }) => {
  const [find, setFind] = React.useState('');
  if (!shops.index) return null;
  const sought = find.trim().toLowerCase();
  const list = shops.index.shop.filter((s) => !sought || s.label.toLowerCase().includes(sought)).slice(0, 32);
  return (
    <Box className="phi-region">
      <Stack direction="column" gap={3}>
        <Title level={2}>{W.title}</Title>
        <Text size="sm" intent="muted">{W.lead}</Text>
        <Input icon={<Search size={14} />} value={find} placeholder={W.find} aria-label={W.find} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFind(e.target.value)} />
        <Stack direction="column" gap={1}>
          {list.map((s) => { const inside = shops.open(s.id); return (
            <Stack key={s.id} direction="row" gap={2} align="center">
              <Stack direction="column" gap={0} flex="1" minWidth="0">
                <Label icon={<NavIcon name={s.icon} size={16} />}>{s.label}</Label>
                <Text as="span" size="xs" intent="muted" truncate>{[s.sub, say(W.items, s.count)].filter(Boolean).join(' · ')}</Text>
              </Stack>
              {inside && <Button variant="glass" aria-label={W.close + ' - ' + s.label} onClick={() => shops.choose(s.id, false)}>{W.close}</Button>}
              <Button variant="glass" aria-label={W.open + ' - ' + s.label} onClick={() => { shops.choose(s.id, true); go(s.id); }}>{W.open}</Button>
            </Stack>); })}
          {!list.length && <Text size="sm" intent="muted">{W.none}</Text>}
        </Stack>
        <Text size="xs" intent="muted" numeric>{say(W.count, shops.index.shop.length)}</Text>
      </Stack>
    </Box>
  );
};
