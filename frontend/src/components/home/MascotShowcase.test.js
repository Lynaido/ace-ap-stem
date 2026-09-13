import { render, screen, within } from '@testing-library/react';
import * as THREE from 'three';
import MascotShowcase, {
  applyHeadwearHairMask,
  createCoveredHairGeometry,
  findArmTriangles,
  getCuffAnchorFromPoints,
  getOutfitArmPose,
  getOutfitFloorY,
  liftOutfitGarment,
  OUTFITS,
  removeArtistBeretCrownNub,
  shouldShowSharedBase,
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
  expect(within(screen.getByRole('group', { name: /outfit/i })).getAllByRole('button')).toHaveLength(11);
  expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(2);
});

test('keeps calibrated shoulder poses for layered outfits and isolates the Technician', () => {
  expect(OUTFITS).toHaveLength(11);
  const layeredOutfits = OUTFITS.filter((outfit) => !outfit.fullCharacter);
  expect(layeredOutfits).toHaveLength(10);
  layeredOutfits.forEach((outfit) => {
    expect(outfit.armPose.shoulderX).toBeGreaterThan(0);
    expect(outfit.armPose.shoulderY).toBeGreaterThan(0);
    expect(outfit.armPose.outerMin).toBeGreaterThan(0);
  });

  expect(OUTFITS.find((outfit) => outfit.id === 'technician')).toMatchObject({
    number: '04',
    label: 'Technician',
    type: 'glb',
    url: '/mascot/outfits/technician.glb',
    fullCharacter: true,
  });
  expect(shouldShowSharedBase(OUTFITS.find((outfit) => outfit.id === 'technician'))).toBe(false);
  expect(shouldShowSharedBase(OUTFITS.find((outfit) => outfit.id === 'classic'))).toBe(true);

  expect(OUTFITS.find((outfit) => outfit.id === 'activewear').showBaseArms).not.toBe(true);
  expect(
    OUTFITS.filter((outfit) => outfit.showBaseArms).map((outfit) => outfit.id)
  ).toEqual(['classic', 'artist']);
});

test('uses material-matched, deeply underlapped shrouds for the base-arm outfits', () => {
  const shroudedOutfits = OUTFITS.filter((outfit) => outfit.shoulderShroud);

  expect(shroudedOutfits.map((outfit) => outfit.id)).toEqual(['classic', 'artist']);
  expect(shroudedOutfits.map((outfit) => outfit.shoulderShroud.materialName)).toEqual([
    'ao_trong_1001',
    'lambert14_1001',
  ]);

  shroudedOutfits.forEach((outfit) => {
    const shroud = outfit.shoulderShroud;
    expect(outfit.showBaseArms).toBe(true);
    // The shroud begins inside the torso, reaches beyond the capsule's former
    // visible root, and stays wider than the synthetic arm at its cuff.
    expect(shroud.innerX).toBeLessThan(17);
    expect(shroud.outerX).toBeGreaterThan(24);
    expect(shroud.shoulderRadius).toBeGreaterThan(shroud.cuffRadius);
    expect(shroud.cuffRadius).toBeGreaterThan(5.1);
  });
});

test('gives Performer a moving sleeve shroud instead of a static shoulder patch', () => {
  const performer = OUTFITS.find((outfit) => outfit.id === 'activewear');
  const shroud = performer.outfitArmShroud;

  expect(shroud.materialName).toBe('ao_trong');
  expect(shroud.innerX).toBeLessThan(getOutfitArmPose(performer).shoulderX);
  expect(shroud.outerX).toBeGreaterThan(performer.armPose.shoulderX);
  expect(shroud.shoulderRadius).toBeGreaterThan(shroud.cuffRadius);
  expect(shroud.cuffRadius).toBeGreaterThan(5.1);
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

test('keeps yoke-only mesh fragments fixed instead of detaching them as arms', () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    18.6, 18, 0, 20.2, 18, 0, 19.4, 20, 0,
    -18.6, 18, 0, -20.2, 18, 0, -19.4, 20, 0,
  ], 3));
  const mesh = new THREE.Mesh(geometry);
  mesh.updateMatrixWorld(true);

  const buckets = findArmTriangles(mesh, {
    shoulderX: 19,
    shoulderY: 18.6,
    sleeveCutX: 19,
    outerMin: 24,
  });

  expect(buckets.left).toEqual([]);
  expect(buckets.right).toEqual([]);
  expect(buckets.body).toEqual([0, 1]);
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

test('moves a one-piece Fashion hood above the base crown as one garment', () => {
  const baseCrownY = 116.4;
  const model = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, -18.44, 0,
    0, 45, 0,
    0, 102.46, 0,
  ], 3));
  const mesh = new THREE.Mesh(geometry);
  model.add(mesh);

  liftOutfitGarment(model, 15.44, 'liftAll');
  model.updateMatrixWorld(true);
  const point = new THREE.Vector3();

  expect(point.fromBufferAttribute(geometry.getAttribute('position'), 0).applyMatrix4(mesh.matrixWorld).y).toBeCloseTo(-3);
  expect(point.fromBufferAttribute(geometry.getAttribute('position'), 1).applyMatrix4(mesh.matrixWorld).y).toBeCloseTo(60.44);
  expect(point.fromBufferAttribute(geometry.getAttribute('position'), 2).applyMatrix4(mesh.matrixWorld).y).toBeGreaterThanOrEqual(baseCrownY);
});

test('trims the base hair at calibrated headwear edges and restores it afterward', () => {
  const base = new THREE.Group();
  const originalGeometry = new THREE.BufferGeometry();
  originalGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -2, 70, 0, 2, 70, 0, 0, 72, 0,
    -2, 90, 0, 2, 90, 0, 0, 92, 0,
  ], 3));
  const hair = new THREE.Mesh(originalGeometry);
  base.add(hair);
  base.updateMatrixWorld(true);

  const cropped = createCoveredHairGeometry(hair, 80, originalGeometry);
  expect(cropped.getAttribute('position').count).toBe(3);

  base.userData.hairMask = {
    mesh: hair,
    baseGeometry: originalGeometry,
    variants: new Map(),
  };
  applyHeadwearHairMask(base, { headwearHairCutoffY: 80 });
  expect(hair.geometry.getAttribute('position').count).toBe(3);
  expect(hair.visible).toBe(true);

  applyHeadwearHairMask(base, { headwearHairCutoffY: 60 });
  expect(hair.visible).toBe(false);

  applyHeadwearHairMask(base, { hideBaseHair: true });
  expect(hair.visible).toBe(false);

  applyHeadwearHairMask(base, {});
  expect(hair.geometry).toBe(originalGeometry);
  expect(hair.visible).toBe(true);
});

test('trims only Creative’s protruding base-body crown under the beret', () => {
  const base = new THREE.Group();
  const hairGeometry = new THREE.BufferGeometry();
  hairGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -2, 70, 0, 2, 70, 0, 0, 72, 0,
  ], 3));
  const bodyGeometry = new THREE.BufferGeometry();
  bodyGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -2, 69, 0, 2, 69, 0, 0, 70, 0,
    -2, 88, 0, 2, 88, 0, 0, 90, 0,
  ], 3));
  const hair = new THREE.Mesh(hairGeometry);
  const body = new THREE.Mesh(bodyGeometry);
  base.add(hair, body);
  base.updateMatrixWorld(true);
  base.userData.hairMask = {
    mesh: hair,
    baseGeometry: hairGeometry,
    variants: new Map(),
  };
  base.userData.bodyCrownMask = {
    mesh: body,
    baseGeometry: bodyGeometry,
    variants: new Map(),
  };

  applyHeadwearHairMask(base, { headwearBodyCutoffY: 70 });

  expect(hair.geometry).toBe(hairGeometry);
  expect(hair.visible).toBe(true);
  expect(body.geometry.getAttribute('position').count).toBe(3);
  expect(body.visible).toBe(true);

  applyHeadwearHairMask(base, {});
  expect(body.geometry).toBe(bodyGeometry);
  expect(body.visible).toBe(true);
});

test('uses the static mesh world orientation when applying a crown cutoff', () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -2, 0, 10, 2, 0, 10, 0, 0, 10,
    -2, 0, 30, 2, 0, 30, 0, 0, 30,
  ], 3));
  const mesh = new THREE.Mesh(geometry);
  mesh.position.y = 50;
  mesh.rotation.x = -Math.PI / 2;
  mesh.updateMatrix();

  const cropped = createCoveredHairGeometry(mesh, 70, geometry);

  // Rotation maps local Z into world Y: the first triangle reaches y=60,
  // while the second reaches y=80 and must not survive the cutoff.
  expect(cropped.getAttribute('position').count).toBe(3);
});

test('removes only the verified detached crown nub from the Creative beret', () => {
  const crownVertexCount = 357;
  const positions = [];
  for (let index = 0; index < crownVertexCount; index += 1) {
    const progress = index / (crownVertexCount - 1);
    positions.push(
      -3.745 + (5.924 * progress),
      100.605 + (5.911 * progress),
      -11.18 + (6.826 * progress)
    );
  }
  // A second, separate triangle represents the main beret, which must remain.
  positions.push(-12, 72, 0, 12, 72, 0, 0, 98, 5);

  const indices = [];
  for (let triangle = 0; triangle < 560; triangle += 1) {
    indices.push(0, 1 + (triangle % 356), 1 + ((triangle + 1) % 356));
  }
  indices.push(357, 358, 359);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const material = new THREE.MeshStandardMaterial();
  material.name = 'openPBR_shader1_1001';
  const mesh = new THREE.Mesh(geometry, material);
  const model = new THREE.Group();
  model.add(mesh);
  model.updateMatrixWorld(true);
  const artist = OUTFITS.find((outfit) => outfit.id === 'artist');

  expect(artist.hideBaseHair).toBe(true);
  expect(artist.headwearBodyCutoffY).toBe(70);
  expect(removeArtistBeretCrownNub(model, artist)).toBe(true);
  expect(mesh.geometry.getAttribute('position').count).toBe(3);
});

test('uses full headwear masks only for the supplied headwear outfits', () => {
  const masks = Object.fromEntries(
    OUTFITS
      .filter((outfit) => Number.isFinite(outfit.headwearHairCutoffY))
      .map((outfit) => [outfit.number, outfit.headwearHairCutoffY])
  );

  expect(masks).toEqual({
    '01': 70,
    '06': 70,
    '08': 70,
    '10': 96,
    '12': 74.5,
  });
});

test('applies the calibrated shoulder pivot and sleeve-cut positions to every layered outfit rig', () => {
  OUTFITS.filter((outfit) => !outfit.fullCharacter).forEach((outfit) => {
    const pose = getOutfitArmPose(outfit);
    const pivotInset = outfit.shoulderPivotInset ?? outfit.shoulderOverlap ?? 0;
    const cutInset = outfit.shoulderCutOverlap ?? pivotInset;

    expect(pose.shoulderX).toBeCloseTo(outfit.armPose.shoulderX - pivotInset);
    expect(pose.sleeveCutX).toBeCloseTo(outfit.armPose.shoulderX - cutInset);
    expect(pose.shoulderY).toBeCloseTo(outfit.armPose.shoulderY + (outfit.modelOffsetY || 0));
  });
});

test('preserves separated Scientist sleeve roots and gives connected sleeves a measured underlap', () => {
  ['classic', 'long-vest'].forEach((outfitId) => {
    const outfit = OUTFITS.find((candidate) => candidate.id === outfitId);
    const pose = getOutfitArmPose(outfit);

    expect(outfit.shoulderOverlap).toBe(0);
    expect(pose.shoulderX).toBeCloseTo(outfit.armPose.shoulderX);
  });

  ['artist', 'activewear'].forEach((outfitId) => {
    const outfit = OUTFITS.find((candidate) => candidate.id === outfitId);
    const pose = getOutfitArmPose(outfit);

    expect(pose.sleeveCutX).toBeCloseTo(outfit.armPose.shoulderX);
    expect(pose.shoulderX).toBeLessThan(pose.sleeveCutX);
    expect(pose.sleeveCutX - pose.shoulderX).toBeCloseTo(outfit.shoulderPivotInset);
  });
});

test('exposes the approved eleven outfit names and skips gamer', () => {
  expect(OUTFITS.map((outfit) => outfit.label)).toEqual([
    'Engineer', 'Healthcare', 'Scientist', 'Technician', 'Business', 'Creative',
    'Performer', 'Fashion', 'Scholar', 'Cozy', 'Fantasy',
  ]);
});
