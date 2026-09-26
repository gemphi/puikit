import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Card, CardBody } from '../../display/card';
import styles from './styles.module.scss';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
};

export const Skeleton = ({ width, height, circle = false, className = '', style, ...props }: SkeletonProps) => {
  return (
    <Box
      className={cn(styles.skeleton, circle && styles.circle, className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
};

export interface SkeletonTextProps {
  /** Number of lines to draw. */
  lines?: number;
  /** Width of each line, cycled. The last line is shortened automatically. */
  widths?: string[];
  lineHeight?: string;
  gap?: 1 | 2 | 3;
  className?: string;
}

const DEFAULT_WIDTHS = ['70%', '90%', '45%'];

/**
 * A paragraph-shaped placeholder.
 *
 * Line widths vary and the final line is shorter, because a block of
 * identical-width bars reads as a table, not as text.
 */
export const SkeletonText = ({
  lines = 3,
  widths = DEFAULT_WIDTHS,
  lineHeight = '0.875rem',
  gap = 2,
  className,
}: SkeletonTextProps) => (
  <Stack gap={gap} className={className}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height={lineHeight} width={widths[i % widths.length]} />
    ))}
  </Stack>
);

export interface SkeletonCardProps {
  /** Draw a media block. `true` uses the default size for the direction. */
  media?: boolean;
  mediaWidth?: string;
  mediaHeight?: string;
  lines?: number;
  /** `column` stacks media above the text; `row` places it alongside. */
  direction?: 'row' | 'column';
  flat?: boolean;
  className?: string;
}

/**
 * The single placeholder card used across the library.
 *
 * Every list renders its loading state through this rather than assembling
 * `Card` + `Skeleton` itself — which is how a skeleton ends up looking
 * different on each page.
 */
export const SkeletonCard = ({
  media = false,
  mediaWidth,
  mediaHeight,
  lines = 3,
  direction = 'column',
  flat = false,
  className,
}: SkeletonCardProps) => {
  const isRow = direction === 'row';
  const width = mediaWidth ?? (isRow ? '4rem' : undefined);
  const height = mediaHeight ?? (isRow ? '4rem' : '12rem');

  return (
    <Card
      variant={flat || isRow ? 'flat' : 'default'}
      hoverable={false}
      className={className}
      data-skeleton="true"
      aria-hidden="true"
    >
      {media && !isRow && <Skeleton height={height} />}
      <CardBody>
        <Stack direction={isRow ? 'row' : 'column'} align={isRow ? 'center' : 'stretch'} gap={3}>
          {media && isRow && <Skeleton width={width} height={height} />}
          <SkeletonText lines={lines} />
        </Stack>
      </CardBody>
    </Card>
  );
};
