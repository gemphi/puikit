import { Image, Stack, Text } from '@pui/components';
import React from 'react';
import type { Block } from '../data';
import s from '../kit.module.scss';

/** A figure: an image from the app's public folder, with a caption. Used by
 *  the Phiano forest views to show what `bin/forest` measured (docs/155). */
export const Figure: React.FC<{ b: Block }> = ({ b }) => (
  <Stack as="figure" direction="column" gap={2} margin={0} maxWidth="980px">
    <Image className={s.figImg} src={import.meta.env.BASE_URL + (b.src as string)} alt={(b.alt as string) || (b.caption as string) || ''} loading="lazy" />
    {b.caption ? <Text as="figcaption" size="xs" intent="muted">{b.caption as string}</Text> : null}
  </Stack>
);
