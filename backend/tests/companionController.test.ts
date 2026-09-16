import {
  mergeCompanionProfile,
  normalizeCompanionProfile,
  updateCompanionSchema,
} from '../src/controllers/companionController';

describe('companion profile validation', () => {
  it('accepts a brain color and a name for Acey', () => {
    expect(updateCompanionSchema.parse({ appearance: { colorId: 'mint', name: '  Nova   Star ' } }))
      .toEqual({ appearance: { colorId: 'mint', name: 'Nova Star' } });
    expect(updateCompanionSchema.parse({ appearance: { name: 'Bé Ốc' } }).appearance?.name).toBe('Bé Ốc');
    // An empty name restores the default.
    expect(updateCompanionSchema.parse({ appearance: { name: '   ' } }).appearance?.name).toBe('');
  });

  it('rejects names that are too long or contain markup', () => {
    expect(() => updateCompanionSchema.parse({ appearance: { name: 'A'.repeat(21) } })).toThrow();
    expect(() => updateCompanionSchema.parse({ appearance: { name: '<b>Acey</b>' } })).toThrow();
    expect(() => updateCompanionSchema.parse({ appearance: { colorId: 'Hot Pink!' } })).toThrow();
  });
});

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
