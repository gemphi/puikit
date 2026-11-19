// A fashion shop's menu, from the one taxonomy in data/catalog.json and the products' own fields (category, length,
// sleeve, fabric, garments...): where a product sits is worked out from those, never stored a second time. Plain
// JavaScript with no imports, so the app, the data check (scripts/catalog.mjs) and Phiora's tests all
// run this same code.

/** A label as a path part: "Coats and jackets" -> "coats-and-jackets". */
export const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const at = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
const words = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]).map((x) => String(x).toLowerCase());

/** Does a product meet a node's rule: every field the rule names holds one of its values, and, when the rule names
 *  garment words, one of the product's garments carries one of them. */
export const meets = (product, rule) =>
  Object.entries(rule.match ?? {}).every(([path, want]) => words(at(product, path)).some((v) => words(want).includes(v)))
  && (!rule.garment || words(product.garments).some((g) => words(rule.garment).some((w) => g.includes(w))));

/** A product's places in the taxonomy, as department/category/item paths. */
export function placesOf(product, catalog) {
  const out = [];
  for (const d of catalog.departments) {
    if (!meets(product, d)) continue;
    for (const c of catalog.categories) {
      const items = c.from ? words(at(product, c.from)).map((v) => ({ id: slug(v) })) : c.items.filter((it) => meets(product, it));
      for (const it of items) out.push(`${d.id}/${c.id}/${it.id}`);
    }
  }
  return out;
}

/** Is a product under a node (a department, a category or an item path)? */
export const under = (product, path, catalog) => !path || placesOf(product, catalog).some((p) => p === path || p.startsWith(path + '/'));

/** The taxonomy as a menu for these products: an array of entries { id, label, count, items }, departments holding
 *  their categories holding their items. An entry's id is its path (women/rtw/dresses) and its count how many
 *  products it holds; one that holds none is left out. Every menu of a path has this shape (data/menu.json). */
export function catalogMenu(catalog, products) {
  const places = products.map((p) => placesOf(p, catalog));
  const count = (path) => places.filter((ps) => ps.some((x) => x === path || x.startsWith(path + '/'))).length;
  const labelFrom = (c, id) => { for (const p of products) for (const v of [at(p, c.from)].flat()) if (v != null && slug(v) === id) return String(v); return id; };
  const entry = (id, label, items) => ({ id, label, count: count(id), ...(items ? { items } : {}) });
  return catalog.departments.map((d) => entry(d.id, d.label, catalog.categories.map((c) => {
    const base = `${d.id}/${c.id}`;
    const ids = c.from ? [...new Set(places.flat().filter((x) => x.startsWith(base + '/')).map((x) => x.slice(base.length + 1)))] : c.items.map((it) => it.id);
    return entry(base, c.label, ids.map((id) => entry(`${base}/${id}`, c.from ? labelFrom(c, id) : c.items.find((it) => it.id === id).label)).filter((x) => x.count > 0));
  }).filter((c) => c.items.length > 0))).filter((d) => d.items.length > 0);
}
