'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { SocialAuthor, SocialComment, SocialFeedKind, SocialPost } from '../../types/social';

/**
 * The data seam. Every method is optional and async; swap this for a live
 * client at go-live and nothing below the provider changes — the same
 * contract the shop module's `ShopAdapter` keeps.
 */
export interface SocialAdapter<T extends SocialPost = SocialPost> {
  getFeed?: (kind: SocialFeedKind) => Promise<T[]>;
  getPostById?: (id: string) => Promise<T | null>;
  getCreator?: (handle: string) => Promise<SocialAuthor | null>;
  getCreatorPosts?: (handle: string) => Promise<T[]>;
  getComments?: (postId: string) => Promise<SocialComment[]>;
  getTrending?: () => Promise<T[]>;
}

export interface SocialConfig<T extends SocialPost = SocialPost> {
  adapter: SocialAdapter<T>;
  /** The signed-in viewer; absent means a guest. */
  viewer?: SocialAuthor;
  /** BCP-47 tag for count formatting, e.g. `en-US`. */
  locale?: string;
  children?: React.ReactNode;
}

export interface ResolvedSocialConfig<T extends SocialPost = SocialPost> {
  adapter: SocialAdapter<T>;
  viewer?: SocialAuthor;
  locale: string;
}

const SocialContext = createContext<ResolvedSocialConfig | null>(null);

export function SocialProvider<T extends SocialPost = SocialPost>({
  adapter,
  viewer,
  locale = 'en-US',
  children,
}: SocialConfig<T>) {
  const value = useMemo<ResolvedSocialConfig>(
    () => ({ adapter: adapter as SocialAdapter, viewer, locale }),
    [adapter, viewer, locale]
  );
  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocialConfig<T extends SocialPost = SocialPost>(): ResolvedSocialConfig<T> {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('Social components must be rendered inside <SocialProvider>.');
  return ctx as unknown as ResolvedSocialConfig<T>;
}

export function useOptionalSocialConfig<T extends SocialPost = SocialPost>(): ResolvedSocialConfig<T> | null {
  return useContext(SocialContext) as unknown as ResolvedSocialConfig<T> | null;
}
