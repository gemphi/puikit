import React from 'react';
import { Avatar, Box, Button, Popover, Stack, Text, Span } from '@pui/components';
import { usePuiTheme } from '@pui/providers';
import { Bell, Moon, Sun } from 'lucide-react';
import { useAsync } from '@pui/shop';
import { getTopics, getNotifications, type Notification } from '../lib/services';
import { topicBySlug } from '../lib/topics';
import { t, format } from '../locales/t';
import s from '../styles/phlick.module.scss';

/**
 * The category header every feed page wears: one pill per topic on the left,
 * level with the logo row, and the viewer's controls — theme, notifications —
 * docked on the right. One component, so every page's header is the same.
 */
export const TopicTabs: React.FC<{
  topic: string | null;
  onTopic: (topic: string | null) => void;
}> = ({ topic, onTopic }) => {
  const topics = useAsync<string[]>(() => getTopics(), []);
  const notifications = useAsync<Notification[]>(() => getNotifications(), []);
  const { theme, setTheme } = usePuiTheme();
  const isDark =
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') !== 'light'
      : theme !== 'light';

  return (
    <Box as="nav" className={s.feedTabs} role="tablist" aria-label={t.explore.title}>
      <Stack direction="row" align="center" gap={1} className={s.feedTabsRow}>
        <Button
          variant={topic === null ? 'primary' : 'ghost'}
          size="sm"
          role="tab"
          aria-selected={topic === null}
          className={s.feedTab}
          onClick={() => onTopic(null)}
        >
          {t.feed.allTopics}
        </Button>
        {(topics.data ?? []).map((name) => (
          <Button
            key={name}
            variant={topic === name ? 'primary' : 'ghost'}
            size="sm"
            role="tab"
            aria-selected={topic === name}
            className={s.feedTab}
            onClick={() => onTopic(name)}
          >
            {topicBySlug(name)?.label ?? name}
          </Button>
        ))}
      </Stack>

      <Stack direction="row" align="center" gap={1} className={s.headerControls}>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t.header.theme}
          aria-pressed={isDark}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          icon={isDark ? <Sun size={16} /> : <Moon size={16} />}
        />
        <Popover
          placement="bottom-end"
          trigger={
            <Button variant="ghost" size="sm" aria-label={t.header.notifications} icon={<Bell size={16} />} />
          }
        >
          <Stack direction="column" gap={2} className={s.notifications} data-notifications="true">
            {(notifications.data ?? []).length === 0 ? (
              <Span variant="muted">{t.header.notificationsEmpty}</Span>
            ) : (
              (notifications.data ?? []).map((n) => (
                <Stack key={n.id} direction="row" align="center" gap={2}>
                  <Avatar src={n.author.avatar} alt={n.author.name} initials={n.author.name.slice(0, 2)} size="sm" />
                  <Stack direction="column" gap={0}>
                    <Text as="span" size="sm">{format(t.notifications[n.kind], { handle: n.author.handle })}</Text>
                    <Span variant="muted">{n.when}</Span>
                  </Stack>
                </Stack>
              ))
            )}
          </Stack>
        </Popover>
      </Stack>
    </Box>
  );
};
