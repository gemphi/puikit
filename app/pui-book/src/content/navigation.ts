export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const DOCS_NAV_GROUPS: NavGroup[] = [
  {
    id: 'getting-started',
    title: 'Overview',
    items: [
      { id: 'home', label: 'Introduction', path: '/' },
      { id: 'tokens', label: 'Tokens', path: '/tokens', badge: '--phi-*' },
      { id: 'generated-docs', label: 'Generated', path: '/docs/generated', badge: 'Auto' },
      { id: 'ecosystem', label: 'Ecosystem', path: '/ecosystem' },
    ],
  },
  {
    id: 'architecture',
    title: 'Data engine',
    items: [
      { id: 'data-engine', label: 'Stores & services', path: '/data-engine', badge: 'Reactive' },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    items: [
      { id: 'primitives', label: 'Primitives', path: '/components/primitives' },
      { id: 'feedback', label: 'Feedback', path: '/components/feedback' },
      { id: 'forms', label: 'Forms', path: '/components/forms' },
      { id: 'data-display', label: 'Data display', path: '/components/data-display' },
      { id: 'overlays', label: 'Overlays', path: '/components/overlays' },
      { id: 'shop', label: 'Shop', path: '/components/shop', badge: 'New' },
      { id: 'playground', label: 'Playground', path: '/playground', badge: 'Interactive' },
    ],
  },
];
