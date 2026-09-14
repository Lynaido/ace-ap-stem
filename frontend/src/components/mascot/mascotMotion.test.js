import { blendMoodMotion, getMoodMotion, stepMoodWeights } from './mascotMotion';
import { MOODS } from './mascotCatalog';

describe('mood idle motion', () => {
  it('has a motion for every selectable mood', () => {
    MOODS.forEach((mood) => {
      const motion = getMoodMotion(mood.id, 1.3);
      expect(Number.isFinite(motion.y) && Number.isFinite(motion.tilt) && Number.isFinite(motion.turn)).toBe(true);
    });
  });

  it('makes each mood visibly different from Ready', () => {
    const range = (moodId, key) => {
      const values = Array.from({ length: 200 }, (_, index) => getMoodMotion(moodId, index * 0.05)[key]);
      return Math.max(...values) - Math.min(...values);
    };
    // Curious looks around; Cheerful hops.
    expect(range('curious', 'turn')).toBeGreaterThan(range('ready', 'turn') + 0.2);
    expect(range('cheerful', 'y')).toBeGreaterThan(range('ready', 'y') * 1.2);
  });

  it('keeps only a still posture when motion is reduced', () => {
    expect(getMoodMotion('cheerful', 0.4, true)).toEqual(getMoodMotion('cheerful', 2.1, true));
    expect(getMoodMotion('curious', 3, true).tilt).toBeGreaterThan(0);
  });

  it('eases between moods instead of snapping', () => {
    let weights = { ready: 1, curious: 0, cheerful: 0 };
    weights = stepMoodWeights(weights, 'cheerful');
    expect(weights.cheerful).toBeGreaterThan(0);
    expect(weights.cheerful).toBeLessThan(1);
    for (let frame = 0; frame < 400; frame += 1) weights = stepMoodWeights(weights, 'cheerful');
    expect(weights).toEqual({ ready: 0, curious: 0, cheerful: 1 });
    expect(blendMoodMotion(weights, 0.7)).toEqual(getMoodMotion('cheerful', 0.7));
    expect(stepMoodWeights(weights, 'unknown', 1)).toEqual({ ready: 1, curious: 0, cheerful: 0 });
  });
});
