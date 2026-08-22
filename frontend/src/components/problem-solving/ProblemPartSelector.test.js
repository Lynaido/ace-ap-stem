import { fireEvent, render, screen } from '@testing-library/react';
import ProblemPartSelector from './ProblemPartSelector';

const structure = {
  extractedText: 'Question 2. (a) Find x. (b) Use x to find y. (c) Explain the result.',
  hasMultipleQuestions: true,
  questions: [
    {
      id: 'q2',
      label: 'Question 2',
      text: 'Use the model below.',
      parts: [
        { id: 'q2-a', label: '2(a)', text: 'Find x.' },
        { id: 'q2-b', label: '2(b)', text: 'Use x to find y.' },
        { id: 'q2-c', label: '2(c)', text: 'Explain the result.' },
      ],
    },
  ],
};

test('returns a focused sub-part with prior-part context available', () => {
  const onSelect = jest.fn();
  render(<ProblemPartSelector structure={structure} onSelect={onSelect} />);

  fireEvent.click(screen.getByRole('button', { name: /only 2\(b\)/i }));

  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
    scope: 'part',
    questionLabel: 'Question 2',
    partLabel: '2(b)',
    focusText: 'Use x to find y.',
    siblingLabels: ['2(a)', '2(c)'],
  }));
});

test('returns every sub-part in order when the whole question is selected', () => {
  const onSelect = jest.fn();
  render(<ProblemPartSelector structure={structure} onSelect={onSelect} />);

  fireEvent.click(screen.getByRole('button', { name: /solve all of question 2/i }));

  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
    scope: 'all',
    questionLabel: 'Question 2',
    siblingLabels: ['2(a)', '2(b)', '2(c)'],
  }));
});
