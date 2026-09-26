import React from 'react';
import { Page } from '../components/layout/Page';
import { Main } from '../components/layout/Main';
import { Stack } from '../components/layout/Stack';
import type {
  ArchetypeLayoutProps,
  ArchetypeNavProps,
  SiteArchetype,
} from './types';

/**
 * Archetype registry and pure resolution helpers.
 *
 * This module is kit-agnostic *logic* (a registry plus pure resolvers). The
 * layout/navigation references it points at are puijs compositions only,
 * honoring the "One UI Kit Per App" rule: no other UI kit is imported and only
 * puijs primitives (`Page`, `Main`, `Stack`) compose the archetype views.
 *
 * Each archetype names a structurally distinct layout + navigation composition
 * so that two archetypes applied to the same content produce different
 * structure, not merely a recolor (Requirement 5.4).
 */

// --- puijs-native navigation compositions (kit-specific view) ---------------

/** Portal-style top navigation bar composition. */
const PortalNav: React.FC<ArchetypeNavProps> = ({ children, archetypeId }) =>
  React.createElement(
    Stack,
    { direction: 'row', gap: 3, align: 'center', 'data-archetype-nav': archetypeId ?? 'portal' } as any,
    children
  );

/** Social-feed rail navigation composition (vertical rail). */
const SocialFeedNav: React.FC<ArchetypeNavProps> = ({ children, archetypeId }) =>
  React.createElement(
    Stack,
    { direction: 'column', gap: 2, align: 'stretch', 'data-archetype-nav': archetypeId ?? 'social-feed' } as any,
    children
  );

/** Docs navigation composition (vertical sidebar list). */
const DocsNav: React.FC<ArchetypeNavProps> = ({ children, archetypeId }) =>
  React.createElement(
    Stack,
    { direction: 'column', gap: 1, align: 'start', 'data-archetype-nav': archetypeId ?? 'docs' } as any,
    children
  );

/** Marketplace navigation composition (horizontal wrapping facet bar). */
const MarketplaceNav: React.FC<ArchetypeNavProps> = ({ children, archetypeId }) =>
  React.createElement(
    Stack,
    { direction: 'row', gap: 2, wrap: true, align: 'center', 'data-archetype-nav': archetypeId ?? 'marketplace' } as any,
    children
  );

/** Shop navigation composition (utility bar: brand, search, cart actions). */
const ShopNav: React.FC<ArchetypeNavProps> = ({ children, archetypeId }) =>
  React.createElement(
    Stack,
    { direction: 'row', gap: 3, align: 'center', justify: 'between', 'data-archetype-nav': archetypeId ?? 'shop' } as any,
    children
  );

// --- puijs-native layout compositions (kit-specific view) -------------------

/** Portal layout: header + main content region. */
const PortalLayout: React.FC<ArchetypeLayoutProps> = ({ children, archetypeId }) =>
  React.createElement(
    Page,
    {
      direction: 'column',
      header: React.createElement(PortalNav, { archetypeId }),
      'data-archetype-layout': archetypeId ?? 'portal',
    } as any,
    children
  );

/** Social-feed layout: left rail + centered feed column. */
const SocialFeedLayout: React.FC<ArchetypeLayoutProps> = ({ children, archetypeId }) =>
  React.createElement(
    Page,
    {
      direction: 'row',
      sidebar: React.createElement(SocialFeedNav, { archetypeId }),
      'data-archetype-layout': archetypeId ?? 'social-feed',
    } as any,
    children
  );

/** Docs layout: sidebar navigation + article main. */
const DocsLayout: React.FC<ArchetypeLayoutProps> = ({ children, archetypeId }) =>
  React.createElement(
    Page,
    {
      direction: 'row',
      sidebar: React.createElement(DocsNav, { archetypeId }),
      'data-archetype-layout': archetypeId ?? 'docs',
    } as any,
    children
  );

/** Marketplace layout: facet nav header over a product grid main. */
const MarketplaceLayout: React.FC<ArchetypeLayoutProps> = ({ children, archetypeId }) =>
  React.createElement(
    Page,
    {
      direction: 'column',
      header: React.createElement(MarketplaceNav, { archetypeId }),
      'data-archetype-layout': archetypeId ?? 'marketplace',
    } as any,
    React.createElement(Main, null, children)
  );

/**
 * Shop layout: utility header over a collapsible facet sidebar plus a product
 * main. The sidebar is *toggleable* rather than fixed, because a storefront
 * needs it open while browsing a category and out of the way on a product,
 * cart or checkout page. `sidebarOpen` drives that; when false the layout
 * collapses to header + main and the main region reclaims the full width.
 */
const ShopLayout: React.FC<ArchetypeLayoutProps> = ({ children, archetypeId, sidebar, sidebarOpen = true }) =>
  React.createElement(
    Page,
    {
      direction: sidebarOpen && sidebar ? 'row' : 'column',
      header: React.createElement(ShopNav, { archetypeId }),
      sidebar: sidebarOpen ? sidebar : undefined,
      'data-archetype-layout': archetypeId ?? 'shop',
      'data-sidebar-open': sidebarOpen ? 'true' : 'false',
    } as any,
    React.createElement(Main, null, children)
  );

// --- registry ---------------------------------------------------------------

/**
 * The available Site_Archetypes. Each entry supplies a unique id, a
 * human-readable name, a puijs layout + navigation composition, a default
 * Brand_Theme id (must exist in BRAND_THEMES), and gradient defaults.
 */
export const SITE_ARCHETYPES: SiteArchetype[] = [
  {
    id: 'portal',
    name: 'Portal',
    layout: PortalLayout,
    navigation: PortalNav,
    defaultBrandId: 'foundry',
    gradientDefaults: { enabled: true },
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    layout: SocialFeedLayout,
    navigation: SocialFeedNav,
    defaultBrandId: 'phient',
    gradientDefaults: { enabled: true },
  },
  {
    id: 'docs',
    name: 'Docs',
    layout: DocsLayout,
    navigation: DocsNav,
    defaultBrandId: 'phidoc',
    gradientDefaults: { enabled: false },
  },
  {
    id: 'shop',
    name: 'Shop',
    layout: ShopLayout,
    navigation: ShopNav,
    defaultBrandId: 'chanel',
    gradientDefaults: { enabled: true },
    supportsSidebar: true,
    defaultSidebarOpen: true,
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    layout: MarketplaceLayout,
    navigation: MarketplaceNav,
    defaultBrandId: 'phixum',
    gradientDefaults: { enabled: true },
  },
];

/** The default Site_Archetype identifier used as a fallback. */
export const DEFAULT_ARCHETYPE_ID = 'portal';

/**
 * Resolve an `archetypeId` to its descriptor. Unknown or undefined ids fall
 * back to the default archetype (Requirement 6.3).
 */
export function resolveArchetype(id: string | undefined): SiteArchetype {
  return SITE_ARCHETYPES.find((a) => a.id === id) ?? getDefaultArchetype();
}

/**
 * Return the default Site_Archetype descriptor. Falls back to the first
 * registered archetype if `DEFAULT_ARCHETYPE_ID` is somehow absent.
 */
export function getDefaultArchetype(): SiteArchetype {
  return (
    SITE_ARCHETYPES.find((a) => a.id === DEFAULT_ARCHETYPE_ID) ?? SITE_ARCHETYPES[0]
  );
}

/**
 * Resolve the effective Brand_Theme id: an explicit brand always wins,
 * otherwise the archetype's default brand is used (Requirements 6.2, 6.3).
 */
export function resolveBrandId(
  archetype: SiteArchetype,
  explicitBrandId: string | null | undefined
): string {
  return explicitBrandId ?? archetype.defaultBrandId;
}
