/**
 * Property + naming-convention tests for the component barrels.
 *
 * The shop/display/navigation groups were restructured into the
 * singular-family + role-file + family-barrel layout (tasks 7.1–7.3). Each
 * group barrel re-exports its family barrels via `export *`, and the root
 * component barrel (`./index.ts`) re-exports the group barrels, so every
 * pre-restructure public named export MUST remain importable by the same name
 * from the package root (Requirement 15.3).
 *
 * Property 18 (barrel export stability) uses fast-check over the export-name
 * arbitrary to assert that each pre-restructure public symbol still resolves
 * from the root barrel and is defined. The naming-convention conformance
 * assertions verify that each restructured family folder re-exports its role
 * files by importing the family barrels directly and checking their named
 * exports.
 *
 * This is kit-agnostic test logic: it references only puijs component barrels
 * and imports no other UI kit ("One UI Kit Per App").
 *
 * Design reference: puijs-theming-and-test-platform — Correctness Property 18.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

// Root component barrel — the stable public named-export surface under test.
import * as rootBarrel from './index';

// Restructured family barrels (for naming-convention conformance).
import * as shopPrice from './shop/price';
import * as shopProduct from './shop/product';
import * as shopCart from './shop/cart';
import * as shopOrder from './shop/order';
import * as shopAddress from './shop/address';
import * as shopPayment from './shop/payment';
import * as shopWishlist from './shop/wishlist';
import * as displayCard from './display/card';
import * as displayList from './display/list';
import * as navigationSidebar from './navigation/sidebar';

import {
  PRE_RESTRUCTURE_EXPORT_NAMES,
  preRestructureExportNameArb,
} from '../test/arbitraries';

const NUM_RUNS = 100;

/**
 * The full set of public named exports whose stability Property 18 guards:
 * the shop symbols from PRE_RESTRUCTURE_EXPORT_NAMES plus the restructured
 * display and navigation symbols that must remain importable by name from the
 * package root.
 */
const DISPLAY_NAVIGATION_EXPORT_NAMES: readonly string[] = [
  'List',
  'ListItem',
  'Card',
  'CardHeader',
  'CardBody',
  'CardFooter',
  'Sidebar',
  'SidebarNav',
  'SidebarBrand',
];

const STABLE_EXPORT_NAMES: readonly string[] = [
  ...PRE_RESTRUCTURE_EXPORT_NAMES,
  ...DISPLAY_NAVIGATION_EXPORT_NAMES,
];

/** Arbitrary over every stable public export name guarded by Property 18. */
const stableExportNameArb: fc.Arbitrary<string> = fc.constantFrom(
  ...STABLE_EXPORT_NAMES
);

describe('component barrel export stability + naming convention', () => {
  // Feature: puijs-theming-and-test-platform, Property 18: Barrel export
  // stability — For any pre-restructure public named export, the symbol SHALL
  // remain present and defined when imported from the root component barrel,
  // so the restructure preserves the backward-compatible public surface.
  // Validates: Requirements 15.3
  it('Property 18: barrel export stability (public symbols unchanged)', () => {
    const exportMap = rootBarrel as Record<string, unknown>;

    // The shop-only arbitrary from arbitraries.ts must resolve.
    fc.assert(
      fc.property(preRestructureExportNameArb, (name) => {
        expect(name in exportMap).toBe(true);
        expect(exportMap[name]).toBeDefined();
      }),
      { numRuns: NUM_RUNS }
    );

    // The full stable surface (shop + display/navigation) must resolve.
    fc.assert(
      fc.property(stableExportNameArb, (name) => {
        expect(name in exportMap).toBe(true);
        expect(exportMap[name]).toBeDefined();
      }),
      { numRuns: NUM_RUNS }
    );

    // Deterministic complement: assert every stable name explicitly, so a
    // regression is reported with the exact missing symbol rather than only a
    // random counterexample.
    for (const name of STABLE_EXPORT_NAMES) {
      expect(exportMap[name], `root barrel missing export "${name}"`).toBeDefined();
    }
  });

  // Naming-convention conformance: each restructured family folder re-exports
  // its role files. Verified by importing the family barrels and asserting the
  // expected role-file named exports exist.
  // Validates: Requirements 15.3
  describe('naming-convention conformance: family barrels re-export role files', () => {
    const familyExpectations: ReadonlyArray<{
      family: string;
      barrel: Record<string, unknown>;
      exports: readonly string[];
    }> = [
      { family: 'shop/price', barrel: shopPrice, exports: ['Price'] },
      {
        family: 'shop/product',
        barrel: shopProduct,
        exports: [
          'ProductCard', // card.tsx
          'ProductGrid', // grid.tsx
          'ProductList', // list.tsx
          'ProductItem', // item.tsx
          'FacetFilter', // facet/index.tsx
        ],
      },
      {
        family: 'shop/cart',
        barrel: shopCart,
        exports: ['CartItem', 'CartSummary', 'CartDrawer'],
      },
      { family: 'shop/order', barrel: shopOrder, exports: ['OrderCard'] },
      {
        family: 'shop/address',
        barrel: shopAddress,
        exports: ['AddressCard'],
      },
      {
        family: 'shop/payment',
        barrel: shopPayment,
        exports: ['PaymentMethod'],
      },
      {
        family: 'shop/wishlist',
        barrel: shopWishlist,
        exports: ['WishlistItem'],
      },
      {
        family: 'display/card',
        barrel: displayCard,
        exports: ['Card', 'CardHeader', 'CardBody', 'CardFooter'],
      },
      {
        family: 'display/list',
        barrel: displayList,
        exports: ['List', 'ListItem'],
      },
      {
        family: 'navigation/sidebar',
        barrel: navigationSidebar,
        exports: ['Sidebar', 'SidebarNav', 'SidebarBrand'],
      },
    ];

    for (const { family, barrel, exports } of familyExpectations) {
      it(`${family} re-exports its role files`, () => {
        for (const name of exports) {
          expect(
            barrel[name],
            `${family} barrel missing role export "${name}"`
          ).toBeDefined();
        }
      });
    }
  });
});
