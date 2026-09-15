import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

jest.mock('../context/AppContext', () => ({
  useAppContext: () => ({ user: { name: 'Linh Ai' }, isAuthenticated: true }),
}));

// Plain function, not jest.fn: CRA's jest config resets mock implementations.
jest.mock('../utils/api', () => ({
  savedItemsAPI: { getAll: () => Promise.resolve({ data: [] }) },
}));

// The real customizer boots a 3D scene, so stand in for it and check the page
// asks for the embedded dashboard variant.
jest.mock('../components/home/MascotShowcase', () => ({
  __esModule: true,
  default: ({ variant }) => <div data-testid="mascot-showcase">{variant}</div>,
}));

const renderPage = () => render(
  <MemoryRouter>
    <DashboardPage />
  </MemoryRouter>
);

test('shows the Acey customizer on the dashboard itself', async () => {
  renderPage();

  expect(await screen.findByTestId('mascot-showcase')).toHaveTextContent('dashboard');
  expect(screen.getByRole('region', { name: /customize acey/i })).toBeInTheDocument();
});

test('points the hero button at the customizer on this page', async () => {
  renderPage();
  await screen.findByTestId('mascot-showcase');

  expect(screen.getByRole('link', { name: /customize acey/i })).toHaveAttribute('href', '#customize-acey');
});
