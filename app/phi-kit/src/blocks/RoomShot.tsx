import React from 'react';
import { Frame, Lightbox, Picture, Pressable, Stack, type LightboxItem } from '@pui/components';
import { assetUrl } from '../data';
import words from '../words.json';

const W = words.view;
const say = (s: string, k: string, v: string) => s.replace('{' + k + '}', v);

/** A picture that was posted: its file as app data names it, and who posted it and when. */
export type Seen = { src: string; name?: string; when?: string; face?: React.ReactNode };

/**
 * The pictures of a message (or a person's, on their profile): each whole in its own frame, never cropped. A press
 * on one opens it over the app in the kit's viewer, where every picture of `all` can be stepped through (a room
 * gives all of its own, so the strip at the viewer's foot is the room's); with no `all` they are the ones shown here.
 */
export const Shot: React.FC<{ list: string[]; alt: string; all?: Seen[]; label?: string }> = ({ list, alt, all, label }) => {
  const seen: Seen[] = all?.length ? all : list.map((src) => ({ src, name: alt }));
  const [at, setAt] = React.useState<number | null>(null);
  const item: LightboxItem[] = seen.map((s) => ({ ...s, src: assetUrl(s.src), alt: s.name }));
  return (
    <>
      <Stack direction="row" gap={2} wrap>
        {list.map((src) => (
          <Pressable key={src} aria-label={say(W.see, 'name', alt)} onClick={() => setAt(Math.max(0, seen.findIndex((s) => s.src === src)))}>
            <Frame ratio="1/1" width="min(12.5rem, 100%)" rounded="md"><Picture src={assetUrl(src)} alt={alt} /></Frame>
          </Pressable>))}
      </Stack>
      {at != null && <Lightbox list={item} index={at} onIndex={setAt} onClose={() => setAt(null)} label={label ?? say(W.of, 'name', alt)} labels={W} />}
    </>
  );
};
