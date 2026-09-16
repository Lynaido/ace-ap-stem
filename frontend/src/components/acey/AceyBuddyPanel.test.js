import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AceyBuddyPanel from './AceyBuddyPanel';

jest.mock('./AceyAvatar', () => () => <div data-testid="acey-avatar" />);

const renderPanel = () => render(
  <MemoryRouter>
    <AceyBuddyPanel />
  </MemoryRouter>
);

beforeEach(() => localStorage.clear());

test('introduces the study buddy with a chat link and example topics', () => {
  renderPanel();
  expect(screen.getByRole('heading', { name: /this is acey!/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /chat with acey/i })).toHaveAttribute('href', '/tutor');
  expect(screen.getByText('AP strategies')).toBeInTheDocument();
  expect(screen.getByText(/acey is typing/i)).toBeInTheDocument();
});

test('customizes the outfit, color, accessories and name in place', () => {
  renderPanel();
  const studio = document.getElementById('acey-studio');
  expect(studio).toHaveAttribute('data-acey-target', 'customize-acey');

  const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
  expect(tabs.map((tab) => tab.textContent.trim())).toEqual(['Choose Outfit', 'Pick Color', 'Accessories', 'Name Acey']);

  // Outfit: every role is a card; choosing one saves it.
  const scientist = screen.getByRole('button', { name: /03\s*scientist/i });
  fireEvent.click(scientist);
  expect(scientist).toHaveAttribute('aria-pressed', 'true');
  expect(JSON.parse(localStorage.getItem('ace-mascot-preferences-v1')).outfitId).toBe('long-vest');

  // Color: a radio group of brain colors.
  fireEvent.click(screen.getByRole('tab', { name: /pick color/i }));
  fireEvent.click(screen.getByRole('radio', { name: 'Mint' }));
  expect(screen.getByRole('radio', { name: 'Mint' })).toHaveAttribute('aria-checked', 'true');
  expect(JSON.parse(localStorage.getItem('ace-mascot-preferences-v1')).colorId).toBe('mint');

  // Accessories: the switch for the chosen role.
  fireEvent.click(screen.getByRole('tab', { name: /accessories/i }));
  const propsSwitch = screen.getByRole('switch', { name: 'Show props: Science flask' });
  fireEvent.click(propsSwitch);
  expect(propsSwitch).not.toBeChecked();

  // Name: saved names appear across the panel; invalid names are refused.
  fireEvent.click(screen.getByRole('tab', { name: /name acey/i }));
  const input = screen.getByLabelText(/your buddy's name/i);
  fireEvent.change(input, { target: { value: '<Nova>' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save name' }));
  expect(screen.getByRole('alert')).toHaveTextContent(/letters, numbers/i);
  fireEvent.change(input, { target: { value: 'Nova' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save name' }));
  expect(screen.getByRole('heading', { name: /this is nova!/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /name nova/i })).toHaveAttribute('aria-selected', 'true');
});

test('moves between tabs with the arrow keys', () => {
  renderPanel();
  const outfitTab = screen.getByRole('tab', { name: /choose outfit/i });
  fireEvent.keyDown(outfitTab, { key: 'ArrowRight' });
  expect(screen.getByRole('tab', { name: /pick color/i })).toHaveAttribute('aria-selected', 'true');
  fireEvent.keyDown(screen.getByRole('tab', { name: /pick color/i }), { key: 'End' });
  expect(screen.getByRole('tab', { name: /name acey/i })).toHaveAttribute('aria-selected', 'true');
});
