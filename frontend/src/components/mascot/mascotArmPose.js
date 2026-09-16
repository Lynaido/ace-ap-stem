import * as THREE from 'three';

// Every full character from the 3D team is built on the same T-pose body
// (metres): arms run along ±x at y≈0.358 and the hands end at |x|=0.681. The
// exported skeletons lose Blender's constraints, so their deform bones cannot
// be posed as a chain. Instead the arms get a small procedural skeleton —
// shoulder and elbow per side — with weights from each vertex's position
// along the arm, so sleeves bend smoothly and held props move with the hand.
export const ARM_FRAME = {
  axisY: 0.358,
  axisZ: 0.01,
  shoulderX: 0.2,
  elbowX: 0.405,
  // Centre of the palm along the arm, the point IK places on a hold target.
  palmX: 0.6,
  // Blend ranges (distance from the body centre) between torso and upper arm,
  // and between upper arm and forearm.
  shoulderBlend: [0.15, 0.25],
  elbowBlend: [0.36, 0.45],
  // Only vertices inside this band around the arm axis follow the arm, so the
  // head, hood and skirt stay put.
  minY: 0.19,
  maxY: 0.44,
  maxAbsZ: 0.24,
  // Beside the torso only the sleeve, above the armpit, follows the arm;
  // lower vertices there are the sides of a jacket or robe, which would
  // otherwise be dragged forward and open a hole at the hip.
  torsoX: [0.28, 0.34],
  armpitY: [0.27, 0.32],
  // The open hand lies palm down with the thumb toward +z. A gripping hand
  // curls its fingers (beyond `knuckleX`) around a handle that runs along z
  // under the knuckles, then rolls thumb-up so the handle stands upright.
  knuckleX: 0.61,
  curlCenterY: 0.336,
  curlRadius: 0.028,
  maxCurl: 2.7,
  handMinX: 0.5,
  handBandY: [0.29, 0.43],
  gripX: 0.617,
};

// Two-bone IK: returns the upper-arm and forearm rotations that put the palm
// (rest point `frame.palmX` along the arm) on `target`, with the elbow bent
// toward `pole`. Rotations are relative to the T-pose.
export const solveArmHold = (side, { target, pole = [0, -1, -0.4], roll = 0 }, frame = ARM_FRAME) => {
  const sign = side === 'right' ? -1 : 1;
  const shoulder = new THREE.Vector3(sign * frame.shoulderX, frame.axisY, frame.axisZ);
  const upperLength = frame.elbowX - frame.shoulderX;
  const foreLength = frame.palmX - frame.elbowX;
  const goal = new THREE.Vector3().fromArray(target);
  const toGoal = goal.clone().sub(shoulder);
  const distance = THREE.MathUtils.clamp(
    toGoal.length(),
    Math.abs(upperLength - foreLength) + 1e-4,
    upperLength + foreLength - 1e-4
  );
  const direction = toGoal.normalize();
  const along = ((upperLength ** 2) - (foreLength ** 2) + (distance ** 2)) / (2 * distance);
  const height = Math.sqrt(Math.max(0, (upperLength ** 2) - (along ** 2)));
  const bendDirection = new THREE.Vector3(sign * pole[0], pole[1], pole[2]);
  bendDirection.sub(direction.clone().multiplyScalar(bendDirection.dot(direction)));
  if (bendDirection.lengthSq() < 1e-8) bendDirection.set(0, -1, 0);
  bendDirection.normalize();
  const elbow = shoulder.clone()
    .add(direction.clone().multiplyScalar(along))
    .add(bendDirection.multiplyScalar(height));
  const palm = shoulder.clone().add(direction.multiplyScalar(distance));

  const restDirection = new THREE.Vector3(sign, 0, 0);
  const upper = new THREE.Quaternion().setFromUnitVectors(
    restDirection,
    elbow.clone().sub(shoulder).normalize()
  );
  const foreWorld = palm.clone().sub(elbow).normalize();
  const foreLocal = foreWorld.applyQuaternion(upper.clone().invert());
  const fore = new THREE.Quaternion().setFromUnitVectors(restDirection, foreLocal);
  // Roll the forearm about its own length (a gripping hand turns thumb-up).
  fore.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(roll)));
  return { upper, fore };
};

export const getArmWeights = (point, frame = ARM_FRAME) => {
  const inBand = point.y >= frame.minY && point.y <= frame.maxY
    && Math.abs(point.z - frame.axisZ) <= frame.maxAbsZ;
  if (!inBand) return { upper: 0, fore: 0 };
  const reach = Math.abs(point.x);
  const follow = Math.max(
    THREE.MathUtils.smoothstep(reach, frame.torsoX[0], frame.torsoX[1]),
    THREE.MathUtils.smoothstep(point.y, frame.armpitY[0], frame.armpitY[1])
  );
  const upper = follow * THREE.MathUtils.smoothstep(reach, frame.shoulderBlend[0], frame.shoulderBlend[1]);
  const fore = upper * THREE.MathUtils.smoothstep(reach, frame.elbowBlend[0], frame.elbowBlend[1]);
  return { upper: upper - fore, fore };
};

// Curl one vertex (and its normal) of a gripping hand into a fist around the
// handle line.
const curlFinger = (point, normal, sign, frame) => {
  const reach = point.x * sign;
  if (reach <= frame.knuckleX || point.y < frame.handBandY[0] || point.y > frame.handBandY[1]) return;
  const length = reach - frame.knuckleX;
  const angle = Math.min(length / frame.curlRadius, frame.maxCurl);
  const straight = length - (angle * frame.curlRadius);
  const radius = point.y - frame.curlCenterY;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  point.x = sign * (frame.knuckleX + (radius * sin) + (straight * cos));
  point.y = frame.curlCenterY + (radius * cos) - (straight * sin);
  if (normal) {
    const nx = normal.x * sign;
    const ny = normal.y;
    normal.x = sign * ((nx * cos) + (ny * sin));
    normal.y = (-nx * sin) + (ny * cos);
  }
};

// Where a held prop's handle is and which way it runs: the principal axis of
// its vertices, pointing up, and the point `at` of the way along it.
const measureHandle = (points, at = 0.3) => {
  const centre = new THREE.Vector3();
  points.forEach((point) => centre.add(point));
  centre.divideScalar(points.length);
  const cov = [0, 0, 0, 0, 0, 0];
  points.forEach(({ x, y, z }) => {
    const dx = x - centre.x; const dy = y - centre.y; const dz = z - centre.z;
    cov[0] += dx * dx; cov[1] += dx * dy; cov[2] += dx * dz;
    cov[3] += dy * dy; cov[4] += dy * dz; cov[5] += dz * dz;
  });
  const axis = new THREE.Vector3(0, 1, 0);
  for (let step = 0; step < 24; step += 1) {
    axis.set(
      (cov[0] * axis.x) + (cov[1] * axis.y) + (cov[2] * axis.z),
      (cov[1] * axis.x) + (cov[3] * axis.y) + (cov[4] * axis.z),
      (cov[2] * axis.x) + (cov[4] * axis.y) + (cov[5] * axis.z)
    ).normalize();
  }
  if (axis.y < 0) axis.negate();
  let low = Infinity;
  let high = -Infinity;
  points.forEach((point) => {
    const t = point.clone().sub(centre).dot(axis);
    low = Math.min(low, t);
    high = Math.max(high, t);
  });
  return { axis, point: centre.addScaledVector(axis, low + ((high - low) * at)) };
};

const createArmSkeleton = (model, frame) => {
  const root = new THREE.Bone();
  root.name = 'ACE-arm-root';
  const bones = [root];
  const joints = {};
  ['right', 'left'].forEach((side) => {
    const sign = side === 'right' ? -1 : 1;
    const shoulder = new THREE.Bone();
    shoulder.name = `ACE-${side}-upper-arm`;
    shoulder.position.set(sign * frame.shoulderX, frame.axisY, frame.axisZ);
    root.add(shoulder);
    const elbow = new THREE.Bone();
    elbow.name = `ACE-${side}-forearm`;
    elbow.position.set(sign * (frame.elbowX - frame.shoulderX), 0, 0);
    shoulder.add(elbow);
    bones.push(shoulder, elbow);
    joints[side] = { shoulder, elbow, upperIndex: bones.length - 2, foreIndex: bones.length - 1 };
  });
  model.add(root);
  // Bind inverses come from the bones' rest placement, so update it first.
  model.updateMatrixWorld(true);
  return { skeleton: new THREE.Skeleton(bones), joints };
};

// Rebuilds a character's visible meshes as skinned meshes on a five-bone arm
// skeleton, then applies `hold`:
//   { left: { target: [x, y, z], pole: [out, up, forward], roll,
//             grip: { meshes: [name, ...], at: 0.3, spin: 0 } },
//     right: { ... },
//     props: { left: [meshName, ...], right: [...] },
//     fixed: [meshName, ...],
//     headwear: { materials: [...], fromY, lift } }
// `fixed` meshes (a prop resting in front of the body) never follow an arm.
// `target` is where the palm goes (character space, metres) and `pole` the
// direction the elbow points, given for the left arm and mirrored for the
// right. `grip` meshes are moved into that hand's fist by their handle
// (`at` of the way up their long axis, turned `spin` degrees about it) and the
// fingers curl around them; `props` meshes simply follow the forearm.
export const poseCharacterArms = (model, hold, frame = ARM_FRAME) => {
  if (!model || !hold || model.userData.armPose) return model?.userData.armPose || null;
  model.updateMatrixWorld(true);
  const toModel = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const meshes = [];
  model.traverse((node) => {
    if (node.isMesh && node.visible && node.geometry?.getAttribute('position')) meshes.push(node);
  });

  const nameSide = (map, mesh) => map.get(mesh.name) || map.get(mesh.parent?.name);
  const rigidSide = new Map();
  const gripSide = new Map();
  const fixedMeshes = new Set(hold.fixed || []);
  ['left', 'right'].forEach((side) => {
    (hold.props?.[side] || []).forEach((name) => rigidSide.set(name, side));
    (hold[side]?.grip?.meshes || []).forEach((name) => gripSide.set(name, side));
  });

  // Bake every vertex into character space (skinned sources in their current
  // pose) before anything moves.
  const baked = meshes.map((mesh) => {
    const matrix = new THREE.Matrix4().multiplyMatrices(toModel, mesh.matrixWorld);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const source = mesh.geometry;
    const count = source.getAttribute('position').count;
    const sourceNormals = source.getAttribute('normal');
    const points = [];
    const normals = [];
    for (let index = 0; index < count; index += 1) {
      points.push(mesh.getVertexPosition(index, new THREE.Vector3()).applyMatrix4(matrix));
      if (sourceNormals) {
        normals.push(new THREE.Vector3().fromBufferAttribute(sourceNormals, index).applyMatrix3(normalMatrix).normalize());
      }
    }
    return {
      mesh,
      points,
      normals,
      grip: nameSide(gripSide, mesh),
      rigid: nameSide(rigidSide, mesh),
      fixed: fixedMeshes.has(mesh.name) || fixedMeshes.has(mesh.parent?.name),
    };
  });

  // Hats sit higher so the brain shows under the brim, as in the approved
  // renders: `headwear: { materials: [...], fromY, lift }` raises every vertex
  // of those materials above `fromY`.
  const { headwear } = hold;
  if (headwear) {
    baked.forEach((item) => {
      const names = (Array.isArray(item.mesh.material) ? item.mesh.material : [item.mesh.material]).map((m) => m?.name);
      if (!names.some((name) => headwear.materials.includes(name))) return;
      item.points.forEach((point) => { if (point.y >= headwear.fromY) point.y += headwear.lift; });
    });
  }

  // Seat gripped props in their fists: handle axis along +z (it turns upright
  // with the thumb-up roll) and handle point on the grip line.
  ['left', 'right'].forEach((side) => {
    const grip = hold[side]?.grip;
    if (!grip) return;
    const parts = baked.filter((item) => item.grip === side);
    const points = parts.flatMap((item) => item.points);
    if (!points.length) return;
    const handle = measureHandle(points, grip.at ?? 0.3);
    const sign = side === 'right' ? -1 : 1;
    const turn = new THREE.Quaternion().setFromUnitVectors(handle.axis, new THREE.Vector3(0, 0, 1));
    turn.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(grip.spin || 0)));
    const seat = new THREE.Vector3(sign * frame.gripX, frame.curlCenterY, frame.axisZ);
    parts.forEach((item) => {
      item.points.forEach((point) => point.sub(handle.point).applyQuaternion(turn).add(seat));
      item.normals.forEach((normal) => normal.applyQuaternion(turn));
      item.rigid = side;
    });
  });

  const { skeleton, joints } = createArmSkeleton(model, frame);
  const gripping = { left: Boolean(hold.left?.grip), right: Boolean(hold.right?.grip) };
  const skinned = [];

  baked.forEach(({ mesh, points, normals, rigid, fixed }) => {
    const source = mesh.geometry;
    const geometry = source.clone();
    if (geometry.getAttribute('skinIndex')) geometry.deleteAttribute('skinIndex');
    if (geometry.getAttribute('skinWeight')) geometry.deleteAttribute('skinWeight');
    const positions = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const count = positions.count;
    const skinIndex = new Uint16Array(count * 4);
    const skinWeight = new Float32Array(count * 4);

    for (let index = 0; index < count; index += 1) {
      const point = points[index];
      const offset = index * 4;
      if (rigid) {
        skinIndex[offset] = joints[rigid].foreIndex;
        skinWeight[offset] = 1;
      } else if (fixed) {
        skinIndex[offset] = 0;
        skinWeight[offset] = 1;
      } else {
        const side = point.x < 0 ? 'right' : 'left';
        const { upper, fore } = getArmWeights(point, frame);
        if (gripping[side] && fore > 0.99 && Math.abs(point.x) > frame.handMinX) {
          curlFinger(point, normals[index], side === 'right' ? -1 : 1, frame);
        }
        skinIndex[offset] = 0;
        skinWeight[offset] = 1 - upper - fore;
        skinIndex[offset + 1] = joints[side].upperIndex;
        skinWeight[offset + 1] = upper;
        skinIndex[offset + 2] = joints[side].foreIndex;
        skinWeight[offset + 2] = fore;
      }
      positions.setXYZ(index, point.x, point.y, point.z);
      if (normalAttribute && normals[index]) normalAttribute.setXYZ(index, normals[index].x, normals[index].y, normals[index].z);
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const replacement = new THREE.SkinnedMesh(geometry, mesh.material);
    replacement.name = mesh.name;
    replacement.castShadow = mesh.castShadow;
    replacement.receiveShadow = mesh.receiveShadow;
    replacement.renderOrder = mesh.renderOrder;
    replacement.frustumCulled = false;
    model.add(replacement);
    // Binding with the mesh's own world matrix keeps the rest pose exact even
    // when the character already sits under a scaled scene root.
    replacement.bind(skeleton);
    skinned.push(replacement);

    // Remove the original: bounds and skinning updates walk every node, and a
    // hidden skinned mesh would still be measured.
    mesh.removeFromParent();
    source.dispose();
  });

  ['left', 'right'].forEach((side) => {
    const pose = hold[side];
    if (!pose?.target) return;
    const roll = pose.roll ?? (pose.grip ? -90 : 0);
    const { upper, fore } = solveArmHold(side, { ...pose, roll }, frame);
    joints[side].shoulder.quaternion.copy(upper);
    joints[side].elbow.quaternion.copy(fore);
  });
  model.updateMatrixWorld(true);
  model.userData.armPose = { skeleton, joints, skinned };
  return model.userData.armPose;
};
