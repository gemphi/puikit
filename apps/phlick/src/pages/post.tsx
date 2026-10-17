import React, { useState } from 'react';
import { Box, Button, Col, Container, EmptyState, Row } from '@pui/components';
import { PostStage, useSocialConfig } from '@pui/social';
import { useSidebarContraction } from '@pui/components';
import { useAsync } from '@pui/shop';
import { usePostSlides } from '../lib/present';
import { PostComments } from '../components/post-comments';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';
import s from '../styles/phlick.module.scss';
import type { Post } from '../social';

/**
 * One post, on its own page: the frame with its rail pinned on the left while
 * the author, caption and thread scroll on the right. Both the frame and the
 * comment control on any feed land here.
 */
export const PostPage: React.FC<{ id: string }> = ({ id }) => {
  const { navigate, back } = useRouter();
  const { adapter } = useSocialConfig<Post>();
  // The rail's comment control draws the thread away and back, so the frame
  // can take the stage alone.
  // A post opens on its own — the thread arrives only when asked for,
  // shrinking the square to half the stage as the panel slides in.
  const [commentsOpen, setCommentsOpen] = useState(false);
  useSidebarContraction(commentsOpen);
  const toSlide = usePostSlides(() => setCommentsOpen((o) => !o));

  const post = useAsync<Post | null>(
    () => adapter.getPostById?.(id) ?? Promise.resolve(null),
    [adapter, id]
  );

  // The feed's order gives the stage its prev/next chevrons.
  const all = useAsync<Post[]>(() => adapter.getFeed?.('for-you') ?? Promise.resolve([]), [adapter]);
  const order = all.data ?? [];
  const at = order.findIndex((x) => x.id === id);
  const prev = at > 0 ? order[at - 1] : null;
  const next = at >= 0 && at < order.length - 1 ? order[at + 1] : null;

  if (!post.loading && !post.data) {
    return (
      <EmptyState
        title={t.post.notFoundTitle}
        description={t.post.notFoundBody}
        action={
          <Button variant="primary" onClick={() => navigate(routes.forYou())}>
            {t.post.back}
          </Button>
        }
      />
    );
  }

  const p = post.data;

  return (
    <Container size="xl" className={s.pagePad}>
      <Row gap={6} align="start" justify="center" wrap>
        <Col xs={12} md={commentsOpen ? 6 : 9} lg={commentsOpen ? 6 : 8} className={s.stickyCol}>
          {p && (
            <Box className={s.postStage}>
              <PostStage
                post={{ ...toSlide(p), onOpen: undefined }}
                shape="square"
                onClose={back}
                onPrev={prev ? () => navigate(routes.post(prev.id)) : undefined}
                onNext={next ? () => navigate(routes.post(next.id)) : undefined}
                labels={{ close: t.post.close, previous: t.feed.previous, next: t.feed.next }}
              />
            </Box>
          )}
        </Col>

        {commentsOpen && (
          <Col xs={12} md={6}>
            {p && (
              <Box className={s.postPanelBox}>
                <PostComments post={p} intro onClose={() => setCommentsOpen(false)} />
              </Box>
            )}
          </Col>
        )}
      </Row>
    </Container>
  );
};
