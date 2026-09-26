import React, { useMemo, useState } from 'react';
import { Grid2X2, Image, List, Search } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Stack } from '../../layout/Stack';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { Input } from '../../forms/Input';
import styles from './styles.module.scss';

export interface AssetBrowserItem {
  id: string;
  name: string;
  src: string;
  category?: string;
  type?: string;
}

export interface AssetBrowserProps {
  assets: AssetBrowserItem[];
  title?: string;
  selectedId?: string;
  onSelect?: (asset: AssetBrowserItem) => void;
  className?: string;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({
  assets,
  title = 'Asset browser',
  selectedId,
  onSelect,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return assets;
    return assets.filter((asset) => [asset.name, asset.category, asset.type]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(value)));
  }, [assets, query]);

  return (
    <Box className={cn(styles.browser, styles.assetBrowser, className)}>
      <Stack direction="row" align="center" justify="between" className={styles.heading}>
        <Stack direction="column" gap={1}>
          <Title level={4}>{title}</Title>
          <Text size="sm" intent="secondary">{filtered.length} asset{filtered.length === 1 ? '' : 's'} available</Text>
        </Stack>
        <Stack direction="row" gap={1} className={styles.viewToggle}>
          <Button variant={view === 'grid' ? 'primary' : 'ghost'} size="sm" aria-label="Grid view" onClick={() => setView('grid')} icon={<Grid2X2 size={15} />} />
          <Button variant={view === 'list' ? 'primary' : 'ghost'} size="sm" aria-label="List view" onClick={() => setView('list')} icon={<List size={15} />} />
        </Stack>
      </Stack>

      <Stack direction="row" align="center" className={styles.toolbar}>
        <Input
          className={styles.search}
          placeholder="Search assets"
          aria-label="Search assets"
          icon={<Search size={15} />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Stack>

      <Box className={cn(styles.assetArea, view === 'list' && styles.assetList)}>
        {filtered.length === 0 ? (
          <Stack align="center" justify="center" className={styles.empty}>
            <Image size={28} />
            <Text intent="secondary">No assets match your search.</Text>
          </Stack>
        ) : filtered.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className={cn(styles.assetItem, selectedId === asset.id && styles.selected)}
            onClick={() => onSelect?.(asset)}
          >
            <img src={asset.src} alt="" />
            <Stack direction="column" gap={1} className={styles.fileMeta}>
              <Text as="span" size="sm" weight="semibold" className={styles.fileName}>{asset.name}</Text>
              {asset.category && <Text as="span" size="xs" intent="muted">{asset.category}</Text>}
            </Stack>
          </button>
        ))}
      </Box>
    </Box>
  );
};

AssetBrowser.displayName = 'AssetBrowser';
