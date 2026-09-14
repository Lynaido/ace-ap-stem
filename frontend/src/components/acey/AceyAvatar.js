import React, { useEffect, useRef, useState } from 'react';
import { OUTFITS, resolveOutfitVariant } from '../mascot/mascotCatalog';

// The 3D engine is a separate chunk; learners on slow connections or devices
// without WebGL keep the lightweight illustrated Acey instead.
const canUse3D = () => {
  if (typeof window === 'undefined') return false;
  const connection = navigator.connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return false;
  if (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory < 2) return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (error) {
    return false;
  }
};

const whenIdle = (callback) => {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: 2500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 900);
  return () => window.clearTimeout(handle);
};

const AceyAvatar = ({ appearance, reaction }) => {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const appearanceRef = useRef(appearance);
  appearanceRef.current = appearance;
  const [mode, setMode] = useState('sprite');

  const outfit = OUTFITS.find((item) => item.id === appearance.outfitId) || OUTFITS[0];
  const displayedOutfit = resolveOutfitVariant(outfit, appearance.accessoriesEnabled);

  useEffect(() => {
    if (!canUse3D()) return undefined;
    let cancelled = false;
    let api = null;

    const cancelIdle = whenIdle(async () => {
      try {
        const { createMascotScene } = await import('../mascot/mascotScene');
        if (cancelled || !stageRef.current || !canvasRef.current) return;
        api = createMascotScene({
          stage: stageRef.current,
          canvas: canvasRef.current,
          interactive: false,
          compact: true,
          onBaseStatus: (status) => {
            if (cancelled) return;
            if (status === 'ready') setMode('3d');
            if (status === 'error') setMode('sprite');
          },
          onError: () => { if (!cancelled) setMode('sprite'); },
        });
        if (!api) return;
        apiRef.current = api;
        const current = appearanceRef.current;
        const currentOutfit = OUTFITS.find((item) => item.id === current.outfitId) || OUTFITS[0];
        api.setMood(current.moodId);
        api.showOutfit(resolveOutfitVariant(currentOutfit, current.accessoriesEnabled));
      } catch (error) {
        if (!cancelled) setMode('sprite');
      }
    });

    return () => {
      cancelled = true;
      cancelIdle();
      apiRef.current = null;
      api?.dispose();
    };
  }, []);

  useEffect(() => {
    apiRef.current?.showOutfit(displayedOutfit);
    // displayedOutfit is derived from these three saved values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearance.outfitId, appearance.accessoriesEnabled]);

  useEffect(() => {
    apiRef.current?.setMood(appearance.moodId);
  }, [appearance.moodId]);

  useEffect(() => {
    if (reaction?.id) apiRef.current?.playAction(reaction.id);
  }, [reaction]);

  return (
    <div
      className={`acey-avatar acey-avatar--${mode}${reaction?.id ? ` acey-avatar--react-${reaction.id}` : ''}`}
      ref={stageRef}
    >
      <canvas ref={canvasRef} className="acey-avatar__canvas" aria-hidden="true" />
      {mode !== '3d' && (
        // Re-keying only the illustration restarts its CSS reaction; the 3D
        // canvas above must stay mounted.
        <div key={reaction?.key || 'idle'} className="ace-sprite ace-sprite--wave acey-avatar__sprite" aria-hidden="true" />
      )}
    </div>
  );
};

export default AceyAvatar;
