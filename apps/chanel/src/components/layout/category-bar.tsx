import React from 'react';
import { TabList, Container } from '@pui/components';
import { useRouter } from '../../router';
import { routes } from '../../lib/routes';
import { categoriesSync } from '../../lib/services';

/** The category rail beneath the utility bar. */
export const CategoryBar: React.FC = () => {
  const { navigate, path } = useRouter();
  const categories = categoriesSync();
  const active = categories.find((c) => path === routes.category(c.slug))?.slug ?? '';

  return (
    <Container size="full">
      <TabList
        items={categories.map((c) => ({ id: c.slug, label: c.name }))}
        activeId={active}
        onChange={(slug) => navigate(routes.category(slug))}
      />
    </Container>
  );
};
