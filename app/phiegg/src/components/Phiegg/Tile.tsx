import React from 'react';
import type { DepthAction } from '@pui/components';
import { DepthMedia, Picture, Pressable, Text, Title, WorldScene } from '@pui/components';
import type { DepthLayer } from '@pui/components';
import { itemOf } from '../../lib/data';

/** Scene base colour per tone, mixes of the theme, so the scenes follow the palette. */
const SCENE_COLOR: Record<string, string> = { accent: 'var(--phi-color-primary)', sage: 'var(--phi-color-success)', neutral: 'var(--phi-color-gray-500, #8a8a8e)', ink: 'var(--phi-color-gray-800, #2c2c2e)' };
import { renderColour, renderFor } from '../../lib/depth';
import { PersonAvatar } from './PersonAvatar';
import { EntityAvatar } from './EntityAvatar';
import styles from './Tile.module.scss';

/** What a card's three layers come from. Anything not given is filled from the pools in lib/depth.ts. */
export type TileDepth = { worldId?: string | null; clubId?: string | null; personId?: string | null; mid?: string; face?: React.ReactNode;
  /** The record the card is about, for its default profile icon when there is no person (a world, a host…). */
  entityId?: string; entityName?: string };

type TileProps = {
  tone: string; title?: string; sub?: string; ratio?: string; big?: boolean; badges?: React.ReactNode;
  onClick?: () => void; animate?: boolean;
  /** Parent-layer picture; defaults to the world's own scene image. */
  image?: string;
  /** Draw the parent layer as the seeded SVG scene instead of a picture. */
  drawn?: boolean;
  depth?: TileDepth;
  /** Perspective floor grid on the parent layer (worlds, arenas). */
  grid?: boolean;
  /** Deck depth: copies of the card's image stacked behind it (0 = a single card). */
  deck?: number;
  /** 'down' hangs the deck below the card, the opposite cascade (feed posts and shots). */
  deckDirection?: 'up' | 'down';
  /** The PFT's own colour (a look's hex). Defaults to one of the club's / world's look colours, so no card is random. */
  color?: string;
  /** The picture alone, as an object: no look in the middle, no face in front, no deck (a world's own render). */
  solo?: boolean;
  /** Who it belongs to, at the top right; and its actions down the right on hover (kit DepthMedia). */
  owner?: React.ReactNode;
  actions?: DepthAction[];
};

/**
 * Every Phiegg card: three nested image layers in decreasing size, scene → framed look → profile photo , 
 * with parallax, the game hover and the app's gradient on the frame.
 */
/**
 * The colour and render a Tile wears, for a wrapper that must match it (a post card around its shot): colour comes
 * from the PFT (the card's own look colour, else the club's / world's look palette, seeded per card), and the dress
 * and the background always match: an explicit render brings its measured colour; otherwise the render is picked to
 * be the card's colour, and the background takes that render's own colour.
 */
export function tileColour({ tone, title, sub, depth = {}, color }: Pick<TileProps, 'tone' | 'title' | 'sub' | 'depth' | 'color'>) {
  const seed = (title ?? '') + (sub ?? '') + tone;
  const club = itemOf('club', depth.clubId);
  const world = itemOf('world', depth.worldId) ?? itemOf('world', club?.worldIds?.[0]);
  const palette = club?.colors?.length ? club.colors : world?.colors;
  const want = color ?? (palette?.length ? palette[[...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % palette.length] : undefined);
  const render = depth.mid ? { src: depth.mid, hex: renderColour(depth.mid) ?? want } : renderFor(seed, depth.clubId, want);
  return { seed, club, world, render, hex: render?.hex ?? want };
}

export const Tile: React.FC<TileProps> = ({ tone, title, sub, ratio = '4/5', big, badges, onClick, animate, image, drawn, depth = {}, grid, deck = 3, deckDirection = 'up', color, solo, owner, actions }) => {
  const { seed, club, world, render, hex } = tileColour({ tone, title, sub, depth, color });
  // The parent layer: the card's own picture when it has one (a world's scene), else the SVG scene drawn in the card's
  // colour, so the dress, the scene and the card around it are one colour.
  const scene = drawn ? undefined : image;
  // Front layer: the person behind the card, else its club's icon, else the record's own icon.
  const face: DepthLayer = depth.face
    ? { node: depth.face }
    : depth.personId
      ? { node: <PersonAvatar id={depth.personId} size="xl" /> }
      : club ? { node: <EntityAvatar id={club.id} name={club.name} size="xl" /> }
      : { node: <EntityAvatar id={depth.entityId ?? seed} name={depth.entityName ?? title ?? '·'} size="xl" /> };
  // Footer, bottom-left: the world's icon (or the record's own icon when the card is not in a world).
  const footerIcon = world ? <EntityAvatar id={world.id} name={world.name} size="lg" />
    : depth.entityId && (depth.personId || club) ? <EntityAvatar id={depth.entityId} name={depth.entityName ?? title ?? '·'} size="lg" /> : undefined;
  return (
    <DepthMedia
      className={[styles.tile, ratio === 'auto' ? styles.fill : '', styles[tone], animate ? styles.animate : ''].join(' ')}
      ratio={ratio}
      // A picture of its own (a post, a city): its blurred copy fills the card and the picture sits whole in the middle,
      // never on a painted colour.
      back={scene && solo ? { node: <Picture src={scene} /> }
        : scene ? { src: scene, alt: '' }
        : { node: <WorldScene seed={depth.worldId ?? depth.clubId ?? seed} color={hex ?? SCENE_COLOR[itemOf('world', depth.worldId)?.tone ?? tone] ?? SCENE_COLOR.accent} night={(itemOf('world', depth.worldId)?.tone ?? tone) === 'ink'} /> }}
      mid={solo ? undefined : { src: render?.src, fit: 'contain', alt: '' }}
      front={solo ? undefined : face}
      midSize={big ? 0.8 : 0.72}
      grid={grid}
      deck={solo ? 0 : deck}
      deckDirection={deckDirection}
      footerIcon={solo || scene ? undefined : footerIcon}
      owner={owner}
      actions={actions}
      badges={badges}
      onClick={onClick}
      aria-label={onClick ? title : undefined}
    >
      {title && <Title level={big ? 2 : 4} size={big ? '2xl' : 'md'} className={styles.title}>{title}</Title>}
      {sub && <Text size="xs" className={styles.sub}>{sub}</Text>}
    </DepthMedia>
  );
};

export const Ring: React.FC<{ onClick?: () => void; children: React.ReactNode; label: string }> = ({ onClick, children, label }) => (
  <Pressable inline rounded="full" className={styles.avatarRing} onClick={onClick} aria-label={label}>{children}</Pressable>
);
