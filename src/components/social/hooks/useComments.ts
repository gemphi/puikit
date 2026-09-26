import { useAsync } from '../../shop/hooks/useAsync';
import { useSocialConfig } from '../provider';
import type { SocialComment } from '../../../types/social';

export interface CommentsResult {
  comments: SocialComment[];
  loading: boolean;
  error: Error | null;
}

/** Comments for one post; `null` postId loads nothing (the drawer is closed). */
export function useComments(postId: string | null): CommentsResult {
  const { adapter } = useSocialConfig();
  const { data, loading, error } = useAsync<SocialComment[]>(
    () => (postId ? adapter.getComments?.(postId) ?? Promise.resolve([]) : Promise.resolve([])),
    [adapter, postId]
  );
  return { comments: data ?? [], loading: Boolean(postId) && loading, error };
}
