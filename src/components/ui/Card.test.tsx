import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello world</Card>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(<Card className="extra-class">content</Card>);
    expect(container.firstChild).toHaveClass('extra-class');
  });
});
