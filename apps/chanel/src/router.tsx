import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * A hash router in ~60 lines.
 *
 * The app deliberately takes no routing dependency: a design-system reference
 * app should demonstrate puijs, not react-router. Hash routing also means the
 * built app works from any static path with no server rewrite rules.
 */

export interface Route {
  /** Path pattern, e.g. `/product/:id`. */
  path: string;
  render: (params: Record<string, string>, query: URLSearchParams) => React.ReactNode;
}

interface RouterValue {
  path: string;
  query: URLSearchParams;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

const readHash = (): string => {
  const raw = window.location.hash.replace(/^#/, '');
  return raw || '/';
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hash, setHash] = useState(readHash);

  useEffect(() => {
    const onChange = () => setHash(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to.startsWith('/') ? to : `/${to}`;
    // A new page should start at the top, the way a real navigation does.
    window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo<RouterValue>(() => {
    const [path, search = ''] = hash.split('?');
    return { path, query: new URLSearchParams(search), navigate };
  }, [hash, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside <RouterProvider>');
  return ctx;
}

/** Match a concrete path against a `/a/:b` pattern, returning its params. */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const ap = path.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    else if (pp[i] !== ap[i]) return null;
  }
  return params;
}

export const Routes: React.FC<{ routes: Route[]; fallback: React.ReactNode }> = ({ routes, fallback }) => {
  const { path, query } = useRouter();
  for (const route of routes) {
    const params = matchRoute(route.path, path);
    if (params) return <>{route.render(params, query)}</>;
  }
  return <>{fallback}</>;
};
