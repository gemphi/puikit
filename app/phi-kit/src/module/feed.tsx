import { PostList, formatCount } from '@pui/components';
import React from 'react';
import { assetUrl, type Block } from '../data';
import { fetchRows, type Pull } from '../pulls';
import type { GridItem } from '../blocks/Grid';

type Row = Record<string, unknown> & { id: string };
/** Which record field fills which part of a post. Paths may go through a join: `club.name`. */
type FeedMap = { author?: string; avatar?: string; caption?: string; tags?: string; views?: string; image?: string };

const DEFAULT_MAP: FeedMap = { author: 'name', caption: 'caption', tags: 'tags', views: 'likes', image: 'image' };
const dig = (r: unknown, path?: string): unknown => (path ? path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r) : undefined);
const text = (v: unknown) => (v == null || typeof v === 'object' ? '' : String(v));
const art = (v: unknown) => { const s = text(v); return !s ? undefined : /^[a-z]+:/.test(s) ? s : 'phiegg:' + s.replace(/^assets\//, ''); };

const postOf = (r: Row, map: FeedMap) => {
  const name = text(dig(r, map.author)) || text(r.slug) || 'Phiace';
  const views = Number(dig(r, map.views));
  const image = art(dig(r, map.image));
  return {
    id: r.id,
    author: { handle: name, name, avatar: assetUrl(art(dig(r, map.avatar))) },
    caption: text(dig(r, map.caption)),
    hashtags: ((dig(r, map.tags) as string[] | undefined) ?? []).map((t) => String(t).replace(/^#/, '')),
    poster: assetUrl(image),
    views: Number.isFinite(views) ? formatCount(views) : undefined,
  };
};

/**
 * The feed every app shares. Config: { "kind": "feed", "pull": { "kind": "shot", "n": 12, "sort": "likes",
 * "join": ["clubId"] }, "map": { "author": "club.name", "image": "club.image" }, "variant": "card" }. Any kind can be
 * a feed; a post opens the record's sheet like any other record.
 */
export const Feed: React.FC<{ b: Block; onOpen: (it: GridItem) => void }> = ({ b, onOpen }) => {
  const pull = b.pull as Pull | undefined;
  const map: FeedMap = { ...DEFAULT_MAP, ...(b.map as FeedMap | undefined) };
  const [rows, setRows] = React.useState<Row[] | null>(b.items ?? null);
  const key = JSON.stringify(pull);
  React.useEffect(() => {
    if (!pull) return;
    void fetchRows(pull).then((r) => setRows((r?.rows as Row[] | undefined) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const open = (id: string) => onOpen({ title: '', route: '#/' + (pull?.kind ?? 'post') + '/' + encodeURIComponent(id) });
  return (
    <PostList
      variant={b.variant ?? 'card'}
      columns={b.columns}
      loading={rows === null}
      posts={(rows ?? []).map((r) => ({ ...postOf(r, map), onOpen: open }))}
      empty={{ title: b.emptyTitle ?? 'Nothing here yet' }}
    />
  );
};
