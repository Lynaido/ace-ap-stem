import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MOODS,
  OUTFITS,
  REACTIONS,
  getBuddyName,
  getOutfitAccessories,
  resolveOutfitVariant,
} from '../mascot/mascotCatalog';
import { createMascotScene } from '../mascot/mascotScene';
import { useAcey } from '../acey/AceyContext';
import { BuddyColorPicker, BuddyNameForm } from '../acey/BuddyControls';
import './MascotShowcase.css';

export * from '../mascot/mascotModel';

// Roles whose designer pose includes props, in catalog order.
const PROP_ROLES = OUTFITS.filter((outfit) => getOutfitAccessories(outfit));

const getSyncLabel = (isAuthenticated, syncStatus) => {
  if (!isAuthenticated) return 'Sign in to keep ACE with you on every page';
  if (syncStatus === 'offline') return 'Saved on this device. We will sync it to your account.';
  if (syncStatus === 'loading') return 'Loading your saved ACE…';
  return 'Saved to your account';
};

// The scene skips reactions when the device asks for reduced motion, so the
// preview buttons say so instead of doing nothing.
const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
);

const getAccessoryDetail = (accessories, outfit, enabled) => {
  if (accessories.builtIn) return `Always included in the ${outfit.label} designer pose.`;
  return enabled
    ? `On: the ${outfit.label} outfit holding these props.`
    : `Off: shows the ${outfit.label} outfit without props.`;
};

const MascotShowcase = ({ variant = 'landing' }) => {
  const isWorkspace = variant === 'workspace';
  const { appearance, updateAppearance, isAuthenticated, syncStatus } = useAcey();
  const name = isWorkspace ? getBuddyName(appearance) : 'ACE';
  // Scene callbacks read the latest name without rebuilding the 3D scene.
  const nameRef = useRef(name);
  nameRef.current = name;
  const {
    outfitId: activeOutfitId,
    moodId: activeMoodId,
    accessoriesEnabled,
    colorId: activeColorId,
  } = appearance;
  const activeColorRef = useRef(activeColorId);
  activeColorRef.current = activeColorId;
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneApiRef = useRef(null);
  const reactionTimerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(isWorkspace);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [baseStatus, setBaseStatus] = useState('idle');
  const [outfitStatus, setOutfitStatus] = useState('idle');
  const [outfitProgress, setOutfitProgress] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [announcement, setAnnouncement] = useState(`${name} is ready. Pick a look or mood.`);
  const [playingReactionId, setPlayingReactionId] = useState(null);
  const [reduceMotion] = useState(prefersReducedMotion);
  const activeMoodRef = useRef(activeMoodId);
  activeMoodRef.current = activeMoodId;

  const activeOutfit = useMemo(
    () => OUTFITS.find((outfit) => outfit.id === activeOutfitId) || OUTFITS[0],
    [activeOutfitId]
  );
  const activeMood = MOODS.find((mood) => mood.id === activeMoodId) || MOODS[0];
  const accessories = getOutfitAccessories(activeOutfit);
  const propsShown = Boolean(accessories && (accessories.builtIn || accessoriesEnabled));
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
        const props = outfit.variant ? getOutfitAccessories(outfit) : null;
        setAnnouncement(
          props
            ? `${nameRef.current} is now in the ${outfit.label} look with ${props.label.toLowerCase()}.`
            : `${nameRef.current} is now wearing the ${outfit.label.toLowerCase()} outfit.`
        );
      },
    });
    if (!api) return undefined;

    sceneApiRef.current = api;
    api.setMood(activeMoodRef.current);
    api.setBrainColor(activeColorRef.current);
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
    sceneApiRef.current?.setBrainColor(activeColorId);
  }, [activeColorId]);

  useEffect(() => {
    sceneApiRef.current?.setMood(activeMoodId);
  }, [activeMoodId]);

  useEffect(() => () => window.clearTimeout(reactionTimerRef.current), []);

  const chooseOutfit = (outfit) => {
    updateAppearance({ outfitId: outfit.id });
  };

  const chooseMood = (mood) => {
    updateAppearance({ moodId: mood.id });
    setAnnouncement(`${name} feels ${mood.label.toLowerCase()}: ${mood.description.toLowerCase()}.`);
  };

  const chooseAccessories = (enabled) => {
    updateAppearance({ accessoriesEnabled: enabled });
  };

  const previewReaction = (reaction) => {
    sceneApiRef.current?.playAction(reaction.id);
    setPlayingReactionId(reaction.id);
    setAnnouncement(`${name} ${reaction.message}`);
    window.clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = window.setTimeout(() => {
      setPlayingReactionId(null);
      setAnnouncement(`${name} is ready for your next study step.`);
    }, reaction.duration * 1000);
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
  const idPrefix = `mascot-${variant}`;

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
              ? `Choose a role, brain color, accessories, name and mood. ${name} keeps this look on your Dashboard, Solve, AI Tutor, Notes Hub and Study Mode.`
              : 'Pick a role, set the mood, and let ACE react as you learn. Every outfit stays fitted while ACE rests, waves hello, focuses with you, and celebrates progress.'}
          </p>
          <div className="mascot-showcase__notes" aria-label="Mascot features">
            <span>{OUTFITS.length} character roles</span>
            <span>Designer poses with props</span>
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
                <small>
                  {activeMood.icon} {activeMood.label}
                  {propsShown ? ' · with props' : ''}
                </small>
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
                      {getOutfitAccessories(outfit) && (
                        <span className="mascot-choice__badge" title="Has props">
                          <span aria-hidden="true">✦</span>
                          <span className="mascot-visually-hidden">, has props</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mascot-controls__group">
                <legend>Brain color</legend>
                <BuddyColorPicker
                  colorId={activeColorId}
                  buddyName={name}
                  disabled={!controlsReady}
                  onChange={(colorId) => updateAppearance({ colorId })}
                />
              </fieldset>

              <fieldset className="mascot-controls__group mascot-accessory">
                <legend>Accessories</legend>
                {accessories ? (
                  <div className={`mascot-accessory__card${propsShown ? ' is-on' : ''}`}>
                    <span className="mascot-accessory__icon" aria-hidden="true">✦</span>
                    <span className="mascot-accessory__copy">
                      <strong>{accessories.label}</strong>
                      <small id={`${idPrefix}-accessory-detail`}>
                        {getAccessoryDetail(accessories, activeOutfit, accessoriesEnabled)}
                      </small>
                    </span>
                    {accessories.builtIn ? (
                      <span className="mascot-accessory__badge">Included</span>
                    ) : (
                      <label className="mascot-accessory__switch">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={accessoriesEnabled}
                          aria-checked={accessoriesEnabled}
                          aria-label={`Show props: ${accessories.label}`}
                          aria-describedby={`${idPrefix}-accessory-detail`}
                          disabled={!controlsReady}
                          onChange={(event) => chooseAccessories(event.target.checked)}
                        />
                        <span className="mascot-accessory__track" aria-hidden="true" />
                        <span className="mascot-accessory__state" aria-hidden="true">
                          {accessoriesEnabled ? 'On' : 'Off'}
                        </span>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="mascot-accessory__empty">
                    <p>No props for the {activeOutfit.label} role yet. Its outfit is shown as usual.</p>
                    <div className="mascot-accessory__roles">
                      <span>Roles with props:</span>
                      {PROP_ROLES.map((outfit) => (
                        <button
                          type="button"
                          key={outfit.id}
                          className="mascot-accessory__role"
                          disabled={!controlsReady}
                          onClick={() => chooseOutfit(outfit)}
                        >
                          {outfit.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>

              {isWorkspace && (
                <fieldset className="mascot-controls__group">
                  <legend>Name</legend>
                  <BuddyNameForm name={appearance.name} onSave={(value) => updateAppearance({ name: value })} />
                </fieldset>
              )}

              <fieldset className="mascot-controls__group">
                <legend>Mood</legend>
                <p className="mascot-controls__hint">How {name} moves while resting, on this page and every study page.</p>
                <div className="mascot-mood-picker">
                  {MOODS.map((mood) => (
                    <button
                      type="button"
                      key={mood.id}
                      className={`mascot-mood${activeMoodId === mood.id ? ' is-active' : ''}`}
                      aria-pressed={activeMoodId === mood.id}
                      aria-label={mood.label}
                      aria-describedby={`${idPrefix}-mood-${mood.id}`}
                      disabled={!controlsReady}
                      onClick={() => chooseMood(mood)}
                    >
                      <span className="mascot-mood__icon" aria-hidden="true">{mood.icon}</span>
                      <span className="mascot-mood__label">{mood.label}</span>
                      <small className="mascot-mood__hint" id={`${idPrefix}-mood-${mood.id}`}>{mood.description}</small>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mascot-controls__group">
                <legend>Study reactions</legend>
                <p className="mascot-controls__hint">
                  {name} plays these by itself while you study. Tap one to preview it.
                </p>
                {reduceMotion && (
                  <p className="mascot-controls__note">
                    Reduced motion is on for this device, so {name} stays still instead of reacting.
                  </p>
                )}
                <div className="mascot-reaction-picker">
                  {REACTIONS.map((reaction) => (
                    <button
                      type="button"
                      key={reaction.id}
                      className={`mascot-reaction${playingReactionId === reaction.id ? ' is-playing' : ''}`}
                      style={{ '--reaction-duration': `${reaction.duration}s` }}
                      aria-label={`Preview ${reaction.label}`}
                      aria-describedby={`${idPrefix}-reaction-${reaction.id}`}
                      disabled={!controlsReady || reduceMotion}
                      onClick={() => previewReaction(reaction)}
                    >
                      <span className="mascot-reaction__icon" aria-hidden="true">{reaction.icon}</span>
                      <span className="mascot-reaction__text">
                        <strong>{reaction.label}</strong>
                        <small id={`${idPrefix}-reaction-${reaction.id}`}>{reaction.when}</small>
                      </span>
                      <span className="mascot-reaction__progress" aria-hidden="true" />
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
