import {
  OUTFITS,
  POSED_VARIANTS,
  REACTIONS,
  REACTION_DURATIONS,
  getOutfitAccessories,
  resolveOutfitVariant,
} from './mascotCatalog';
import { ACEY_REACTIONS } from '../acey/aceyBrain';

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
  it('only uses corrected re-exports and keeps every other role in its approved garment', () => {
    expect(Object.keys(POSED_VARIANTS)).toEqual(['wizard', 'hoodie']);
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
    OUTFITS.filter((outfit) => !['wizard', 'hoodie'].includes(outfit.id)).forEach((outfit) => {
      expect(resolveOutfitVariant(outfit, true)).toBe(outfit);
    });
  });

  it('uses a posed character for a role once one is registered', () => {
    const doctor = byId('doctor');
    POSED_VARIANTS.doctor = { url: '/mascot/poses/healthcare.glb', label: 'Stethoscope & clipboard' };
    try {
      expect(resolveOutfitVariant(doctor, true)).toMatchObject({
        id: 'doctor',
        url: '/mascot/poses/healthcare.glb',
        fullCharacter: true,
        variant: 'posed',
        modelOffsetY: 0,
      });
      expect(resolveOutfitVariant(doctor, false)).toBe(doctor);
      expect(getOutfitAccessories(doctor)).toEqual({ label: 'Stethoscope & clipboard', builtIn: false });
    } finally {
      delete POSED_VARIANTS.doctor;
    }
  });

  it('describes built-in accessories and roles without accessories', () => {
    expect(getOutfitAccessories(byId('technician'))).toEqual({ label: 'Wrench & power drill', builtIn: true });
    expect(getOutfitAccessories(byId('doctor'))).toBeNull();
    expect(getOutfitAccessories(byId('wizard'))).toEqual({ label: 'Magic wand & spell book', builtIn: false });
    expect(getOutfitAccessories(byId('hoodie'))).toEqual({ label: 'Headphones & game controller', builtIn: false });
    expect(getOutfitAccessories(byId('vest'))).toBeNull();
  });
});
