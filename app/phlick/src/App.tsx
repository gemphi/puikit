import React from 'react';
import { PuiProvider } from '@pui/providers';
import { SocialProvider } from '@pui/social';
import { RouterProvider, Routes, type Route } from './router';
import { AppShell } from './components/layout/shell';
import { adapter } from './social';
import { FeedPage } from './pages/feed';
import { SearchPage } from './pages/search';
import { SectionPage } from './pages/section';
import { BrandsPage } from './pages/brands';
import { ExplorePage } from './pages/explore';
import { LivePage } from './pages/live';
import { PostPage } from './pages/post';
import { UploadPage } from './pages/upload';
import { CreatorPage } from './pages/creator';
import { NotFoundPage } from './pages/not-found';

const routeTable: Route[] = [
  { path: '/', render: () => <FeedPage kind="for-you" /> },
  { path: '/following', render: () => <FeedPage kind="following" /> },
  { path: '/explore', render: () => <ExplorePage /> },
  { path: '/live', render: () => <LivePage /> },
  { path: '/upload', render: () => <UploadPage /> },
  { path: '/search', render: () => <SearchPage /> },
  { path: '/brands', render: () => <BrandsPage /> },
  { path: '/section/:name', render: (p) => <SectionPage name={p.name} /> },
  { path: '/c/:slug', render: (p) => <FeedPage key={p.slug} kind="for-you" lockedTopic={p.slug} /> },
  { path: '/post/:id', render: (p) => <PostPage id={p.id} /> },
  { path: '/creator/:handle', render: (p) => <CreatorPage handle={p.handle} /> },
];

/**
 * The phlick feed.
 *
 * `PuiProvider` runs the `social-feed` archetype on the `phlick` brand, dark
 * by default — the reference is a dark product. `SocialProvider` carries the
 * one data seam; the viewer starts as a guest, and their likes, saves and
 * follows persist under the guest namespace exactly as a shopper's bag does.
 */
export const App: React.FC = () => (
  <PuiProvider defaultTheme="dark" defaultThemeStyle="gradient" defaultArchetype="social-feed" defaultBrand="phlick">
    <SocialProvider adapter={adapter} locale="en-US">
      <RouterProvider>
        <AppShell>
          <Routes routes={routeTable} fallback={<NotFoundPage />} />
        </AppShell>
      </RouterProvider>
    </SocialProvider>
  </PuiProvider>
);
