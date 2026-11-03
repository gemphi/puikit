import type { AppData, Block, NavItem } from './data';

/**
 * Blocks that show other records instead of carrying copies, so the data stays linked: an edit to a menu entry or a
 * story shows everywhere it is used on the next load.
 *   { kind: 'grid', from: 'menus' }                          a card per menu entry that opens a page (its title,
 *                                                            sub and art come from the menu and the page)
 *   { kind: 'news', from: 'page', page: 'news', limit: 4 }   the first items of that page's block of the same kind
 *                                                            (`of` names another kind)
 * A block that already carries items keeps them.
 */
export function resolveLinks(d: AppData): AppData {
  const leaves = (list: NavItem[], group?: string): (NavItem & { group?: string })[] =>
    list.flatMap((n) => (n.items?.length ? leaves(n.items, n.label) : [{ ...n, group: group ?? n.label }]));
  const fromMenus = (b: Block) => leaves(d.nav).filter((n) => n.id !== 'home' && d.views[n.id]).map((n) => ({
    title: d.views[n.id].title || n.label, sub: n.group, body: d.views[n.id].sub || '', action: b.action ?? 'Open', href: '#/' + n.id, image: n.image,
  }));
  const fromPage = (b: Block) => {
    const src = d.views[b.page]?.blocks.find((x) => x.kind === (b.of ?? b.kind) && !x.from);
    return (src?.items ?? []).slice(0, b.limit ?? undefined);
  };
  const resolve = (b: Block): Block => (b.items?.length || !b.from ? b : { ...b, items: b.from === 'menus' ? fromMenus(b) : b.from === 'page' ? fromPage(b) : [] });
  return { ...d, views: Object.fromEntries(Object.entries(d.views).map(([k, v]) => [k, { ...v, blocks: v.blocks.map(resolve) }])) };
}
