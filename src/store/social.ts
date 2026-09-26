import { createStore } from './createStore';
import { persist } from './middleware';
import { useStore } from '../hooks/useStore';

/**
 * The viewer's engagement — which posts they liked and saved, which creators
 * they follow, and which feed they are on. Persisted like the shop stores, so
 * a like survives a reload the same way a bag line does.
 */
export interface SocialState {
  liked: string[];
  saved: string[];
  following: string[];
  likedComments: string[];
  feed: 'for-you' | 'following';
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (handle: string) => void;
  toggleCommentLike: (commentId: string) => void;
  setFeed: (feed: 'for-you' | 'following') => void;
  hasLiked: (postId: string) => boolean;
  hasSaved: (postId: string) => boolean;
  isFollowing: (handle: string) => boolean;
  hasLikedComment: (commentId: string) => boolean;
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export const socialStore = createStore<SocialState>(
  persist<SocialState>('social:engagement')((set, get) => ({
    liked: [],
    saved: [],
    following: [],
    likedComments: [],
    feed: 'for-you',
    toggleLike: (postId) => set({ liked: toggle(get().liked, postId) }),
    toggleSave: (postId) => set({ saved: toggle(get().saved, postId) }),
    toggleFollow: (handle) => set({ following: toggle(get().following, handle) }),
    toggleCommentLike: (commentId) => set({ likedComments: toggle(get().likedComments, commentId) }),
    setFeed: (feed) => set({ feed }),
    hasLiked: (postId) => get().liked.includes(postId),
    hasSaved: (postId) => get().saved.includes(postId),
    isFollowing: (handle) => get().following.includes(handle),
    hasLikedComment: (commentId) => get().likedComments.includes(commentId),
  }))
);

/** Subscribe to the engagement store. Pass a selector to narrow the subscription. */
export function useSocialStore(): SocialState;
export function useSocialStore<T>(selector: (state: SocialState) => T): T;
export function useSocialStore<T>(selector?: (state: SocialState) => T) {
  return useStore(socialStore, selector as (state: SocialState) => T);
}
