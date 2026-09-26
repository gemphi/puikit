import React from 'react';
import { Section, Container, Stack, Title, Button } from '@pui/components';
import { useShop, WishlistList } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { productImage } from '../lib/media';
import { t } from '../locales/t';

export const WishlistPage: React.FC = () => {
  const { navigate } = useRouter();
  const shop = useShop();

  return (
    <Section>
      <Container size="lg">
        <Stack direction="column" gap={4}>
          <Title level={2}>{t.wishlist.title}</Title>
          <WishlistList
            variant="row"
            items={shop.wishlist.items.map((item) => ({
              id: item.id,
              title: item.title,
              price: item.price,
              image: productImage(item),
              onMoveToCart: () => shop.wishlist.moveToCart(item),
              onRemove: () => shop.wishlist.remove(item.id),
            }))}
            empty={{
              title: t.wishlist.emptyTitle,
              description: t.wishlist.emptyBody,
              action: (
                <Button variant="primary" onClick={() => navigate(routes.home())}>
                  {t.cart.continue}
                </Button>
              ),
            }}
          />
        </Stack>
      </Container>
    </Section>
  );
};
