'use client';

import React from 'react';
import { Page } from '@pui/components';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  children: React.ReactNode;
}

/**
 * Root layout for pui-book.
 *
 * The docs shell is the same `Page` composition every puijs app uses — header,
 * sidebar rail, main — so the library's own documentation is rendered by the
 * library's own layout primitive rather than by a hand-rolled flex box. There
 * is no inline style here: `Page` owns the structure and the tokens own the
 * spacing, which is what makes a theme or density change reach these docs at
 * the same time it reaches an app.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  searchQuery,
  onSearchChange,
  children,
}) => (
  <Page
    header={<AppHeader searchQuery={searchQuery} onSearchChange={onSearchChange} />}
    sidebar={<AppSidebar currentPath={currentPath} onNavigate={onNavigate} />}
  >
    {children}
  </Page>
);
