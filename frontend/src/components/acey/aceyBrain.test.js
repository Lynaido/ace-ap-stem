import {
  ACEY_CONTEXTS,
  CONTEXT_MESSAGES,
  EVENT_MESSAGES,
  GATE_RULES,
  TUTORIAL_STEPS,
  canShowBubble,
  createHistory,
  getAceyContext,
  normalizeHistory,
  pickContextMessage,
  recordBubble,
  shouldAutoStartTutorial,
} from './aceyBrain';

const NOW = 10_000_000;
const greeting = CONTEXT_MESSAGES[ACEY_CONTEXTS.DASHBOARD][0];
const hint = EVENT_MESSAGES['hint-requested'];

describe('getAceyContext', () => {
  it('maps each workspace route to its Acey context', () => {
    expect(getAceyContext('/')).toBe(ACEY_CONTEXTS.DASHBOARD);
    expect(getAceyContext('/dashboard')).toBe(ACEY_CONTEXTS.DASHBOARD);
    expect(getAceyContext('/solve-problems')).toBe(ACEY_CONTEXTS.UPLOAD);
    expect(getAceyContext('/tutor')).toBe(ACEY_CONTEXTS.TUTOR);
    expect(getAceyContext('/notes-hub')).toBe(ACEY_CONTEXTS.NOTES);
    expect(getAceyContext('/study-mode')).toBe(ACEY_CONTEXTS.STUDY);
    expect(getAceyContext('/customize-acey')).toBe(ACEY_CONTEXTS.CUSTOMIZE);
    expect(getAceyContext('/faq')).toBeNull();
  });

  it('follows the learning view that is open on the problem page', () => {
    const open = (problemDisplayMode) => getAceyContext('/solve-problems', {
      isProblemViewVisible: true,
      problemDisplayMode,
    });
    expect(open('hints')).toBe(ACEY_CONTEXTS.HINTS);
    expect(open('concepts')).toBe(ACEY_CONTEXTS.CONCEPTS);
    expect(open('solution')).toBe(ACEY_CONTEXTS.SOLUTION);
    expect(getAceyContext('/solve-problems', { isProblemViewVisible: false, problemDisplayMode: 'hints' }))
      .toBe(ACEY_CONTEXTS.UPLOAD);
  });
});

describe('canShowBubble', () => {
  const base = { now: NOW, history: createHistory() };

  it('always allows bubbles the learner asked for', () => {
    expect(canShowBubble({ ...base, message: greeting, kind: 'manual', minimized: true, lastTypingAt: NOW })).toBe(true);
    expect(canShowBubble({ ...base, message: TUTORIAL_STEPS[0], kind: 'tutorial', bubblesEnabled: false })).toBe(true);
  });

  it('stays quiet while the learner is typing, minimized Acey, or muted bubbles', () => {
    expect(canShowBubble({ ...base, message: hint, kind: 'reaction', lastTypingAt: NOW - 1000 })).toBe(false);
    expect(canShowBubble({ ...base, message: hint, kind: 'reaction', minimized: true })).toBe(false);
    expect(canShowBubble({ ...base, message: hint, kind: 'reaction', bubblesEnabled: false })).toBe(false);
    expect(canShowBubble({ ...base, message: hint, kind: 'reaction', tutorialActive: true })).toBe(false);
    expect(canShowBubble({
      ...base, message: hint, kind: 'reaction', lastTypingAt: NOW - GATE_RULES.typingQuietMs,
    })).toBe(true);
  });

  it('keeps a long gap before automatic messages', () => {
    const history = recordBubble(createHistory(), hint, NOW - 30 * 1000);
    expect(canShowBubble({ now: NOW, history, message: greeting, kind: 'ambient' })).toBe(false);
    expect(canShowBubble({ now: NOW, history, message: EVENT_MESSAGES['item-saved'], kind: 'reaction' })).toBe(true);
  });

  it('lets each feature introduce itself once, shortly after the last bubble', () => {
    const upload = CONTEXT_MESSAGES[ACEY_CONTEXTS.UPLOAD][0];
    const history = recordBubble(createHistory(), greeting, NOW - 5000);
    expect(canShowBubble({ now: NOW, history, message: upload, kind: 'context' })).toBe(false);
    const later = NOW + GATE_RULES.contextGapMs;
    expect(canShowBubble({ now: later, history, message: upload, kind: 'context' })).toBe(true);
    const shown = recordBubble(history, upload, later);
    expect(canShowBubble({ now: later + GATE_RULES.ambientGapMs, history: shown, message: upload, kind: 'context' }))
      .toBe(false);
  });

  it('does not repeat the same message too often', () => {
    const history = recordBubble(createHistory(), greeting, NOW - GATE_RULES.ambientGapMs - 1);
    expect(canShowBubble({ now: NOW, history, message: greeting, kind: 'ambient' })).toBe(false);
    const later = NOW + GATE_RULES.ambientRepeatMs;
    expect(canShowBubble({ now: later, history, message: greeting, kind: 'ambient' })).toBe(true);
  });

  it('caps the number of bubbles in a short period', () => {
    let history = createHistory();
    for (let index = 0; index < GATE_RULES.maxBubblesPerWindow; index += 1) {
      history = recordBubble(history, { id: `message-${index}` }, NOW - (index + 1) * 60 * 1000);
    }
    history = { ...history, lastShownAt: NOW - 60 * 1000 };
    expect(canShowBubble({ now: NOW, history, message: EVENT_MESSAGES['item-saved'], kind: 'reaction' })).toBe(false);
  });
});

describe('message helpers', () => {
  it('rotates to the variant shown least recently', () => {
    const [first, second] = CONTEXT_MESSAGES[ACEY_CONTEXTS.DASHBOARD];
    const history = recordBubble(createHistory(), first, NOW);
    expect(pickContextMessage(ACEY_CONTEXTS.DASHBOARD, history).id).toBe(second.id);
    expect(pickContextMessage('unknown', history)).toBeNull();
  });

  it('recovers from corrupted stored history', () => {
    expect(normalizeHistory('broken')).toEqual(createHistory());
    expect(normalizeHistory({ lastShownAt: 'x', byId: null, shownAt: [1, 'x'] }))
      .toEqual({ lastShownAt: 0, byId: {}, shownAt: [1] });
  });

  it('starts the tour only for learners who have not finished or dismissed it', () => {
    expect(shouldAutoStartTutorial(null)).toBe(true);
    expect(shouldAutoStartTutorial({ onboarding: null })).toBe(true);
    expect(shouldAutoStartTutorial({ onboarding: { status: 'skipped' } })).toBe(false);
    expect(shouldAutoStartTutorial({ onboarding: { status: 'completed' } })).toBe(false);
  });

  it('covers every tour step the brief asked for', () => {
    expect(TUTORIAL_STEPS.map((step) => step.target).filter(Boolean))
      .toEqual(['upload-problem', 'learning-options', 'notes-hub']);
  });
});
