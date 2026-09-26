import React from 'react';
import { ProductList, type ProductListProps } from './list';

export type ProductGridProps = Omit<ProductListProps, 'variant'>;

/**
 * A grid of product cards.
 *
 * Retained as a named entry point because "grid" is what a catalog page calls
 * this, but it is `ProductList` in its `card` variant — there is one list
 * implementation, not two.
 */
export const ProductGrid: React.FC<ProductGridProps> = (props) => (
  <ProductList {...props} variant="card" />
);
