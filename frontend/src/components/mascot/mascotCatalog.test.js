import {
  COLORS,
  DEFAULT_BUDDY_NAME,
  DEFAULT_COLOR_ID,
  OUTFITS,
  POSED_VARIANTS,
  PROP_SETS,
  REACTIONS,
  REACTION_DURATIONS,
  getBrainBlend,
  getBrainTint,
  getBuddyName,
  getOutfitAccessories,
  normalizeBuddyName,
  resolveOutfitVariant,
} from './mascotCatalog';
import { ACEY_REACTIONS } from '../acey/aceyBrain';
import { normalizeAppearance } from '../acey/AceyContext';

describe('brain colors and buddy name', () => {
  it('offers distinct colors with the Dreamy blend first, as the default', () => {
    expect(COLORS[0].id).toBe(DEFAULT_COLOR_ID);
    expect(DEFAULT_COLOR_ID).toBe('dreamy');
    expect(getBrainTint('lavender')).toBeNull();
    expect(new Set(COLORS.map((color) => color.id)).size).toBe(COLORS.length);
    // Lavender is the model's own brain; every other color is one tint or a blend.
    COLORS.filter((color) => !color.blend && color.id !== 'lavender')
      .forEach((color) => expect(getBrainTint(color.id)).toMatch(/^#[0-9a-f]{6}$/));
    expect(getBrainTint('unknown')).toBeNull();
    expect(getBrainBlend('dreamy')).toEqual([expect.stringMatching(/^#[0-9a-f]{6}$/), expect.any(String), expect.any(String)]);
    expect(getBrainTint('dreamy')).toBeNull();
    expect(getBrainBlend('lavender')).toBeNull();
  });

  it('keeps names short and plain, falling back to Acey', () => {
    expect(normalizeBuddyName('  Nova   Star ')).toBe('Nova Star');
    expect(normalizeBuddyName('Bé Ốc')).toBe('Bé Ốc');
    expect(normalizeBuddyName('<b>Hi</b>')).toBe('');
    expect(normalizeBuddyName('A'.repeat(21))).toBe('');
    expect(getBuddyName({ name: '' })).toBe(DEFAULT_BUDDY_NAME);
    expect(getBuddyName({ name: 'Pixel' })).toBe('Pixel');
  });

  it('normalizes saved appearance with a color and a name', () => {
    expect(normalizeAppearance({ outfitId: 'doctor', colorId: 'mint', name: ' Pixel ' })).toMatchObject({
      outfitId: 'doctor', colorId: 'mint', name: 'Pixel',
    });
    expect(normalizeAppearance({ colorId: 'neon', name: 42 })).toMatchObject({ colorId: DEFAULT_COLOR_ID, name: '' });
  });

  it('knows which materials form the brain on designer characters', () => {
    expect(resolveOutfitVariant(OUTFITS.find((outfit) => outfit.id === 'hoodie'), true).brainMaterials).toEqual(['Material.002']);
    expect(resolveOutfitVariant(OUTFITS.find((outfit) => outfit.id === 'wizard'), true).brainMaterials).toEqual(['toc']);
  });
});

describe('study reactions', () => {
  it('previews exactly the reactions Acey plays while studying', () => {
    expect(REACTIONS.map((reaction) => reaction.id).sort()).toEqual(Object.values(ACEY_REACTIONS).sort());
    REACTIONS.forEach((reaction) => {
      expect(reaction.duration).toBeGreaterThan(1);
      expect(REACTION_DURATIONS[reaction.id]).toBe(reaction.duration);
      expect(reaction.when).toBeTruthy();
    });
  });
});

const byId = (id) => OUTFITS.find((outfit) => outfit.id === id);

describe('designer poses with accessories', () => {
  it('uses matching posed characters and keeps every other role in its approved garment', () => {
    expect(Object.keys(POSED_VARIANTS)).toEqual(['classic', 'doctor', 'activewear', 'artist', 'cloak', 'wizard', 'hoodie']);
    expect(resolveOutfitVariant(byId('wizard'), true)).toMatchObject({
      url: '/mascot/poses/wizard.glb',
      fullCharacter: true,
      variant: 'posed',
    });
    expect(resolveOutfitVariant(byId('wizard'), false)).toBe(byId('wizard'));
    expect(resolveOutfitVariant(byId('hoodie'), true)).toMatchObject({
      url: '/mascot/poses/hoodie.glb',
      fullCharacter: true,
      variant: 'posed',
    });
    expect(resolveOutfitVariant(byId('hoodie'), false)).toBe(byId('hoodie'));
    expect(resolveOutfitVariant(byId('classic'), true)).toMatchObject({
      url: '/mascot/poses/engineer.glb',
      fullCharacter: true,
      variant: 'posed',
    });
    expect(byId('singer')).toMatchObject({ url: '/mascot/poses/singer.glb', fullCharacter: true });
    expect(byId('singer').hold.left.grip.meshes).toEqual(['Prongs_low_Microphone_0']);
    expect(resolveOutfitVariant(byId('activewear'), true)).toMatchObject({ label: 'Fashion', url: '/mascot/poses/fashion.glb' });
    expect(resolveOutfitVariant(byId('doctor'), true)).toMatchObject({ url: '/mascot/poses/healthcare.glb' });
    expect(resolveOutfitVariant(byId('original'), true)).toBe(byId('original'));
  });

  it('gives every role accessories, with props on the approved garment where no matching pose exists', () => {
    OUTFITS.filter((outfit) => !outfit.plain).forEach((outfit) => expect(getOutfitAccessories(outfit)).not.toBeNull());
    expect(getOutfitAccessories(byId('original'))).toBeNull();
    expect(Object.keys(PROP_SETS).sort()).toEqual(
      OUTFITS.filter((outfit) => !outfit.plain && !outfit.accessories && !POSED_VARIANTS[outfit.id]).map((outfit) => outfit.id).sort()
    );
    Object.entries(PROP_SETS).forEach(([id, set]) => {
      const outfit = byId(id);
      const shown = resolveOutfitVariant(outfit, true);
      expect(shown).toMatchObject({ id, url: outfit.url, props: set, variant: 'props' });
      expect(shown.fullCharacter).toBeFalsy();
      expect(set.url).toBe(`/mascot/props/${id}.glb`);
      expect(resolveOutfitVariant(outfit, false)).toBe(outfit);
    });
  });

  it('uses a posed character for a role once one is registered', () => {
    // Business has no posed character yet; register one for this test only.
    const business = byId('vest');
    POSED_VARIANTS.vest = { url: '/mascot/poses/business.glb', label: 'Briefcase & coffee mug' };
    try {
      expect(resolveOutfitVariant(business, true)).toMatchObject({
        id: 'vest',
        url: '/mascot/poses/business.glb',
        fullCharacter: true,
        variant: 'posed',
        modelOffsetY: 0,
      });
      expect(resolveOutfitVariant(business, false)).toBe(business);
      expect(getOutfitAccessories(business)).toEqual({ label: 'Briefcase & coffee mug', builtIn: false });
    } finally {
      delete POSED_VARIANTS.vest;
    }
  });

  it('describes built-in accessories and roles without accessories', () => {
    expect(getOutfitAccessories(byId('classic'))).toEqual({ label: 'Wrench & power drill', builtIn: false });
    expect(getOutfitAccessories(byId('doctor'))).toEqual({ label: 'Stethoscope & clipboard', builtIn: false });
    expect(getOutfitAccessories(byId('wizard'))).toEqual({ label: 'Magic wand & spell book', builtIn: false });
    expect(getOutfitAccessories(byId('hoodie'))).toEqual({ label: 'Headphones & game controller', builtIn: false });
    expect(getOutfitAccessories(byId('vest'))).toEqual({ label: 'Briefcase & coffee mug', builtIn: false });
  });
});
