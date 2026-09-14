import {
  OUTFITS,
  POSED_VARIANTS,
  getOutfitAccessories,
  resolveOutfitVariant,
} from './mascotCatalog';

const byId = (id) => OUTFITS.find((outfit) => outfit.id === id);

describe('designer poses with accessories', () => {
  it('uses the posed character while accessories are on', () => {
    const posed = resolveOutfitVariant(byId('doctor'), true);
    expect(posed).toMatchObject({
      id: 'doctor',
      label: 'Healthcare',
      url: POSED_VARIANTS.doctor.url,
      fullCharacter: true,
      variant: 'posed',
      modelOffsetY: 0,
    });
  });

  it('keeps the calibrated garment when accessories are off or not delivered yet', () => {
    expect(resolveOutfitVariant(byId('doctor'), false)).toBe(byId('doctor'));
    expect(resolveOutfitVariant(byId('classic'), true)).toBe(byId('classic'));
  });

  it('describes each role’s accessories', () => {
    expect(getOutfitAccessories(byId('technician'))).toEqual({ label: 'Wrench & power drill', builtIn: true });
    expect(getOutfitAccessories(byId('doctor'))).toEqual({ label: 'Stethoscope & clipboard', builtIn: false });
    expect(getOutfitAccessories(byId('wizard'))).toBeNull();
  });

  it('only offers posed variants for known roles', () => {
    Object.keys(POSED_VARIANTS).forEach((id) => {
      expect(byId(id)).toBeDefined();
      expect(POSED_VARIANTS[id].url).toMatch(/^\/mascot\/poses\/.+\.glb$/);
    });
  });
});
