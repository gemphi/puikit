'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, Music, Play, Volume2, VolumeX } from 'lucide-react';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Avatar } from '../../media/Avatar';
import { Stack } from '../../layout/Stack';
import { EngagementRail, type EngagementRailProps } from '../actions/rail';
import { cn } from '../../../utils/cn';
import styles from '../styles.module.scss';
import { Box } from '../../layout/Box';

/**
 * - `immersive`: the full-height feed slide — poster, scrim, caption, sound
 *   row, with the engagement rail riding beside the frame.
 * - `card`: a 9:16 discover tile with views and a clamped caption.
 * - `row`: compact author + caption line, for lists.
 */
export type PostItemVariant = 'immersive' | 'card' | 'row';

export interface PostItemLabels {
  mute: string;
  unmute: string;
}

export const DEFAULT_POST_ITEM_LABELS: PostItemLabels = {
  mute: 'Mute',
  unmute: 'Unmute',
};

export interface PostItemProps {
  id: string;
  author: { handle: string; name: string; avatar?: string };
  caption: string;
  hashtags?: string[];
  sound?: { title: string; artist: string };
  poster?: string;
  /** Photo-mode: several stills, played left to right on the immersive frame. */
  slides?: string[];
  /** How long each slide holds before advancing. */
  slideMs?: number;
  /** Badge over a `card` tile — a LIVE flag, say. */
  badge?: React.ReactNode;
  /** The tile's shape on `card` — each catalogue declares its own. */
  ratio?: 'portrait' | 'square' | 'wide';
  /** Pre-formatted view count, shown on the `card` variant. */
  views?: string;
  variant?: PostItemVariant;
  /** Everything the rail needs; omitted means no rail (card and row). */
  rail?: Omit<EngagementRailProps, 'author' | 'className'>;
  /** On a single-post surface, arrow keys walk a deck's slides. */
  keyboard?: boolean;
  onOpen?: (id: string) => void;
  labels?: Partial<PostItemLabels>;
  className?: string;
}

/**
 * One post. The immersive variant is the reference feed slide: the frame is a
 * 9:16 stage whose poster breathes like paused footage, the caption sits on a
 * scrim that guarantees contrast on any imagery, and the sound line marquees
 * when it overflows. All copy and all counts arrive as props.
 */
export const PostItem: React.FC<PostItemProps> = ({
  id,
  author,
  caption,
  hashtags = [],
  sound,
  poster,
  slides,
  slideMs = 3500,
  badge,
  views,
  ratio,
  variant = 'card',
  rail,
  keyboard = false,
  onOpen,
  labels,
  className,
}) => {
  const copy = { ...DEFAULT_POST_ITEM_LABELS, ...labels };
  const [muted, setMuted] = useState(true);

  // Photo-mode playback: the deck advances on its own clock and loops; a tap
  // on a segment jumps. The keyed state restarts cleanly when the deck jumps.
  const deck = slides && slides.length > 1 ? slides : null;
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (!deck || variant !== 'immersive') return;
    const id = window.setInterval(() => setSlide((i) => (i + 1) % deck.length), slideMs);
    return () => window.clearInterval(id);
  }, [deck, slideMs, variant, slide]);

  // Left/right walk the deck, the reference's own keys — only where the post
  // has the stage to itself, so a feed of decks doesn't all turn at once.
  useEffect(() => {
    if (!keyboard || !deck || variant !== 'immersive' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); setSlide((i) => (i + 1) % deck.length); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setSlide((i) => (i - 1 + deck.length) % deck.length); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [keyboard, deck, variant]);

  if (variant === 'immersive' && deck) {
    const n = deck.length;
    const prevI = (slide - 1 + n) % n;
    const nextI = (slide + 1) % n;
    const line = sound ? `${sound.title} · ${sound.artist}` : null;
    return (
      <Stack direction="row" align="end" gap={3} className={cn(styles.spotlightSlide, className)} data-variant={variant}>
        <Box
          className={styles.spotlightFrame}
          data-spotlight="true"
          role={onOpen ? 'link' : undefined}
          tabIndex={onOpen ? 0 : undefined}
          onClick={onOpen ? () => onOpen(id) : undefined}
          onKeyDown={onOpen ? (e) => { if (e.key === 'Enter') onOpen(id); } : undefined}
        >
          <Box className={styles.spotlightRow}>
            {([['side', prevI], ['mid', slide], ['side', nextI]] as const).map(([role, i]) => (
              <button
                key={deck[i]}
                type="button"
                className={styles.spotCell}
                data-role={role}
                data-index={i}
                aria-label={`${i + 1} / ${n}`}
                aria-current={role === 'mid'}
                onClick={(e) => { e.stopPropagation(); if (role === 'side') setSlide(i); }}
              >
                <img src={deck[i]} alt="" />
              </button>
            ))}

            <Box className={styles.spotNavCol}>
              <button
                type="button"
                className={styles.railButton}
                aria-label={`${prevI + 1} / ${n}`}
                onClick={(e) => { e.stopPropagation(); setSlide(prevI); }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={styles.railButton}
                aria-label={`${nextI + 1} / ${n}`}
                onClick={(e) => { e.stopPropagation(); setSlide(nextI); }}
              >
                <ChevronRight size={18} />
              </button>
            </Box>
          </Box>

          <Box className={styles.slideBar} style={{ '--slide-ms': `${slideMs}ms` } as React.CSSProperties}>
            {deck.map((src, i) => (
              <button
                key={src}
                type="button"
                className={styles.slideSegment}
                data-played={i < slide ? 'true' : undefined}
                data-current={i === slide ? 'true' : undefined}
                aria-label={`${i + 1} / ${deck.length}`}
                aria-current={i === slide}
                onClick={(e) => { e.stopPropagation(); setSlide(i); }}
              />
            ))}
          </Box>

          <Box className={styles.spotMeta}>
            <Text as="span" weight="semibold">@{author.handle}</Text>
            <Text as="span" size="sm">
              {caption}{' '}
              {hashtags.map((h) => (
                <Span key={h} className={styles.hashtag}>#{h} </Span>
              ))}
            </Text>
            {line && (
              <Span variant="muted"><Music size={12} /> {line}</Span>
            )}
          </Box>
        </Box>

        {rail && <EngagementRail author={author} {...rail} />}
      </Stack>
    );
  }

  if (variant === 'immersive') {
    return (
      <Stack direction="row" align="end" gap={3} className={className} data-variant={variant}>
        <Box
          className={styles.frame}
          role={onOpen ? 'link' : undefined}
          tabIndex={onOpen ? 0 : undefined}
          onClick={onOpen ? () => onOpen(id) : undefined}
          onKeyDown={onOpen ? (e) => { if (e.key === 'Enter') onOpen(id); } : undefined}
        >
          {deck ? (
            <>
              {deck.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={styles.slideImg}
                  data-current={i === slide ? 'true' : undefined}
                />
              ))}
              <Box className={styles.slideBar} style={{ '--slide-ms': `${slideMs}ms` } as React.CSSProperties}>
                {deck.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={styles.slideSegment}
                    data-played={i < slide ? 'true' : undefined}
                    data-current={i === slide ? 'true' : undefined}
                    aria-label={`${i + 1} / ${deck.length}`}
                    aria-current={i === slide}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlide(i);
                    }}
                  />
                ))}
              </Box>
            </>
          ) : (
            poster && <img src={poster} alt="" className={styles.poster} />
          )}
          <Box className={styles.scrim} />

          <Box className={styles.frameTop}>
            <button
              type="button"
              className={styles.railButton}
              aria-label={muted ? copy.unmute : copy.mute}
              aria-pressed={muted}
              onClick={(e) => {
                e.stopPropagation();
                setMuted((m) => !m);
              }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </Box>

          <Box className={styles.caption}>
            <Text as="span" weight="semibold">@{author.handle}</Text>
            <Text as="span" size="sm" className={styles.captionBody}>
              {caption}{' '}
              {hashtags.map((h) => (
                <Span key={h} className={styles.hashtag}>#{h} </Span>
              ))}
            </Text>
            {sound && (() => {
              const line = `${sound.title} · ${sound.artist}`;
              // Marquee only when the line would actually overflow; a short
              // title sliding out from under the note icon reads as a glitch.
              const long = line.length > 30;
              return (
                <Box className={styles.sound}>
                  <Music size={14} />
                  <span className={long ? styles.soundText : undefined}>
                    {long ? `${line} — ${line}` : line}
                  </span>
                </Box>
              );
            })()}
          </Box>
        </Box>

        {rail && <EngagementRail author={author} {...rail} />}
      </Stack>
    );
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        className={cn(styles.tile, className)}
        data-variant={variant}
        data-ratio={ratio}
        onClick={onOpen ? () => onOpen(id) : undefined}
      >
        {(slides?.[0] ?? poster) && <img src={slides?.[0] ?? poster} alt={caption} loading="lazy" />}
        <Box className={styles.tileScrim} />
        {badge ? (
          <span className={styles.tileBadge}>{badge}</span>
        ) : (
          slides && slides.length > 1 && (
            <span className={styles.tileBadge}>
              <Images size={12} /> {slides.length}
            </span>
          )
        )}
        <Box className={styles.tileMeta}>
          <Text as="span" size="sm" className={styles.tileCaption}>{caption}</Text>
          <Stack direction="row" align="center" justify="between" gap={2}>
            <Span variant="muted">@{author.handle}</Span>
            {views && (
              <Span className={styles.views}>
                <Play size={12} fill="currentColor" /> {views}
              </Span>
            )}
          </Stack>
        </Box>
      </button>
    );
  }

  return (
    <Stack
      direction="row"
      align="center"
      gap={2}
      className={className}
      data-variant={variant}
      data-clickable={onOpen ? 'true' : undefined}
      onClick={onOpen ? () => onOpen(id) : undefined}
    >
      <Avatar src={author.avatar} alt={author.name} initials={author.name.slice(0, 2)} size="sm" />
      <Stack direction="column" gap={0}>
        <Text as="span" weight="semibold" size="sm">@{author.handle}</Text>
        <Text as="span" size="sm" intent="secondary" className={styles.tileCaption}>{caption}</Text>
      </Stack>
    </Stack>
  );
};
