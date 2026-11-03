import raw from '../../mocks/api-creators.json';
import { resolve } from './client';
import { creatorAvatar } from '../media';
import type { SocialAuthor } from '@pui/types';

const creators: SocialAuthor[] = (raw as SocialAuthor[]).map((c) => ({
  ...c,
  avatar: creatorAvatar(c),
}));

export const getCreators = async (): Promise<SocialAuthor[]> => resolve(creators);

export const getCreator = async (handle: string): Promise<SocialAuthor | null> =>
  resolve(creators.find((c) => c.handle === handle) ?? null);

/** Synchronous lookup for joining posts to their authors at load time. */
/** Every fixture creator's handle, for generators that need a byline. */
export const creatorHandles = (): string[] => creators.map((c) => c.handle);

export const creatorByHandle = (handle: string): SocialAuthor =>
  creators.find((c) => c.handle === handle) ?? { handle, name: handle };
