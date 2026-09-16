// Shared ACE mascot model data and fitting helpers. Used by the landing-page
// customizer and by the Acey companion that follows learners through the app.
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getOutfitArmPose } from './mascotCatalog';
import { poseCharacterArms } from './mascotArmPose';

export * from './mascotCatalog';
export { poseCharacterArms };

export const MASCOT_FLOOR_Y = -1.94;

// Textured materials of Acey's own body (brain, face shell, eyes, glasses,
// mouth, bulb) as named in the base FBX and the 3D team's GLB exports.
const BODY_MATERIALS = new Set(['body', 'mat', 'mat_kinh', 'mieng', 'toc', 'Material']);

// The approved design renders show a pearl-white face with crisp navy eyes.
// The base FBX multiplies every body texture by 0.8 grey, and its eye layer is
// drawn translucent over the face shell, which washed the eyes out to grey.
// Show the textures at full value and draw the eyes opaque.
export const applyDesignBodyLook = (material) => {
  if (!material?.map || !BODY_MATERIALS.has(material.name)) return;
  material.color?.set(0xffffff);
  if (material.name === 'mat') {
    material.transparent = false;
    material.depthWrite = true;
  }
  material.needsUpdate = true;
};

// `keepColors` leaves material colors as delivered: designer characters are
// already in the approved design colors, only garments need softening.
export const configureModel = (model, { keepColors = false } = {}) => {
  model.traverse((node) => {
    if (!node.isMesh) return;

    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      applyDesignBodyLook(material);
      const materialName = (material.name || '').toLowerCase();
      const shouldStayGlossy = /eye|glass|lens|kinh|pupil/.test(materialName);
      // Colors recorded from an approved design render are used as delivered.
      const keepColor = keepColors || Boolean(material.userData?.keepColor);

      // The supplied files mix very glossy and very dark material defaults.
      // Bring fabrics and painted surfaces into one soft, toy-like finish while
      // keeping the eyes and glasses crisp.
      if (!shouldStayGlossy && Number.isFinite(material.roughness)) {
        material.roughness = Math.max(material.roughness, 0.52);
      }
      if (!shouldStayGlossy && Number.isFinite(material.metalness)) {
        material.metalness = Math.min(material.metalness, 0.18);
      }
      if (!shouldStayGlossy && !keepColor && material.color?.isColor) {
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

export const disposeModel = (model) => {
  const cutoffMasks = [];
  model?.traverse?.((node) => {
    [node.userData?.hairMask, node.userData?.bodyCrownMask]
      .filter(Boolean)
      .forEach((mask) => cutoffMasks.push(mask));
  });
  const inactiveGeometries = new Set();

  // The visible geometry is disposed by the normal traversal below. Dispose
  // cached, inactive crops as well so switching outfits cannot retain GPU
  // buffers after the 3D preview is unmounted.
  cutoffMasks.forEach((mask) => {
    mask.variants?.forEach((geometry) => {
      if (geometry !== mask.mesh?.geometry) inactiveGeometries.add(geometry);
    });
    if (mask.baseGeometry !== mask.mesh?.geometry) {
      inactiveGeometries.add(mask.baseGeometry);
    }
  });
  inactiveGeometries.forEach((geometry) => geometry?.dispose());

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

export const REST_ARM_ANGLES = {
  left: THREE.MathUtils.degToRad(42),
  right: THREE.MathUtils.degToRad(-45),
};

// An arm that holds a prop rests lowered and brought forward, so the prop is
// held in front of the body the way the designer's posed characters hold
// theirs, instead of on an arm stretched out to the side. `forward` swings the
// arm toward the camera about the shoulder; a prop set can override both with
// `holdPose: { left: { down, forward }, right: {...} }` (degrees).
export const HOLD_ARM_ANGLES = {
  left: THREE.MathUtils.degToRad(40),
  right: THREE.MathUtils.degToRad(-40),
};
export const HOLD_ARM_FORWARD = {
  left: THREE.MathUtils.degToRad(35),
  right: THREE.MathUtils.degToRad(35),
};

export const getRestArmAngles = (outfit) => {
  const holdArms = outfit?.props?.holdArms;
  if (!holdArms?.length) return REST_ARM_ANGLES;
  const pose = outfit.props.holdPose || {};
  const angle = (side) => {
    if (!holdArms.includes(side)) return REST_ARM_ANGLES[side];
    if (pose[side]?.down === undefined) return HOLD_ARM_ANGLES[side];
    return THREE.MathUtils.degToRad(side === 'left' ? pose[side].down : -pose[side].down);
  };
  const forward = (side) => {
    if (!holdArms.includes(side)) return 0;
    if (pose[side]?.forward === undefined) return HOLD_ARM_FORWARD[side];
    return THREE.MathUtils.degToRad(pose[side].forward);
  };
  return {
    left: angle('left'),
    right: angle('right'),
    forwardLeft: forward('left'),
    forwardRight: forward('right'),
  };
};

export const ACTION_ARM_ANGLES = {
  hello: { left: REST_ARM_ANGLES.left, right: THREE.MathUtils.degToRad(50) },
  focus: { left: THREE.MathUtils.degToRad(50), right: THREE.MathUtils.degToRad(-52) },
  celebrate: { left: THREE.MathUtils.degToRad(-26), right: THREE.MathUtils.degToRad(27) },
  think: { left: REST_ARM_ANGLES.left, right: THREE.MathUtils.degToRad(12) },
  encourage: { left: THREE.MathUtils.degToRad(18), right: THREE.MathUtils.degToRad(-20) },
  rest: { left: THREE.MathUtils.degToRad(48), right: THREE.MathUtils.degToRad(-50) },
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

const getIndexedTriangleComponents = (geometry, matrixWorld) => {
  const positions = geometry?.getAttribute('position');
  const sourceIndex = geometry?.getIndex();
  if (!positions || !sourceIndex) return [];

  const triangleCount = Math.floor(sourceIndex.count / 3);
  const parents = Array.from({ length: triangleCount }, (_, index) => index);
  const vertexOwners = new Map();
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

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = sourceIndex.getX((triangle * 3) + corner);
      const owner = vertexOwners.get(vertex);
      if (owner === undefined) vertexOwners.set(vertex, triangle);
      else union(triangle, owner);
    }
  }

  const components = new Map();
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const root = find(triangle);
    if (!components.has(root)) {
      components.set(root, {
        triangles: [],
        vertices: new Set(),
        bounds: new THREE.Box3(
          new THREE.Vector3(Infinity, Infinity, Infinity),
          new THREE.Vector3(-Infinity, -Infinity, -Infinity)
        ),
      });
    }

    const component = components.get(root);
    component.triangles.push(triangle);
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = sourceIndex.getX((triangle * 3) + corner);
      component.vertices.add(vertex);
      component.bounds.expandByPoint(
        point.fromBufferAttribute(positions, vertex).applyMatrix4(matrixWorld)
      );
    }
  }

  return Array.from(components.values());
};

const isArtistBeretCrownNub = (component) => {
  const { bounds } = component;
  const isNear = (value, expected) => Math.abs(value - expected) <= 0.15;

  return component.triangles.length === 560
    && component.vertices.size === 357
    && isNear(bounds.min.x, -3.745)
    && isNear(bounds.max.x, 2.179)
    && isNear(bounds.min.y, 100.605)
    && isNear(bounds.max.y, 106.516)
    && isNear(bounds.min.z, -11.18)
    && isNear(bounds.max.z, -4.354);
};

// `artist.glb` contains a small detached component at the top of the beret.
// It is not a separately addressable node, so remove it only after its exact
// vertex count, triangle count and transformed bounds have all matched. An
// updated asset simply bypasses this guard instead of losing an unknown mesh.
export const removeArtistBeretCrownNub = (model, outfit) => {
  if (outfit?.id !== 'artist' || !outfit.removeBeretCrownNub) return false;

  let removed = false;
  model.updateMatrixWorld(true);
  model.traverse((node) => {
    if (removed || !node.isMesh) return;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const hasBeretMaterial = materials.some(
      (material) => material?.name === 'openPBR_shader1_1001'
    );
    if (!hasBeretMaterial) return;

    const components = getIndexedTriangleComponents(node.geometry, node.matrixWorld);
    const crownNub = components.find(isArtistBeretCrownNub);
    if (!crownNub) return;

    const omitted = new Set(crownNub.triangles);
    const retainedTriangles = Array.from(
      { length: Math.floor(node.geometry.getIndex().count / 3) },
      (_, triangle) => triangle
    ).filter((triangle) => !omitted.has(triangle));
    const filteredGeometry = createTriangleGeometry(node.geometry, retainedTriangles);
    if (!filteredGeometry) return;

    node.geometry.dispose();
    node.geometry = filteredGeometry;
    removed = true;
  });

  return removed;
};

// Headwear in the supplied assets is designed to sit over ACE's brain-shaped
// hair mesh. The hair is a separate base-model mesh, however, so it can still
// draw through a helmet, cap, hood, or hat even when the accessory itself is
// perfectly placed. Keep only whole hair triangles below the measured inner
// edge of each headwear item. Keeping whole triangles avoids a visible sliced
// surface, and the remaining edge is safely tucked behind the accessory.
export const createCoveredHairGeometry = (hairMesh, cutoffY, sourceGeometry = hairMesh?.geometry) => {
  if (!hairMesh || !sourceGeometry || !Number.isFinite(cutoffY)) return null;

  hairMesh.updateMatrix();
  const positions = sourceGeometry.getAttribute('position');
  const sourceIndex = sourceGeometry.getIndex();
  if (!positions) return null;

  const triangleCount = Math.floor((sourceIndex?.count || positions.count) / 3);
  const retainedTriangles = [];
  const point = new THREE.Vector3();

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    let topY = -Infinity;
    for (let corner = 0; corner < 3; corner += 1) {
      const offset = (triangle * 3) + corner;
      const vertex = sourceIndex ? sourceIndex.getX(offset) : offset;
      point.fromBufferAttribute(positions, vertex).applyMatrix4(hairMesh.matrix);
      topY = Math.max(topY, point.y);
    }
    if (topY <= cutoffY) retainedTriangles.push(triangle);
  }

  return createTriangleGeometry(sourceGeometry, retainedTriangles);
};

const applyHeadwearCutoffMask = (mask, cutoffY) => {
  if (!mask?.mesh || !mask.baseGeometry) return;

  if (!Number.isFinite(cutoffY)) {
    mask.mesh.geometry = mask.baseGeometry;
    mask.mesh.visible = true;
    return;
  }

  const key = String(cutoffY);
  let maskedGeometry = mask.variants.get(key);
  if (!maskedGeometry) {
    const croppedGeometry = createCoveredHairGeometry(mask.mesh, cutoffY, mask.baseGeometry);
    if (croppedGeometry) {
      mask.variants.set(key, croppedGeometry);
      maskedGeometry = croppedGeometry;
    } else {
      // A covered base mesh can legitimately have no exposed triangles.
      // Avoid falling back to the original geometry, which would reintroduce
      // the exact crown leak this guard exists to prevent.
      mask.mesh.visible = false;
      return;
    }
  }

  mask.mesh.geometry = maskedGeometry;
  mask.mesh.visible = true;
};

export const applyHeadwearHairMask = (baseModel, outfit) => {
  const hairMask = baseModel?.userData?.hairMask;
  const bodyCrownMask = baseModel?.userData?.bodyCrownMask;

  if (outfit?.hideBaseHair && hairMask?.mesh) {
    hairMask.mesh.visible = false;
  } else {
    applyHeadwearCutoffMask(hairMask, outfit?.headwearHairCutoffY);
  }

  applyHeadwearCutoffMask(bodyCrownMask, outfit?.headwearBodyCutoffY);
};

export const findArmTriangles = (node, armPose) => {
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
    const fallbackOuterMin = armPose.fallbackOuterMin ?? armPose.outerMin;

    // A mesh containing only a yoke, epaulette or trim can have triangles at
    // the shoulder line without containing an arm at all. Splitting those
    // fragments made them rotate independently and is the source of the
    // visible shoulder spikes in three-quarter views. Only use the connected
    // garment fallback if that *same mesh* genuinely reaches the outer arm.
    const hasReachableSleeve = buckets.body.some((triangle) => {
      for (let corner = 0; corner < 3; corner += 1) {
        if ((worldPoint(triangle, corner).x * sign) >= fallbackOuterMin) return true;
      }
      return false;
    });
    if (!hasReachableSleeve) return;

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
      // `sleeveCutX` deliberately can differ from the shoulder rotation
      // centre. Keep the moving geometry under the fixed torso whenever a
      // connected garment would otherwise open at the shoulder while rotating.
      const sleeveCutX = armPose.sleeveCutX ?? armPose.shoulderX;
      const entirelyOnSide = sign > 0
        ? triangleBounds.min.x >= sleeveCutX - 0.5
        : triangleBounds.max.x <= -sleeveCutX + 0.5;
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

// The synthetic base arms used by short-sleeve outfits must begin inside the
// garment's shoulder volume. Start the capsule deeply inside the torso so its
// rounded root remains completely under the garment shroud at every yaw.
const BASE_ARM_INNER_X = 8;
const BASE_ARM_OUTER_X = 50.5;

const disposeShoulderShroud = (shroud) => {
  if (!shroud) return;
  shroud.removeFromParent();
  shroud.geometry?.dispose();
  const materials = Array.isArray(shroud.material) ? shroud.material : [shroud.material];
  // Material clones share the source texture with the outfit. Dispose only
  // the clone so changing outfits cannot invalidate the still-visible model.
  materials.filter(Boolean).forEach((material) => material.dispose());
};

const findOutfitMaterial = (outfitModel, materialName) => {
  let match = null;
  outfitModel?.traverse((node) => {
    if (match || !node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    match = materials.find((material) => material?.name === materialName) || null;
  });
  return match;
};

// Connected garments such as Performer retain a fixed bib while their sleeves
// move with the shoulder rig. Cover the geometric split with a short, tapered
// section of the actual sleeve cloth. Unlike a static bridge, this follows the
// arm through every action and cannot become a horizontal rear protrusion.
const addOutfitArmShrouds = (model, outfit) => {
  const profile = outfit.outfitArmShroud;
  const rigs = model.userData.armRigs;
  if (!profile || !rigs) return;

  const sourceMaterial = findOutfitMaterial(model, profile.materialName);
  const length = profile.outerX - profile.innerX;
  if (!sourceMaterial || !(length > 0)) return;

  const pose = getOutfitArmPose(outfit);
  const localScale = model.scale.x || outfit.unitScale || 1;

  ['left', 'right'].forEach((side) => {
    const rig = rigs[side];
    if (!rig) return;
    disposeShoulderShroud(rig.userData.outfitArmShroud);

    const sign = side === 'right' ? 1 : -1;
    const shroud = new THREE.Mesh(
      new THREE.CylinderGeometry(
        profile.cuffRadius / localScale,
        profile.shoulderRadius / localScale,
        length / localScale,
        20,
        4,
        true
      ),
      cloneMaterial(sourceMaterial)
    );
    shroud.name = `ACE-${side}-moving-garment-shoulder-shroud`;
    shroud.rotation.z = sign * -Math.PI / 2;
    shroud.position.set(
      sign * ((((profile.innerX + profile.outerX) / 2) - pose.shoulderX) / localScale),
      (profile.yOffset || 0) / localScale,
      (profile.zOffset || 0) / localScale
    );
    shroud.castShadow = true;
    shroud.receiveShadow = true;
    rig.add(shroud);
    rig.userData.outfitArmShroud = shroud;
  });
};

// Short-sleeve outfits use the base model's articulated arms. A small tapered
// section of their own cloth, attached to that same pivot, gives the arm a
// natural sleeve-to-skin transition from every viewing angle. It starts well
// inside the static shell and finishes over the base-arm capsule, so neither
// the shroud nor the skin can expose a circular root at the rear shoulder.
const syncShoulderShroud = (rig, outfit, outfitModel, side, shoulderX, shoulderY, liftY) => {
  disposeShoulderShroud(rig.shoulderShroud);
  rig.shoulderShroud = null;

  const profile = outfit.showBaseArms && outfit.shoulderShroud;
  if (!profile) return;

  const sourceMaterial = findOutfitMaterial(outfitModel, profile.materialName);
  if (!sourceMaterial) return;

  const sign = side === 'right' ? 1 : -1;
  const length = profile.outerX - profile.innerX;
  if (!(length > 0)) return;

  const shroud = new THREE.Mesh(
    new THREE.CylinderGeometry(
      profile.cuffRadius,
      profile.shoulderRadius,
      length,
      20,
      4,
      true
    ),
    cloneMaterial(sourceMaterial)
  );
  shroud.name = `ACE-${side}-garment-shoulder-shroud`;
  // CylinderGeometry is vertical by default. Its +Y opening maps to the
  // outward side for both arms; open ends avoid a visible circular plug while
  // the narrower cuff remains safely over the base arm.
  shroud.rotation.z = sign * -Math.PI / 2;
  shroud.position.set(
    sign * (((profile.innerX + profile.outerX) / 2) - shoulderX),
    rig.handCenter.y + liftY - shoulderY - 0.7 + (profile.yOffset || 0),
    rig.handCenter.z - 1.5 + (profile.zOffset || 0)
  );
  shroud.castShadow = true;
  shroud.receiveShadow = true;
  rig.shoulder.add(shroud);
  rig.shoulderShroud = shroud;
};

// Held props are anchored at the centre of the outer part of each hand: the
// vertices beyond 81% of the hand's reach from the body centre. This matches
// how the 3D team's posed deliveries were measured (|x| > 0.55 of 0.681).
const PROP_TIP_REACH = 0.55 / 0.681;

export const getHandTip = (hand) => {
  hand.updateMatrix();
  const positions = hand.geometry.getAttribute('position');
  const point = new THREE.Vector3();
  let reach = 0;
  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index).applyMatrix4(hand.matrix);
    reach = Math.max(reach, Math.abs(point.x));
  }
  const box = new THREE.Box3();
  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index).applyMatrix4(hand.matrix);
    if (Math.abs(point.x) >= reach * PROP_TIP_REACH) box.expandByPoint(point);
  }
  return box.isEmpty() ? hand.position.clone() : box.getCenter(new THREE.Vector3());
};

// A hand that grips a prop curls into a fist around a handle. Values are in
// the wrist rig's space for the right hand, where the open hand lies palm down
// (+x toward the fingertips, +z toward the thumb); the left hand mirrors x.
const FIST = {
  knuckleX: 3,
  // Finger midline radius around the handle and the largest curl (radians).
  curlRadius: 2.6,
  maxCurl: 2.9,
  // The thumb (z > ~4.5, x < ~3.5) turns from pointing forward to lying beside
  // the index finger, so it wraps the handle with the fingers.
  thumbPivot: { x: 0.3, z: 3.8 },
  thumbZ: [3.6, 5.4],
  thumbX: [3.5, 5.5],
  // Middle of the four fingers across the hand.
  gripZ: -1.75,
};

// A fist is rolled thumb-up, so the handle through it runs vertically.
const GRIP_ROLL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

const createFistGeometry = (hand, openQuaternion, side) => {
  const sign = side === 'right' ? 1 : -1;
  const geometry = hand.geometry.clone();
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const toWrist = new THREE.Matrix4().compose(new THREE.Vector3(), openQuaternion, hand.scale);
  const toLocal = toWrist.clone().invert();
  const toLocalRotation = openQuaternion.clone().invert();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const { thumbPivot, curlRadius, knuckleX } = FIST;

  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index).applyMatrix4(toWrist);
    if (normals) normal.fromBufferAttribute(normals, index).applyQuaternion(openQuaternion);
    let x = point.x * sign;
    let nx = normal.x * sign;

    const thumb = THREE.MathUtils.smoothstep(point.z, FIST.thumbZ[0], FIST.thumbZ[1])
      * (1 - THREE.MathUtils.smoothstep(x, FIST.thumbX[0], FIST.thumbX[1]));
    if (thumb > 0) {
      const cos = Math.cos(thumb * Math.PI / 2);
      const sin = Math.sin(thumb * Math.PI / 2);
      const dx = x - thumbPivot.x;
      const dz = point.z - thumbPivot.z;
      x = thumbPivot.x + (dx * cos) + (dz * sin);
      point.z = thumbPivot.z - (dx * sin) + (dz * cos);
      const turnedNx = (nx * cos) + (normal.z * sin);
      normal.z = (-nx * sin) + (normal.z * cos);
      nx = turnedNx;
    }

    if (x > knuckleX) {
      const length = x - knuckleX;
      const angle = Math.min(length / curlRadius, FIST.maxCurl);
      const straight = length - (angle * curlRadius);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const radius = curlRadius + point.y;
      x = knuckleX + (radius * sin) + (straight * cos);
      point.y = -curlRadius + (radius * cos) - (straight * sin);
      const curledNx = (nx * cos) + (normal.y * sin);
      normal.y = (-nx * sin) + (normal.y * cos);
      nx = curledNx;
    }

    point.x = x * sign;
    normal.x = nx * sign;
    point.applyMatrix4(toLocal);
    positions.setXYZ(index, point.x, point.y, point.z);
    if (normals) {
      normal.applyQuaternion(toLocalRotation).normalize();
      normals.setXYZ(index, normal.x, normal.y, normal.z);
    }
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
};

// Every hand sits in a hold frame that turns about the wrist joint. It stays
// at rest for open hands; a fist counter-rotates with the arm so the prop it
// grips stays upright while Acey rests or reacts.
export const addHandHold = (rig, side) => {
  const { wrist, hand } = rig;
  const joint = rig.handWristOffset || new THREE.Vector3();
  const holdPivot = new THREE.Group();
  holdPivot.name = `ACE-${side}-hold`;
  holdPivot.position.copy(joint);
  wrist.add(holdPivot);
  const holdFrame = new THREE.Group();
  holdFrame.position.copy(joint).negate();
  holdPivot.add(holdFrame);
  holdFrame.add(hand);
  Object.assign(rig, {
    holdPivot,
    holdFrame,
    side,
    gripping: false,
    openGeometry: hand.geometry,
    openQuaternion: hand.quaternion.clone(),
    openPosition: hand.position.clone(),
  });
  return rig;
};

const setHandGrip = (rig, gripping) => {
  if (!rig?.holdFrame || rig.gripping === gripping) return;
  const { hand } = rig;
  rig.gripping = gripping;
  if (gripping) {
    rig.fistGeometry = rig.fistGeometry || createFistGeometry(hand, rig.openQuaternion, rig.side);
    hand.geometry = rig.fistGeometry;
    hand.quaternion.copy(rig.openQuaternion).premultiply(GRIP_ROLL);
    // Roll about the wrist joint so the hand stays joined to its sleeve.
    const joint = rig.handWristOffset || new THREE.Vector3();
    hand.position.copy(rig.openPosition).add(joint).sub(joint.clone().applyQuaternion(GRIP_ROLL));
  } else {
    hand.geometry = rig.openGeometry;
    hand.quaternion.copy(rig.openQuaternion);
    hand.position.copy(rig.openPosition);
    rig.holdPivot.rotation.z = 0;
  }
};

// The centre of the handle through a fist, in hold-frame coordinates.
const getGripCenter = (rig) => {
  const sign = rig.side === 'right' ? 1 : -1;
  return new THREE.Vector3(sign * FIST.knuckleX, -FIST.curlRadius, FIST.gripZ)
    .applyQuaternion(GRIP_ROLL)
    .add(rig.hand.position);
};

const addArmAndHand = (model, hand, side) => {
  const sign = side === 'right' ? 1 : -1;
  const handCenter = hand.position.clone();
  const handTip = getHandTip(hand);
  // The supplied body is slightly translucent. Opaque hands keep held props
  // from showing through the fingers; the synthetic arms are opaque too.
  (Array.isArray(hand.material) ? hand.material : [hand.material]).filter(Boolean).forEach((material) => {
    material.transparent = false;
    material.alphaMap = null;
    material.needsUpdate = true;
  });
  const shoulderX = 19;
  const shoulderY = 18.6;
  // Sink the base arm under the outfit shoulder so no skin-colored gap is
  // visible when a short-sleeve outfit is raised to the neck.
  const armStartX = BASE_ARM_INNER_X;
  const armEndX = BASE_ARM_OUTER_X;
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
  return addHandHold({ arm, shoulder, wrist, hand, handCenter, handTip, handWristOffset }, side);
};

const PROP_ANCHOR_SIDES = { anchor_pos: 'right', anchor_neg: 'left', anchor_body: null };
const GRIP_ANCHOR_SIDES = { grip_pos: 'right', grip_neg: 'left' };

export const detachPropSet = (baseModel) => {
  const anchors = baseModel?.userData.propAnchors;
  if (!anchors) return;
  anchors.forEach((anchor) => anchor.removeFromParent());
  baseModel.userData.propAnchors = null;
  const rigs = baseModel.userData.armRigs;
  setHandGrip(rigs?.left, false);
  setHandGrip(rigs?.right, false);
};

const syncPropAnchors = (model) => {
  const rigs = model?.userData.armRigs;
  [rigs?.left, rigs?.right].forEach((rig) => {
    if (rig?.holdPivot && rig.gripping) {
      rig.holdPivot.rotation.z = -(rig.shoulder.rotation.z + rig.wrist.rotation.z);
    }
  });
  model?.userData.propAnchors?.forEach((anchor) => {
    const { rig } = anchor.userData;
    // Hanging props (bags) follow the open hand but counter-rotate with the
    // arm, so they keep hanging straight down while Acey rests or reacts.
    if (rig) anchor.rotation.z = -(rig.shoulder.rotation.z + rig.wrist.rotation.z);
  });
};

// Prop sets (public/mascot/props) are authored in units of the hand span
// between the fingertips, so one scale fits them to Acey's own hands on the
// approved garment:
// - `grip_pos` / `grip_neg`: held through the +x (right rig) or -x fist; the
//   origin is the centre of the handle and +y runs along it;
// - `anchor_pos` / `anchor_neg`: hanging from the open +x or -x palm;
// - `anchor_body`: around the midpoint between the fingertips.
export const attachPropSet = (baseModel, propScene) => {
  detachPropSet(baseModel);
  const rigs = baseModel?.userData.armRigs;
  if (!rigs?.left?.handTip || !rigs?.right?.handTip || !propScene) return [];
  const span = rigs.right.handTip.x - rigs.left.handTip.x;
  const anchors = [];
  propScene.children.forEach((source) => {
    const gripSide = GRIP_ANCHOR_SIDES[source.name];
    if (!gripSide && !(source.name in PROP_ANCHOR_SIDES)) return;
    const anchor = source.clone(true);
    anchor.scale.setScalar(span);
    const side = PROP_ANCHOR_SIDES[source.name];
    if (gripSide) {
      const rig = rigs[gripSide];
      setHandGrip(rig, true);
      (rig.holdFrame || rig.wrist).add(anchor);
      anchor.position.copy(rig.holdFrame ? getGripCenter(rig) : rig.hand.position);
    } else if (side) {
      const rig = rigs[side];
      // The hand mesh is centred on its bounding box, so its position is the palm.
      anchor.position.copy(rig.hand.position);
      rig.wrist.add(anchor);
      anchor.userData.rig = rig;
    } else {
      anchor.position.copy(rigs.left.handTip).add(rigs.right.handTip).multiplyScalar(0.5);
      baseModel.add(anchor);
    }
    anchors.push(anchor);
  });
  baseModel.userData.propAnchors = anchors;
  syncPropAnchors(baseModel);
  return anchors;
};

export const loadPropSet = (url) => new Promise((resolve, reject) => {
  new GLTFLoader().load(url, (gltf) => {
    configureModel(gltf.scene);
    resolve(gltf.scene);
  }, undefined, reject);
});

export const configureBaseArmRigs = (model, outfit, outfitModel) => {
  const rigs = model?.userData.armRigs;
  if (!rigs) return;
  const armPose = getOutfitArmPose(outfit);
  const liftY = outfit.modelOffsetY || 0;

  ['left', 'right'].forEach((side) => {
    const rig = rigs[side];
    if (!rig) return;
    const sign = side === 'right' ? 1 : -1;
    const shoulderX = armPose.shoulderX;
    const shoulderY = armPose.shoulderY;
    rig.shoulder.position.set(sign * shoulderX, shoulderY, armPose.shoulderZ || 0);
    const cuffAnchor = outfitModel?.userData.cuffAnchors?.[side];
    const hasAuthoredSleeve = !outfit.showBaseArms && cuffAnchor && rig.handWristOffset;
    const wristTarget = hasAuthoredSleeve
      ? cuffAnchor.clone().add(new THREE.Vector3(
        -sign * (outfit.cuffOverlap || 2.4),
        outfit.handOffsetY || 0,
        outfit.handOffsetZ || 0
      ))
      : rig.handCenter.clone().add(new THREE.Vector3(0, liftY, 0));
    const handTarget = hasAuthoredSleeve
      ? wristTarget.clone().sub(rig.handWristOffset)
      : wristTarget;
    // Both the sleeve and hand rigs rotate around their authored shoulder
    // origins. Keep the wrist in the same neutral model coordinate space so
    // the next resting/action rotation moves the two pieces together.
    rig.wrist.position.copy(handTarget).sub(rig.shoulder.position);
    rig.arm.position.set(
      sign * (((BASE_ARM_INNER_X + BASE_ARM_OUTER_X) / 2) - shoulderX),
      rig.handCenter.y + liftY - shoulderY - 0.7,
      rig.handCenter.z - 1.5
    );
    rig.arm.visible = Boolean(outfit.showBaseArms);
    syncShoulderShroud(rig, outfit, outfitModel, side, shoulderX, shoulderY, liftY);
  });
};

// Positive `forward` swings either arm toward the camera. The left rig points
// to -x and the right rig to +x, so their yaw signs are opposite.
export const setArmPose = (model, angles, wristWave = 0) => {
  const rigs = model?.userData.armRigs;
  if (!rigs) return;
  const leftYaw = angles.forwardLeft || 0;
  const rightYaw = -(angles.forwardRight || 0);
  const leftJoint = rigs.left?.shoulder || rigs.left;
  const rightJoint = rigs.right?.shoulder || rigs.right;
  if (leftJoint) leftJoint.rotation.set(0, leftYaw, angles.left);
  if (rightJoint) rightJoint.rotation.set(0, rightYaw, angles.right);
  if (rigs.right?.wrist) rigs.right.wrist.rotation.z = wristWave;
  syncPropAnchors(model);
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
  let hairMesh = null;
  let bodyCrownMesh = null;

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
      if (node.name === 'polySurface1009') hairMesh = mesh;
      if (node.name === 'polySurface1010' && part.id === 'body') bodyCrownMesh = mesh;
    });
  });

  staticModel.userData.faceTargets = faceTargets;
  if (hairMesh) {
    staticModel.userData.hairMask = {
      mesh: hairMesh,
      baseGeometry: hairMesh.geometry,
      variants: new Map(),
    };
  }
  if (bodyCrownMesh) {
    staticModel.userData.bodyCrownMask = {
      mesh: bodyCrownMesh,
      baseGeometry: bodyCrownMesh.geometry,
      variants: new Map(),
    };
  }
  if (hands.left && hands.right) {
    const left = addArmAndHand(staticModel, hands.left, 'left');
    const right = addArmAndHand(staticModel, hands.right, 'right');
    staticModel.userData.armRigs = { left, right };
    setArmPose(staticModel, REST_ARM_ANGLES);
  }
  configureModel(staticModel);
  return staticModel;
};

export const releaseSourceMeshes = (source) => {
  source.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => material.dispose());
  });
};

// Head accessories and clothing can share a mesh in the supplied files. The
// empty band between them lets us preserve hats while lifting the garment.
// Fashion's hood is continuous with its coat, so blend through the neck band.
export const liftOutfitGarment = (model, liftY, integratedHood = false) => {
  if (!liftY) return;
  if (integratedHood === 'liftAll') {
    model.position.y += liftY;
    model.updateMatrixWorld(true);
    return;
  }
  model.updateMatrixWorld(true);
  const point = new THREE.Vector3();
  model.traverse((node) => {
    if (!node.isMesh) return;
    const positions = node.geometry?.getAttribute('position');
    if (!positions) return;
    const inverse = node.matrixWorld.clone().invert();
    let changed = false;
    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index).applyMatrix4(node.matrixWorld);
      const headWeight = integratedHood
        ? THREE.MathUtils.smoothstep(point.y, 30, 60)
        : Number(point.y >= 45);
      if (!headWeight) continue;
      point.y -= liftY * headWeight;
      point.applyMatrix4(inverse);
      positions.setXYZ(index, point.x, point.y, point.z);
      changed = true;
    }
    if (changed) {
      positions.needsUpdate = true;
      if (integratedHood) node.geometry.computeVertexNormals();
      node.geometry.computeBoundingBox();
      node.geometry.computeBoundingSphere();
    }
  });
  model.position.y += liftY;
  model.updateMatrixWorld(true);
};

// Materials that make up Acey's brain on the shared base. Designer characters
// list their own (`brainMaterials` on the resolved outfit).
export const BASE_BRAIN_MATERIALS = ['toc'];

// Recolors the brain. The brain texture carries its shading, so a tint
// replaces the material color rather than darkening it; `null` restores the
// designer's color.
// A `blend` (three colors) paints soft, overlapping patches of each color
// across the brain in the shader, from each vertex's position inside the
// brain's bounds, multiplied over the brain texture so its folds keep their
// shading. It does not depend on the geometry, so headwear crops keep it.
const BRAIN_BLEND_VERTEX = '\nvarying vec3 vAceBrainPosition;';
const BRAIN_BLEND_FRAGMENT = [
  '',
  'varying vec3 vAceBrainPosition;',
  'uniform vec3 aceBrainMin;',
  'uniform vec3 aceBrainSize;',
  'uniform vec3 aceBrainPink;',
  'uniform vec3 aceBrainBlue;',
  'uniform vec3 aceBrainViolet;',
  'vec3 aceBrainBlend(vec3 position) {',
  '  vec3 q = (position - aceBrainMin) / max(aceBrainSize, vec3(1e-5));',
  '  float wave = 0.5 + 0.5 * sin(q.x * 6.3 + q.y * 3.1 + q.z * 2.2 + 0.7);',
  '  float drift = 0.5 + 0.5 * sin(q.z * 5.4 - q.x * 2.6 + q.y * 4.2 + 2.3);',
  '  vec3 color = mix(aceBrainPink, aceBrainBlue, smoothstep(0.22, 0.78, wave));',
  '  return mix(color, aceBrainViolet, smoothstep(0.35, 0.9, drift) * 0.45);',
  '}',
].join('\n');

const setBrainBlend = (material, mesh, blend) => {
  const blendData = material.userData.brainBlend;
  if (!blend) {
    if (!blendData) return;
    material.onBeforeCompile = blendData.previousCompile;
    material.customProgramCacheKey = blendData.previousCacheKey;
    delete material.userData.brainBlend;
    material.needsUpdate = true;
    return;
  }
  const colors = blend.map((hex) => new THREE.Color(hex));
  if (blendData) {
    blendData.uniforms.aceBrainPink.value.copy(colors[0]);
    blendData.uniforms.aceBrainBlue.value.copy(colors[1]);
    blendData.uniforms.aceBrainViolet.value.copy(colors[2]);
    return;
  }
  const { geometry } = mesh;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const uniforms = {
    aceBrainMin: { value: box.min.clone() },
    aceBrainSize: { value: box.getSize(new THREE.Vector3()) },
    aceBrainPink: { value: colors[0] },
    aceBrainBlue: { value: colors[1] },
    aceBrainViolet: { value: colors[2] },
  };
  material.userData.brainBlend = {
    uniforms,
    previousCompile: material.onBeforeCompile,
    previousCacheKey: material.customProgramCacheKey,
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>' + BRAIN_BLEND_VERTEX)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAceBrainPosition = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>' + BRAIN_BLEND_FRAGMENT)
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= aceBrainBlend(vAceBrainPosition);');
  };
  material.customProgramCacheKey = () => 'ace-brain-blend';
  material.needsUpdate = true;
};

export const applyBrainTint = (root, tint, materialNames = BASE_BRAIN_MATERIALS, blend = null) => {
  if (!root || !materialNames?.length) return;
  const color = tint ? new THREE.Color(tint) : null;
  root.traverse((node) => {
    if (!node.isMesh) return;
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => {
      if (!material?.color?.isColor || !materialNames.includes(material.name)) return;
      if (!material.userData.designColor) material.userData.designColor = material.color.clone();
      // A blend multiplies over the texture, so the base color stays white.
      material.color.copy(blend ? new THREE.Color(0xffffff) : (color || material.userData.designColor));
      setBrainBlend(material, node, blend);
    });
  });
};

// Reshapes a garment's headwear and collar after the garment lift, in the
// mascot's model units (see OUTFITS[].gearAdjust). Only meshes whose material
// matches `materialName` move:
// - hat: vertices at or above `fromY` are scaled about `center`, tipped back
//   by `tiltDeg` about `pivot` (front brim up) and raised by `liftY`;
// - collar: vertices between `fromY` and `toY` shrink toward the body axis
//   and drop, blended in from `fromY` to `blendY` so the garment stays joined.
export const adjustOutfitGear = (model, gear) => {
  if (!gear) return;
  const { hat, collar, materialName } = gear;
  model.updateMatrixWorld(true);
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const hatCenter = hat && new THREE.Vector3(...hat.center);
  const hatPivot = hat && new THREE.Vector3(...hat.pivot);
  const hatTilt = hat && new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    THREE.MathUtils.degToRad(-(hat.tiltDeg || 0))
  );

  model.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    if (!materials.some((material) => material?.name === materialName)) return;
    const positions = node.geometry?.getAttribute('position');
    if (!positions) return;
    const normals = node.geometry.getAttribute('normal');
    const toModel = node.matrixWorld;
    const toNode = toModel.clone().invert();
    const nodeRotation = new THREE.Quaternion();
    toModel.decompose(new THREE.Vector3(), nodeRotation, new THREE.Vector3());
    const tiltInNode = hatTilt && nodeRotation.clone().invert().multiply(hatTilt).multiply(nodeRotation);
    let changed = false;

    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index).applyMatrix4(toModel);
      if (hat && point.y >= hat.fromY) {
        point.sub(hatCenter).multiplyScalar(hat.scale || 1).add(hatCenter);
        point.sub(hatPivot).applyQuaternion(hatTilt).add(hatPivot);
        point.y += hat.liftY || 0;
        if (normals) {
          normal.fromBufferAttribute(normals, index).applyQuaternion(tiltInNode).normalize();
          normals.setXYZ(index, normal.x, normal.y, normal.z);
        }
      } else if (collar && point.y >= collar.fromY && point.y < collar.toY) {
        const weight = THREE.MathUtils.smoothstep(point.y, collar.fromY, collar.blendY);
        const radial = 1 - ((1 - collar.shrink) * weight);
        point.x *= radial;
        point.z *= radial;
        point.y -= (collar.dropY || 0) * weight;
      } else {
        continue;
      }
      point.applyMatrix4(toNode);
      positions.setXYZ(index, point.x, point.y, point.z);
      changed = true;
    }

    if (changed) {
      positions.needsUpdate = true;
      if (normals) normals.needsUpdate = true;
      node.geometry.computeBoundingBox();
      node.geometry.computeBoundingSphere();
    }
  });
};

// A garment delivered as one plain white material (the Scholar gown, vest,
// shirt, tie, cap and tassel) is painted in its approved colors with vertex
// colors, in the prepared model's coordinates:
// `regionColors: {
//   color,
//   regions: [{ color, min, max }],     // per vertex: the point is inside
//   components: [{ color, min, max }],  // per connected piece: all of it is inside
// }`
// Regions are checked first, then pieces; the first match wins. Pieces tell
// nested layers apart (a vest inside a gown) where a box around points cannot.
const boxRule = (rule) => ({
  color: new THREE.Color(rule.color),
  box: new THREE.Box3(new THREE.Vector3(...rule.min), new THREE.Vector3(...rule.max)),
});

// Connected pieces of a mesh, welding vertices that share a position (loaders
// often split vertices along UV and normal seams). Returns each vertex's piece
// and each piece's bounds in model space.
const getMeshPieces = (geometry, matrix) => {
  const positions = geometry.getAttribute('position');
  const indices = geometry.getIndex();
  const { count } = positions;
  const point = new THREE.Vector3();
  const welded = new Map();
  const parent = new Int32Array(count);
  const weld = new Int32Array(count);
  for (let index = 0; index < count; index += 1) {
    point.fromBufferAttribute(positions, index);
    const key = `${point.x.toFixed(4)},${point.y.toFixed(4)},${point.z.toFixed(4)}`;
    if (!welded.has(key)) welded.set(key, index);
    weld[index] = welded.get(key);
    parent[index] = index;
  }
  const find = (value) => {
    let root = value;
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]];
      root = parent[root];
    }
    return root;
  };
  const join = (a, b) => {
    const rootA = find(weld[a]);
    const rootB = find(weld[b]);
    if (rootA !== rootB) parent[rootA] = rootB;
  };
  const corners = indices ? indices.count : count;
  for (let corner = 0; corner + 2 < corners; corner += 3) {
    const a = indices ? indices.getX(corner) : corner;
    const b = indices ? indices.getX(corner + 1) : corner + 1;
    const c = indices ? indices.getX(corner + 2) : corner + 2;
    join(a, b);
    join(b, c);
  }
  const piece = new Int32Array(count);
  const bounds = new Map();
  for (let index = 0; index < count; index += 1) {
    const root = find(weld[index]);
    piece[index] = root;
    if (!bounds.has(root)) bounds.set(root, new THREE.Box3());
    bounds.get(root).expandByPoint(point.fromBufferAttribute(positions, index).applyMatrix4(matrix));
  }
  return { piece, bounds };
};

export const applyRegionColors = (model, regionColors) => {
  if (!regionColors) return;
  model.updateMatrixWorld(true);
  const toModel = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const base = new THREE.Color(regionColors.color);
  const regions = (regionColors.regions || []).map(boxRule);
  const pieceRules = (regionColors.components || []).map(boxRule);
  const point = new THREE.Vector3();
  model.traverse((node) => {
    if (!node.isMesh || !node.geometry?.getAttribute('position')) return;
    const positions = node.geometry.getAttribute('position');
    const matrix = new THREE.Matrix4().multiplyMatrices(toModel, node.matrixWorld);
    const pieces = pieceRules.length ? getMeshPieces(node.geometry, matrix) : null;
    const pieceColors = new Map();
    pieces?.bounds.forEach((box, root) => {
      const rule = pieceRules.find((candidate) => candidate.box.containsBox(box));
      if (rule) pieceColors.set(root, rule.color);
    });
    const colors = new Float32Array(positions.count * 3);
    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index).applyMatrix4(matrix);
      const color = regions.find((region) => region.box.containsPoint(point))?.color
        || (pieces && pieceColors.get(pieces.piece[index]))
        || base;
      colors.set([color.r, color.g, color.b], index * 3);
    }
    node.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material) => {
      material.vertexColors = true;
      material.needsUpdate = true;
    });
  });
};

export const prepareOutfitModel = (model, outfit) => {
  if (outfit.unitScale !== 1) model.scale.multiplyScalar(outfit.unitScale);
  if (outfit.fullCharacter) {
    model.position.y += outfit.fullCharacterOffsetY || 0;
    model.name = `ACEOutfit-${outfit.id}`;
    // Designer characters arrive in a T-pose; bend their arms so they hold
    // their props the way the approved renders do.
    if (outfit.hold) poseCharacterArms(model, outfit.hold);
    configureModel(model, { keepColors: true });
    return model;
  }
  liftOutfitGarment(model, outfit.modelOffsetY, outfit.integratedHood);
  adjustOutfitGear(model, outfit.gearAdjust);
  removeArtistBeretCrownNub(model, outfit);
  model.name = `ACEOutfit-${outfit.id}`;
  // Engineer and Creative deliberately use the base model's animated arms.
  // Their supplied garments are short-sleeve/static shells, so splitting
  // their shoulder trim into a second moving rig only creates loose flaps at
  // oblique angles. Leave those garments whole and keep the synthetic arm
  // socket tucked beneath the static sleeve opening instead.
  if (!outfit.showBaseArms) {
    createOutfitArmRigs(model, getOutfitArmPose(outfit));
    setArmPose(model, REST_ARM_ANGLES);
  }
  configureModel(model);
  if (outfit.outfitTint) {
    const tint = new THREE.Color(outfit.outfitTint);
    model.traverse((node) => {
      if (!node.isMesh) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.filter(Boolean).forEach((material) => {
        if (material.color?.isColor) {
          if (Number.isFinite(outfit.outfitTintBlend)) {
            material.color.lerp(tint, outfit.outfitTintBlend);
          } else {
            material.color.multiply(tint);
          }
          material.needsUpdate = true;
        }
      });
    });
  }
  // This runs after the color treatment so the shroud clones the exact
  // displayed sleeve material rather than an untinted source color.
  addOutfitArmShrouds(model, outfit);
  applyRegionColors(model, outfit.regionColors);
  return model;
};

export const getOutfitFloorY = (outfit, contentScale) => (
  MASCOT_FLOOR_Y + ((outfit?.modelOffsetY || 0) * (contentScale || 0))
);

export const shouldShowSharedBase = (outfit) => !outfit?.fullCharacter;

export const loadOutfitModel = (outfit, onProgress) => new Promise((resolve, reject) => {
  if (outfit.type === 'fbx') {
    new FBXLoader().load(outfit.url, resolve, onProgress, reject);
    return;
  }

  new GLTFLoader().load(outfit.url, (gltf) => resolve(gltf.scene), onProgress, reject);
});

export const getProgress = (event) => {
  if (!event?.lengthComputable || !event.total) return null;
  return Math.min(100, Math.round((event.loaded / event.total) * 100));
};
