/**
 * The cards of Home's stage (kit CardStage): only what Phiegg shows as pictures, of four kinds, taken in turn so the
 * stage mixes them: reels (the old gembar's, by scripts/gembar.py, and the feed's posts of several pictures), shows
 * (their first look's render), drops (their first look's render) and worlds (their finished view). Each card's id
 * opens it as a post (lib/picturePost.ts). How many of each, and the kinds' words, are landing.json `stage`.
 */
import type { StageCard } from '@pui/components';
import type { ID, World } from '../../types/phiegg';
import { D, feedPosts, itemImage, itemOf } from '../../lib/data';
import { mediaUrl } from '../../lib/media';
import { REELS, pictureId, reelPicture } from '../../lib/picturePost';

/** A look's render, front first. */
const lookPicture = (id?: ID): string | undefined => {
  const look = id ? (itemOf('look', id) as { views?: Record<string, string> } | undefined) : undefined;
  const path = look?.views?.FRONT ?? Object.values(look?.views ?? {})[0];
  return path ? itemImage(path) : undefined;
};

/** Lists taken in turn: the first of each, then the second of each, and on. */
const inTurn = <T,>(lists: T[][]): T[] => {
  const out: T[] = [];
  for (let k = 0; lists.some((list) => k < list.length); k++) lists.forEach((list) => { if (k < list.length) out.push(list[k]); });
  return out;
};

export const stageCards = (cities: World[], view: (w: World, size: 'sm' | 'lg') => string | undefined, most: number): StageCard[] => {
  const card = (id: string, image: string | undefined, title: string, sub: string, kind: string): StageCard[] => (image ? [{ id, image, title, sub, kind }] : []);
  const reels = [
    ...REELS.flatMap((reel) => card(pictureId(reelPicture(reel.picture[0], 'lg')), mediaUrl(reelPicture(reel.picture[0], 'lg')), reel.name, reel.caption, 'reel')),
    ...feedPosts().filter((post) => post.slides.length > 1 && post.slides[0].src).flatMap((post) => card(post.id, mediaUrl(post.slides[0].src!), post.slides[0].title, post.caption, 'reel')),
  ];
  const shows = D.shows.shows.flatMap((show) => {
    const first = (show.looks as { lookId?: ID }[] | undefined)?.[0]?.lookId;
    return card(show.id, lookPicture(first), show.title, itemOf('world', show.worldId)?.name ?? '', 'show');
  });
  const drops = D.pools.pools.flatMap((pool) => card(pool.id, lookPicture((pool as { lookIds?: ID[] }).lookIds?.[0]), pool.name, itemOf('club', pool.clubId)?.name ?? '', 'drop'));
  const worlds = cities.flatMap((w) => card(w.id, view(w, 'lg'), w.name, w.landName && w.landName !== w.name ? w.landName : w.landGroup ?? '', 'world'));
  return inTurn([reels, shows, drops, worlds]).slice(0, most);
};
