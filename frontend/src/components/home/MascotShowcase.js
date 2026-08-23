import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './MascotShowcase.css';

export const OUTFITS = [
  { id: 'hoodie', label: 'Hoodie', type: 'glb', url: '/mascot/outfits/hoodie.glb', unitScale: 100 },
  { id: 'doctor', label: 'Doctor', type: 'glb', url: '/mascot/outfits/doctor.glb', unitScale: 100 },
  { id: 'classic', label: 'Classic', type: 'glb', url: '/mascot/outfits/classic.glb', unitScale: 100, showBaseArms: true },
  { id: 'artist', label: 'Artist', type: 'glb', url: '/mascot/outfits/artist.glb', unitScale: 100, showBaseArms: true },
  { id: 'cloak', label: 'Cloak', type: 'glb', url: '/mascot/outfits/cloak.glb', unitScale: 100 },
  { id: 'wizard', label: 'Wizard', type: 'glb', url: '/mascot/outfits/wizard.glb', unitScale: 100 },
  {
    id: 'graduation',
    label: 'Graduation',
    type: 'fbx',
    url: '/mascot/outfits/graduation/graduation.fbx',
    unitScale: 1,
  },
  { id: 'activewear', label: 'Activewear', type: 'glb', url: '/mascot/outfits/activewear.glb', unitScale: 100, showBaseArms: true },
  { id: 'vest', label: 'Vest', type: 'glb', url: '/mascot/outfits/vest.glb', unitScale: 100 },
  { id: 'long-vest', label: 'Long vest', type: 'glb', url: '/mascot/outfits/long-vest.glb', unitScale: 100 },
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

const DEFAULT_OUTFIT_ID = 'hoodie';
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

const addArmAndHand = (model, hand, side) => {
  hand.geometry.computeBoundingBox();
  const handSize = hand.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(hand.scale);
  const innerHandX = Math.abs(hand.position.x) - (handSize.x / 2);
  const shoulderX = 10;
  const armEndX = Math.max(shoulderX + 16, innerHandX + 2);
  const radius = 6.5;
  const totalLength = armEndX - shoulderX;
  const arm = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, Math.max(4, totalLength - (radius * 2)), 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xd8c9ef, roughness: 0.62, metalness: 0.02 })
  );
  arm.name = `ACE-${side}-arm`;
  arm.rotation.z = Math.PI / 2;
  arm.position.set(
    (side === 'right' ? 1 : -1) * ((shoulderX + armEndX) / 2),
    hand.position.y,
    hand.position.z - 2
  );
  arm.castShadow = true;
  arm.receiveShadow = true;
  arm.visible = false;
  model.add(arm);

  const pivot = new THREE.Group();
  pivot.name = `ACE-${side}-hand-pivot`;
  pivot.position.copy(hand.position);
  hand.position.set(0, 0, 0);
  model.remove(hand);
  pivot.add(hand);
  model.add(pivot);
  return { arm, pivot };
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
    staticModel.userData.armMeshes = [left.arm, right.arm];
    staticModel.userData.leftHandPivot = left.pivot;
    staticModel.userData.rightHandPivot = right.pivot;
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
  const [announcement, setAnnouncement] = useState('Choose an outfit or a mood for ACE.');
  const activeMoodRef = useRef(activeMoodId);
  activeMoodRef.current = activeMoodId;

  const activeOutfit = useMemo(
    () => OUTFITS.find((outfit) => outfit.id === activeOutfitId) || OUTFITS[0],
    [activeOutfitId]
  );

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
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    camera.position.set(0, 0.08, 5.6);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 8;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 2.5));

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(3.5, 5.5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf97316, 1.4);
    rimLight.position.set(-2, 3, -4);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.05, 64),
      new THREE.ShadowMaterial({ color: 0x9a3412, opacity: 0.16 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.38;
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
          model = await loadOutfitModel(outfit, (event) => {
            if (requestId === outfitRequest) setOutfitProgress(getProgress(event));
          });
          if (disposed) {
            disposeModel(model);
            return;
          }
          prepareOutfitModel(model, outfit);
          model.visible = false;
          outfitCache.set(outfit.id, model);
          contentRoot.add(model);
        }

        if (requestId !== outfitRequest) return;
        if (visibleOutfit && visibleOutfit !== model) visibleOutfit.visible = false;
        model.visible = true;
        visibleOutfit = model;
        const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
        baseModel?.userData.armMeshes?.forEach((arm) => {
          arm.visible = Boolean(outfit.showBaseArms);
        });
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

    const clock = new THREE.Clock();

    const playAction = (actionId) => {
      currentAction = { id: actionId, startedAt: clock.getElapsedTime() };
    };

    sceneApiRef.current = { showOutfit, setMood, playAction };
    setBaseStatus('loading');
    setOutfitStatus('idle');

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
          contentRoot.position.set(-center.x * scale, -center.y * scale - 0.04, -center.z * scale);
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

    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      let y = reduceMotion ? 0 : Math.sin(elapsed * 1.1) * 0.018;
      let tilt = reduceMotion ? 0 : Math.sin(elapsed * 0.68) * 0.008;
      let turn = 0;

      if (currentAction && !reduceMotion) {
        const actionElapsed = elapsed - currentAction.startedAt;
        const duration = currentAction.id === 'focus' ? 1.6 : 1.25;
        const progress = Math.min(1, Math.max(0, actionElapsed / duration));
        const envelope = Math.sin(progress * Math.PI);

        if (currentAction.id === 'hello') {
          tilt += Math.sin(progress * Math.PI * 5) * 0.085 * envelope;
          turn += Math.sin(progress * Math.PI * 2) * 0.08 * envelope;
        } else if (currentAction.id === 'focus') {
          y -= Math.sin(progress * Math.PI) * 0.055;
          turn += Math.sin(progress * Math.PI * 2) * 0.035;
        } else if (currentAction.id === 'celebrate') {
          y += Math.sin(progress * Math.PI * 3) * 0.12 * envelope;
          turn += Math.sin(progress * Math.PI * 4) * 0.12 * envelope;
        }

        if (progress >= 1) currentAction = null;
      }

      companionRoot.position.y = y;
      companionRoot.rotation.z = tilt;
      companionRoot.rotation.y = turn;

      const baseModel = contentRoot.getObjectByName('ACEWebReadyBase');
      const rightHandPivot = baseModel?.userData.rightHandPivot;
      if (rightHandPivot) rightHandPivot.rotation.z = 0;
      if (rightHandPivot && currentAction?.id === 'hello' && !reduceMotion) {
        const actionElapsed = elapsed - currentAction.startedAt;
        const progress = Math.min(1, Math.max(0, actionElapsed / 1.25));
        const envelope = Math.sin(progress * Math.PI);
        rightHandPivot.rotation.z = Math.sin(progress * Math.PI * 6) * 0.34 * envelope;
      }

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
      2200
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
          <p className="mascot-showcase__eyebrow">Your study companion</p>
          <h2>Meet ACE. Make every study session feel more personal.</h2>
          <p>
            Choose an outfit, set ACE's mood, and share small moments of focus and progress.
            Your choices stay ready for the next visit on this device.
          </p>
          <div className="mascot-showcase__notes" aria-label="Mascot features">
            <span>10 selectable outfits</span>
            <span>Three moods and study reactions</span>
            <span>Ready for future character designs</span>
          </div>
        </div>

        <div className="mascot-showcase__experience">
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

            <p className="mascot-stage__hint">Drag to rotate. Scroll to zoom.</p>
          </div>

          <div className="mascot-controls">
            <div className="mascot-controls__heading">
              <div>
                <h3>Customize ACE</h3>
                <p>Pick a look and a mood that fits today's study session.</p>
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
                    {outfit.label}
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
    </section>
  );
};

export default MascotShowcase;
