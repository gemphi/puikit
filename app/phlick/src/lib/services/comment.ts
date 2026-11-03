import raw from '../../mocks/api-comments.json';
import { resolve } from './client';
import { creatorAvatar } from '../media';
import type { SocialComment } from '@pui/types';

const hydrate = (c: SocialComment): SocialComment => ({
  ...c,
  author: { ...c.author, avatar: creatorAvatar(c.author) },
  replies: c.replies?.map(hydrate),
});

const comments: SocialComment[] = (raw as SocialComment[]).map(hydrate);

export const getComments = async (postId: string): Promise<SocialComment[]> =>
  resolve(comments.filter((c) => c.postId === postId));
