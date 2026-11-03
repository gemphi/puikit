import React, { useMemo, useState } from 'react';
import {
  AssetBrowser,
  type AssetBrowserItem,
  Button,
  Callout,
  Card,
  CardBody,
  Col,
  Container,
  FileBrowser,
  type FileBrowserItem,
  FormGroup,
  Input,
  Row,
  Stack,
  Text,
  Textarea,
  Title,
} from '@pui/components';
import { CheckCircle2 } from 'lucide-react';
import { t } from '../locales/t';
import s from '../styles/phlick.module.scss';

const assetModules = import.meta.glob<string>('../../assets/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const ASSET_LIBRARY: AssetBrowserItem[] = Object.entries(assetModules)
  .map(([path, src], index) => {
    const name = path.split('/').pop() ?? `asset-${index}`;
    const category = path.match(/\/assets\/([^/]+)\//)?.[1] ?? 'library';
    return { id: `${category}-${index}`, name, src, category };
  })
  .slice(0, 48);

export const UploadPage: React.FC = () => {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [sound, setSound] = useState('');
  const [posted, setPosted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileBrowserItem | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetBrowserItem | null>(null);

  const selectedSource = useMemo(() => selectedFile?.name ?? selectedAsset?.name ?? '', [selectedAsset, selectedFile]);

  const discard = () => {
    setCaption('');
    setHashtags('');
    setSound('');
    setSelectedFile(null);
    setSelectedAsset(null);
    setPosted(false);
  };

  const selectAsset = (asset: AssetBrowserItem) => {
    setSelectedAsset(asset);
    setSelectedFile(null);
    if (!caption.trim()) setCaption(asset.name.replace(/\.[^.]+$/, ''));
  };

  const selectFile = (file: FileBrowserItem) => {
    setSelectedFile(file);
    setSelectedAsset(null);
    if (!caption.trim()) setCaption(file.name.replace(/\.[^.]+$/, ''));
  };

  return (
    <Container size="xl" className={s.pagePad}>
      <Stack direction="column" gap={4}>
        <Stack direction="column" gap={1}>
          <Title level={2}>{t.upload.title}</Title>
          <Text intent="secondary">{t.upload.body}</Text>
        </Stack>

        {posted && (
          <Callout intent="success" title={t.upload.postedTitle} icon={<CheckCircle2 size={18} />}>
            <Text as="span">{t.upload.postedBody}</Text>
          </Callout>
        )}

        <Row gap={4} align="stretch" wrap>
          <Col xs={12} lg={7}>
            <FileBrowser
              title="Import files"
              onSelect={selectFile}
              onFilesChange={() => setPosted(false)}
            />
          </Col>
          <Col xs={12} lg={5}>
            <AssetBrowser
              title="Asset browser"
              assets={ASSET_LIBRARY}
              selectedId={selectedAsset?.id}
              onSelect={selectAsset}
            />
          </Col>
        </Row>

        <Card>
          <CardBody>
            <Stack direction="column" gap={3}>
              <Stack direction="column" gap={1}>
                <Title level={4}>Publish details</Title>
                <Text size="sm" intent="secondary">
                  {selectedSource ? `Selected source: ${selectedSource}` : 'Choose a local file or an asset from the library.'}
                </Text>
              </Stack>
              <FormGroup floating label={t.upload.captionLabel}>
                <Textarea
                  value={caption}
                  placeholder={t.upload.captionPlaceholder}
                  rows={3}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </FormGroup>
              <FormGroup floating label={t.upload.hashtagsLabel}>
                <Input
                  value={hashtags}
                  placeholder={t.upload.hashtagsPlaceholder}
                  onChange={(e) => setHashtags(e.target.value)}
                />
              </FormGroup>
              <FormGroup floating label={t.upload.soundLabel}>
                <Input
                  value={sound}
                  placeholder={t.upload.soundPlaceholder}
                  onChange={(e) => setSound(e.target.value)}
                />
              </FormGroup>
              <Stack direction="row" justify="between" gap={2}>
                <Button variant="ghost" onClick={discard}>{t.upload.discard}</Button>
                <Button variant="primary" disabled={!caption.trim() || (!selectedFile && !selectedAsset)} onClick={() => setPosted(true)}>
                  {t.upload.post}
                </Button>
              </Stack>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  );
};
