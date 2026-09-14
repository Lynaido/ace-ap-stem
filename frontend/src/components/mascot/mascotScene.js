import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ACTION_ARM_ANGLES,
  MASCOT_FLOOR_Y,
  REST_ARM_ANGLES,
  applyHeadwearHairMask,
  attachPropSet,
  configureBaseArmRigs,
  detachPropSet,
  createWebReadyBase,
  disposeModel,
  getOutfitFloorY,
  getRestArmAngles,
  getProgress,
  loadOutfitModel,
  loadPropSet,
  prepareOutfitModel,
  releaseSourceMeshes,
  setArmPose,
  shouldShowSharedBase,
} from './mascotModel';
import { REACTION_DURATIONS } from './mascotCatalog';
import { blendMoodMotion, stepMoodWeights } from './mascotMotion';

// Seconds per study reaction. Unknown reactions fall back to a short nod.
export const ACTION_DURATIONS = REACTION_DURATIONS;

const MOOD_FACE_SCALE = {
  ready: { mouthX: 1, mouthZ: 1, eyesZ: 1 },
  curious: { mouthX: 0.9, mouthZ: 0.86, eyesZ: 1.06 },
  cheerful: { mouthX: 1.1, mouthZ: 0.72, eyesZ: 0.96 },
};

export const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (error) {
    return false;
  }
};

/**
 * Creates the ACE mascot scene on a canvas.
 *
 * `interactive` enables drag-to-rotate for the customizer. The compact
 * companion disables controls and shadows and renders at a lower frame rate so
 * it can stay on screen while learners work.
 */
export const createMascotScene = ({
  stage,
  canvas,
  interactive = true,
  compact = false,
  onBaseStatus = () => {},
  onOutfitStatus = () => {},
  onOutfitProgress = () => {},
  onError = () => {},
  onOutfitShown = () => {},
}) => {
  let disposed = false;
  let paused = false;
  let outfitRequest = 0;
  let visibleOutfit = null;
  let currentMood = 'ready';
  let moodWeights = { ready: 1, curious: 0, cheerful: 0 };
  const restAngles = { ...REST_ARM_ANGLES };
  let currentAction = null;
  let activeOutfit = null;
  let lastFrameAt = 0;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
      powerPreference: compact ? 'low-power' : 'high-performance',
    });
  } catch (error) {
    onBaseStatus('error');
    onError('The 3D preview is not available on this device.');
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  camera.position.set(0, 0.02, compact ? 6.9 : 6.2);

  let controls = null;
  if (interactive) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.8;
    controls.maxDistance = 8.8;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.target.set(0, -0.12, 0);
  } else {
    camera.lookAt(0, -0.12, 0);
  }

  scene.add(new THREE.HemisphereLight(0xfffbff, 0xded8f4, 1.65));

  const keyLight = new THREE.DirectionalLight(0xfffbff, 2.7);
  keyLight.position.set(3.5, 5.5, 4);
  keyLight.castShadow = !compact;
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
  floor.position.y = MASCOT_FLOOR_Y;
  floor.receiveShadow = true;
  floor.visible = !compact;
  scene.add(floor);

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(stage);
  resize();

  let contentScale = 0;
  let floorTargetY = MASCOT_FLOOR_Y;
  const syncFloorTarget = (outfit) => {
    floorTargetY = getOutfitFloorY(outfit, contentScale);
  };

  // Posed variants share the garment id, so cache by the file actually loaded.
  const cacheKey = (outfit) => outfit.url;

  // Full characters are exported in different units from the shared base
  // (metres vs centimetres). Fit each one to the base body once: same height,
  // feet on the same floor, centred on the same spot. This keeps new designer
  // deliveries correct without hand-tuned scale factors.
  const fitFullCharacter = (model) => {
    const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
    if (!baseModel || model.userData.fittedToBase) return;

    const updateSkinning = () => {
      contentRoot.updateMatrixWorld(true);
      model.traverse((node) => {
        if (!node.isSkinnedMesh) return;
        node.skeleton.update();
        // Skinned bounds are computed lazily and can be stale after refitting.
        node.frustumCulled = false;
      });
    };

    updateSkinning();
    const baseBox = new THREE.Box3().setFromObject(baseModel);
    const modelBox = new THREE.Box3().setFromObject(model, true);
    const baseHeight = baseBox.getSize(new THREE.Vector3()).y;
    const modelHeight = modelBox.getSize(new THREE.Vector3()).y;
    if (!(baseHeight > 0) || !(modelHeight > 0)) return;

    model.scale.multiplyScalar(baseHeight / modelHeight);
    updateSkinning();
    const fittedBox = new THREE.Box3().setFromObject(model, true);
    const rootScale = contentRoot.getWorldScale(new THREE.Vector3()).y || 1;
    const baseCenter = baseBox.getCenter(new THREE.Vector3());
    const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
    model.position.x += (baseCenter.x - fittedCenter.x) / rootScale;
    model.position.z += (baseCenter.z - fittedCenter.z) / rootScale;
    model.position.y += (baseBox.min.y - fittedBox.min.y) / rootScale;
    model.userData.fittedToBase = true;
  };

  // Props for garment roles live on the shared base's hands. Each set is
  // loaded once; switching roles swaps the attached copy.
  const propSets = new Map();
  let propRequest = 0;
  const syncProps = async (outfit) => {
    const requestId = ++propRequest;
    const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
    if (!baseModel) return;
    detachPropSet(baseModel);
    const url = outfit?.fullCharacter ? null : outfit?.props?.url;
    if (!url) return;
    let request = propSets.get(url);
    if (!request) {
      request = loadPropSet(url);
      propSets.set(url, request);
      request.catch(() => propSets.delete(url));
    }
    try {
      const template = await request;
      if (disposed || requestId !== propRequest) return;
      attachPropSet(baseModel, template);
    } catch (error) {
      // Props are optional decoration; the outfit stays usable without them.
    }
  };

  const showOutfit = async (outfit) => {
    if (!outfit || disposed) return;
    activeOutfit = outfit;
    const requestId = ++outfitRequest;
    const key = cacheKey(outfit);
    onOutfitStatus('loading');
    onOutfitProgress(null);

    try {
      let model = outfitCache.get(key);
      if (!model) {
        let request = outfitRequests.get(key);
        if (!request) {
          request = loadOutfitModel(outfit, (event) => {
            if (requestId === outfitRequest) onOutfitProgress(getProgress(event));
          }).then((loadedModel) => {
            if (disposed) {
              disposeModel(loadedModel);
              return null;
            }
            prepareOutfitModel(loadedModel, outfit);
            loadedModel.visible = false;
            outfitCache.set(key, loadedModel);
            contentRoot.add(loadedModel);
            return loadedModel;
          });
          outfitRequests.set(key, request);
        }
        try {
          model = await request;
        } finally {
          if (outfitRequests.get(key) === request) outfitRequests.delete(key);
        }
        if (!model || disposed) return;
      }

      if (requestId !== outfitRequest) return;
      if (visibleOutfit && visibleOutfit !== model) visibleOutfit.visible = false;
      if (outfit.fullCharacter) fitFullCharacter(model);
      model.visible = true;
      visibleOutfit = model;
      const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
      if (baseModel) {
        baseModel.visible = shouldShowSharedBase(outfit);
        if (baseModel.visible) {
          applyHeadwearHairMask(baseModel, outfit);
          configureBaseArmRigs(baseModel, outfit, model);
        }
      }
      syncProps(outfit);
      syncFloorTarget(outfit);
      onOutfitStatus('ready');
      onOutfitProgress(null);
      onOutfitShown(outfit);
    } catch (error) {
      if (requestId !== outfitRequest || disposed) return;
      onOutfitStatus('error');
      onOutfitProgress(null);
      onError(`Could not load the ${outfit.label.toLowerCase()} outfit.`);
    }
  };

  const timer = new THREE.Timer();
  timer.connect(document);
  timer.update();

  const setMood = (moodId) => { currentMood = moodId; };
  const playAction = (actionId) => {
    currentAction = { id: actionId, startedAt: timer.getElapsed() };
  };
  const setPaused = (value) => { paused = Boolean(value); };

  onBaseStatus('loading');

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
        contentScale = scale;
        contentRoot.scale.setScalar(scale);
        // Frame the complete outfit, not only the base head mesh. The extra
        // lift keeps long garments inside the viewport and visually joins
        // the clothes, hands and body into one character.
        contentRoot.position.set(-center.x * scale, -center.y * scale + 0.2, -center.z * scale);
        if (activeOutfit) syncFloorTarget(activeOutfit);
      }

      // The first outfit can finish loading before the base FBX. Reapply
      // its calibrated arm pose and hair occlusion once both models exist.
      if (visibleOutfit && activeOutfit) {
        if (activeOutfit.fullCharacter) fitFullCharacter(visibleOutfit);
        model.visible = shouldShowSharedBase(activeOutfit);
        if (model.visible) {
          applyHeadwearHairMask(model, activeOutfit);
          configureBaseArmRigs(model, activeOutfit, visibleOutfit);
        }
        syncProps(activeOutfit);
      }

      onBaseStatus('ready');
    },
    undefined,
    () => {
      if (disposed) return;
      onBaseStatus('error');
      onError('Could not load the ACE mascot model.');
    }
  );

  // The compact companion only needs a gentle idle loop.
  const frameInterval = compact ? 1000 / 30 : 0;

  renderer.setAnimationLoop((timestamp) => {
    if (paused || (typeof document !== 'undefined' && document.hidden)) return;
    if (frameInterval && timestamp - lastFrameAt < frameInterval) return;
    lastFrameAt = timestamp;

    timer.update(timestamp);
    const elapsed = timer.getElapsed();
    // The mood drives the idle motion of the whole character, so it is
    // visible on garments and complete designer characters alike.
    moodWeights = stepMoodWeights(moodWeights, currentMood);
    const moodMotion = blendMoodMotion(moodWeights, elapsed, reduceMotion);
    let moodInfluence = 1;
    let y = 0;
    let tilt = 0;
    let turn = 0;
    // Ease into the resting arm pose of the current role (arms holding props
    // rest lifted) instead of snapping when the role changes.
    const restTarget = getRestArmAngles(activeOutfit);
    restAngles.left = THREE.MathUtils.lerp(restAngles.left, restTarget.left, 0.12);
    restAngles.right = THREE.MathUtils.lerp(restAngles.right, restTarget.right, 0.12);
    const armAngles = { ...restAngles };
    let wristWave = 0;

    if (!currentAction && !reduceMotion) {
      const relaxedMotion = Math.sin(elapsed * 0.82) * THREE.MathUtils.degToRad(0.8);
      armAngles.left += relaxedMotion;
      armAngles.right -= relaxedMotion;
    }

    if (currentAction && reduceMotion) currentAction = null;

    if (currentAction) {
      const actionElapsed = elapsed - currentAction.startedAt;
      const duration = ACTION_DURATIONS[currentAction.id] || 2.4;
      const progress = Math.min(1, Math.max(0, actionElapsed / duration));
      const envelope = Math.sin(progress * Math.PI) ** 2;
      // A reaction takes over from the idle mood motion while it plays.
      moodInfluence = 1 - envelope * 0.8;
      const targetAngles = ACTION_ARM_ANGLES[currentAction.id] || restAngles;
      armAngles.left = THREE.MathUtils.lerp(restAngles.left, targetAngles.left, envelope);
      armAngles.right = THREE.MathUtils.lerp(restAngles.right, targetAngles.right, envelope);

      if (currentAction.id === 'hello') {
        tilt -= 0.025 * envelope;
        turn -= 0.055 * envelope;
        wristWave = Math.sin(progress * Math.PI * 8) * 0.2 * envelope;
        // Designer characters cannot raise a separate arm, so they sway.
        if (activeOutfit?.fullCharacter) turn += Math.sin(progress * Math.PI * 6) * 0.05 * envelope;
      } else if (currentAction.id === 'focus') {
        y -= 0.045 * envelope;
        tilt += Math.sin(progress * Math.PI * 2) * 0.018 * envelope;
        turn += 0.045 * envelope;
      } else if (currentAction.id === 'celebrate') {
        y += Math.abs(Math.sin(progress * Math.PI * 2)) * 0.095 * envelope;
        tilt += Math.sin(progress * Math.PI * 4) * 0.028 * envelope;
        turn += Math.sin(progress * Math.PI * 2) * 0.055 * envelope;
      } else if (currentAction.id === 'think') {
        // A curious head tilt with a slow look to one side.
        tilt += 0.07 * envelope;
        turn += 0.12 * envelope;
        wristWave = Math.sin(progress * Math.PI * 3) * 0.06 * envelope;
      } else if (currentAction.id === 'encourage') {
        // Two small nods with open arms.
        y -= Math.abs(Math.sin(progress * Math.PI * 4)) * 0.04 * envelope;
        tilt -= Math.sin(progress * Math.PI * 4) * 0.012 * envelope;
      } else if (currentAction.id === 'rest') {
        // A slow, relaxed stretch that settles back down.
        y -= 0.06 * envelope;
        tilt += Math.sin(progress * Math.PI) * 0.035 * envelope;
        turn -= Math.sin(progress * Math.PI * 2) * 0.05 * envelope;
      }

      if (progress >= 1) currentAction = null;
    }

    // Complete designer characters have no separate arm rigs, so their
    // reactions are carried by a larger whole-body motion.
    const bodyEmphasis = activeOutfit?.fullCharacter ? 1.8 : 1;
    companionRoot.position.y = y * bodyEmphasis + moodMotion.y * moodInfluence;
    companionRoot.rotation.z = tilt * bodyEmphasis + moodMotion.tilt * moodInfluence;
    companionRoot.rotation.y = turn * bodyEmphasis + moodMotion.turn * moodInfluence;
    floor.position.y = THREE.MathUtils.lerp(floor.position.y, floorTargetY, 0.16);

    const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
    setArmPose(baseModel, armAngles, wristWave);
    setArmPose(visibleOutfit, armAngles);

    const targets = baseModel?.userData.faceTargets;
    const mood = MOOD_FACE_SCALE[currentMood] || MOOD_FACE_SCALE.ready;
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

    controls?.update();
    renderer.render(scene, camera);
  });

  const dispose = () => {
    disposed = true;
    outfitRequest += 1;
    resizeObserver?.disconnect();
    renderer.setAnimationLoop(null);
    timer.dispose();
    controls?.dispose();
    const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
    detachPropSet(baseModel);
    propSets.forEach((request) => request.then(disposeModel, () => {}));
    disposeModel(contentRoot);
    floor.geometry.dispose();
    floor.material.dispose();
    renderer.dispose();
  };

  return { showOutfit, setMood, playAction, setPaused, dispose };
};
