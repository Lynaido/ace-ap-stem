import React, { useEffect, useRef } from 'react';
import './AceyScene.css';

// A full-bleed study-room scene: a painted 16:9 background, Acey cutouts
// standing on their book stacks and a foreground layer (laptop, leaves).
// Characters are placed in % of the frame, measured from the same 3D camera
// that rendered the room (tmp/hero-scene.html), so their feet stay on the
// books at every crop. `focusX` (0–1) picks which part of the frame stays in
// view when the hero is narrower than 16:9 (`focusY` when it is wider).
//
// Motion: characters pop in back-to-front, then bob on their own rhythm;
// the layers drift a little with the pointer for depth.

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const AceyScene = ({ scene, over, characters, focusX = 0.5, focusY = 0.5, className = '', children, sparkles = [], veil = false }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !window.matchMedia?.('(pointer: fine)').matches) return undefined;
    const host = root.parentElement || root;
    let frame = 0;
    let target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      root.style.setProperty('--px', current.x.toFixed(4));
      root.style.setProperty('--py', current.y.toFixed(4));
      frame = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (event) => {
      const rect = host.getBoundingClientRect();
      target = {
        x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
      };
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      target = { x: 0, y: 0 };
      if (!frame) frame = requestAnimationFrame(tick);
    };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const ordered = [...characters].sort((a, b) => a.depth - b.depth);

  return (
    <div className={`acey-scene ${className}`} ref={rootRef} style={{ '--focus-x': focusX, '--focus-y': focusY }} aria-hidden="true">
      <div className="acey-scene__frame">
        <picture className="acey-scene__layer acey-scene__layer--back">
          <source media="(max-width: 700px)" srcSet={scene.small} />
          <img src={scene.large} alt="" width="2400" height="1350" decoding="async" />
        </picture>
        <div className="acey-scene__light" />
        {/* Soft light behind a centered headline, kept under the characters. */}
        {veil && <div className="acey-scene__veil" />}

        {ordered.map((character, index) => (
          <span
            key={character.id}
            className="acey-scene__character"
            style={{
              left: `${character.x}%`,
              top: `${character.y - character.h}%`,
              height: `${character.h}%`,
              zIndex: 2 + index,
              '--depth': (character.depth + 4) / 8,
              '--enter-delay': `${260 + index * 110}ms`,
              '--bob-duration': `${4.4 + ((index * 0.7) % 2.1)}s`,
              '--bob-delay': `${-index * 0.9}s`,
            }}
          >
            <span className="acey-scene__bob">
              <img src={character.src} alt="" decoding="async" />
            </span>
          </span>
        ))}

        {children}

        {over && <img className="acey-scene__layer acey-scene__layer--over" src={over} alt="" width="2400" height="1350" decoding="async" />}

        {sparkles.map((sparkle, index) => (
          <i
            key={index}
            className={`acey-scene__sparkle acey-scene__sparkle--${sparkle.tone || 'gold'}`}
            style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%`, '--size': `${sparkle.size || 14}px`, '--delay': `${index * -0.8}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default AceyScene;
