import {
  mergeCompanionProfile,
  normalizeCompanionProfile,
} from '../src/controllers/companionController';

describe('companion profile helpers', () => {
  const now = new Date('2026-09-13T10:00:00.000Z');

  it('returns empty defaults for users who never customized Acey', () => {
    expect(normalizeCompanionProfile(null)).toEqual({
      appearance: {},
      preferences: {},
      onboarding: null,
      updatedAt: null,
    });
    expect(normalizeCompanionProfile('corrupted')).toEqual(normalizeCompanionProfile(null));
  });

  it('merges each section without erasing the others', () => {
    const current = normalizeCompanionProfile({
      appearance: { outfitId: 'classic', moodId: 'ready' },
      preferences: { minimized: true },
      onboarding: { status: 'completed', updatedAt: '2026-09-01T00:00:00.000Z' },
    });

    const merged = mergeCompanionProfile(current, { appearance: { moodId: 'cheerful' } }, now);

    expect(merged.appearance).toEqual({ outfitId: 'classic', moodId: 'cheerful' });
    expect(merged.preferences).toEqual({ minimized: true });
    expect(merged.onboarding).toEqual(current.onboarding);
    expect(merged.updatedAt).toBe(now.toISOString());
  });

  it('records when onboarding was finished, skipped or dismissed', () => {
    const merged = mergeCompanionProfile(
      normalizeCompanionProfile(null),
      { onboarding: { status: 'dismissed' } },
      now
    );
    expect(merged.onboarding).toEqual({ status: 'dismissed', updatedAt: now.toISOString() });
  });
});
