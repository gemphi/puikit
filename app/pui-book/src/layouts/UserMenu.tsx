'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Popover,
  Stack,
  Text,
  usePuiTheme,
} from '@pui/components';
import { PreferencesModal } from '@pui/components';

/**
 * Header user menu.
 *
 * Renders as a compact outline button showing the initial of the active user
 * (from `usePuiTheme().userId`). Clicking opens a Popover with:
 *   - the current identity ("Signed in as {userId}")
 *   - a Switch-user area (Input + Button; empty submits reset to 'guest')
 *   - a Preferences button that opens the shared PreferencesModal
 *
 * Composition rules honored here:
 * - Only `@pui/components` primitives + lucide-react are consumed; no raw
 *   `<Box>` and no per-component `.module.scss`.
 * - The avatar circle is a `Box` styled with `--phi-*` custom properties so
 *   it inherits the active brand's palette instead of hardcoding colors.
 * - UserMenu owns both the popover state and the preferences modal state,
 *   so callers only need to mount the component.
 */
const initialFor = (id: string): string => {
  const trimmed = (id || '').trim();
  if (!trimmed) return 'G';
  return trimmed.charAt(0).toUpperCase();
};

export const UserMenu: React.FC = () => {
  const { userId, setUserId } = usePuiTheme();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [pendingId, setPendingId] = useState('');

  const openPrefs = () => {
    setPopoverOpen(false);
    setPrefsOpen(true);
  };
  const closePrefs = () => setPrefsOpen(false);

  const handleSwitch = (event?: React.FormEvent) => {
    event?.preventDefault();
    // Empty submit resets to the default 'guest' identity by way of the
    // provider's setUserId fallback, which reloads that user's persisted
    // preferences namespace.
    setUserId(pendingId);
    setPendingId('');
    setPopoverOpen(false);
  };

  const avatar = (
    <Box
      aria-hidden="true"
      style={{
        width: '20px',
        height: '20px',
        borderRadius: 'var(--phi-radius-full)',
        background: 'var(--phi-color-primary)',
        color: 'var(--phi-color-text-inverse)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--phi-font-size-xs)',
        fontWeight: 'var(--phi-font-weight-semibold)',
        lineHeight: 1,
      }}
    >
      {initialFor(userId)}
    </Box>
  );

  const trigger = (
    <Button variant="outline" size="sm" icon={avatar} aria-label={`User menu for ${userId}`}>
      {userId}
    </Button>
  );

  return (
    <>
      <Popover
        isOpen={popoverOpen}
        onOpenChange={setPopoverOpen}
        placement="bottom-end"
        trigger={trigger}
      >
        <Stack direction="column" gap={3} style={{ minWidth: '240px', padding: '4px 4px' }}>
          <Stack direction="column" gap={1}>
            <Text size="sm" intent="secondary">Signed in as</Text>
            <Text weight="semibold">{userId}</Text>
          </Stack>

          <Box as="form" onSubmit={handleSwitch}>
            <Stack direction="column" gap={2}>
              <Text size="xs" intent="muted">Switch user</Text>
              <Stack direction="row" gap={2} align="center">
                <Box style={{ flex: 1 }}>
                  <Input
                    value={pendingId}
                    onChange={(e) => setPendingId(e.target.value)}
                    placeholder="user id (empty = guest)"
                    aria-label="Switch user id"
                  />
                </Box>
                <Button type="submit" variant="primary" size="sm">
                  Switch
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Button variant="outline" size="sm" onClick={openPrefs}>
            Preferences
          </Button>
        </Stack>
      </Popover>

      <PreferencesModal isOpen={prefsOpen} onClose={closePrefs} />
    </>
  );
};
