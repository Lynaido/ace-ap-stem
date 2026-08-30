import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/home/MascotShowcase', () => () => <div data-testid="mascot-showcase" />);
jest.mock('./components/home/VideoSlideshow', () => () => <div data-testid="video-slideshow" />);

test('shows the public landing page to signed-out visitors', async () => {
  localStorage.clear();
  render(<App />);
  expect(await screen.findByRole('heading', {
    name: /master ap stem with an ai companion/i,
  })).toBeInTheDocument();
});
