import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../../utils/cn';
import { Portal } from '../Portal/Portal';
import type { DocsPortalProps, DocGuide } from './types';
import { DocsArticle } from './DocsArticle';
import { DocsNavbar } from './DocsNavbar';
import { DocsSidebar } from './DocsSidebar';
import { DocsTOC } from './DocsTOC';
import styles from './DocsPortal.module.scss';

export const DocsPortal: React.FC<DocsPortalProps> = ({
  guides,
  initialGuideId = 'quickstart',
  activeGuideId: controlledGuideId,
  onGuideChange,
  version,
  brandTitle = 'Docs',
  onBackToApp,
  backToAppLabel = 'Open App',
  dark,
  onToggleDark,
  onOpenPreferences,
  className = '',
}) => {
  const [internalGuideId, setInternalGuideId] = useState<string>(initialGuideId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const activeGuideId = controlledGuideId ?? internalGuideId;

  useEffect(() => {
    if (controlledGuideId === undefined) setInternalGuideId(initialGuideId);
  }, [controlledGuideId, initialGuideId]);

  const selectGuide = (id: string) => {
    if (controlledGuideId === undefined) setInternalGuideId(id);
    onGuideChange?.(id);
  };

  const visibleGuides = useMemo(() => {
    return guides.filter((guide) => !guide.hidden && !guide.draft);
  }, [guides]);

  const filteredGuides = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visibleGuides;
    return visibleGuides.filter((guide) => [guide.title, guide.category, guide.summary, guide.content]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query)));
  }, [visibleGuides, searchQuery]);

  const categories = useMemo(() => {
    const grouped: Record<string, DocGuide[]> = {};
    filteredGuides.forEach((guide) => {
      grouped[guide.category] = [...(grouped[guide.category] || []), guide];
    });
    return grouped;
  }, [filteredGuides]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return filteredGuides.slice(0, 8).map((guide) => ({
      id: guide.id,
      title: guide.title,
      category: guide.category,
    }));
  }, [filteredGuides, searchQuery]);

  const selectSearchResult = (id: string) => {
    selectGuide(id);
    setSearchQuery('');
  };

  const activeGuide = useMemo(() => {
    return visibleGuides.find((guide) => guide.id === activeGuideId) || visibleGuides[0];
  }, [visibleGuides, activeGuideId]);

  const tocItems = useMemo(() => extractTocHeadings(activeGuide?.content || ''), [activeGuide?.content]);

  const currentIndex = visibleGuides.findIndex((guide) => guide.id === activeGuide?.id);
  const prevGuide = currentIndex > 0 ? visibleGuides[currentIndex - 1] : undefined;
  const nextGuide = currentIndex >= 0 && currentIndex < visibleGuides.length - 1 ? visibleGuides[currentIndex + 1] : undefined;

  if (!activeGuide) return null;

  return (
    <Portal
      variant="docs"
      className={cn(styles.portal, className)}
      header={(
        <DocsNavbar
          brandTitle={brandTitle}
          version={version}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          onSelectSearchResult={selectSearchResult}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onHome={() => selectGuide(visibleGuides[0]?.id || initialGuideId)}
          onBackToApp={onBackToApp}
          backToAppLabel={backToAppLabel}
          dark={dark}
          onToggleDark={onToggleDark}
        onOpenPreferences={onOpenPreferences}
        />
      )}
      sidebar={sidebarOpen ? (
        <DocsSidebar
          categories={categories}
          activeGuideId={activeGuide.id}
          onSelectGuide={selectGuide}
          onToggleSidebar={() => setSidebarOpen(false)}
        />
      ) : undefined}
      aside={<DocsTOC items={tocItems} onSelectItem={scrollToHeading} />}
    >
      <DocsArticle
        guide={activeGuide}
        prevGuide={prevGuide}
        nextGuide={nextGuide}
        onSelectGuide={selectGuide}
      />
    </Portal>
  );
};

function scrollToHeading(item: string): void {
  const headings = Array.from(document.querySelectorAll('h2, h3'));
  const target = headings.find((h) => h.textContent?.trim() === item);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function extractTocHeadings(markdown: string): string[] {
  const headings: string[] = [];
  let inCode = false;
  markdown.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCode = !inCode;
      return;
    }
    if (inCode) return;
    const match = trimmed.match(/^#{2,3}\s+(.+)$/);
    if (match) headings.push(match[1].replace(/\*\*/g, '').trim());
  });
  return [...new Set(headings)];
}

export const Docs = DocsPortal;
export const DocsPage = DocsPortal;
export default DocsPortal;
