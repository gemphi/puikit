import { COMPONENT_CATALOG, ComponentDoc } from '../content/components';

export class SearchService {
  static search(query: string): ComponentDoc[] {
    const q = query.trim().toLowerCase();
    if (!q) return COMPONENT_CATALOG;
    return COMPONENT_CATALOG.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }
}
