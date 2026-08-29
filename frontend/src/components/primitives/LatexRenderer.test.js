import React from 'react';
import { render, screen } from '@testing-library/react';
import LatexRenderer from './LatexRenderer';

describe('LatexRenderer', () => {
  it('renders nested saved AI content without object placeholders', () => {
    render(
      <LatexRenderer
        content={{
          answer: 'The result is $x=2$.',
          steps: ['Subtract 4.', { explanation: 'Divide both sides by $3$.' }],
        }}
      />
    );

    expect(screen.getByText(/The result is/)).toBeInTheDocument();
    expect(screen.getByText(/Subtract 4/)).toBeInTheDocument();
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
  });

  it('keeps malformed math readable instead of blanking the saved note', () => {
    const { container } = render(<LatexRenderer content="Review $\\notacommand{ before class" />);
    expect(container).toHaveTextContent('Review');
  });
});
