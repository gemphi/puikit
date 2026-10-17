'use client';

import React, { useState } from 'react';
import { Box, Button, Input, Navbar, NavbarSection, PreferencesModal, Stack, Tag, Text, usePuiTheme } from '@pui/components';
import { Search, Sun, Moon, SlidersHorizontal } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

/**
 * The docs utility bar, built from `Navbar` so it inherits the sticky
 * behaviour, the surface treatment and the section grid that every other
 * puijs app gets — rather than a hand-positioned `<Box as="header">`. The preferences
 * modal is opened from here, so theme, brand, radius and density can be
 * exercised against the documentation itself.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { setTheme, isDark } = usePuiTheme();
  const [prefsOpen, setPrefsOpen] = useState(false);

  return (
    <>
      <Navbar sticky>
        <NavbarSection align="start">
          <Stack direction="row" gap={3} align="center">
            <Text as="span" size="lg" weight="bold" intent="primary">
              &#934;
            </Text>
            <Text as="span" weight="bold">
              PUI Documentation
            </Text>
            <Tag intent="primary" minimal round>
              puijs.com
            </Tag>
          </Stack>
        </NavbarSection>

        <NavbarSection align="center">
          <Input
            placeholder="Search components, tokens, APIs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search size={14} />}
            aria-label="Search the documentation"
          />
        </NavbarSection>

        <NavbarSection align="end">
          <Stack direction="row" gap={2} align="center">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Appearance preferences"
              onClick={() => setPrefsOpen(true)}
              icon={<SlidersHorizontal size={14} />}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              icon={isDark ? <Sun size={14} /> : <Moon size={14} />}
            >
              {isDark ? 'Light' : 'Dark'}
            </Button>
            <UserMenu />
          </Stack>
        </NavbarSection>
      </Navbar>

      <PreferencesModal isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  );
};
