import { render, screen, within } from '@testing-library/react';
import * as THREE from 'three';
import MascotShowcase, {
  getCuffAnchorFromPoints,
  getOutfitArmPose,
  getOutfitFloorY,
  liftOutfitGarment,
  OUTFITS,
} from './MascotShowcase';

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

test('applies measured vertical cuff corrections to the three slanted sleeves', () => {
  const offsets = Object.fromEntries(
    OUTFITS.map((outfit) => [outfit.number, outfit.handOffsetY || 0])
  );

  expect(offsets).toMatchObject({
    '03': -2.24,
    '10': 3.49,
    '12': 5.03,
  });
});

test('lifts the business outfit as one rig and keeps its feet on the floor', () => {
  const business = OUTFITS.find((outfit) => outfit.id === 'vest');

  expect(business.modelOffsetY).toBe(17);
  expect(getOutfitArmPose(business).shoulderY).toBeCloseTo(18.6 + business.modelOffsetY);
  expect(getOutfitFloorY(business, 0.02616)).toBeCloseTo(-1.495, 2);
});

test('lifts clothing while keeping a hat in place even when they share a scaled mesh', () => {
  const model = new THREE.Group();
  model.scale.setScalar(100);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0.2, 0, 0.1, 0.2, 0, 0, 0.25, 0,
    0, 0.8, 0, 0.1, 0.8, 0, 0, 0.85, 0,
  ], 3));
  const mesh = new THREE.Mesh(geometry);
  model.add(mesh);

  liftOutfitGarment(model, 17);
  const point = new THREE.Vector3();
  const positions = geometry.getAttribute('position');
  expect(point.fromBufferAttribute(positions, 0).applyMatrix4(mesh.matrixWorld).y).toBeCloseTo(37);
  expect(point.fromBufferAttribute(positions, 3).applyMatrix4(mesh.matrixWorld).y).toBeCloseTo(80);
});

test('keeps an integrated hood continuous between the lifted collar and fixed head', () => {
  const model = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 30, 0, 1, 45, 0, 0, 60, 0,
  ], 3));
  const mesh = new THREE.Mesh(geometry);
  model.add(mesh);

  liftOutfitGarment(model, 12.46, true);
  const point = new THREE.Vector3();
  const positions = geometry.getAttribute('position');
  const heights = [0, 1, 2].map((index) => (
    point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld).y
  ));
  expect(heights[0]).toBeCloseTo(42.46);
  expect(heights[1]).toBeCloseTo(51.23);
  expect(heights[2]).toBeCloseTo(60);
  expect(heights[0]).toBeLessThan(heights[1]);
  expect(heights[1]).toBeLessThan(heights[2]);
});

test('exposes the approved ten outfit names and skips tech and gamer', () => {
  expect(OUTFITS.map((outfit) => outfit.label)).toEqual([
    'Engineer', 'Healthcare', 'Scientist', 'Business', 'Creative',
    'Performer', 'Fashion', 'Scholar', 'Cozy', 'Fantasy',
  ]);
});
