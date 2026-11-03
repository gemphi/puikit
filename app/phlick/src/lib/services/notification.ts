import { resolve } from './client';
import { creatorByHandle } from './creator';
import type { SocialAuthor } from '@pui/types';

export interface Notification {
  id: string;
  kind: 'follow' | 'like' | 'comment' | 'mention';
  author: SocialAuthor;
  when: string;
}

const ITEMS: Array<[string, Notification['kind'], string]> = [
  ['n01', 'like', 'aria.moves'],
  ['n02', 'follow', 'stray.cafe'],
  ['n03', 'comment', 'kit.paints'],
  ['n04', 'like', 'velo.vera'],
  ['n05', 'mention', 'aria.moves'],
];

export const getNotifications = async (): Promise<Notification[]> =>
  resolve(
    ITEMS.map(([id, kind, handle], i) => ({
      id,
      kind,
      author: creatorByHandle(handle),
      when: `${(i + 1) * 3}h`,
    }))
  );
