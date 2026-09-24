import * as THREE from 'three';
import { ARM_FRAME, getArmWeights, getWaveAngle, poseCharacterArms, shortenArmFrame, solveArmHold } from './mascotArmPose';

const placePalm = (side, { upper, fore }) => {
  const sign = side === 'right' ? -1 : 1;
  const rest = new THREE.Vector3(sign, 0, 0);
  const shoulder = new THREE.Vector3(sign * ARM_FRAME.shoulderX, ARM_FRAME.axisY, ARM_FRAME.axisZ);
  const elbow = shoulder.clone().add(rest.clone().multiplyScalar(ARM_FRAME.elbowX - ARM_FRAME.shoulderX).applyQuaternion(upper));
  const palm = elbow.clone().add(rest.clone().multiplyScalar(ARM_FRAME.palmX - ARM_FRAME.elbowX).applyQuaternion(upper.clone().multiply(fore)));
  return { elbow, palm };
};

test('puts each palm on its hold target with the elbow toward the pole', () => {
  ['left', 'right'].forEach((side) => {
    const sign = side === 'right' ? -1 : 1;
    const target = [sign * 0.1, 0.33, 0.27];
    const { elbow, palm } = placePalm(side, solveArmHold(side, { target, pole: [1, -1, -0.5] }));
    palm.toArray().forEach((value, index) => expect(value).toBeCloseTo(target[index], 5));
    // Elbow out to its own side and below the shoulder.
    expect(Math.sign(elbow.x)).toBe(sign);
    expect(elbow.y).toBeLessThan(ARM_FRAME.axisY);
  });
});

test('weights only the arms: torso, head and hands blend by reach along the arm', () => {
  expect(getArmWeights(new THREE.Vector3(0.05, 0.36, 0))).toEqual({ upper: 0, fore: 0 });
  expect(getArmWeights(new THREE.Vector3(0.6, 0.8, 0))).toEqual({ upper: 0, fore: 0 });
  expect(getArmWeights(new THREE.Vector3(0.3, 0.36, 0))).toEqual({ upper: 1, fore: 0 });
  expect(getArmWeights(new THREE.Vector3(-0.62, 0.36, 0))).toEqual({ upper: 0, fore: 1 });
  // A jacket side below the armpit, next to the torso, stays with the body.
  expect(getArmWeights(new THREE.Vector3(0.24, 0.22, 0))).toEqual({ upper: 0, fore: 0 });
});

test('sleeveTop lets a raised sleeve follow the arm without catching the head', () => {
  const frame = { ...ARM_FRAME, sleeveTop: { fromX: 0.4, maxY: 0.52 } };
  const sleeveTop = new THREE.Vector3(0.5, 0.47, 0);
  expect(getArmWeights(sleeveTop)).toEqual({ upper: 0, fore: 0 });
  expect(getArmWeights(sleeveTop, frame).fore).toBeGreaterThan(0.99);
  expect(getArmWeights(new THREE.Vector3(0.3, 0.47, 0), frame)).toEqual({ upper: 0, fore: 0 });
});

test('rebuilds a T-pose character as skinned meshes and moves the held prop with the hand', () => {
  const model = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.05, 0.05), new THREE.MeshStandardMaterial());
  arm.position.y = ARM_FRAME.axisY;
  arm.name = 'arms';
  const wand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.02), new THREE.MeshStandardMaterial());
  wand.position.set(0.62, 0.4, 0.05);
  wand.name = 'wand';
  model.add(arm, wand);

  const target = [0.2, 0.3, 0.25];
  const pose = poseCharacterArms(model, { left: { target, pole: [1, -1, -0.5] }, props: { left: ['wand'] } });
  expect(pose.skinned.map((mesh) => mesh.name).sort()).toEqual(['arms', 'wand']);
  expect(model.getObjectByName('arms').isSkinnedMesh).toBe(true);

  model.updateMatrixWorld(true);
  const posedWand = model.getObjectByName('wand');
  const tip = posedWand.getVertexPosition(0, new THREE.Vector3()).applyMatrix4(posedWand.matrixWorld);
  // The wand followed the forearm toward the target instead of staying at x=0.62.
  expect(tip.x).toBeLessThan(0.45);
  expect(tip.z).toBeGreaterThan(0.1);
  expect(poseCharacterArms(model, { left: { target } })).toBe(pose);
});

test('waves in bursts and rests between them', () => {
  const wave = { degrees: 20, speed: 9, period: 4, active: 2 };
  const angles = Array.from({ length: 40 }, (_, i) => getWaveAngle(wave, i * 0.05));
  expect(Math.max(...angles)).toBeGreaterThan(0.1);
  expect(Math.min(...angles)).toBeLessThan(-0.1);
  angles.forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(THREE.MathUtils.degToRad(20)));
  expect(getWaveAngle(wave, 3)).toBe(0);
  expect(getWaveAngle(undefined, 1)).toBe(0);
});

test('shorter arms halve the shoulder-to-wrist stretch and slide the hand in', () => {
  const frame = shortenArmFrame(ARM_FRAME, { from: 0.2, to: 0.45, scale: 0.5 });
  expect(frame.shoulderX).toBe(ARM_FRAME.shoulderX);
  expect(frame.elbowX).toBeCloseTo(0.2 + ((ARM_FRAME.elbowX - 0.2) * 0.5));
  expect(frame.palmX).toBeCloseTo(ARM_FRAME.palmX - 0.125);
  expect(frame.elbowBlend[0]).toBeLessThan(ARM_FRAME.elbowBlend[0]);
});

test('opaqueArms draws only the arm triangles of a see-through material opaque', () => {
  const model = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false });
  // One quad on the head (x = 0) and one on the hand (x = 0.62).
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.05, 0.8, 0, 0.05, 0.8, 0, 0.05, 0.9, 0, -0.05, 0.9, 0,
    0.6, 0.34, 0, 0.64, 0.34, 0, 0.64, 0.38, 0, 0.6, 0.38, 0,
  ], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const mesh = new THREE.Mesh(geometry, material);
  model.add(mesh);
  const { skinned } = poseCharacterArms(model, { opaqueArms: true, left: { target: [0.2, 0.3, 0.3] } });
  const [head, hand] = skinned[0].material;
  expect(head).toBe(material);
  expect(hand.transparent).toBe(false);
  expect(hand.depthWrite).toBe(true);
  expect(skinned[0].geometry.groups).toEqual([
    { start: 0, count: 6, materialIndex: 0 },
    { start: 6, count: 6, materialIndex: 1 },
  ]);
});

test('wristRoll turns only the hand, and shift moves a fixed prop before posing', () => {
  const build = () => {
    const model = new THREE.Group();
    // A sleeve point on the forearm and a knuckle point on the hand, both
    // above the arm axis.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0.45, ARM_FRAME.axisY + 0.03, ARM_FRAME.axisZ,
      0.62, ARM_FRAME.axisY + 0.03, ARM_FRAME.axisZ,
      0.62, ARM_FRAME.axisY, ARM_FRAME.axisZ + 0.01,
    ], 3));
    const arm = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    arm.name = 'arm';
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), new THREE.MeshStandardMaterial());
    book.name = 'book';
    model.add(arm, book);
    return model;
  };
  const model = build();
  const pose = poseCharacterArms(model, { left: { wristRoll: 180 }, fixed: ['book'], shift: { book: [0, 0.05, 0] } });
  const arm = pose.skinned.find((mesh) => mesh.name === 'arm').geometry.getAttribute('position');
  // The sleeve keeps its place; the knuckle turns to below the arm axis.
  expect(arm.getY(0)).toBeCloseTo(ARM_FRAME.axisY + 0.03, 5);
  expect(arm.getY(1)).toBeCloseTo(ARM_FRAME.axisY - 0.03, 5);
  const book = pose.skinned.find((mesh) => mesh.name === 'book');
  book.geometry.computeBoundingBox();
  expect(book.geometry.boundingBox.getCenter(new THREE.Vector3()).y).toBeCloseTo(0.05, 5);
});
