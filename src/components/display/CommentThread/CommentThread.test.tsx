import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentThread } from './index';

const chain = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 'c' + i, parentId: i ? 'c' + (i - 1) : null, author: 'A' + i, text: 'level ' + i }));

describe('CommentThread', () => {
  it('nests replies to six levels', () => {
    const { container } = render(<CommentThread comments={chain(7)} />);
    expect(screen.getByText('level 6')).toBeTruthy();
    expect(container.querySelector('[data-depth="6"]')).toBeTruthy();
    expect(container.querySelector('[data-level="6"]')).toBeTruthy();
  });
  it('folds and unfolds replies', () => {
    render(<CommentThread comments={chain(3)} openDepth={1} />);
    expect(screen.queryByText('level 1')).toBeNull();
    fireEvent.click(screen.getByText('Show 2 replies'));
    expect(screen.getByText('level 1')).toBeTruthy();
  });
  it('treats orphans as top level', () => {
    render(<CommentThread comments={[{ id: 'x', parentId: 'missing', author: 'Z', text: 'orphan' }]} />);
    expect(screen.getByText('orphan')).toBeTruthy();
  });
});

describe('CommentThread cascade', () => {
  it('sits on a card deck by default and bare with depth 0', () => {
    const a = render(<CommentThread comments={chain(2)} />);
    expect(a.container.querySelector('[data-deck-level]')).toBeTruthy();
    const b = render(<CommentThread comments={chain(2)} depth={0} />);
    expect(b.container.querySelector('[data-deck-level]')).toBeNull();
  });
});
