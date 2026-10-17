import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from './index';

describe('ItemCard', () => {
  it('renders media, header, body and actions in their areas', () => {
    const { container } = render(<ItemCard media={<span>M</span>} title="Rose Swans" meta="Club" aside="$5" actions={<button>Join</button>}>Couture avatars</ItemCard>);
    expect(screen.getByText('Rose Swans')).toBeTruthy(); expect(screen.getByText('Club')).toBeTruthy();
    expect(screen.getByText('Couture avatars')).toBeTruthy(); expect(screen.getByText('Join')).toBeTruthy(); expect(screen.getByText('$5')).toBeTruthy();
    expect(container.querySelector('[data-stack="md"]')).toBeTruthy();
  });
  it('takes the stack breakpoint as a prop and passes clicks to the card', () => {
    let n = 0; const { container } = render(<ItemCard title="A" stackBelow="always" onClick={() => n++} />);
    expect(container.querySelector('[data-stack="always"]')).toBeTruthy();
    fireEvent.click(screen.getByText('A')); expect(n).toBe(1);
  });
});
