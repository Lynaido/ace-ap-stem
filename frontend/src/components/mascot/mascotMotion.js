// Three.js-free idle motion for each mood. The motion moves the whole
// character, so a mood is visible on every role, including complete designer
// characters whose faces cannot be reshaped at runtime.

const MOOD_MOTION = {
  // Calm, steady breathing.
  ready: (t) => ({
    y: Math.sin(t * 1.1) * 0.018,
    tilt: Math.sin(t * 0.68) * 0.008,
    turn: 0,
  }),
  // Leans in with a head tilt and slowly looks from side to side.
  curious: (t) => ({
    y: Math.sin(t * 0.8) * 0.012,
    tilt: 0.055 + Math.sin(t * 0.5) * 0.012,
    turn: Math.sin(t * 0.45) * 0.16,
  }),
  // Small, happy hops with a light sway.
  cheerful: (t) => ({
    y: Math.abs(Math.sin(t * 2.3)) * 0.05,
    tilt: Math.sin(t * 2.3) * 0.022,
    turn: Math.sin(t * 1.15) * 0.05,
  }),
};

// Reduced motion keeps only each mood's resting posture.
const MOOD_POSTURE = {
  ready: { y: 0, tilt: 0, turn: 0 },
  curious: { y: 0, tilt: 0.055, turn: 0.08 },
  cheerful: { y: 0.012, tilt: 0, turn: 0 },
};

export const MOOD_IDS = Object.keys(MOOD_MOTION);

export const getMoodMotion = (moodId, elapsed, reduceMotion = false) => {
  if (reduceMotion) return { ...(MOOD_POSTURE[moodId] || MOOD_POSTURE.ready) };
  return (MOOD_MOTION[moodId] || MOOD_MOTION.ready)(elapsed);
};

// Blends mood motions by weight so switching moods eases in instead of
// snapping the character to a new position.
export const blendMoodMotion = (weights, elapsed, reduceMotion = false) => {
  const result = { y: 0, tilt: 0, turn: 0 };
  let total = 0;
  Object.entries(weights).forEach(([moodId, weight]) => {
    if (!(weight > 0)) return;
    const motion = getMoodMotion(moodId, elapsed, reduceMotion);
    result.y += motion.y * weight;
    result.tilt += motion.tilt * weight;
    result.turn += motion.turn * weight;
    total += weight;
  });
  if (!total) return getMoodMotion('ready', elapsed, reduceMotion);
  return { y: result.y / total, tilt: result.tilt / total, turn: result.turn / total };
};

export const stepMoodWeights = (weights, moodId, rate = 0.06) => Object.fromEntries(
  MOOD_IDS.map((id) => {
    const current = weights[id] || 0;
    const target = id === (MOOD_MOTION[moodId] ? moodId : 'ready') ? 1 : 0;
    const next = current + (target - current) * rate;
    return [id, Math.abs(next - target) < 0.001 ? target : next];
  })
);
