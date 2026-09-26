import React, { useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  File as FileIcon,
  Folder,
  Grid2X2,
  List,
  Search,
  Upload,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { ResizablePanel } from '../../layout/ResizablePanel';
import { Stack } from '../../layout/Stack';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';
import { Title } from '../../primitives/Title';
import { Input } from '../../forms/Input';
import styles from './styles.module.scss';

export type FileBrowserView = 'grid' | 'list';

export interface FileBrowserItem {
  id: string;
  name: string;
  path?: string;
  type?: string;
  size?: number;
  modified?: string;
  folder?: string;
  previewUrl?: string;
  file?: File;
}

export interface FileBrowserFolder {
  id: string;
  label: string;
  count?: number;
}

export interface FileBrowserProps {
  files?: FileBrowserItem[];
  folders?: FileBrowserFolder[];
  title?: string;
  initialFolder?: string;
  initialView?: FileBrowserView;
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  onSelect?: (file: FileBrowserItem) => void;
  selectedId?: string;
  className?: string;
}

const DEFAULT_FOLDERS: FileBrowserFolder[] = [
  { id: 'all', label: 'All files' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'document', label: 'Documents' },
];

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
};

const fileFolder = (file: FileBrowserItem) => file.folder ?? file.type?.split('/')[0] ?? 'document';

export const FileBrowser: React.FC<FileBrowserProps> = ({
  files = [],
  folders = DEFAULT_FOLDERS,
  title = 'File browser',
  initialFolder = 'all',
  initialView = 'grid',
  accept = 'image/*,video/*,audio/*,.pdf',
  multiple = true,
  onFilesChange,
  onSelect,
  selectedId,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importedFiles, setImportedFiles] = useState<FileBrowserItem[]>([]);
  const [folder, setFolder] = useState(initialFolder);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<FileBrowserView>(initialView);

  const allFiles = useMemo(() => [...files, ...importedFiles], [files, importedFiles]);
  const visibleFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allFiles.filter((file) => {
      const matchesFolder = folder === 'all' || fileFolder(file) === folder;
      const matchesQuery = !normalizedQuery || [file.name, file.path, file.type]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
      return matchesFolder && matchesQuery;
    });
  }, [allFiles, folder, query]);

  const chooseFiles = () => inputRef.current?.click();

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const next = selected.map<FileBrowserItem>((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      path: file.webkitRelativePath || file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      modified: new Date(file.lastModified).toLocaleDateString(),
      folder: file.type.split('/')[0] || 'document',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      file,
    }));
    setImportedFiles((previous) => [...previous, ...next]);
    onFilesChange?.(selected);
    event.target.value = '';
  };

  const currentFolder = folders.find((item) => item.id === folder);

  return (
    <Box className={cn(styles.browser, className)}>
      <Stack direction="row" align="center" justify="between" className={styles.heading}>
        <Stack direction="column" gap={1}>
          <Title level={4}>{title}</Title>
          <Text size="sm" intent="secondary">{visibleFiles.length} item{visibleFiles.length === 1 ? '' : 's'} in {currentFolder?.label ?? 'All files'}</Text>
        </Stack>
        <Stack direction="row" gap={2} align="center">
          <input ref={inputRef} className={styles.fileInput} type="file" accept={accept} multiple={multiple} onChange={onInputChange} />
          <Button variant="primary" size="sm" icon={<Upload size={15} />} onClick={chooseFiles}>Import files</Button>
        </Stack>
      </Stack>

      <Stack direction="row" gap={2} align="center" className={styles.toolbar}>
        <Input
          className={styles.search}
          placeholder="Search files"
          aria-label="Search files"
          icon={<Search size={15} />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Stack direction="row" gap={1} className={styles.viewToggle}>
          <Button variant={view === 'grid' ? 'primary' : 'ghost'} size="sm" aria-label="Grid view" onClick={() => setView('grid')} icon={<Grid2X2 size={15} />} />
          <Button variant={view === 'list' ? 'primary' : 'ghost'} size="sm" aria-label="List view" onClick={() => setView('list')} icon={<List size={15} />} />
        </Stack>
      </Stack>

      <Text size="xs" intent="muted" className={styles.breadcrumbs}>Home <ChevronRight size={12} /> {currentFolder?.label ?? 'All files'}</Text>

      <ResizablePanel
        defaultSize={216}
        minSize={168}
        maxSize={360}
        panelLabel="Resize file browser folders"
        className={styles.body}
        panel={(
          <Stack direction="column" gap={2} className={styles.folderPanel}>
            <Text size="xs" weight="semibold" intent="muted" className={styles.panelLabel}>Folders</Text>
            {folders.map((item) => (
              <Button
                key={item.id}
                variant={folder === item.id ? 'primary' : 'ghost'}
                size="sm"
                fullWidth
                className={styles.folderButton}
                onClick={() => setFolder(item.id)}
                icon={<Folder size={15} />}
              >
                <Stack direction="row" justify="between" align="center" className={styles.folderButtonContent}>
                  <span>{item.label}</span>
                  {item.count !== undefined && <span>{item.count}</span>}
                </Stack>
              </Button>
            ))}
          </Stack>
        )}
      >
        <Box className={cn(styles.fileArea, view === 'list' && styles.listView)}>
          {visibleFiles.length === 0 ? (
            <Stack align="center" justify="center" className={styles.empty}>
              <FileIcon size={28} />
              <Text intent="secondary">No files match this view.</Text>
              <Button variant="outline" size="sm" onClick={chooseFiles}>Choose files</Button>
            </Stack>
          ) : (
            visibleFiles.map((file) => (
              <button
                key={file.id}
                type="button"
                className={cn(styles.fileItem, selectedId === file.id && styles.selected)}
                onClick={() => onSelect?.(file)}
              >
                <Box className={styles.preview}>
                  {file.previewUrl ? <img src={file.previewUrl} alt="" /> : <FileIcon size={28} />}
                </Box>
                <Stack direction="column" gap={1} className={styles.fileMeta}>
                  <Text as="span" size="sm" weight="semibold" className={styles.fileName}>{file.name}</Text>
                  <Text as="span" size="xs" intent="muted">{formatBytes(file.size)}{file.modified ? ` · ${file.modified}` : ''}</Text>
                </Stack>
              </button>
            ))
          )}
        </Box>
      </ResizablePanel>
    </Box>
  );
};

FileBrowser.displayName = 'FileBrowser';
