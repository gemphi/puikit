import raw from '../../mocks/api-categories.json';
import { resolve } from './client';

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  order: number;
}

const categories: Category[] = [...(raw as Category[])].sort((a, b) => a.order - b.order);

export const getCategories = async (): Promise<Category[]> => resolve(categories);

export const getCategoryBySlug = async (slug: string): Promise<Category | null> =>
  resolve(categories.find((c) => c.slug === slug) ?? null);

/** Synchronous read for render paths that cannot await (nav bars, breadcrumbs). */
export const categoriesSync = (): Category[] => categories;
