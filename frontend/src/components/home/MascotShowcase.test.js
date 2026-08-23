import { render, screen } from '@testing-library/react';

jest.mock('three/examples/jsm/loaders/FBXLoader.js', () => ({ FBXLoader: jest.fn() }));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({ GLTFLoader: jest.fn() }));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: jest.fn() }));

import MascotShowcase from './MascotShowcase';

class IdleIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  localStorage.clear();
  window.IntersectionObserver = IdleIntersectionObserver;
});

afterEach(() => {
  delete window.IntersectionObserver;
});

test('renders complete mascot personalization controls', () => {
  render(<MascotShowcase />);

  expect(screen.getByRole('heading', { name: /meet ace/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /outfit/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /^mood$/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /study reactions/i })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(2);
});

test('restores valid saved outfit and mood preferences', () => {
  localStorage.setItem(
    'ace-mascot-preferences-v1',
    JSON.stringify({ outfitId: 'doctor', moodId: 'cheerful' })
  );

  render(<MascotShowcase />);

  expect(screen.getByRole('button', { name: 'Doctor' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Cheerful' })).toHaveAttribute('aria-pressed', 'true');
});
