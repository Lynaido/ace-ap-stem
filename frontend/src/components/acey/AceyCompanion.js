import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaEllipsisH, FaTimes } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { useAcey } from './AceyContext';
import AceyAvatar from './AceyAvatar';
import { ACEY_EVENT } from './aceyEvents';
import {
  ACEY_REACTIONS,
  EVENT_MESSAGES,
  GATE_RULES,
  TUTORIAL_STEPS,
  canShowBubble,
  getAceyContext,
  normalizeHistory,
  pickContextMessage,
  recordBubble,
  shouldAutoStartTutorial,
} from './aceyBrain';
import './AceyCompanion.css';

// The customizer already shows a full-size Acey, so the companion stays away there.
const COMPANION_PATHS = ['/dashboard', '/solve-problems', '/tutor', '/notes-hub', '/study-mode', '/concept-notes'];
const HISTORY_PREFIX = 'acey-history-v1:';
const SESSION_START_KEY = 'acey-session-started-at';
const LONG_SESSION_KEY = 'acey-long-session-shown';
const GREETED_PREFIX = 'acey-greeted:';
const CUSTOMIZE_INTRO_PREFIX = 'acey-customize-intro-v1:';
const IDLE_FIDGET_MS = 75 * 1000;

export const shouldShowCompanion = (pathname) => (
  pathname === '/' || COMPANION_PATHS.some((path) => pathname.startsWith(path))
);

const storage = (type) => {
  try {
    return window[type];
  } catch (error) {
    return null;
  }
};

const readJson = (key) => {
  try {
    return JSON.parse(storage('localStorage')?.getItem(key) || 'null');
  } catch (error) {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    storage('localStorage')?.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Message history is a nicety; Acey still works without storage.
  }
};

const sessionGet = (key) => {
  try {
    return storage('sessionStorage')?.getItem(key);
  } catch (error) {
    return null;
  }
};

const sessionSet = (key, value) => {
  try {
    storage('sessionStorage')?.setItem(key, value);
  } catch (error) {
    // Ignore unavailable session storage.
  }
};

const isEditableTarget = (target) => Boolean(target) && (
  target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
);

const findVisibleTarget = (target) => Array.from(document.querySelectorAll(`[data-acey-target="${target}"]`))
  .find((element) => element.getClientRects().length > 0);

const AceyCompanionPanel = ({ userId, pathname, problemView }) => {
  const navigate = useNavigate();
  const {
    appearance,
    preferences,
    onboarding,
    isReady,
    updatePreferences,
    setOnboardingStatus,
  } = useAcey();
  const context = getAceyContext(pathname, problemView);
  const [bubble, setBubble] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const historyKey = `${HISTORY_PREFIX}${userId}`;
  const historyRef = useRef(normalizeHistory(readJson(historyKey)));
  const lastTypingAtRef = useRef(0);
  const lastActivityAtRef = useRef(Date.now());
  const lastFidgetAtRef = useRef(Date.now());
  const hideTimerRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const highlightedRef = useRef(null);
  const autoTourRef = useRef(false);
  const bubbleRef = useRef(bubble);
  bubbleRef.current = bubble;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const gateStateRef = useRef({});
  gateStateRef.current = {
    minimized: preferences.minimized,
    bubblesEnabled: preferences.bubblesEnabled,
    tutorialActive: tutorialStep !== null,
  };

  const react = useCallback((id) => {
    if (id) setReaction({ id, key: Date.now() });
  }, []);

  const clearHighlight = useCallback(() => {
    window.clearInterval(highlightTimerRef.current);
    highlightedRef.current?.classList.remove('acey-highlight');
    highlightedRef.current = null;
  }, []);

  // Targets can appear a moment after navigation, so look for them briefly.
  const highlight = useCallback((target) => {
    clearHighlight();
    if (!target) return;
    let attempts = 0;
    const tryHighlight = () => {
      attempts += 1;
      const element = findVisibleTarget(target);
      if (element) {
        window.clearInterval(highlightTimerRef.current);
        element.classList.add('acey-highlight');
        highlightedRef.current = element;
        // Scroll only the page, and only when the feature is off screen.
        // scrollIntoView would also move embedding frames and nested panels.
        const rect = element.getBoundingClientRect();
        const offScreen = rect.top < 80 || rect.bottom > window.innerHeight - 40;
        if (offScreen) {
          const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          window.scrollBy({
            top: rect.top - Math.max(90, (window.innerHeight - rect.height) / 2),
            behavior: reduceMotion ? 'auto' : 'smooth',
          });
        }
      } else if (attempts >= 20) {
        window.clearInterval(highlightTimerRef.current);
      }
    };
    highlightTimerRef.current = window.setInterval(tryHighlight, 150);
    tryHighlight();
  }, [clearHighlight]);

  const hideBubble = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);
    setBubble(null);
    clearHighlight();
  }, [clearHighlight]);

  const showBubble = useCallback((message, kind) => {
    const now = Date.now();
    const allowed = canShowBubble({
      message,
      kind,
      now,
      history: historyRef.current,
      lastTypingAt: lastTypingAtRef.current,
      ...gateStateRef.current,
    });
    if (!allowed) return false;

    historyRef.current = recordBubble(historyRef.current, message, now);
    writeJson(historyKey, historyRef.current);
    react(message.reaction);
    window.clearTimeout(hideTimerRef.current);
    setBubble({ message, kind });
    if (message.highlight) highlight(message.highlight);
    else clearHighlight();
    const visibleFor = GATE_RULES.autoHideMs + (message.highlight ? 4000 : 0);
    hideTimerRef.current = window.setTimeout(() => {
      setBubble(null);
      clearHighlight();
    }, visibleFor);
    return true;
  }, [clearHighlight, highlight, historyKey, react]);

  const finishTutorial = useCallback((status) => {
    setTutorialStep(null);
    setOnboardingStatus(status);
    hideBubble();
    // The tour just spoke on this page: give the learner a pause before any
    // automatic tip, and do not repeat this page's introduction.
    historyRef.current = recordBubble(historyRef.current, { id: 'tutorial-finished' }, Date.now());
    writeJson(historyKey, historyRef.current);
    sessionSet(`${GREETED_PREFIX}${userId}:${getAceyContext(pathnameRef.current)}`, '1');
    if (status === 'completed') react(ACEY_REACTIONS.CELEBRATE);
  }, [hideBubble, historyKey, react, setOnboardingStatus, userId]);

  const goToStep = useCallback((index) => {
    const step = TUTORIAL_STEPS[index];
    if (!step) {
      finishTutorial('completed');
      return;
    }
    setMenuOpen(false);
    setTutorialStep(index);
    if (step.route && getAceyContext(pathnameRef.current) !== getAceyContext(step.route)) {
      navigate(step.route);
    }
    react(step.reaction);
    window.clearTimeout(hideTimerRef.current);
    setBubble({ message: step, kind: 'tutorial' });
    highlight(step.target);
  }, [finishTutorial, highlight, navigate, react]);

  // Typing, clicks and scrolling tell Acey the learner is busy or active.
  useEffect(() => {
    const handleKey = (event) => {
      lastActivityAtRef.current = Date.now();
      if (event.key === 'Escape' && bubbleRef.current && bubbleRef.current.kind !== 'tutorial') {
        hideBubble();
        return;
      }
      if (isEditableTarget(event.target) && !event.target.closest?.('.acey-companion')) {
        lastTypingAtRef.current = Date.now();
        // Never talk over someone who is writing an answer or a question.
        if (bubbleRef.current && bubbleRef.current.kind !== 'tutorial') hideBubble();
      }
    };
    const handleActivity = () => { lastActivityAtRef.current = Date.now(); };

    document.addEventListener('keydown', handleKey, true);
    document.addEventListener('input', handleKey, true);
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.removeEventListener('input', handleKey, true);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [hideBubble]);

  // Reactions to what the learner just did on a page.
  useEffect(() => {
    const handleEvent = (event) => {
      const message = EVENT_MESSAGES[event.detail?.type];
      if (!message) return;
      lastActivityAtRef.current = Date.now();
      const shown = showBubble(message, message.ambient ? 'ambient' : 'reaction');
      // Even when the bubble stays quiet, a small animation still acknowledges it.
      if (!shown && !gateStateRef.current.tutorialActive) react(message.reaction);
    };
    window.addEventListener(ACEY_EVENT, handleEvent);
    return () => window.removeEventListener(ACEY_EVENT, handleEvent);
  }, [react, showBubble]);

  // First visit: offer the guided tour once, from the dashboard.
  useEffect(() => {
    if (!isReady || autoTourRef.current || !shouldAutoStartTutorial({ onboarding })) return undefined;
    if (getAceyContext(pathname) !== 'dashboard') return undefined;
    autoTourRef.current = true;
    const timer = window.setTimeout(() => goToStep(0), 1600);
    return () => window.clearTimeout(timer);
  }, [goToStep, isReady, onboarding, pathname]);

  // Learners who finished the tour earlier get one pointer to customization.
  useEffect(() => {
    if (!isReady || tutorialStep !== null || shouldAutoStartTutorial({ onboarding })) return undefined;
    if (context !== 'dashboard') return undefined;
    const introKey = `${CUSTOMIZE_INTRO_PREFIX}${userId}`;
    if (readJson(introKey)) return undefined;

    const timer = window.setTimeout(() => {
      if (showBubble(EVENT_MESSAGES['customize-intro'], 'context')) {
        writeJson(introKey, Date.now());
        sessionSet(`${GREETED_PREFIX}${userId}:dashboard`, '1');
      }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [context, isReady, onboarding, showBubble, tutorialStep, userId]);

  // Each feature introduces itself once per visit.
  useEffect(() => {
    if (!isReady || tutorialStep !== null || !context) return undefined;
    if (shouldAutoStartTutorial({ onboarding }) && !autoTourRef.current) return undefined;
    // The one-time customization pointer takes the dashboard slot first.
    if (context === 'dashboard' && !readJson(`${CUSTOMIZE_INTRO_PREFIX}${userId}`) && onboarding) return undefined;
    const greetedKey = `${GREETED_PREFIX}${userId}:${context}`;
    if (sessionGet(greetedKey)) return undefined;

    const timer = window.setTimeout(() => {
      const message = pickContextMessage(context, historyRef.current);
      if (message && showBubble(message, 'context')) sessionSet(greetedKey, '1');
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [context, isReady, onboarding, showBubble, tutorialStep, userId]);

  // Idle check-ins, gentle fidgets and a break reminder after long sessions.
  useEffect(() => {
    let startedAt = Number(sessionGet(SESSION_START_KEY));
    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      startedAt = Date.now();
      sessionSet(SESSION_START_KEY, String(startedAt));
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      if (document.hidden || gateStateRef.current.tutorialActive || bubbleRef.current) return;
      const idleFor = now - lastActivityAtRef.current;

      if (!sessionGet(LONG_SESSION_KEY) && now - startedAt >= GATE_RULES.longSessionMs && idleFor < 60 * 1000) {
        if (showBubble(EVENT_MESSAGES['long-session'], 'ambient')) sessionSet(LONG_SESSION_KEY, '1');
        return;
      }
      if (idleFor >= GATE_RULES.idleAfterMs) {
        if (showBubble(EVENT_MESSAGES.idle, 'ambient')) lastActivityAtRef.current = now;
        return;
      }
      if (idleFor >= 20 * 1000 && now - lastFidgetAtRef.current >= IDLE_FIDGET_MS && now - lastTypingAtRef.current > GATE_RULES.typingQuietMs) {
        lastFidgetAtRef.current = now;
        react(ACEY_REACTIONS.THINK);
      }
    }, 20 * 1000);
    return () => window.clearInterval(interval);
  }, [react, showBubble]);

  // Leave room at the bottom of the page so Acey never covers the last controls.
  useEffect(() => {
    document.body.classList.add('has-acey-companion');
    return () => {
      document.body.classList.remove('has-acey-companion');
      window.clearTimeout(hideTimerRef.current);
      window.clearInterval(highlightTimerRef.current);
      highlightedRef.current?.classList.remove('acey-highlight');
    };
  }, []);

  const tutorialActive = tutorialStep !== null;
  const minimized = preferences.minimized && !tutorialActive;

  const handleAvatarClick = () => {
    setMenuOpen(false);
    if (preferences.minimized) {
      updatePreferences({ minimized: false });
    }
    if (tutorialActive) return;
    if (bubble) {
      hideBubble();
      return;
    }
    const message = pickContextMessage(context, historyRef.current) || EVENT_MESSAGES.idle;
    showBubble(message, 'manual');
  };

  const toggleMinimized = () => {
    setMenuOpen(false);
    if (!preferences.minimized) hideBubble();
    updatePreferences({ minimized: !preferences.minimized });
  };

  const toggleTips = () => {
    setMenuOpen(false);
    if (preferences.bubblesEnabled) hideBubble();
    updatePreferences({ bubblesEnabled: !preferences.bubblesEnabled });
  };

  const isLastStep = tutorialStep === TUTORIAL_STEPS.length - 1;

  return (
    <aside
      className={`acey-companion${minimized ? ' is-minimized' : ''}${tutorialActive ? ' is-touring' : ''}`}
      aria-label="Acey, your study buddy"
    >
      {bubble && (!minimized || bubble.kind === 'tutorial') && (
        <div
          className={`acey-bubble acey-bubble--${bubble.kind}`}
          role={bubble.kind === 'tutorial' ? 'dialog' : 'status'}
          aria-live="polite"
          aria-label={bubble.kind === 'tutorial' ? 'Acey tour' : undefined}
        >
          <p className="acey-bubble__text">{bubble.message.text}</p>
          {bubble.kind !== 'tutorial' && (bubble.kind === 'manual' || bubble.message.cta === 'customize') && (
            <Link className="acey-bubble__link" to="/customize-acey" onClick={hideBubble}>
              ✨ Customize Acey
            </Link>
          )}
          {bubble.kind === 'tutorial' && (
            <div className="acey-bubble__tour">
              <span className="acey-bubble__progress">{tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
              <div className="acey-bubble__actions">
                {isLastStep ? (
                  <>
                    <Link className="acey-button" to="/customize-acey" onClick={() => finishTutorial('completed')}>
                      ✨ Customize Acey
                    </Link>
                    <button type="button" className="acey-button acey-button--primary" onClick={() => finishTutorial('completed')}>
                      Got it
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="acey-button" onClick={() => finishTutorial('skipped')}>
                      Skip tutorial
                    </button>
                    <button type="button" className="acey-button" onClick={() => finishTutorial('dismissed')}>
                      Don&apos;t show again
                    </button>
                    <button type="button" className="acey-button acey-button--primary" onClick={() => goToStep(tutorialStep + 1)}>
                      Next
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            className="acey-bubble__close"
            aria-label={bubble.kind === 'tutorial' ? 'Close tour' : 'Dismiss message'}
            onClick={bubble.kind === 'tutorial' ? () => finishTutorial('skipped') : hideBubble}
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="acey-companion__body">
        {!tutorialActive && (
          <div className="acey-companion__tools">
            <button
              type="button"
              className="acey-companion__menu-toggle"
              aria-label="Acey options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <FaEllipsisH aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="acey-menu" role="menu">
                <Link role="menuitem" to="/customize-acey" onClick={() => setMenuOpen(false)}>Customize Acey</Link>
                <button type="button" role="menuitem" onClick={() => goToStep(0)}>Show me around</button>
                <button type="button" role="menuitem" onClick={toggleTips}>
                  {preferences.bubblesEnabled ? 'Pause tips' : 'Turn tips back on'}
                </button>
                <button type="button" role="menuitem" onClick={toggleMinimized}>
                  {preferences.minimized ? 'Expand Acey' : 'Minimize Acey'}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="acey-companion__avatar"
          onClick={handleAvatarClick}
          aria-label={minimized ? 'Open Acey' : 'Talk to Acey'}
        >
          <AceyAvatar appearance={appearance} reaction={reaction} />
        </button>
      </div>
    </aside>
  );
};

const AceyCompanion = () => {
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    isProblemViewVisible,
    problemDisplayMode,
  } = useAppContext();
  const { pathname } = useLocation();

  if (!isAuthenticated || isAuthLoading || !user?.id || !shouldShowCompanion(pathname)) return null;

  return (
    <AceyCompanionPanel
      key={user.id}
      userId={user.id}
      pathname={pathname}
      problemView={{ isProblemViewVisible, problemDisplayMode }}
    />
  );
};

export default AceyCompanion;
