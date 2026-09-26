import React from 'react';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Title } from '../../primitives/Title';
import { Stack } from '../../layout/Stack';
import { Card, CardBody, CardImage } from '../../display/card';

/**
 * - `card`: image tile with the name over it.
 * - `row`: name and tagline in a line.
 * - `compact`: name only, for nav rails.
 */
export type CategoryItemVariant = 'card' | 'row' | 'compact';

export interface CategoryItemProps {
  slug: string;
  name: string;
  tagline?: string;
  image?: string;
  count?: number;
  active?: boolean;
  variant?: CategoryItemVariant;
  onSelect?: (slug: string) => void;
  className?: string;
}

/** A single category entry. */
export const CategoryItem: React.FC<CategoryItemProps> = ({
  slug,
  name,
  tagline,
  image,
  count,
  active = false,
  variant = 'card',
  onSelect,
  className,
}) => {
  const isRow = variant === 'row' || variant === 'compact';

  return (
    <Card
      className={className}
      variant={variant === 'card' ? 'default' : 'flat'}
      data-variant={variant}
      data-active={active ? 'true' : undefined}
      hoverable={Boolean(onSelect)}
      onClick={onSelect ? () => onSelect(slug) : undefined}
    >
      {variant === 'card' && image && <CardImage src={image} alt={name} loading="lazy" />}
      <CardBody>
        <Stack direction={isRow ? 'row' : 'column'} gap={1} align={isRow ? 'center' : 'stretch'} justify={isRow ? 'between' : undefined}>
          <Title level={6}>{name}</Title>
          {variant !== 'compact' && tagline && <Text size="sm" intent="secondary">{tagline}</Text>}
          {count !== undefined && <Span variant="muted">{count}</Span>}
        </Stack>
      </CardBody>
    </Card>
  );
};
