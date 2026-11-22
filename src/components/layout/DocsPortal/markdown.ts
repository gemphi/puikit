/** The guide text as blocks: code, tables, headings, quotes, lists, rules and paragraphs. */
export function stripDuplicateH1(content: string, title: string): string {
  const match = content.match(/^\s*#\s+(.+?)\s*(?:\r?\n|$)/);
  if (match && match[1].trim().toLowerCase() === title.trim().toLowerCase()) {
    return content.slice(match[0].length);
  }
  return content;
}

export type MarkdownBlock =
  | { type: 'code'; lang: string; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'h2'; content: string }
  | { type: 'h3'; content: string }
  | { type: 'h4'; content: string }
  | { type: 'blockquote'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'hr' }
  | { type: 'paragraph'; content: string };

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
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
