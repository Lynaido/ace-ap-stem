import { render, screen } from '@testing-library/react';
import App from './App';

test('shows the public landing page to signed-out visitors', async () => {
  localStorage.clear();
  render(<App />);
  expect(await screen.findByRole('heading', {
    name: /your ai-powered ap stem companion/i,
  })).toBeInTheDocument();
});
