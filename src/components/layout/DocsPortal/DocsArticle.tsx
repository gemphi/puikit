import React, { useState } from 'react';
import { Check, Copy, GraduationCap } from 'lucide-react';
import type { DocGuide } from './types';
import { Container } from '../Container';
import { Section } from '../Section';
import { Stack } from '../Stack';
import { Title } from '../../primitives/Title';
import { Text } from '../../primitives/Text';
import { Button } from '../../primitives/Button';
import { Span } from '../../primitives/Span';
import { Callout } from '../../feedback/Callout';
import { List, ListItem } from '../../display/list';
import { RichMarkdownContent } from './DocsMarkdown';
import { stripDuplicateH1 } from './markdown';
import styles from './DocsArticle.module.scss';

interface DocsArticleProps {
  guide: DocGuide;
  prevGuide?: DocGuide;
  nextGuide?: DocGuide;
  onSelectGuide: (id: string) => void;
}

export const DocsArticle: React.FC<DocsArticleProps> = ({
  guide,
  prevGuide,
  nextGuide,
  onSelectGuide,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(guide.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Container size="lg" className={styles.article}>
      <Stack direction="column" gap={6}>
        {/* Breadcrumb / Category */}
        <Stack direction="row" align="center" gap={2} className={styles.breadcrumb}>
          <Text as="span" size="xs" variant="primary" weight="bold" letterSpacing="0.05em">
            {guide.category}
          </Text>
          {guide.badge && guide.badge !== guide.category && (
            <>
              <Text as="span" size="xs" variant="secondary">/</Text>
              <Text as="span" size="xs" variant="secondary" weight="semibold">{guide.badge}</Text>
            </>
          )}
        </Stack>

        {/* Article Title & Summary */}
        <Section as="header" className={styles.header}>
          <Stack direction="row" align="start" justify="between" gap={4} className={styles.titleRow}>
            <Title variant="h1" size="2xl" className={styles.title}>{guide.title}</Title>
            <Button variant="glass" onClick={handleCopy} icon={copied ? <Check size={15} /> : <Copy size={15} />}>
              {copied ? 'Copied' : 'Copy Guide'}
            </Button>
          </Stack>
          <Text size="md" variant="secondary" className={styles.summary}>{guide.summary}</Text>
        </Section>

        {/* Academic References Callout */}
        {guide.citations && guide.citations.length > 0 && (
          <Callout intent="primary" title="Foundational Literature & Academic References:" icon={<GraduationCap size={18} />}>
            <List className={styles.citationList}>
              {guide.citations.map((cit, idx) => (
                <ListItem key={idx}>{cit}</ListItem>
              ))}
            </List>
          </Callout>
        )}

        {/* Rendered Guide Body */}
        <Section as="article" className={styles.body}>
          <RichMarkdownContent content={stripDuplicateH1(guide.content, guide.title)} />
        </Section>

        {/* Bottom Guide Pagination */}
        <Section as="footer" className={styles.pagination}>
          {prevGuide ? (
            <Button variant="glass" onClick={() => onSelectGuide(prevGuide.id)} className={styles.prevNext}>
              <Text as="span" size="xs" variant="secondary" weight="semibold">← PREVIOUS</Text>
              <Text as="span" size="sm" variant="primary" weight="bold" className={styles.ellipsis}>{prevGuide.title}</Text>
            </Button>
          ) : <Span aria-hidden="true" />}

          {nextGuide ? (
            <Button variant="glass" onClick={() => onSelectGuide(nextGuide.id)} className={styles.prevNext}>
              <Text as="span" size="xs" variant="secondary" weight="semibold">NEXT →</Text>
              <Text as="span" size="sm" variant="primary" weight="bold" className={styles.ellipsis}>{nextGuide.title}</Text>
            </Button>
          ) : <Span aria-hidden="true" />}
        </Section>
      </Stack>
    </Container>
  );
};
