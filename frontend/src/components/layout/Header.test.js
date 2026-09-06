import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

jest.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    user: null,
    isAuthenticated: false,
    logout: jest.fn(),
  }),
}));

const renderAt = (entry) => render(
  <MemoryRouter initialEntries={[entry]}>
    <Header />
  </MemoryRouter>
);

test.each([
  ['/#features', 'Features', 'Home'],
  ['/#meet-ace', 'Study Buddy', 'Home'],
])('marks %s as the active public anchor', (entry, activeLabel, inactiveLabel) => {
  renderAt(entry);

  expect(screen.getByRole('link', { name: activeLabel })).toHaveClass('active');
  expect(screen.getByRole('link', { name: inactiveLabel })).not.toHaveClass('active');
});
