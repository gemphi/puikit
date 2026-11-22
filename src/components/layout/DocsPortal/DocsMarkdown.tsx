import React from 'react';
import { Terminal } from 'lucide-react';
import { Stack } from '../Stack';
import { Title } from '../../primitives/Title';
import { Text } from '../../primitives/Text';
import { Divider } from '../../primitives/Divider';
import { Span } from '../../primitives/Span';
import { Callout } from '../../feedback/Callout';
import { Card, CardHeader, CardBody } from '../../display/card';
import { List, ListItem } from '../../display/list';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../display/Table';
import { parseMarkdownBlocks } from './markdown';
import styles from './DocsArticle.module.scss';

/**
 * Rich Markdown parser supporting tables, callouts, lists, math, code blocks, and headings.
 */
export function RichMarkdownContent({ content }: { content: string }) {
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
                    <Text as="span" size="xs" variant="secondary" letterSpacing="0.05em">
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
