/** Every path in the app, in one place — the Chanel rule. */
export const routes = {
  forYou: () => '/',
  following: () => '/following',
  explore: () => '/explore',
  live: () => '/live',
  upload: () => '/upload',
  creator: (handle: string) => `/creator/${handle}`,
  topic: (slug: string) => `/c/${slug}`,
  post: (id: string) => `/post/${id}`,
  section: (name: string) => `/section/${name}`,
  brands: () => '/brands',
  search: (q?: string) => (q ? `/search?q=${encodeURIComponent(q)}` : '/search'),
  about: () => '/about',
} as const;

/** Hash-router href for the same path. */
export const href = (path: string): string => `#${path}`;
