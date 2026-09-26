import React from 'react';
import { PortalNavbar, type PortalSearchResult } from '../Portal/PortalNavbar';

interface DocsNavbarProps {
  brandTitle: string;
  version?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults?: PortalSearchResult[];
  onSelectSearchResult?: (id: string) => void;
  onToggleSidebar?: () => void;
  onHome: () => void;
  onBackToApp?: () => void;
  backToAppLabel?: string;
  dark?: boolean;
  onToggleDark?: () => void;
  onOpenPreferences?: () => void;
}

export const DocsNavbar: React.FC<DocsNavbarProps> = ({
  brandTitle,
  version,
  searchQuery,
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
}) => {
  return (
    <PortalNavbar
      brandTitle={brandTitle}
      version={version}
      searchQuery={searchQuery}
      searchPlaceholder="Search guides, APIs..."
      onSearchChange={onSearchChange}
      searchResults={searchResults}
      onSelectSearchResult={onSelectSearchResult}
      onToggleSidebar={onToggleSidebar}
      onHome={onHome}
      onBackToApp={onBackToApp}
      backToAppLabel={backToAppLabel}
      dark={dark}
      onToggleDark={onToggleDark}
      onOpenPreferences={onOpenPreferences}
    />
  );
};
