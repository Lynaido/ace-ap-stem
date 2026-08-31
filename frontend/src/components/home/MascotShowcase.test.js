import { render, screen, within } from '@testing-library/react';
import * as THREE from 'three';
import MascotShowcase, { getCuffAnchorFromPoints, OUTFITS } from './MascotShowcase';

jest.mock('three/examples/jsm/loaders/FBXLoader.js', () => ({ FBXLoader: jest.fn() }));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({ GLTFLoader: jest.fn() }));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: jest.fn() }));

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

  expect(screen.getByRole('heading', { name: /make ace feel like your own/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /outfit/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /^mood$/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /study reactions/i })).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: /outfit/i })).getAllByRole('button')).toHaveLength(10);
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

  expect(screen.getByRole('button', { name: 'Healthcare' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Cheerful' })).toHaveAttribute('aria-pressed', 'true');
});

test('uses the real outer sleeve edge as the wrist anchor on both sides', () => {
  const rightPoints = [
    new THREE.Vector3(22, 18, 0),
    new THREE.Vector3(45, 17, -2),
    new THREE.Vector3(48, 18, 0),
    new THREE.Vector3(49, 19, 2),
    new THREE.Vector3(49.5, 18.5, 0.5),
  ];
  const leftPoints = rightPoints.map((point) => new THREE.Vector3(-point.x, point.y, point.z));

  const right = getCuffAnchorFromPoints(rightPoints, 'right');
  const left = getCuffAnchorFromPoints(leftPoints, 'left');

  expect(right.x).toBeGreaterThan(48);
  expect(left.x).toBeLessThan(-48);
  expect(right.y).toBeCloseTo(left.y);
  expect(right.z).toBeCloseTo(left.z);
});

test('exposes the approved ten outfit names and skips tech and gamer', () => {
  expect(OUTFITS.map((outfit) => outfit.label)).toEqual([
    'Engineer', 'Healthcare', 'Scientist', 'Business', 'Creative',
    'Performer', 'Fashion', 'Scholar', 'Cozy', 'Fantasy',
  ]);
});
