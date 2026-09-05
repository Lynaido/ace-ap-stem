import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './MascotShowcase.css';

// handOffsetY values compensate for slanted or flared sleeve caps whose
// vertex medians differ from the area-weighted centre of the real opening.
export const OUTFITS = [
  {
    id: 'classic', number: '01', label: 'Engineer', type: 'glb', url: '/mascot/outfits/classic.glb', unitScale: 100,
    showBaseArms: true, armPose: { shoulderX: 19, shoulderY: 18.6, outerMin: 24 },
  },
  {
    id: 'doctor', number: '02', label: 'Healthcare', type: 'glb', url: '/mascot/outfits/doctor.glb', unitScale: 100,
    cuffOverlap: 3.4, armPose: { shoulderX: 19, shoulderY: 18.8, outerMin: 45 },
  },
  {
    id: 'long-vest', number: '03', label: 'Scientist', type: 'glb', url: '/mascot/outfits/long-vest.glb', unitScale: 100,
    cuffOverlap: 3.4, handOffsetY: -2.24,
    armPose: { shoulderX: 19.3, shoulderY: 18.3, outerMin: 43 },
  },
  {
    id: 'vest', number: '05', label: 'Business', type: 'glb', url: '/mascot/outfits/vest.glb', unitScale: 100,
    cuffOverlap: 3.2, armPose: { shoulderX: 18.3, shoulderY: 18.6, outerMin: 45 },
  },
  {
    id: 'artist', number: '06', label: 'Creative', type: 'glb', url: '/mascot/outfits/artist.glb', unitScale: 100,
    showBaseArms: true, armPose: { shoulderX: 19, shoulderY: 18.55, outerMin: 24 },
  },
  {
    id: 'activewear', number: '07', label: 'Performer', type: 'glb', url: '/mascot/outfits/activewear.glb', unitScale: 100,
    cuffOverlap: 3.2, armPose: { shoulderX: 19, shoulderY: 18.55, outerMin: 45 },
  },
  {
    id: 'cloak', number: '08', label: 'Fashion', type: 'glb', url: '/mascot/outfits/cloak.glb', unitScale: 100,
    cuffOverlap: 3.2, armPose: { shoulderX: 16.3, shoulderY: 19.45, outerMin: 45 },
  },
  {
    id: 'graduation', number: '10', label: 'Scholar', type: 'fbx',
    url: '/mascot/outfits/graduation/graduation.fbx', unitScale: 1,
    cuffOverlap: 3.4, handOffsetY: 3.49,
    armPose: { shoulderX: 21.1, shoulderY: 18.8, outerMin: 45 },
  },
  {
    id: 'hoodie', number: '11', label: 'Cozy', type: 'glb', url: '/mascot/outfits/hoodie.glb', unitScale: 100,
    cuffOverlap: 3.4, armPose: { shoulderX: 16.1, shoulderY: 19.45, outerMin: 45 },
  },
  {
    id: 'wizard', number: '12', label: 'Fantasy', type: 'glb', url: '/mascot/outfits/wizard.glb', unitScale: 100,
    cuffOverlap: 3.4, handOffsetY: 5.03,
    armPose: { shoulderX: 15.3, shoulderY: 15.25, outerMin: 45 },
  },
];

const MOODS = [
  { id: 'ready', label: 'Ready' },
  { id: 'curious', label: 'Curious' },
  { id: 'cheerful', label: 'Cheerful' },
];

const ACTIONS = [
  { id: 'hello', label: 'Say hello', message: 'ACE says hello and is ready to study with you.' },
  { id: 'focus', label: 'Focus with me', message: 'ACE is settling in for a focused study session.' },
  { id: 'celebrate', label: 'Celebrate', message: 'ACE is celebrating your progress.' },
];

const DEFAULT_OUTFIT_ID = 'classic';
const DEFAULT_MOOD_ID = 'ready';
const PREFERENCES_KEY = 'ace-mascot-preferences-v1';

const readPreferences = () => {
  if (typeof window === 'undefined') return {};

  try {
    const preferences = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || '{}');
    return preferences && typeof preferences === 'object' ? preferences : {};
  } catch (error) {
    return {};
  }
};

const isKnownPreference = (items, id) => items.some((item) => item.id === id);

const configureModel = (model) => {
  model.traverse((node) => {
    if (!node.isMesh) return;

    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      const materialName = (material.name || '').toLowerCase();
      const shouldStayGlossy = /eye|glass|lens|kinh|pupil/.test(materialName);

      // The supplied files mix very glossy and very dark material defaults.
      // Bring fabrics and painted surfaces into one soft, toy-like finish while
      // keeping the eyes and glasses crisp.
      if (!shouldStayGlossy && Number.isFinite(material.roughness)) {
        material.roughness = Math.max(material.roughness, 0.52);
      }
      if (!shouldStayGlossy && Number.isFinite(material.metalness)) {
        material.metalness = Math.min(material.metalness, 0.18);
      }
      if (!shouldStayGlossy && material.color?.isColor) {
        const color = {};
        material.color.getHSL(color);
        const softenedSaturation = Math.min(color.s, 0.68);
        const softenedLightness = color.s > 0.18 && color.l < 0.38
          ? 0.38 + (color.l * 0.12)
          : color.l;
        material.color.setHSL(color.h, softenedSaturation, softenedLightness);
      }
      if (Number.isFinite(material.emissiveIntensity)) {
        material.emissiveIntensity = Math.min(material.emissiveIntensity, 0.32);
      }
      material.needsUpdate = true;
    });
  });
};

const disposeModel = (model) => {
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
};

const cloneMaterial = (material) => {
  if (Array.isArray(material)) return material.map((item) => item.clone());
  return material?.clone();
};

const repairNeutralPoseGeometry = (node, geometry) => {
  if (node.name !== 'polySurface1010') return geometry;

  const positions = geometry.getAttribute('position');
  if (!positions) return geometry;

  for (let index = 0; index < positions.count; index += 1) {
    // The two hand islands are the only vertices beyond this X range. Their
    // approved neutral-pose data sits 14.5 cm above the outfit sleeves.
    if (Math.abs(positions.getX(index)) > 0.45) {
      positions.setZ(index, positions.getZ(index) - 0.145);
    }
  }

  positions.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
};

const splitHandGeometry = (geometry) => {
  if (geometry.index || geometry.getAttribute('position').count % 3 !== 0) {
    return [{ id: 'body', geometry }];
  }

  const attributes = Object.entries(geometry.attributes).filter(
    ([name]) => name !== 'skinIndex' && name !== 'skinWeight'
  );
  const buckets = {
    body: Object.fromEntries(attributes.map(([name]) => [name, []])),
    leftHand: Object.fromEntries(attributes.map(([name]) => [name, []])),
    rightHand: Object.fromEntries(attributes.map(([name]) => [name, []])),
  };
  const positions = geometry.getAttribute('position');

  for (let triangle = 0; triangle < positions.count; triangle += 3) {
    const centerX = (
      positions.getX(triangle)
      + positions.getX(triangle + 1)
      + positions.getX(triangle + 2)
    ) / 3;
    const bucket = centerX < -0.45
      ? buckets.leftHand
      : centerX > 0.45
        ? buckets.rightHand
        : buckets.body;

    attributes.forEach(([name, attribute]) => {
      for (let vertex = triangle; vertex < triangle + 3; vertex += 1) {
        for (let item = 0; item < attribute.itemSize; item += 1) {
          bucket[name].push(attribute.array[(vertex * attribute.itemSize) + item]);
        }
      }
    });
  }

  return Object.entries(buckets).map(([id, attributeValues]) => {
    const part = new THREE.BufferGeometry();
    attributes.forEach(([name, sourceAttribute]) => {
      const values = new sourceAttribute.array.constructor(attributeValues[name]);
      part.setAttribute(
        name,
        new THREE.BufferAttribute(values, sourceAttribute.itemSize, sourceAttribute.normalized)
      );
    });
    part.computeBoundingBox();
    part.computeBoundingSphere();
    return { id, geometry: part };
  });
};

const createStaticMesh = (node, geometry, name) => {
  geometry.computeBoundingBox();
  const localCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
  const worldCenter = localCenter.clone().applyMatrix4(node.matrixWorld);
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  node.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
  geometry.translate(-localCenter.x, -localCenter.y, -localCenter.z);

  const mesh = new THREE.Mesh(geometry, cloneMaterial(node.material));
  mesh.name = name;
  mesh.visible = node.visible;
  mesh.position.copy(worldCenter);
  mesh.quaternion.copy(worldQuaternion);
  mesh.scale.copy(worldScale);
  return mesh;
};

const REST_ARM_ANGLES = {
  left: THREE.MathUtils.degToRad(42),
  right: THREE.MathUtils.degToRad(-45),
};

const ACTION_ARM_ANGLES = {
  hello: { left: REST_ARM_ANGLES.left, right: THREE.MathUtils.degToRad(50) },
  focus: { left: THREE.MathUtils.degToRad(50), right: THREE.MathUtils.degToRad(-52) },
  celebrate: { left: THREE.MathUtils.degToRad(-26), right: THREE.MathUtils.degToRad(27) },
};

const getAttributeValue = (attribute, index, item) => {
  if (item === 0) return attribute.getX(index);
  if (item === 1) return attribute.getY(index);
  if (item === 2) return attribute.getZ(index);
  return attribute.getW(index);
};

const getTriangleMaterialIndex = (geometry, triangle) => {
  if (!geometry.groups.length) return 0;
  const offset = triangle * 3;
  const group = geometry.groups.find(
    (item) => offset >= item.start && offset < item.start + item.count
  );
  return group?.materialIndex || 0;
};

const createTriangleGeometry = (source, triangles) => {
  if (!triangles.length) return null;

  const geometry = new THREE.BufferGeometry();
  const sourceIndex = source.getIndex();

  Object.entries(source.attributes).forEach(([name, attribute]) => {
    if (name === 'skinIndex' || name === 'skinWeight') return;
    const values = new attribute.array.constructor(triangles.length * 3 * attribute.itemSize);
    let cursor = 0;

    triangles.forEach((triangle) => {
      for (let corner = 0; corner < 3; corner += 1) {
        const offset = (triangle * 3) + corner;
        const vertex = sourceIndex ? sourceIndex.getX(offset) : offset;
        for (let item = 0; item < attribute.itemSize; item += 1) {
          values[cursor] = getAttributeValue(attribute, vertex, item);
          cursor += 1;
        }
      }
    });

    geometry.setAttribute(
      name,
      new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized)
    );
  });

  let groupStart = 0;
  let groupMaterial = getTriangleMaterialIndex(source, triangles[0]);
  triangles.forEach((triangle, index) => {
    const materialIndex = getTriangleMaterialIndex(source, triangle);
    if (materialIndex !== groupMaterial) {
      geometry.addGroup(groupStart, (index * 3) - groupStart, groupMaterial);
      groupStart = index * 3;
      groupMaterial = materialIndex;
    }
  });
  geometry.addGroup(groupStart, (triangles.length * 3) - groupStart, groupMaterial);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
};

const findArmTriangles = (node, armPose) => {
  const geometry = node.geometry;
  const positions = geometry.getAttribute('position');
  const sourceIndex = geometry.getIndex();
  const triangleCount = Math.floor((sourceIndex?.count || positions.count) / 3);
  const parents = Array.from({ length: triangleCount }, (_, index) => index);
  const positionOwners = new Map();
  const point = new THREE.Vector3();

  const find = (index) => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    while (parents[index] !== index) {
      const next = parents[index];
      parents[index] = root;
      index = next;
    }
    return root;
  };

  const union = (first, second) => {
    const firstRoot = find(first);
    const secondRoot = find(second);
    if (firstRoot !== secondRoot) parents[secondRoot] = firstRoot;
  };

  const worldPoint = (triangle, corner) => {
    const offset = (triangle * 3) + corner;
    const vertex = sourceIndex ? sourceIndex.getX(offset) : offset;
    return point.fromBufferAttribute(positions, vertex).applyMatrix4(node.matrixWorld);
  };

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    for (let corner = 0; corner < 3; corner += 1) {
      const value = worldPoint(triangle, corner);
      const key = `${Math.round(value.x * 1000)}:${Math.round(value.y * 1000)}:${Math.round(value.z * 1000)}`;
      const owner = positionOwners.get(key);
      if (owner === undefined) positionOwners.set(key, triangle);
      else union(triangle, owner);
    }
  }

  const components = new Map();
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const root = find(triangle);
    if (!components.has(root)) {
      components.set(root, {
        triangles: [],
        bounds: new THREE.Box3(
          new THREE.Vector3(Infinity, Infinity, Infinity),
          new THREE.Vector3(-Infinity, -Infinity, -Infinity)
        ),
      });
    }
    const component = components.get(root);
    component.triangles.push(triangle);
    for (let corner = 0; corner < 3; corner += 1) {
      component.bounds.expandByPoint(worldPoint(triangle, corner));
    }
  }

  const buckets = { body: [], left: [], right: [] };
  components.forEach(({ triangles, bounds }) => {
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const rightSide = bounds.min.x > 12;
    const leftSide = bounds.max.x < -12;
    const outerX = rightSide ? bounds.max.x : leftSide ? Math.abs(bounds.min.x) : 0;
    const isArm = (rightSide || leftSide)
      && outerX >= armPose.outerMin
      && size.x >= 3.5
      && size.y <= 21
      && size.z <= 18
      && Math.abs(center.y - armPose.shoulderY) <= 8
      && Math.abs(center.z) <= 4.5;

    buckets[isArm ? (rightSide ? 'right' : 'left') : 'body'].push(...triangles);
  });

  // Some garments connect both sleeves through a shoulder yoke. In that case
  // the connected component spans both sides, so cut only at the authored
  // shoulder line and keep the central torso triangles in the body bucket.
  ['left', 'right'].forEach((side) => {
    if (buckets[side].length) return;
    const sign = side === 'right' ? 1 : -1;
    const bodyTriangles = [];

    buckets.body.forEach((triangle) => {
      const triangleBounds = new THREE.Box3(
        new THREE.Vector3(Infinity, Infinity, Infinity),
        new THREE.Vector3(-Infinity, -Infinity, -Infinity)
      );
      for (let corner = 0; corner < 3; corner += 1) {
        triangleBounds.expandByPoint(worldPoint(triangle, corner));
      }
      const center = triangleBounds.getCenter(new THREE.Vector3());
      const entirelyOnSide = sign > 0
        ? triangleBounds.min.x >= armPose.shoulderX - 0.5
        : triangleBounds.max.x <= -armPose.shoulderX + 0.5;
      const inArmBand = entirelyOnSide
        && Math.abs(center.y - armPose.shoulderY) <= 10.5
        && Math.abs(center.z) <= 8;

      if (inArmBand) buckets[side].push(triangle);
      else bodyTriangles.push(triangle);
    });

    buckets.body = bodyTriangles;
  });

  Object.values(buckets).forEach((triangles) => triangles.sort((a, b) => a - b));
  return buckets;
};

const copyMeshPresentation = (source, target) => {
  target.name = source.name;
  target.position.copy(source.position);
  target.quaternion.copy(source.quaternion);
  target.scale.copy(source.scale);
  target.visible = source.visible;
  target.renderOrder = source.renderOrder;
  target.frustumCulled = source.frustumCulled;
  target.castShadow = true;
  target.receiveShadow = true;
};

const percentile = (values, ratio) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((first, second) => first - second);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
};

// Locate the centre of a sleeve opening from the sleeve's actual vertices.
// This fits the hand to every supplied garment instead of applying one visual
// offset that can only be correct for a subset of the models.
export const getCuffAnchorFromPoints = (points, side) => {
  if (!points?.length) return null;
  const sign = side === 'right' ? 1 : -1;
  const outwardValues = points.map((point) => point.x * sign);
  // The distal 10% of the sleeve is the most reliable representation of the
  // actual cuff opening. A wider band can include the sloping upper sleeve
  // and make the hand appear to float when the model is viewed from the side.
  const outerBandStart = percentile(outwardValues, 0.9);
  const cuffPoints = points.filter((point) => (point.x * sign) >= outerBandStart);
  if (!cuffPoints.length) return null;

  return new THREE.Vector3(
    sign * percentile(cuffPoints.map((point) => point.x * sign), 0.55),
    percentile(cuffPoints.map((point) => point.y), 0.5),
    percentile(cuffPoints.map((point) => point.z), 0.5)
  );
};

const getWorldPoints = (meshes) => {
  const points = [];
  const point = new THREE.Vector3();

  meshes.forEach((mesh) => {
    const positions = mesh.geometry?.getAttribute('position');
    if (!positions) return;
    const stride = Math.max(1, Math.floor(positions.count / 12000));
    for (let index = 0; index < positions.count; index += stride) {
      points.push(point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld).clone());
    }
  });

  return points;
};

const createOutfitArmRigs = (model, armPose) => {
  const sourceMeshes = [];
  model.traverse((node) => {
    if (node.isMesh && node.geometry?.getAttribute('position')) sourceMeshes.push(node);
  });
  model.updateMatrixWorld(true);

  const rigs = {};
  const sleeveMeshes = { left: [], right: [] };
  ['left', 'right'].forEach((side) => {
    const sign = side === 'right' ? 1 : -1;
    const rig = new THREE.Group();
    rig.name = `ACE-${side}-outfit-shoulder`;
    model.add(rig);
    model.updateMatrixWorld(true);
    rig.position.copy(model.worldToLocal(new THREE.Vector3(
      sign * armPose.shoulderX,
      armPose.shoulderY,
      armPose.shoulderZ || 0
    )));
    rigs[side] = rig;
  });
  model.updateMatrixWorld(true);

  sourceMeshes.forEach((node) => {
    const buckets = findArmTriangles(node, armPose);
    if (!buckets.left.length && !buckets.right.length) return;

    const sourceGeometry = node.geometry;
    ['left', 'right'].forEach((side) => {
      const sleeveGeometry = createTriangleGeometry(sourceGeometry, buckets[side]);
      if (!sleeveGeometry) return;
      const sleeve = new THREE.Mesh(sleeveGeometry, cloneMaterial(node.material));
      copyMeshPresentation(node, sleeve);
      sleeve.name = `${node.name}-${side}-sleeve`;
      node.parent.add(sleeve);
      model.updateMatrixWorld(true);
      rigs[side].attach(sleeve);
      sleeveMeshes[side].push(sleeve);
    });

    const bodyGeometry = createTriangleGeometry(sourceGeometry, buckets.body);
    if (bodyGeometry) node.geometry = bodyGeometry;
    else node.visible = false;
    sourceGeometry.dispose();
  });

  model.updateMatrixWorld(true);
  model.userData.armRigs = rigs;
  model.userData.cuffAnchors = {
    left: getCuffAnchorFromPoints(getWorldPoints(sleeveMeshes.left), 'left'),
    right: getCuffAnchorFromPoints(getWorldPoints(sleeveMeshes.right), 'right'),
  };
  return rigs;
};

const createSkinMaterial = (hand) => {
  const source = Array.isArray(hand.material) ? hand.material[0] : hand.material;
  return new THREE.MeshStandardMaterial({
    color: source?.color?.clone() || new THREE.Color(0xd8c9ef),
    roughness: Number.isFinite(source?.roughness) ? source.roughness : 0.62,
    metalness: Number.isFinite(source?.metalness) ? source.metalness : 0.02,
  });
};

// The hand mesh is centred for clean re-parenting, but the sleeve joins the
// hand at its proximal edge rather than at the hand's visual centre. Measure
// that edge from the supplied geometry so every outfit gets the same natural
// wrist fit without relying on a guessed global x-offset.
const getHandWristOffset = (hand, side) => {
  const positions = hand.geometry?.getAttribute('position');
  if (!positions?.count) return new THREE.Vector3();

  const sign = side === 'right' ? 1 : -1;
  const outwardValues = [];
  for (let index = 0; index < positions.count; index += 1) {
    outwardValues.push(positions.getX(index) * sign);
  }
  const proximalLimit = percentile(outwardValues, 0.16);
  const proximalPoints = [];
  for (let index = 0; index < positions.count; index += 1) {
    if (positions.getX(index) * sign > proximalLimit) continue;
    proximalPoints.push(new THREE.Vector3(
      positions.getX(index),
      positions.getY(index),
      positions.getZ(index)
    ));
  }
  if (!proximalPoints.length) return new THREE.Vector3();

  const localPoint = new THREE.Vector3(
    percentile(proximalPoints.map((point) => point.x), 0.5),
    percentile(proximalPoints.map((point) => point.y), 0.5),
    percentile(proximalPoints.map((point) => point.z), 0.5)
  );
  return localPoint.multiply(hand.scale).applyQuaternion(hand.quaternion);
};

const addArmAndHand = (model, hand, side) => {
  const sign = side === 'right' ? 1 : -1;
  const handCenter = hand.position.clone();
  const shoulderX = 19;
  const shoulderY = 18.6;
  const armStartX = 24.5;
  const armEndX = 50.5;
  const radius = 5.1;
  const totalLength = armEndX - armStartX;
  const shoulder = new THREE.Group();
  shoulder.name = `ACE-${side}-shoulder`;
  shoulder.position.set(sign * shoulderX, shoulderY, 0);
  model.add(shoulder);

  const arm = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, Math.max(4, totalLength - (radius * 2)), 8, 16),
    createSkinMaterial(hand)
  );
  arm.name = `ACE-${side}-arm`;
  arm.rotation.z = sign * -Math.PI / 2;
  arm.position.set(
    sign * (((armStartX + armEndX) / 2) - shoulderX),
    handCenter.y - shoulderY - 0.7,
    handCenter.z - 1.5
  );
  arm.castShadow = true;
  arm.receiveShadow = true;
  arm.visible = false;
  shoulder.add(arm);

  const wrist = new THREE.Group();
  wrist.name = `ACE-${side}-wrist`;
  wrist.position.copy(handCenter).sub(shoulder.position);
  shoulder.add(wrist);
  model.updateMatrixWorld(true);
  wrist.attach(hand);

  const handWristOffset = getHandWristOffset(hand, side);
  return { arm, shoulder, wrist, handCenter, handWristOffset };
};

const configureBaseArmRigs = (model, outfit, outfitModel) => {
  const rigs = model?.userData.armRigs;
  if (!rigs) return;

  ['left', 'right'].forEach((side) => {
    const rig = rigs[side];
    if (!rig) return;
    const sign = side === 'right' ? 1 : -1;
    const shoulderX = outfit.armPose.shoulderX;
    const shoulderY = outfit.armPose.shoulderY;
    rig.shoulder.position.set(sign * shoulderX, shoulderY, outfit.armPose.shoulderZ || 0);
    const cuffAnchor = outfitModel?.userData.cuffAnchors?.[side];
    const hasAuthoredSleeve = !outfit.showBaseArms && cuffAnchor && rig.handWristOffset;
    const wristTarget = hasAuthoredSleeve
      ? cuffAnchor.clone().add(new THREE.Vector3(
        -sign * (outfit.cuffOverlap || 2.4),
        outfit.handOffsetY || 0,
        outfit.handOffsetZ || 0
      ))
      : rig.handCenter.clone();
    const handTarget = hasAuthoredSleeve
      ? wristTarget.clone().sub(rig.handWristOffset)
      : wristTarget;
    // Both the sleeve and hand rigs rotate around their authored shoulder
    // origins. Keep the wrist in the same neutral model coordinate space so
    // the next resting/action rotation moves the two pieces together.
    rig.wrist.position.copy(handTarget).sub(rig.shoulder.position);
    rig.arm.position.set(
      sign * (37.5 - shoulderX),
      rig.handCenter.y - shoulderY - 0.7,
      rig.handCenter.z - 1.5
    );
    rig.arm.visible = Boolean(outfit.showBaseArms);
  });
};

const setArmPose = (model, angles, wristWave = 0) => {
  const rigs = model?.userData.armRigs;
  if (!rigs) return;
  if (rigs.left?.shoulder) rigs.left.shoulder.rotation.z = angles.left;
  else if (rigs.left) rigs.left.rotation.z = angles.left;
  if (rigs.right?.shoulder) rigs.right.shoulder.rotation.z = angles.right;
  else if (rigs.right) rigs.right.rotation.z = angles.right;
  if (rigs.right?.wrist) rigs.right.wrist.rotation.z = wristWave;
};

// The supplied FBX contains vertices with more skinning weights than Three.js supports.
// Converting the approved neutral pose to static meshes prevents the loader from dropping
// hand weights and separating the hands from the body. Future rigged assets can replace
// this adapter without changing the companion controls.
export const createWebReadyBase = (source) => {
  source.updateMatrixWorld(true);
  const staticModel = new THREE.Group();
  staticModel.name = 'ACEWebReadyBase';
  const faceTargets = {};
  const hands = {};

  source.traverse((node) => {
    if (!node.isMesh) return;

    const geometry = repairNeutralPoseGeometry(node, node.geometry.clone());
    const parts = node.name === 'polySurface1010'
      ? splitHandGeometry(geometry)
      : [{ id: 'body', geometry }];
    if (node.name === 'polySurface1010' && parts.every((part) => part.geometry !== geometry)) {
      geometry.dispose();
    }

    parts.forEach((part) => {
      const mesh = createStaticMesh(node, part.geometry, `${node.name}-${part.id}`);
      staticModel.add(mesh);

      if (part.id === 'leftHand') hands.left = mesh;
      if (part.id === 'rightHand') hands.right = mesh;
      if (node.name === 'polySurface1008') faceTargets.mouth = mesh;
      if (node.name === 'polySurface1007') faceTargets.eyes = mesh;
    });
  });

  staticModel.userData.faceTargets = faceTargets;
  if (hands.left && hands.right) {
    const left = addArmAndHand(staticModel, hands.left, 'left');
    const right = addArmAndHand(staticModel, hands.right, 'right');
    staticModel.userData.armRigs = { left, right };
    setArmPose(staticModel, REST_ARM_ANGLES);
  }
  configureModel(staticModel);
  return staticModel;
};

const releaseSourceMeshes = (source) => {
  source.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => material.dispose());
  });
};

const prepareOutfitModel = (model, outfit) => {
  if (outfit.unitScale !== 1) model.scale.multiplyScalar(outfit.unitScale);
  model.name = `ACEOutfit-${outfit.id}`;
  createOutfitArmRigs(model, outfit.armPose);
  setArmPose(model, REST_ARM_ANGLES);
  configureModel(model);
  return model;
};

const loadOutfitModel = (outfit, onProgress) => new Promise((resolve, reject) => {
  if (outfit.type === 'fbx') {
    new FBXLoader().load(outfit.url, resolve, onProgress, reject);
    return;
  }

  new GLTFLoader().load(outfit.url, (gltf) => resolve(gltf.scene), onProgress, reject);
});

const getProgress = (event) => {
  if (!event?.lengthComputable || !event.total) return null;
  return Math.min(100, Math.round((event.loaded / event.total) * 100));
};

const MascotShowcase = () => {
  const initialPreferences = useMemo(readPreferences, []);
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneApiRef = useRef(null);
  const announcementTimerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [activeOutfitId, setActiveOutfitId] = useState(
    isKnownPreference(OUTFITS, initialPreferences.outfitId)
      ? initialPreferences.outfitId
      : DEFAULT_OUTFIT_ID
  );
  const [activeMoodId, setActiveMoodId] = useState(
    isKnownPreference(MOODS, initialPreferences.moodId)
      ? initialPreferences.moodId
      : DEFAULT_MOOD_ID
  );
  const [baseStatus, setBaseStatus] = useState('idle');
  const [outfitStatus, setOutfitStatus] = useState('idle');
  const [outfitProgress, setOutfitProgress] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [announcement, setAnnouncement] = useState('ACE is ready. Pick a look or mood.');
  const activeMoodRef = useRef(activeMoodId);
  activeMoodRef.current = activeMoodId;

  const activeOutfit = useMemo(
    () => OUTFITS.find((outfit) => outfit.id === activeOutfitId) || OUTFITS[0],
    [activeOutfitId]
  );
  const activeOutfitRef = useRef(activeOutfit);
  activeOutfitRef.current = activeOutfit;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ outfitId: activeOutfitId, moodId: activeMoodId })
      );
    } catch (error) {
      // Personalization still works for this visit when browser storage is unavailable.
    }
  }, [activeMoodId, activeOutfitId]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !stageRef.current || !canvasRef.current) return undefined;

    let disposed = false;
    let outfitRequest = 0;
    let visibleOutfit = null;
    let currentMood = activeMoodRef.current;
    let currentAction = null;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const companionRoot = new THREE.Group();
    const contentRoot = new THREE.Group();
    const outfitCache = new Map();
    const outfitRequests = new Map();
    companionRoot.add(contentRoot);
    scene.add(companionRoot);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio <= 2,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      setBaseStatus('error');
      setErrorMessage('The 3D preview is not available on this device.');
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    camera.position.set(0, 0.02, 6.2);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.8;
    controls.maxDistance = 8.8;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.target.set(0, -0.12, 0);

    scene.add(new THREE.HemisphereLight(0xfffbff, 0xded8f4, 1.65));

    const keyLight = new THREE.DirectionalLight(0xfffbff, 2.7);
    keyLight.position.set(3.5, 5.5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xded8ff, 1.25);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd9ef, 0.82);
    rimLight.position.set(-2, 3, -4);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.15, 64),
      new THREE.ShadowMaterial({ color: 0x6c3df4, opacity: 0.11 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.94;
    floor.receiveShadow = true;
    scene.add(floor);

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    const showOutfit = async (outfit) => {
      const requestId = ++outfitRequest;
      setOutfitStatus('loading');
      setOutfitProgress(null);
      setErrorMessage('');

      try {
        let model = outfitCache.get(outfit.id);
        if (!model) {
          let request = outfitRequests.get(outfit.id);
          if (!request) {
            request = loadOutfitModel(outfit, (event) => {
              if (requestId === outfitRequest) setOutfitProgress(getProgress(event));
            }).then((loadedModel) => {
              if (disposed) {
                disposeModel(loadedModel);
                return null;
              }
              prepareOutfitModel(loadedModel, outfit);
              loadedModel.visible = false;
              outfitCache.set(outfit.id, loadedModel);
              contentRoot.add(loadedModel);
              return loadedModel;
            });
            outfitRequests.set(outfit.id, request);
          }
          try {
            model = await request;
          } finally {
            if (outfitRequests.get(outfit.id) === request) {
              outfitRequests.delete(outfit.id);
            }
          }
          if (!model || disposed) return;
        }

        if (requestId !== outfitRequest) return;
        if (visibleOutfit && visibleOutfit !== model) visibleOutfit.visible = false;
        model.visible = true;
        visibleOutfit = model;
        const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
        configureBaseArmRigs(baseModel, outfit, model);
        setOutfitStatus('ready');
        setOutfitProgress(null);
        setAnnouncement(`ACE is now wearing the ${outfit.label.toLowerCase()} outfit.`);
      } catch (error) {
        if (requestId !== outfitRequest || disposed) return;
        setOutfitStatus('error');
        setOutfitProgress(null);
        setErrorMessage(`Could not load the ${outfit.label.toLowerCase()} outfit.`);
      }
    };

    const setMood = (moodId) => {
      currentMood = moodId;
    };

    const timer = new THREE.Timer();
    timer.connect(document);
    timer.update();

    const playAction = (actionId) => {
      currentAction = { id: actionId, startedAt: timer.getElapsed() };
    };

    sceneApiRef.current = { showOutfit, setMood, playAction };
    setBaseStatus('loading');
    setOutfitStatus('loading');
    // Start the first outfit request immediately so its network transfer and
    // parsing overlap with the body FBX request instead of running serially.
    showOutfit(activeOutfitRef.current);

    const baseLoader = new FBXLoader();
    baseLoader.setPath('/mascot/body/');
    baseLoader.load(
      'body_light_neon.fbx',
      (source) => {
        if (disposed) {
          disposeModel(source);
          return;
        }

        const model = createWebReadyBase(source);
        releaseSourceMeshes(source);
        contentRoot.add(model);

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());

        if (size.y > 0) {
          const scale = 2.6 / size.y;
          contentRoot.scale.setScalar(scale);
          // Frame the complete outfit, not only the base head mesh. The extra
          // lift keeps long garments inside the viewport and visually joins
          // the clothes, hands and body into one character.
          contentRoot.position.set(-center.x * scale, -center.y * scale + 0.2, -center.z * scale);
        }

        setBaseStatus('ready');
        setErrorMessage('');
      },
      undefined,
      () => {
        if (disposed) return;
        setBaseStatus('error');
        setErrorMessage('Could not load the ACE mascot model.');
      }
    );

    const moodScale = {
      ready: { mouthX: 1, mouthZ: 1, eyesZ: 1 },
      curious: { mouthX: 0.9, mouthZ: 0.86, eyesZ: 1.06 },
      cheerful: { mouthX: 1.1, mouthZ: 0.72, eyesZ: 0.96 },
    };

    renderer.setAnimationLoop((timestamp) => {
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      let y = reduceMotion ? 0 : Math.sin(elapsed * 1.1) * 0.018;
      let tilt = reduceMotion ? 0 : Math.sin(elapsed * 0.68) * 0.008;
      let turn = 0;
      const armAngles = { ...REST_ARM_ANGLES };
      let wristWave = 0;

      if (!currentAction && !reduceMotion) {
        const relaxedMotion = Math.sin(elapsed * 0.82) * THREE.MathUtils.degToRad(0.8);
        armAngles.left += relaxedMotion;
        armAngles.right -= relaxedMotion;
      }

      if (currentAction && !reduceMotion) {
        const actionElapsed = elapsed - currentAction.startedAt;
        const duration = currentAction.id === 'hello'
          ? 3
          : currentAction.id === 'focus'
            ? 2.35
            : 2.65;
        const progress = Math.min(1, Math.max(0, actionElapsed / duration));
        const envelope = Math.sin(progress * Math.PI) ** 2;
        const targetAngles = ACTION_ARM_ANGLES[currentAction.id] || REST_ARM_ANGLES;
        armAngles.left = THREE.MathUtils.lerp(REST_ARM_ANGLES.left, targetAngles.left, envelope);
        armAngles.right = THREE.MathUtils.lerp(REST_ARM_ANGLES.right, targetAngles.right, envelope);

        if (currentAction.id === 'hello') {
          tilt -= 0.025 * envelope;
          turn -= 0.055 * envelope;
          wristWave = Math.sin(progress * Math.PI * 8) * 0.2 * envelope;
        } else if (currentAction.id === 'focus') {
          y -= 0.045 * envelope;
          tilt += Math.sin(progress * Math.PI * 2) * 0.018 * envelope;
          turn += 0.045 * envelope;
        } else if (currentAction.id === 'celebrate') {
          y += Math.abs(Math.sin(progress * Math.PI * 2)) * 0.095 * envelope;
          tilt += Math.sin(progress * Math.PI * 4) * 0.028 * envelope;
          turn += Math.sin(progress * Math.PI * 2) * 0.055 * envelope;
        }

        if (progress >= 1) currentAction = null;
      }

      companionRoot.position.y = y;
      companionRoot.rotation.z = tilt;
      companionRoot.rotation.y = turn;

      const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
      setArmPose(baseModel, armAngles, wristWave);
      setArmPose(visibleOutfit, armAngles);

      const targets = baseModel?.userData.faceTargets;
      const mood = moodScale[currentMood] || moodScale.ready;
      if (targets?.mouth) {
        const base = targets.mouth.userData.baseScale || targets.mouth.scale.clone();
        targets.mouth.userData.baseScale = base;
        targets.mouth.scale.x = THREE.MathUtils.lerp(targets.mouth.scale.x, base.x * mood.mouthX, 0.12);
        targets.mouth.scale.z = THREE.MathUtils.lerp(targets.mouth.scale.z, base.z * mood.mouthZ, 0.12);
      }
      if (targets?.eyes) {
        const base = targets.eyes.userData.baseScale || targets.eyes.scale.clone();
        targets.eyes.userData.baseScale = base;
        targets.eyes.scale.z = THREE.MathUtils.lerp(targets.eyes.scale.z, base.z * mood.eyesZ, 0.12);
      }

      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      outfitRequest += 1;
      sceneApiRef.current = null;
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      timer.dispose();
      controls.dispose();
      disposeModel(contentRoot);
      floor.geometry.dispose();
      floor.material.dispose();
      renderer.dispose();
    };
  }, [sceneVersion, shouldLoad]);

  useEffect(() => {
    if (sceneApiRef.current && baseStatus === 'ready') {
      sceneApiRef.current.showOutfit(activeOutfit);
    }
  }, [activeOutfit, baseStatus]);

  useEffect(() => {
    sceneApiRef.current?.setMood(activeMoodId);
  }, [activeMoodId]);

  useEffect(() => () => window.clearTimeout(announcementTimerRef.current), []);

  const chooseMood = (mood) => {
    setActiveMoodId(mood.id);
    setAnnouncement(`ACE feels ${mood.label.toLowerCase()}.`);
  };

  const runAction = (action) => {
    sceneApiRef.current?.playAction(action.id);
    setAnnouncement(action.message);
    window.clearTimeout(announcementTimerRef.current);
    announcementTimerRef.current = window.setTimeout(
      () => setAnnouncement('ACE is ready for your next study step.'),
      3400
    );
  };

  const retryScene = () => {
    setErrorMessage('');
    setBaseStatus('idle');
    setOutfitStatus('idle');
    setSceneVersion((version) => version + 1);
  };

  const isLoading = baseStatus === 'loading' || outfitStatus === 'loading';
  const controlsReady = baseStatus === 'ready';

  return (
    <section className="mascot-showcase" id="meet-ace" ref={sectionRef}>
      <div className="mascot-showcase__container">
        <div className="mascot-showcase__copy">
          <p className="mascot-showcase__eyebrow">Meet your study buddy</p>
          <h2>Make ACE feel like your own.</h2>
          <p>
            Pick a role, set the mood, and let ACE react as you learn. Every outfit stays fitted
            while ACE rests, waves hello, focuses with you, and celebrates progress.
          </p>
          <div className="mascot-showcase__notes" aria-label="Mascot features">
            <span>10 character roles</span>
            <span>3 moods and study reactions</span>
            <span>Your choice is remembered</span>
          </div>
        </div>

        <div className="mascot-showcase__experience">
          <div className="mascot-companion-bar">
            <div className="mascot-companion-bar__identity">
              <span className="mascot-companion-bar__signal" aria-hidden="true" />
              <div>
                <strong>ACE is here</strong>
                <span>Your personal AP STEM study buddy</span>
              </div>
            </div>
            <div className="mascot-companion-bar__chat" aria-label="ACE status">
              <span>ACE</span>
              <p>{announcement}</p>
            </div>
            <div className="mascot-companion-bar__topics" aria-label="What ACE can help with">
              <span>Homework questions</span>
              <span>Concept explanations</span>
              <span>Practice and review</span>
            </div>
          </div>

          <div className="mascot-showcase__workspace">
            <div className="mascot-stage-shell">
              <div className="mascot-stage-shell__label">
                <span>Interactive 3D companion</span>
                <strong>{activeOutfit.number} · {activeOutfit.label}</strong>
              </div>
              <div
                className={`mascot-stage mascot-stage--${activeMoodId}`}
                ref={stageRef}
                role="img"
                aria-label={`Interactive 3D model of ACE wearing the ${activeOutfit.label.toLowerCase()} outfit and feeling ${activeMoodId}`}
              >
                <canvas ref={canvasRef} className="mascot-stage__canvas" />

                {!shouldLoad && (
                  <div className="mascot-stage__skeleton" aria-hidden="true">
                    <div className="mascot-stage__skeleton-figure" />
                  </div>
                )}

                {isLoading && (
                  <div className="mascot-stage__loading" role="status" aria-live="polite">
                    <span>
                      {baseStatus === 'loading'
                        ? 'Preparing ACE'
                        : `Changing to ${activeOutfit.label.toLowerCase()}`}
                    </span>
                    {outfitProgress !== null && <strong>{outfitProgress}%</strong>}
                  </div>
                )}

                {errorMessage && (
                  <div className="mascot-stage__error" role="alert">
                    <strong>ACE needs a quick reset.</strong>
                    <span>{errorMessage}</span>
                    <button type="button" onClick={retryScene}>Try again</button>
                  </div>
                )}

                <p className="mascot-stage__hint">Drag to turn. Pinch or scroll to zoom.</p>
              </div>
            </div>

            <div className="mascot-controls">
            <div className="mascot-controls__heading">
              <div>
                <h3>Customize ACE</h3>
                <p>Build a look and mood for today's study session.</p>
              </div>
              <span className="mascot-controls__status" aria-live="polite">{announcement}</span>
            </div>

            <fieldset className="mascot-controls__group">
              <legend>Outfit</legend>
              <div className="mascot-outfit-picker">
                {OUTFITS.map((outfit) => (
                  <button
                    type="button"
                    key={outfit.id}
                    className={`mascot-choice${activeOutfitId === outfit.id ? ' is-active' : ''}`}
                    aria-pressed={activeOutfitId === outfit.id}
                    disabled={!controlsReady}
                    onClick={() => setActiveOutfitId(outfit.id)}
                  >
                    <span className="mascot-choice__number" aria-hidden="true">{outfit.number}</span>
                    <span>{outfit.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mascot-controls__lower">
              <fieldset className="mascot-controls__group">
                <legend>Mood</legend>
                <div className="mascot-mood-picker">
                  {MOODS.map((mood) => (
                    <button
                      type="button"
                      key={mood.id}
                      className={`mascot-choice${activeMoodId === mood.id ? ' is-active' : ''}`}
                      aria-pressed={activeMoodId === mood.id}
                      disabled={!controlsReady}
                      onClick={() => chooseMood(mood)}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mascot-controls__group mascot-controls__group--actions">
                <legend>Study reactions</legend>
                <div className="mascot-action-picker">
                  {ACTIONS.map((action) => (
                    <button
                      type="button"
                      key={action.id}
                      className="mascot-action"
                      disabled={!controlsReady}
                      onClick={() => runAction(action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MascotShowcase;
