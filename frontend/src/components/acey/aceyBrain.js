// Acey's context, message and interruption rules. Kept free of React and DOM
// access so the "never gets in the way" behaviour can be unit tested directly.

export const ACEY_CONTEXTS = {
  DASHBOARD: 'dashboard',
  UPLOAD: 'upload',
  HINTS: 'hints',
  CONCEPTS: 'concepts',
  SOLUTION: 'solution',
  TUTOR: 'tutor',
  NOTES: 'notes',
  STUDY: 'study',
  CUSTOMIZE: 'customize',
};

// Reactions map onto the 3D companion's motion clips.
export const ACEY_REACTIONS = {
  HELLO: 'hello',
  FOCUS: 'focus',
  THINK: 'think',
  CELEBRATE: 'celebrate',
  ENCOURAGE: 'encourage',
  REST: 'rest',
};

const ROUTE_CONTEXTS = [
  ['/solve-problems', ACEY_CONTEXTS.UPLOAD],
  ['/tutor', ACEY_CONTEXTS.TUTOR],
  ['/notes-hub', ACEY_CONTEXTS.NOTES],
  ['/study-mode', ACEY_CONTEXTS.STUDY],
  ['/concept-notes', ACEY_CONTEXTS.CONCEPTS],
  ['/customize-acey', ACEY_CONTEXTS.CUSTOMIZE],
  ['/dashboard', ACEY_CONTEXTS.DASHBOARD],
];

const DISPLAY_MODE_CONTEXTS = {
  hints: ACEY_CONTEXTS.HINTS,
  concepts: ACEY_CONTEXTS.CONCEPTS,
  solution: ACEY_CONTEXTS.SOLUTION,
};

export const getAceyContext = (pathname = '/', problemView = {}) => {
  if (pathname === '/') return ACEY_CONTEXTS.DASHBOARD;
  const match = ROUTE_CONTEXTS.find(([prefix]) => pathname.startsWith(prefix));
  const context = match ? match[1] : null;

  // The problem page is one route with several learning views. Once a problem
  // is open, Acey follows the view the learner is actually reading.
  if (context === ACEY_CONTEXTS.UPLOAD && problemView.isProblemViewVisible) {
    return DISPLAY_MODE_CONTEXTS[problemView.problemDisplayMode] || ACEY_CONTEXTS.UPLOAD;
  }
  return context;
};

export const CONTEXT_MESSAGES = {
  [ACEY_CONTEXTS.DASHBOARD]: [
    { id: 'dashboard-ready', text: 'Hey! Ready to study? 👋', reaction: ACEY_REACTIONS.HELLO },
    { id: 'dashboard-today', text: 'What should we work on today?', reaction: ACEY_REACTIONS.HELLO },
  ],
  [ACEY_CONTEXTS.UPLOAD]: [
    { id: 'upload-guide', text: 'Got a tricky problem? You can upload a photo or type it here!', reaction: ACEY_REACTIONS.THINK },
  ],
  [ACEY_CONTEXTS.HINTS]: [
    { id: 'hints-together', text: "Let's figure this out together. Try each step before the next hint.", reaction: ACEY_REACTIONS.THINK },
  ],
  [ACEY_CONTEXTS.CONCEPTS]: [
    { id: 'concepts-big-idea', text: 'These notes explain the big idea behind the problem. Take them one at a time.', reaction: ACEY_REACTIONS.FOCUS },
  ],
  [ACEY_CONTEXTS.SOLUTION]: [
    { id: 'solution-why', text: 'Follow why each step works, not just the final answer. You can ask me about any step!', reaction: ACEY_REACTIONS.FOCUS },
  ],
  [ACEY_CONTEXTS.TUTOR]: [
    { id: 'tutor-ask', text: 'You can ask me anything about this problem!', reaction: ACEY_REACTIONS.HELLO },
  ],
  [ACEY_CONTEXTS.NOTES]: [
    { id: 'notes-home', text: 'This is where all your saved notes live!', reaction: ACEY_REACTIONS.HELLO },
    { id: 'notes-review', text: 'Reviewing one saved note today keeps it fresh for the exam.', reaction: ACEY_REACTIONS.FOCUS },
  ],
  [ACEY_CONTEXTS.STUDY]: [
    { id: 'study-ready', text: 'Ready to see what you remember? Let’s go! ✨', reaction: ACEY_REACTIONS.FOCUS },
  ],
  [ACEY_CONTEXTS.CUSTOMIZE]: [
    { id: 'customize-look', text: 'Pick my look and mood. I’ll keep it on every page!', reaction: ACEY_REACTIONS.CELEBRATE },
  ],
};

export const EVENT_MESSAGES = {
  'problem-uploaded': {
    id: 'event-problem-uploaded',
    text: 'I found your problem! How do you want to solve it? Try a step-by-step hint, concept notes, or the full solution.',
    reaction: ACEY_REACTIONS.THINK,
    highlight: 'learning-options',
  },
  'hint-requested': { id: 'event-hint-requested', text: "Let's figure this out together.", reaction: ACEY_REACTIONS.THINK },
  'concepts-requested': { id: 'event-concepts-requested', text: 'Good call. Understanding the idea makes the steps easier.', reaction: ACEY_REACTIONS.THINK },
  'solution-ready': { id: 'event-solution-ready', text: 'Here it is! Read each step and see why it works.', reaction: ACEY_REACTIONS.FOCUS },
  'study-started': { id: 'event-study-started', text: "Let's do this!", reaction: ACEY_REACTIONS.FOCUS },
  'practice-ready': { id: 'event-practice-ready', text: 'Your practice set is ready. Pick one and give it a try! ✨', reaction: ACEY_REACTIONS.CELEBRATE },
  'answer-correct': { id: 'event-answer-correct', text: 'You got it! 🎉', reaction: ACEY_REACTIONS.CELEBRATE },
  'answer-incorrect': { id: 'event-answer-incorrect', text: "That's okay! Let's try another way.", reaction: ACEY_REACTIONS.ENCOURAGE },
  'problem-completed': { id: 'event-problem-completed', text: 'Nice work! Want to try another one?', reaction: ACEY_REACTIONS.CELEBRATE },
  'item-saved': { id: 'event-item-saved', text: "Saved! You'll find it in your Notes Hub.", reaction: ACEY_REACTIONS.CELEBRATE },
  'request-failed': { id: 'event-request-failed', text: "That's okay! Let's try another way.", reaction: ACEY_REACTIONS.ENCOURAGE },
  'question-asked': { id: 'event-question-asked', text: 'Great question. Let’s work through it.', reaction: ACEY_REACTIONS.THINK },
  'long-session': { id: 'event-long-session', text: "You've been working hard. Want to take a little break?", reaction: ACEY_REACTIONS.REST, ambient: true },
  idle: { id: 'event-idle', text: "I'm ready whenever you are! 👋", reaction: ACEY_REACTIONS.HELLO, ambient: true },
  // Shown once to learners who finished the tour before customization existed.
  'customize-intro': {
    id: 'event-customize-intro',
    text: 'New! You can pick my outfit, accessories and mood. Tap “Customize Acey” to make me yours! ✨',
    reaction: ACEY_REACTIONS.CELEBRATE,
    highlight: 'customize-acey',
    cta: 'customize',
  },
};

export const TUTORIAL_STEPS = [
  { id: 'intro', text: "Hi! I'm Acey 👋 I'll show you around!", reaction: ACEY_REACTIONS.HELLO, route: '/dashboard' },
  { id: 'upload', text: "First, you can upload any AP STEM problem you're stuck on.", reaction: ACEY_REACTIONS.FOCUS, route: '/solve-problems', target: 'upload-problem' },
  { id: 'learn', text: 'Then, you can choose how you want to learn: step-by-step hints, concept notes, or the full solution.', reaction: ACEY_REACTIONS.THINK, route: '/solve-problems', target: 'learning-options' },
  { id: 'notes', text: 'You can also save useful explanations to your Notes Hub!', reaction: ACEY_REACTIONS.FOCUS, target: 'notes-hub' },
  { id: 'customize', text: 'Want to make me yours? Pick my outfit, accessories and mood here! ✨', reaction: ACEY_REACTIONS.CELEBRATE, route: '/dashboard', target: 'customize-acey' },
  { id: 'done', text: "That's it! I'm here whenever you need me. 💜", reaction: ACEY_REACTIONS.CELEBRATE },
];

// Automatic messages (greetings, idle, break reminders) are the ones that can
// feel like pop-ups, so they get long gaps. Reactions answer something the
// learner just did and may appear sooner, but never back-to-back.
// Page-entry tips sit in between: each feature may introduce itself once per
// visit, but not the moment another bubble has just closed.
export const GATE_RULES = {
  typingQuietMs: 8000,
  ambientGapMs: 90 * 1000,
  contextGapMs: 20 * 1000,
  reactionGapMs: 12 * 1000,
  ambientRepeatMs: 6 * 60 * 60 * 1000,
  contextRepeatMs: 8 * 60 * 60 * 1000,
  reactionRepeatMs: 2 * 60 * 1000,
  burstWindowMs: 10 * 60 * 1000,
  maxBubblesPerWindow: 5,
  idleAfterMs: 4 * 60 * 1000,
  idleRepeatMs: 30 * 60 * 1000,
  longSessionMs: 45 * 60 * 1000,
  autoHideMs: 7000,
};

export const createHistory = () => ({ lastShownAt: 0, byId: {}, shownAt: [] });

export const normalizeHistory = (value) => {
  const history = value && typeof value === 'object' ? value : {};
  return {
    lastShownAt: Number.isFinite(history.lastShownAt) ? history.lastShownAt : 0,
    byId: history.byId && typeof history.byId === 'object' ? history.byId : {},
    shownAt: Array.isArray(history.shownAt) ? history.shownAt.filter(Number.isFinite) : [],
  };
};

/**
 * Decide whether a bubble may appear right now.
 * kind: 'ambient' | 'reaction' | 'tutorial' | 'manual'
 */
export const canShowBubble = ({
  message,
  kind,
  now,
  history,
  lastTypingAt = 0,
  minimized = false,
  bubblesEnabled = true,
  tutorialActive = false,
  rules = GATE_RULES,
}) => {
  if (!message) return false;
  // The learner asked (clicked Acey) or is inside the tour they started.
  if (kind === 'manual' || kind === 'tutorial') return true;
  if (tutorialActive || minimized || !bubblesEnabled) return false;
  if (now - lastTypingAt < rules.typingQuietMs) return false;

  const safeHistory = normalizeHistory(history);
  const recent = safeHistory.shownAt.filter((time) => now - time < rules.burstWindowMs);
  if (recent.length >= rules.maxBubblesPerWindow) return false;

  const gap = {
    ambient: rules.ambientGapMs,
    context: rules.contextGapMs,
  }[kind] ?? rules.reactionGapMs;
  if (now - safeHistory.lastShownAt < gap) return false;

  const repeatWindow = message.id === EVENT_MESSAGES.idle.id
    ? rules.idleRepeatMs
    : {
      ambient: rules.ambientRepeatMs,
      context: rules.contextRepeatMs,
    }[kind] ?? rules.reactionRepeatMs;
  const lastForMessage = safeHistory.byId[message.id];
  if (!Number.isFinite(lastForMessage)) return true;
  return now - lastForMessage >= repeatWindow;
};

export const recordBubble = (history, message, now) => {
  const safeHistory = normalizeHistory(history);
  return {
    lastShownAt: now,
    byId: { ...safeHistory.byId, [message.id]: now },
    // Only the burst window matters, so the stored history stays tiny.
    shownAt: [...safeHistory.shownAt.filter((time) => now - time < GATE_RULES.burstWindowMs), now],
  };
};

// Prefer the variant shown least recently so the same line is not repeated.
export const pickContextMessage = (context, history) => {
  const options = CONTEXT_MESSAGES[context] || [];
  if (!options.length) return null;
  const safeHistory = normalizeHistory(history);
  return [...options].sort(
    (first, second) => (safeHistory.byId[first.id] || 0) - (safeHistory.byId[second.id] || 0)
  )[0];
};

export const shouldAutoStartTutorial = (profile) => !profile?.onboarding?.status;
