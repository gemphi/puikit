import { useAsync } from '../../shop/hooks/useAsync';
import { useSocialConfig } from '../provider';
import { useSocialStore } from '../../../store/social';
import type { SocialFeedKind, SocialPost } from '../../../types/social';

export interface FeedResult<T extends SocialPost = SocialPost> {
  posts: T[];
  loading: boolean;
  error: Error | null;
  kind: SocialFeedKind;
  setKind: (kind: SocialFeedKind) => void;
}

/**
 * The feed being watched. `following` narrows to followed creators — client-
 * side against the same adapter call, so a live backend can take over the
 * narrowing without the hook changing shape.
 */
export function useFeed<T extends SocialPost = SocialPost>(): FeedResult<T> {
  const { adapter } = useSocialConfig<T>();
  const kind = useSocialStore((s) => s.feed);
  const setKind = useSocialStore((s) => s.setFeed);
  const following = useSocialStore((s) => s.following);

  const { data, loading, error } = useAsync<T[]>(
    () => adapter.getFeed?.(kind) ?? Promise.resolve([]),
    [adapter, kind]
  );

  const posts =
    kind === 'following' && data
      ? data.filter((p) => following.includes(p.author.handle))
      : data ?? [];

  return { posts, loading, error, kind, setKind };
}
