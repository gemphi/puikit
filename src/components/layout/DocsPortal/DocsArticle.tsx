import React, { useState } from 'react';
import { Check, Copy, GraduationCap, Terminal } from 'lucide-react';
import type { DocGuide } from './types';
import { Container } from '../Container';
import { Section } from '../Section';
import { Stack } from '../Stack';
import { Title } from '../../primitives/Title';
import { Text } from '../../primitives/Text';
import { Button } from '../../primitives/Button';
import { Divider } from '../../primitives/Divider';
import { Span } from '../../primitives/Span';
import { Callout } from '../../feedback/Callout';
import { Card, CardHeader, CardBody } from '../../display/card';
import { List, ListItem } from '../../display/list';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../display/Table';
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
          <Text as="span" size="xs" variant="primary" weight="bold" textTransform="uppercase" letterSpacing="0.05em">
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
            <Button variant="outline" size="sm" onClick={handleCopy} icon={copied ? <Check size={15} /> : <Copy size={15} />}>
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
            <Button variant="outline" size="sm" onClick={() => onSelectGuide(prevGuide.id)} className={styles.prevNext}>
              <Text as="span" size="xs" variant="secondary" weight="semibold">← PREVIOUS</Text>
              <Text as="span" size="sm" variant="primary" weight="bold" className={styles.ellipsis}>{prevGuide.title}</Text>
            </Button>
          ) : <Span aria-hidden="true" />}

          {nextGuide ? (
            <Button variant="outline" size="sm" onClick={() => onSelectGuide(nextGuide.id)} className={styles.prevNext}>
              <Text as="span" size="xs" variant="secondary" weight="semibold">NEXT →</Text>
              <Text as="span" size="sm" variant="primary" weight="bold" className={styles.ellipsis}>{nextGuide.title}</Text>
            </Button>
          ) : <Span aria-hidden="true" />}
        </Section>
      </Stack>
    </Container>
  );
};

/**
 * Rich Markdown parser supporting tables, callouts, lists, math, code blocks, and headings.
 */
function RichMarkdownContent({ content }: { content: string }) {
  const sections = parseMarkdownBlocks(content);

  return (
    <Stack direction="column" gap={5}>
      {sections.map((sec, idx) => {
        switch (sec.type) {
          case 'code':
            return (
              <Card key={idx} variant="flat" className={styles.codeBlock}>
                <CardHeader className={styles.codeHeader}>
                  <Stack direction="row" align="center" gap={2}>
                    <Terminal size={13} />
                    <Text as="span" size="xs" variant="secondary" textTransform="uppercase" letterSpacing="0.05em">
                      {sec.lang || 'text'}
                    </Text>
                  </Stack>
                </CardHeader>
                <CardBody>
                  <pre className={styles.pre}><code>{sec.content}</code></pre>
                </CardBody>
              </Card>
            );

          case 'table':
            return (
              <Card key={idx} variant="flat" className={styles.tableCard}>
                <Table>
                  <Thead>
                    <Tr>
                      {sec.headers.map((h, i) => (
                        <Th key={i}>
                          <InlineFormattedText text={h} />
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sec.rows.map((row, rIdx) => (
                      <Tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <Td key={cIdx}>
                            <InlineFormattedText text={cell} />
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Card>
            );

          case 'h2':
            return (
              <Title key={idx} variant="h2" size="xl" className={styles.h2}>
                <InlineFormattedText text={sec.content} />
              </Title>
            );

          case 'h3':
            return (
              <Title key={idx} variant="h3" size="lg" className={styles.h3}>
                <InlineFormattedText text={sec.content} />
              </Title>
            );

          case 'h4':
            return (
              <Title key={idx} variant="h4" size="md" className={styles.h4}>
                <InlineFormattedText text={sec.content} />
              </Title>
            );

          case 'blockquote':
            return (
              <Callout key={idx} intent="none" className={styles.blockquote}>
                <InlineFormattedText text={sec.content} />
              </Callout>
            );

          case 'list':
            return (
              <List key={idx} className={styles.list}>
                {sec.items.map((item, iIdx) => (
                  <ListItem key={iIdx}>
                    <InlineFormattedText text={item} />
                  </ListItem>
                ))}
              </List>
            );

          case 'hr':
            return <Divider key={idx} className={styles.divider} />;

          case 'paragraph':
          default:
            return (
              <Text key={idx} size="md" className={styles.paragraph}>
                <InlineFormattedText text={sec.content} />
              </Text>
            );
        }
      })}
    </Stack>
  );
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and $math$
 */
function InlineFormattedText({ text }: { text: string }) {
  if (!text) return null;

  // Split by inline code, bold, math
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\$[^\$]+\$)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
          return (
            <code key={i} className={styles.inlineCode}>
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
          return (
            <Span key={i} variant="bold" className={styles.strong}>
              {part.slice(2, -2)}
            </Span>
          );
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          return (
            <Span key={i} className={styles.math}>
              {part.slice(1, -1)}
            </Span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function stripDuplicateH1(content: string, title: string): string {
  const match = content.match(/^\s*#\s+(.+?)\s*(?:\r?\n|$)/);
  if (match && match[1].trim().toLowerCase() === title.trim().toLowerCase()) {
    return content.slice(match[0].length);
  }
  return content;
}

type MarkdownBlock =
  | { type: 'code'; lang: string; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'h2'; content: string }
  | { type: 'h3'; content: string }
  | { type: 'h4'; content: string }
  | { type: 'blockquote'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'hr' }
  | { type: 'paragraph'; content: string };

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.replace('```', '').trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        lang,
        content: codeLines.join('\n'),
      });
      continue;
    }

    // 2. Horizontal divider
    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 3. Headings
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', content: trimmed.replace(/^##\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', content: trimmed.replace(/^###\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: trimmed.replace(/^####\s+/, '') });
      i++;
      continue;
    }

    // 4. Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join(' ') });
      continue;
    }

    // 5. Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerRow = tableLines[0];
        const headers = headerRow.split('|').slice(1, -1).map(s => s.trim());
        // filter out delimiter row (|---|---|)
        const dataRows = tableLines.slice(1).filter(l => !/^[\|\s\-:]+$/.test(l));
        const rows = dataRows.map(r => r.split('|').slice(1, -1).map(s => s.trim()));
        blocks.push({
          type: 'table',
          headers,
          rows,
        });
        continue;
      }
      blocks.push({ type: 'paragraph', content: tableLines.join(' ') });
      continue;
    }

    // 6. Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* ') || /^\d+\.\s/.test(lines[i].trim()))) {
        listItems.push(lines[i].trim().replace(/^[-*]|\d+\.\s*/, '').trim());
        i++;
      }
      blocks.push({ type: 'list', items: listItems });
      continue;
    }

    // 7. Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      lines[i].trim() !== '---'
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (!paraLines.length) {
      // Unrecognized line type (e.g. `# ` h1 headings) — never stall the parser.
      blocks.push({ type: 'h2', content: trimmed.replace(/^#+\s*/, '') });
      i++;
      continue;
    }
    blocks.push({ type: 'paragraph', content: paraLines.join(' ') });
  }

  return blocks;
}
