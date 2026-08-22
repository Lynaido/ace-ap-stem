import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './MascotShowcase.css';

const OUTFITS = [
  { id: 'hoodie', label: 'Hoodie', type: 'glb', url: '/mascot/outfits/hoodie.glb' },
  { id: 'doctor', label: 'Doctor', type: 'glb', url: '/mascot/outfits/doctor.glb' },
  { id: 'classic', label: 'Classic', type: 'glb', url: '/mascot/outfits/classic.glb' },
  { id: 'artist', label: 'Artist', type: 'glb', url: '/mascot/outfits/artist.glb' },
  { id: 'cloak', label: 'Cloak', type: 'glb', url: '/mascot/outfits/cloak.glb' },
  { id: 'wizard', label: 'Wizard', type: 'glb', url: '/mascot/outfits/wizard.glb' },
  {
    id: 'graduation',
    label: 'Graduation',
    type: 'fbx',
    url: '/mascot/outfits/graduation/graduation.fbx',
  },
  { id: 'activewear', label: 'Activewear', type: 'glb', url: '/mascot/outfits/activewear.glb' },
  { id: 'vest', label: 'Vest', type: 'glb', url: '/mascot/outfits/vest.glb' },
  { id: 'long-vest', label: 'Long vest', type: 'glb', url: '/mascot/outfits/long-vest.glb' },
];

const DEFAULT_OUTFIT_ID = 'hoodie';

const configureModel = (model) => {
  model.traverse((node) => {
    if (!node.isMesh) return;

    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
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

const loadOutfitModel = (outfit) => new Promise((resolve, reject) => {
  if (outfit.type === 'fbx') {
    new FBXLoader().load(outfit.url, resolve, undefined, reject);
    return;
  }

  new GLTFLoader().load(outfit.url, (gltf) => resolve(gltf.scene), undefined, reject);
});

const MascotShowcase = () => {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneApiRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [activeOutfitId, setActiveOutfitId] = useState(DEFAULT_OUTFIT_ID);
  const [baseStatus, setBaseStatus] = useState('idle');
  const [outfitStatus, setOutfitStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const activeOutfit = useMemo(
    () => OUTFITS.find((outfit) => outfit.id === activeOutfitId) || OUTFITS[0],
    [activeOutfitId]
  );

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
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const modelRoot = new THREE.Group();
    const outfitCache = new Map();
    scene.add(modelRoot);

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
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.65;

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

      outfitCache.forEach((model) => {
        model.visible = false;
      });

      try {
        let model = outfitCache.get(outfit.id);
        if (!model) {
          model = await loadOutfitModel(outfit);
          if (disposed) {
            disposeModel(model);
            return;
          }
          configureModel(model);
          model.visible = false;
          outfitCache.set(outfit.id, model);
          modelRoot.add(model);
        }

        if (requestId !== outfitRequest) return;
        model.visible = true;
        setOutfitStatus('ready');
        setErrorMessage('');
      } catch (error) {
        if (requestId !== outfitRequest || disposed) return;
        setOutfitStatus('error');
        setErrorMessage(`Could not load the ${outfit.label.toLowerCase()} outfit.`);
      }
    };

    sceneApiRef.current = { showOutfit };
    setBaseStatus('loading');

    const baseLoader = new FBXLoader();
    baseLoader.setPath('/mascot/body/');
    baseLoader.load(
      'body_light_neon.fbx',
      (model) => {
        if (disposed) {
          disposeModel(model);
          return;
        }

        configureModel(model);
        modelRoot.add(model);

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());

        if (size.y > 0) {
          const scale = 2.6 / size.y;
          modelRoot.scale.setScalar(scale);
          modelRoot.position.set(-center.x * scale, -center.y * scale - 0.04, -center.z * scale);
        }

        setBaseStatus('ready');
      },
      undefined,
      () => {
        if (disposed) return;
        setBaseStatus('error');
        setErrorMessage('Could not load the ACE mascot model.');
      }
    );

    renderer.setAnimationLoop(() => {
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
      disposeModel(modelRoot);
      floor.geometry.dispose();
      floor.material.dispose();
      renderer.dispose();
    };
  }, [shouldLoad]);

  useEffect(() => {
    if (sceneApiRef.current && baseStatus === 'ready') {
      sceneApiRef.current.showOutfit(activeOutfit);
    }
  }, [activeOutfit, baseStatus]);

  const isLoading = baseStatus === 'loading' || outfitStatus === 'loading';

  return (
    <section className="mascot-showcase" id="meet-ace" ref={sectionRef}>
      <div className="mascot-showcase__container">
        <div className="mascot-showcase__copy">
          <h2>Meet ACE, your study companion.</h2>
          <p>
            Choose a look for ACE, rotate the model, and make your study space feel more personal.
          </p>
          <div className="mascot-showcase__notes" aria-label="Mascot features">
            <span>10 selectable outfits</span>
            <span>Interactive 3D preview</span>
            <span>Designed for focused study</span>
          </div>
        </div>

        <div className="mascot-showcase__experience">
          <div
            className="mascot-stage"
            ref={stageRef}
            role="img"
            aria-label={`Interactive 3D model of ACE wearing the ${activeOutfit.label.toLowerCase()} outfit`}
          >
            <canvas ref={canvasRef} className="mascot-stage__canvas" />

            {!shouldLoad && (
              <div className="mascot-stage__skeleton" aria-hidden="true">
                <div className="mascot-stage__skeleton-figure" />
              </div>
            )}

            {isLoading && (
              <div className="mascot-stage__loading" role="status" aria-live="polite">
                Preparing {activeOutfit.label.toLowerCase()}...
              </div>
            )}

            {errorMessage && (
              <div className="mascot-stage__error" role="status">
                <strong>ACE is still here.</strong>
                <span>{errorMessage}</span>
              </div>
            )}

            <p className="mascot-stage__hint">Drag to rotate. Scroll to zoom.</p>
          </div>

          <div className="mascot-outfit-picker" aria-label="Choose ACE's outfit">
            {OUTFITS.map((outfit) => (
              <button
                type="button"
                key={outfit.id}
                className={`mascot-outfit-picker__button${activeOutfitId === outfit.id ? ' is-active' : ''}`}
                aria-pressed={activeOutfitId === outfit.id}
                onClick={() => setActiveOutfitId(outfit.id)}
              >
                {outfit.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MascotShowcase;
