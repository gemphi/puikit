import type { SocialAdapter } from '@pui/social';
import { getComments, getCreator, getFeed, getPostById, getPostsByCreator, getTrending, type Post } from './lib/services';

export type { Post } from './lib/services';

/**
 * Everything this app tells the social module. Swap this adapter for a live
 * client at go-live; nothing below the provider changes.
 */
export const adapter: SocialAdapter<Post> = {
  getFeed,
  getTrending,
  getCreator,
  getCreatorPosts: getPostsByCreator,
  getComments,
  getPostById,
};
