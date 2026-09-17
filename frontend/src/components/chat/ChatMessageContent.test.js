import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessageContent from './ChatMessageContent';

describe('ChatMessageContent', () => {
  it('renders paragraphs, lists, bold text and math from a tutor reply', () => {
    render(
      <ChatMessageContent
        content={'Start with **energy**.\n\n1. Write \\( v = 0 \\)\n2. Solve it\n\n\\[ t = \\frac{v_0}{g} \\]\nDone'}
      />
    );

    expect(screen.getByText('energy').tagName).toBe('STRONG');
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Solve it')).toBeInTheDocument();
    expect(screen.getAllByText('v', { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText('Done')).toBeInTheDocument();
    // Display math is typeset, so its delimiters never reach the text.
    expect(screen.queryByText(/\\\[/)).toBeNull();
  });

  it('keeps plain replies as a single paragraph', () => {
    render(<ChatMessageContent content="Hello there" />);
    expect(screen.getByText('Hello there').tagName).toBe('P');
  });
});
