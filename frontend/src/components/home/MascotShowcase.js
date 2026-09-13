import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACTIONS,
  MOODS,
  OUTFITS,
  getOutfitAccessories,
  resolveOutfitVariant,
} from '../mascot/mascotCatalog';
import { createMascotScene } from '../mascot/mascotScene';
import { useAcey } from '../acey/AceyContext';
import './MascotShowcase.css';

export * from '../mascot/mascotModel';

const getSyncLabel = (isAuthenticated, syncStatus) => {
  if (!isAuthenticated) return 'Sign in to keep ACE with you on every page';
  if (syncStatus === 'offline') return 'Saved on this device. We will sync it to your account.';
  if (syncStatus === 'loading') return 'Loading your saved ACE…';
  return 'Saved to your account';
};

const MascotShowcase = ({ variant = 'landing' }) => {
  const isWorkspace = variant === 'workspace';
  const { appearance, updateAppearance, isAuthenticated, syncStatus } = useAcey();
  const { outfitId: activeOutfitId, moodId: activeMoodId, accessoriesEnabled } = appearance;
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneApiRef = useRef(null);
  const announcementTimerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(isWorkspace);
  const [sceneVersion, setSceneVersion] = useState(0);
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
  const accessories = getOutfitAccessories(activeOutfit);
  const displayedOutfit = useMemo(
    () => resolveOutfitVariant(activeOutfit, accessoriesEnabled),
    [activeOutfit, accessoriesEnabled]
  );
  const displayedOutfitRef = useRef(displayedOutfit);
  displayedOutfitRef.current = displayedOutfit;

  // LandingPage may receive /#meet-ace before this code-split component has
  // mounted. Reassert the anchor once the real section exists so a direct
  // visit cannot remain at the Home hero while the 3D companion finishes
  // loading.
  useEffect(() => {
    if (isWorkspace || window.location.hash !== '#meet-ace' || !sectionRef.current) return undefined;

    const timer = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isWorkspace]);

  useEffect(() => {
    const section = sectionRef.current;
    if (shouldLoad || !section) return undefined;

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
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || !stageRef.current || !canvasRef.current) return undefined;

    setErrorMessage('');
    const api = createMascotScene({
      stage: stageRef.current,
      canvas: canvasRef.current,
      interactive: true,
      onBaseStatus: (status) => {
        setBaseStatus(status);
        if (status === 'ready') setErrorMessage('');
      },
      onOutfitStatus: (status) => {
        setOutfitStatus(status);
        if (status === 'loading') setErrorMessage('');
      },
      onOutfitProgress: setOutfitProgress,
      onError: setErrorMessage,
      onOutfitShown: (outfit) => {
        setAnnouncement(
          outfit.variant === 'posed'
            ? `ACE is now wearing the ${outfit.label.toLowerCase()} outfit with accessories.`
            : `ACE is now wearing the ${outfit.label.toLowerCase()} outfit.`
        );
      },
    });
    if (!api) return undefined;

    sceneApiRef.current = api;
    api.setMood(activeMoodRef.current);
    // Start the first outfit request immediately so its network transfer and
    // parsing overlap with the body FBX request instead of running serially.
    api.showOutfit(displayedOutfitRef.current);

    return () => {
      sceneApiRef.current = null;
      api.dispose();
    };
  }, [sceneVersion, shouldLoad]);

  useEffect(() => {
    sceneApiRef.current?.showOutfit(displayedOutfit);
  }, [displayedOutfit]);

  useEffect(() => {
    sceneApiRef.current?.setMood(activeMoodId);
  }, [activeMoodId]);

  useEffect(() => () => window.clearTimeout(announcementTimerRef.current), []);

  const chooseOutfit = (outfit) => {
    updateAppearance({ outfitId: outfit.id });
  };

  const chooseMood = (mood) => {
    updateAppearance({ moodId: mood.id });
    setAnnouncement(`ACE feels ${mood.label.toLowerCase()}.`);
  };

  const chooseAccessories = (enabled) => {
    updateAppearance({ accessoriesEnabled: enabled });
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
  const Heading = isWorkspace ? 'h1' : 'h2';

  return (
    <section
      className={`mascot-showcase${isWorkspace ? ' mascot-showcase--workspace' : ''}`}
      id={isWorkspace ? undefined : 'meet-ace'}
      ref={sectionRef}
    >
      <div className="mascot-showcase__container">
        <div className="mascot-showcase__copy">
          <p className="mascot-showcase__eyebrow">{isWorkspace ? 'Your study buddy' : 'Meet your study buddy'}</p>
          <Heading>{isWorkspace ? 'Customize Acey.' : 'Make ACE feel like your own.'}</Heading>
          <p>
            {isWorkspace
              ? 'Choose a role, accessories and mood. Acey keeps this look on your Dashboard, Solve, AI Tutor, Notes Hub and Study Mode.'
              : 'Pick a role, set the mood, and let ACE react as you learn. Every outfit stays fitted while ACE rests, waves hello, focuses with you, and celebrates progress.'}
          </p>
          <div className="mascot-showcase__notes" aria-label="Mascot features">
            <span>11 character roles</span>
            <span>Designer poses with accessories</span>
            <span>{isAuthenticated ? 'Saved to your account' : 'Your choice is remembered'}</span>
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
              <span className={`mascot-sync-status mascot-sync-status--${isAuthenticated ? syncStatus : 'guest'}`}>
                {getSyncLabel(isAuthenticated, syncStatus)}
              </span>
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
                    onClick={() => chooseOutfit(outfit)}
                  >
                    <span className="mascot-choice__number" aria-hidden="true">{outfit.number}</span>
                    <span>{outfit.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mascot-controls__group mascot-accessory">
              <legend>Accessories</legend>
              {accessories ? (
                <label className={`mascot-accessory__switch${accessories.builtIn ? ' is-built-in' : ''}`}>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={accessories.builtIn || accessoriesEnabled}
                    aria-checked={accessories.builtIn || accessoriesEnabled}
                    disabled={!controlsReady || accessories.builtIn}
                    onChange={(event) => chooseAccessories(event.target.checked)}
                  />
                  <span className="mascot-accessory__track" aria-hidden="true" />
                  <span className="mascot-accessory__copy">
                    <strong>{accessories.label}</strong>
                    <small>{accessories.builtIn ? 'Part of this role’s designer pose' : 'Designer pose with props'}</small>
                  </span>
                </label>
              ) : (
                <p className="mascot-accessory__empty">
                  Accessories for the {activeOutfit.label} role are being prepared by the 3D team.
                </p>
              )}
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
