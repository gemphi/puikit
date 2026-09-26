import React from 'react';
import { Text } from '../../primitives/Text';
import { Span } from '../../primitives/Span';
import { Title } from '../../primitives/Title';
import { Button } from '../../primitives/Button';
import { Stack } from '../../layout/Stack';
import { Link } from '../../navigation/Link';
import { Card, CardBody, CardImage } from '../../display/card';

/**
 * - `feature`: a full-width editorial panel — the shape a hero slide takes.
 * - `card`: an image tile with its label beneath, for a row of looks or shows.
 * - `compact`: label only.
 */
export type EditorialItemVariant = 'feature' | 'card' | 'compact';

export interface EditorialItemProps {
  id: string;
  title: string;
  eyebrow?: string;
  body?: string;
  image?: string;
  /** Destination. Present means the whole entry is a real link. */
  href?: string;
  ctaLabel?: string;
  variant?: EditorialItemVariant;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * One editorial entry — a campaign panel, a look, a show.
 *
 * The same three fields drive every variant, so a storefront adds a section by
 * supplying data rather than by writing another card.
 */
export const EditorialItem: React.FC<EditorialItemProps> = ({
  id,
  title,
  eyebrow,
  body,
  image,
  href,
  ctaLabel,
  variant = 'card',
  onSelect,
  className,
}) => {
  const isFeature = variant === 'feature';

  const navigate = (e: React.MouseEvent) => {
    if (!onSelect) return;
    if (href && (e.metaKey || e.ctrlKey || e.shiftKey)) return;
    if (href) e.preventDefault();
    onSelect(id);
  };

  const heading = (
    <Stack direction="column" gap={1}>
      {eyebrow && <Span variant="muted">{eyebrow}</Span>}
      <Title level={isFeature ? 2 : 6}>{title}</Title>
      {body && variant !== 'compact' && (
        <Text size="sm" intent="secondary">
          {body}
        </Text>
      )}
    </Stack>
  );

  return (
    <Card
      className={className}
      variant={isFeature ? 'default' : 'flat'}
      data-variant={variant}
      /* The small tiles carry the bottom-to-top brand wash; a feature panel is
         large enough that a wash across it would read as a tinted block. */
      data-gradient-card={isFeature ? undefined : 'true'}
      hoverable={Boolean(onSelect || href)}
    >
      {image && variant !== 'compact' && (
        href ? (
          <Link href={href} onClick={navigate} tabIndex={-1} aria-hidden="true">
            <CardImage src={image} alt={title} loading="lazy" />
          </Link>
        ) : (
          <CardImage src={image} alt={title} loading="lazy" />
        )
      )}
      <CardBody>
        <Stack direction="column" gap={isFeature ? 3 : 2} align="stretch">
          {href ? (
            <Link href={href} variant="default" onClick={navigate}>
              {heading}
            </Link>
          ) : (
            heading
          )}
          {ctaLabel && (
            <Stack direction="row">
              <Button
                variant={isFeature ? 'primary' : 'outline'}
                size="sm"
                onClick={(e) => navigate(e as unknown as React.MouseEvent)}
              >
                {ctaLabel}
              </Button>
            </Stack>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
