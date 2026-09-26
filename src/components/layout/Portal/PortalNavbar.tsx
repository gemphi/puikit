import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Moon, PanelLeft, Search, Sun, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../forms/Input';
import { Navbar, NavbarItem, NavbarSection } from '../../navigation/Navbar';
import { Badge } from '../../primitives/Badge';
import { Button } from '../../primitives/Button';
import { Icon } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Section } from '../Section';
import { Stack } from '../Stack';
import styles from './PortalNavbar.module.scss';

export interface PortalSearchResult {
  id: string;
  title: string;
  category?: string;
}

export interface PortalNavbarProps {
  brandTitle: string;
  version?: string;
  searchQuery?: string;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  searchResults?: PortalSearchResult[];
  onSelectSearchResult?: (id: string) => void;
  onToggleSidebar?: () => void;
  onHome?: () => void;
  onBackToApp?: () => void;
  backToAppLabel?: string;
  dark?: boolean;
  onToggleDark?: () => void;
  /** Opens the shared preference surface. Omit to hide the affordance. */
  onOpenPreferences?: () => void;
  preferencesLabel?: string;
}

export const PortalNavbar: React.FC<PortalNavbarProps> = ({
  brandTitle,
  version,
  searchQuery,
  searchPlaceholder = 'Search...',
  onSearchChange,
  searchResults,
  onSelectSearchResult,
  onToggleSidebar,
  onHome,
  onBackToApp,
  backToAppLabel = 'Open App',
  dark,
  onToggleDark,
  onOpenPreferences,
  preferencesLabel = 'Preferences',
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const showResults = searchFocused && Boolean(searchQuery) && Boolean(onSelectSearchResult);

  return (
    <Navbar sticky variant="default" height={65}>
      <NavbarSection align="start">
        {onToggleSidebar && (
          <Button
            variant="icon"
            size="sm"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            iconLeft={PanelLeft}
          />
        )}
        <NavbarItem onClick={onHome}>
          <Stack direction="row" align="center" gap={2}>
            <Icon icon={BookOpen} size="md" />
            <Text as="span" weight="semibold">{brandTitle}</Text>
          </Stack>
        </NavbarItem>
        {version && <Badge variant="secondary">{version}</Badge>}
      </NavbarSection>
      {onSearchChange && (
        <NavbarSection align="center">
          <Section as="div" className={styles.search}>
            <Input
              icon={<Search size={15} />}
              placeholder={searchPlaceholder}
              value={searchQuery || ''}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {showResults && (
              <Section as="div" className={styles.results} role="listbox">
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className={styles.result}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelectSearchResult?.(result.id);
                      }}
                    >
                      <Text as="span" className={styles.resultTitle}>{result.title}</Text>
                      {result.category && <Text as="span" className={styles.resultCategory}>{result.category}</Text>}
                    </button>
                  ))
                ) : (
                  <Text as="span" className={styles.empty}>No matching documents</Text>
                )}
              </Section>
            )}
          </Section>
        </NavbarSection>
      )}
      <NavbarSection align="end">
        {onBackToApp && (
          <Button variant="outline" size="sm" onClick={onBackToApp}>
            <ArrowLeft size={15} />
            <Text as="span">{backToAppLabel}</Text>
          </Button>
        )}
        {onToggleDark && (
          <Button
            variant="icon"
            size="sm"
            onClick={onToggleDark}
            aria-label="Toggle theme mode"
            iconLeft={dark ? Sun : Moon}
          />
        )}
        {onOpenPreferences && (
          <Button
            variant="icon"
            size="sm"
            onClick={onOpenPreferences}
            aria-label={preferencesLabel}
            iconLeft={SlidersHorizontal}
          />
        )}
      </NavbarSection>
    </Navbar>
  );
};
