import { render, screen } from '@testing-library/react';

jest.mock('three/examples/jsm/loaders/FBXLoader.js', () => ({ FBXLoader: jest.fn() }));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({ GLTFLoader: jest.fn() }));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: jest.fn() }));

import MascotShowcase, { OUTFITS } from './MascotShowcase';

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
  expect(screen.getByRole('group', { name: /outfit/i }).querySelectorAll('button')).toHaveLength(10);
  expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(2);
});

test('keeps a calibrated shoulder pose for every supplied outfit', () => {
  expect(OUTFITS).toHaveLength(10);
  OUTFITS.forEach((outfit) => {
    expect(outfit.armPose.shoulderX).toBeGreaterThan(0);
    expect(outfit.armPose.shoulderY).toBeGreaterThan(0);
    expect(outfit.armPose.outerMin).toBeGreaterThan(0);
  });

  expect(OUTFITS.find((outfit) => outfit.id === 'activewear').showBaseArms).not.toBe(true);
  expect(
    OUTFITS.filter((outfit) => outfit.showBaseArms).map((outfit) => outfit.id)
  ).toEqual(['classic', 'artist']);
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
