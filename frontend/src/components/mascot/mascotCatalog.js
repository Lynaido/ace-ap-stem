// Three.js-free mascot catalog: outfit calibration, moods, reactions and saved
// preference helpers. Safe to import from app-wide code without loading 3D.

// handOffsetY values compensate for slanted or flared sleeve caps whose
// vertex medians differ from the area-weighted centre of the real opening.
export const OUTFITS = [
  {
    id: 'classic', number: '01', label: 'Engineer', type: 'glb', url: '/mascot/outfits/classic.glb', unitScale: 100,
    modelOffsetY: 11.65,
    // The supplied sleeve root already sits 0.6 units inside the torso.
    // Moving its pivot farther inward makes the resting rotation pull the
    // visible shoulder edge away from the body, so preserve its authored pivot.
    shoulderOverlap: 0,
    // As supplied, the hard hat sits down over the eyes (brim at y=63-68,
    // eyes at y=62-77) and the glasses rims cut through its brim, while the
    // thick scarf crowds the chin. Tip the hat back 14° and lift it so the
    // front brim clears the glasses, and slim the scarf a little.
    gearAdjust: {
      materialName: 'non_quanao_1001',
      hat: { fromY: 55, center: [0, 63, 0], scale: 0.92, pivot: [0, 63, -20], tiltDeg: 14, liftY: 5 },
      collar: { fromY: 31, toY: 50, blendY: 36, shrink: 0.9, dropY: 1.5 },
    },
    // With the hat tipped back, a fringe of brain curls below y=84 shows
    // under the brim; higher curls would bulge past it at the sides.
    headwearHairCutoffY: 84,
    // The short utility shirt ends above the exposed base arm. A tapered
    // fabric shroud follows the arm pivot and overlaps both pieces, keeping
    // the rear shoulder as a sleeve transition rather than a bare tube.
    shoulderShroud: {
      materialName: 'ao_trong_1001', innerX: 8, outerX: 27,
      shoulderRadius: 6.6, cuffRadius: 5.6,
    },
    showBaseArms: true, armPose: { shoulderX: 19, shoulderY: 18.6, outerMin: 24 },
  },
  {
    id: 'doctor', number: '02', label: 'Healthcare', type: 'glb', url: '/mascot/outfits/doctor.glb', unitScale: 100,
    modelOffsetY: 18.84,
    shoulderOverlap: 1.6,
    outfitTint: '#c5e7e1',
    cuffOverlap: 3.4, armPose: { shoulderX: 19, shoulderY: 18.8, outerMin: 45 },
  },
  {
    id: 'long-vest', number: '03', label: 'Scientist', type: 'glb', url: '/mascot/outfits/long-vest.glb', unitScale: 100,
    modelOffsetY: 18.84,
    // Each pink sleeve is a separate supplied mesh whose inner edge begins
    // exactly at x=19.3. Keep the rotation centre on that edge: an inset
    // pivots the edge down and exposes the body at a three-quarter view.
    shoulderOverlap: 0,
    outfitTint: '#c8d0f1',
    cuffOverlap: 3.4, handOffsetY: -2.24,
    armPose: { shoulderX: 19.3, shoulderY: 18.3, outerMin: 43 },
  },
  {
    id: 'vest', number: '04', label: 'Business', type: 'glb', url: '/mascot/outfits/vest.glb', unitScale: 100,
    // The supplied vest ends well below the mascot's chin. Lift the complete
    // garment and its authored shoulder pivots together so the collar, cuffs,
    // hands and action poses remain one connected character.
    modelOffsetY: 17,
    shoulderOverlap: 1.6,
    cuffOverlap: 3.2, armPose: { shoulderX: 18.3, shoulderY: 18.6, outerMin: 45 },
  },
  {
    id: 'artist', number: '05', label: 'Creative', type: 'glb', url: '/mascot/outfits/artist.glb', unitScale: 100,
    modelOffsetY: 17.66,
    // The short-sleeve shoulder has to be cut at its authored outside edge,
    // while its rotation centre stays under the bib. Decoupling those two
    // positions gives the sleeve a real underlap instead of a visible seam
    // at side angles.
    shoulderPivotInset: 1.4,
    shoulderCutOverlap: 0,
    // The beret's opening shows the base hair as pale patches in its inner
    // cavity. The supplied beret also has an open crown, so crop is not
    // sufficient at a top-down camera angle: keep the base hair fully hidden
    // while this fitted hat is selected.
    headwearHairCutoffY: 70,
    hideBaseHair: true,
    // The base body shell extends through the open crown of the supplied
    // beret. Crop only its crown-facing triangles for this outfit; other
    // outfits keep their complete base body.
    headwearBodyCutoffY: 70,
    // The supplied beret includes a disconnected, raised crown fragment that
    // reads as an unintended bump under the preview lights. Its topology is
    // verified below before it is removed; the guard fails closed if 3D sends
    // an updated artist asset.
    removeBeretCrownNub: true,
    // Match the supplied cream artist shirt at the exposed upper arm. This
    // is a real garment-material sleeve cap, not a skin-coloured patch.
    shoulderShroud: {
      materialName: 'lambert14_1001', innerX: 8, outerX: 25,
      shoulderRadius: 6.3, cuffRadius: 5.5,
    },
    showBaseArms: true, armPose: { shoulderX: 19, shoulderY: 18.55, outerMin: 24 },
  },
  {
    id: 'activewear', number: '06', label: 'Singer', type: 'glb', url: '/mascot/outfits/activewear.glb', unitScale: 100,
    modelOffsetY: 16.14,
    // Its continuous top is split into a moving sleeve and fixed torso at
    // runtime. Keep that cut at the asset's outer shoulder edge, but tuck the
    // rotation centre 1.6 units inside the torso. The moving sleeve then stays
    // beneath the torso through the rest pose and all three-quarter rotations.
    shoulderPivotInset: 1.6,
    shoulderCutOverlap: 0,
    outfitTint: '#ecb3cb',
    // The pink top is a connected mesh while the dark bib stays fixed. A
    // moving, open sleeve shroud uses the same source cloth to bridge their
    // joint without leaving a U-shaped socket at the rear shoulder.
    outfitArmShroud: {
      materialName: 'ao_trong', innerX: 13.5, outerX: 31,
      shoulderRadius: 6.2, cuffRadius: 5.55,
    },
    cuffOverlap: 3.2, armPose: { shoulderX: 19, shoulderY: 18.55, outerMin: 45 },
  },
  {
    id: 'cloak', number: '07', label: 'Fashion', type: 'glb', url: '/mascot/outfits/cloak.glb', unitScale: 100,
    // Measured hood peak is 102.46 versus the base-hair peak 116.40.
    // This 15.44 lift supplies a 1.5-unit safety clearance at the crown.
    modelOffsetY: 15.44, integratedHood: 'liftAll',
    shoulderOverlap: 1.4,
    // The hood and coat are one connected mesh. Its inner opening reaches
    // y=70 after the calibrated lift, so no base-brain triangle can show
    // through the hood cavity.
    headwearHairCutoffY: 70,
    outfitTint: '#e8b5d3',
    cuffOverlap: 3.2, armPose: { shoulderX: 16.3, shoulderY: 19.45, outerMin: 45 },
  },
  {
    id: 'graduation', number: '08', label: 'Scholar', type: 'fbx',
    url: '/mascot/outfits/graduation/graduation.fbx', unitScale: 1,
    modelOffsetY: 17,
    shoulderOverlap: 1.6,
    // The mortarboard begins at y=98. A 96 y cutoff leaves a neat fringe
    // below the cap while removing every hair triangle that could poke up.
    headwearHairCutoffY: 96,
    // The supplied gown, cap and tassel share one plain white material. Paint
    // them as in the approved Scholar render: a black gown and cap with a gold
    // tassel (cord and tuft hang at x≈-43, its button tops the cap).
    // The gown is three nested torso layers; the inner two get their own
    // colors so the vest reads as a separate layer under the open gown.
    regionColors: {
      color: '#26262e',
      regions: [
        { color: '#d8a31f', min: [-47, 38, 0.5], max: [-38.5, 60, 9.5] },
        { color: '#d8a31f', min: [-43.5, 88.5, 2.5], max: [-39.2, 93, 6.8] },
      ],
      components: [
        // Tie: the narrow strip down the front.
        { color: '#d8a31f', min: [-4.2, 6.5, 15.5], max: [4.2, 21, 18.5] },
        // Buttons down the vest front.
        { color: '#b98a1c', min: [-0.6, -2.5, 18], max: [0.6, 13, 19.4] },
        // Shirt: the innermost torso layer.
        { color: '#f1f0f6', min: [-22.6, -4.8, -17.8], max: [22.6, 25.4, 17.8] },
        // Vest: the middle layer, between shirt and gown.
        { color: '#555b6b', min: [-23.8, -5.6, -18.8], max: [23.8, 26, 20.3] },
      ],
    },
    cuffOverlap: 3.4, handOffsetY: 3.49,
    armPose: { shoulderX: 21.1, shoulderY: 18.8, outerMin: 45 },
  },
  {
    id: 'hoodie', number: '09', label: 'Cozy', type: 'glb', url: '/mascot/outfits/hoodie.glb', unitScale: 100,
    modelOffsetY: 15.72,
    shoulderOverlap: 1.6,
    outfitTint: '#c8b7e8',
    cuffOverlap: 3.4, armPose: { shoulderX: 16.1, shoulderY: 19.45, outerMin: 45 },
  },
  {
    id: 'wizard', number: '10', label: 'Fantasy', type: 'glb', url: '/mascot/outfits/wizard.glb', unitScale: 100,
    modelOffsetY: 17.12,
    shoulderOverlap: 1.6,
    // The witch-hat brim ends at y=75.1. Keep only the fringe below it so
    // the crown cannot emerge through the pointed hat from any camera angle.
    headwearHairCutoffY: 74.5,
    // The source wizard material is already very dark; blend toward violet
    // instead of multiplying it to preserve a rich, readable fantasy tone.
    outfitTint: '#a25bdf', outfitTintBlend: 0.42,
    cuffOverlap: 3.4, handOffsetY: 5.03,
    armPose: { shoulderX: 15.3, shoulderY: 15.25, outerMin: 45 },
  },
];

// Store pivots in the original asset coordinates, then apply the same lift
// to the clothing and both hand rigs. A rig's split line and its rotation
// centre are normally identical, but a connected garment needs the centre
// tucked inside the torso while keeping the split at the supplied sleeve edge.
// That intentional underlap prevents a background slit at three-quarter views.
export const getOutfitArmPose = (outfit) => {
  const shoulderPivotInset = outfit.shoulderPivotInset ?? outfit.shoulderOverlap ?? 0;
  const shoulderCutOverlap = outfit.shoulderCutOverlap ?? shoulderPivotInset;
  return {
    ...outfit.armPose,
    shoulderX: outfit.armPose.shoulderX - shoulderPivotInset,
    sleeveCutX: outfit.armPose.shoulderX - shoulderCutOverlap,
    shoulderY: outfit.armPose.shoulderY + (outfit.modelOffsetY || 0),
  };
};

// A mood sets how Acey moves while idle on every page (see mascotMotion.js).
export const MOODS = [
  { id: 'ready', label: 'Ready', icon: '🙂', description: 'Calm and steady' },
  { id: 'curious', label: 'Curious', icon: '🤔', description: 'Tilts and looks around' },
  { id: 'cheerful', label: 'Cheerful', icon: '😄', description: 'Bouncy and upbeat' },
];

// The reactions Acey plays by itself while the learner studies. Ids match
// ACEY_REACTIONS in components/acey/aceyBrain.js; `when` describes the real
// trigger so the customizer preview explains what each one is for.
export const REACTIONS = [
  {
    id: 'hello', label: 'Hello', icon: '👋', duration: 3,
    when: 'Greets you on the Dashboard and in AI Tutor',
    message: 'waves hello.',
  },
  {
    id: 'think', label: 'Think', icon: '💭', duration: 2.8,
    when: 'When you upload a problem or ask for a hint',
    message: 'is thinking it through with you.',
  },
  {
    id: 'focus', label: 'Focus', icon: '🎯', duration: 2.35,
    when: 'When a solution or study session starts',
    message: 'is settling in to focus.',
  },
  {
    id: 'celebrate', label: 'Celebrate', icon: '🎉', duration: 2.65,
    when: 'When you finish a problem or save a note',
    message: 'is celebrating your progress.',
  },
  {
    id: 'encourage', label: 'Encourage', icon: '💪', duration: 2.4,
    when: 'When something goes wrong, so you keep going',
    message: 'is cheering you on.',
  },
  {
    id: 'rest', label: 'Break', icon: '☕', duration: 3.4,
    when: 'After a long study session',
    message: 'stretches and suggests a short break.',
  },
];

export const REACTION_DURATIONS = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.id, reaction.duration])
);

// Brain colors a learner can pick. `swatch` is the UI dot; `tint` becomes the
// color of the textured brain material in 3D (null keeps the designer's
// lavender). Technician's brain is baked into its single texture and stays
// under the hard hat, so it has no brainMaterials.
export const COLORS = [
  { id: 'lavender', label: 'Lavender', swatch: '#b69cff', tint: null },
  { id: 'bubblegum', label: 'Bubblegum', swatch: '#f58dc8', tint: '#ff9fd3' },
  { id: 'peach', label: 'Peach', swatch: '#ff9d5c', tint: '#ffb68a' },
  { id: 'sunny', label: 'Sunny', swatch: '#ffcf4a', tint: '#ffdb6e' },
  { id: 'mint', label: 'Mint', swatch: '#4fcf93', tint: '#8feabb' },
  { id: 'sky', label: 'Sky', swatch: '#62c8f2', tint: '#98dcff' },
  { id: 'ocean', label: 'Ocean', swatch: '#4f82f4', tint: '#8aa6ff' },
  { id: 'grape', label: 'Grape', swatch: '#8b5cf6', tint: '#a88bff' },
  // The approved lightbulb render: a soft pink, sky-blue and violet blend
  // across the brain rather than one color (`blend`, see applyBrainTint).
  {
    id: 'dreamy',
    label: 'Dreamy',
    swatch: 'linear-gradient(135deg, #f7a8d8 0%, #b69cff 52%, #8fc1ff 100%)',
    glow: '#b69cff',
    tint: null,
    blend: ['#ffa6d4', '#9ec4ff', '#c8a8ff'],
  },
];

export const getBrainTint = (colorId) => COLORS.find((color) => color.id === colorId)?.tint || null;
export const getBrainBlend = (colorId) => COLORS.find((color) => color.id === colorId)?.blend || null;

export const DEFAULT_OUTFIT_ID = 'classic';
export const DEFAULT_MOOD_ID = 'ready';
export const DEFAULT_COLOR_ID = 'lavender';
export const DEFAULT_BUDDY_NAME = 'Acey';
export const BUDDY_NAME_MAX_LENGTH = 20;

// Mirrors the backend rule: letters (any language), digits, spaces and . ' -
// up to 20 characters. Anything else falls back to the default name ('').
export const normalizeBuddyName = (value) => {
  if (typeof value !== 'string') return '';
  const name = value.trim().replace(/\s+/g, ' ');
  return /^[\p{L}\p{N}][\p{L}\p{N} .'-]{0,19}$/u.test(name) ? name : '';
};

export const getBuddyName = (appearance) => normalizeBuddyName(appearance?.name) || DEFAULT_BUDDY_NAME;
export const PREFERENCES_KEY = 'ace-mascot-preferences-v1';

// Designer poses with props from the `pose_fbx` delivery. Each is a complete
// character that replaces the layered garment while accessories are switched
// on. The scene fits full characters to the shared base body at runtime, so
// no per-file scale calibration is needed here.
//
// The original `pose_fbx` files were built on the Technician body (work
// overalls and tool belt) without outfit textures, so roles are added back
// one at a time from the 3D team's corrected GLB re-exports, each compared
// side by side with its garment in outfits/. See public/mascot/README.md.
export const POSED_VARIANTS = {
  // Engineer: the 3D team's posed worker (mascot_Rig_CN2, formerly shown as
  // a separate Technician) holding a wrench and power drill, recolored to the
  // approved Engineer design — yellow hard hat, brown tool belt and boots, and
  // the pearl face — by tmp/build-design-mascots.mjs.
  classic: {
    url: '/mascot/poses/engineer.glb',
    label: 'Wrench & power drill',
  },
  // Singer: body_rig_AO_casi2.glb (pink blazer, headphones, microphone). The
  // microphone sits in a fist held up by the mouth; the other arm rests.
  activewear: {
    url: '/mascot/poses/singer.glb',
    label: 'Headphones & microphone',
    brainMaterials: ['Material.004.1001'],
    hold: {
      left: {
        target: [0.12, 0.39, 0.28],
        pole: [1, -1, -0.4],
        grip: { meshes: ['Prongs_low_Microphone_0'], at: 0.3 },
      },
      right: { target: [-0.34, 0.13, 0.08], pole: [1, 0.2, -1] },
    },
  },
  // phu_thuy.glb (2026-09-14): wizard hat, robe and belt match outfits/wizard.glb.
  // Creative: BODY_AO_HoaSi2.glb — brown beret sitting on the brain, white
  // shirt, blue overalls; a paintbrush in one fist and the palette held out.
  artist: {
    url: '/mascot/poses/artist.glb',
    label: 'Paintbrush & palette',
    brainMaterials: ['Material.008.1001'],
    hold: {
      right: {
        target: [-0.26, 0.32, 0.25],
        pole: [1, -1, -0.5],
        grip: { meshes: ['Cylinder', 'Cylinder001', 'Cylinder002'], at: 0.3 },
      },
      left: { target: [0.46, 0.27, 0.14], pole: [0.3, -1, -1] },
      props: { left: ['Cylinder003'] },
    },
  },
  // Fashion: body_AoKhoacTrumDau2.glb — pink hooded jacket with the brain
  // showing inside the hood; both hands cup the mug.
  cloak: {
    url: '/mascot/poses/hooded-jacket.glb',
    label: 'Warm mug',
    hold: {
      right: { target: [-0.1, 0.31, 0.3], pole: [1, -1, -0.5] },
      left: { target: [0.07, 0.31, 0.3], pole: [1, -1, -0.5] },
    },
  },
  wizard: {
    url: '/mascot/poses/wizard.glb',
    label: 'Magic wand & spell book',
    brainMaterials: ['toc'],
    // The wand hand (already curled around the wand) comes in front of the
    // chest; the other hand cups the open spell book from below, palm up.
    hold: {
      right: { target: [-0.3, 0.3, 0.22], pole: [1, -1, -0.5] },
      left: { target: [0.2, 0.255, 0.31], pole: [1, -1, -0.4], roll: 180 },
      props: { right: ['pCylinder3'] },
      // The open spell book (rebuilt by tmp/build-wizard-book.mjs) stays still
      // in front of the body; the palm holds it under the spine.
      fixed: ['spell_book'],
      // The witch hat (robe, hat band and buckle materials above the neck)
      // rides higher so the brain shows under its brim.
      headwear: { materials: ['QUAN_AO', 'That_lung', 'pk_non'], fromY: 0.9, lift: 0.12 },
    },
  },
  // body_AO_hoodi2.glb (2026-09-14): purple ribbed hoodie and shoes match
  // outfits/hoodie.glb.
  hoodie: {
    url: '/mascot/poses/hoodie.glb',
    label: 'Headphones & game controller',
    brainMaterials: ['Material.002'],
    // Both hands come in to hold the game controller in front of the chest.
    hold: {
      right: { target: [-0.1, 0.33, 0.27], pole: [1, -1, -0.5] },
      left: { target: [0.1, 0.33, 0.27], pole: [1, -1, -0.5] },
    },
  },
};

// Props taken from the 3D team's deliveries (or built where a delivered mesh
// is unusable) and held in Acey's fists on the role's approved garment, for
// roles whose posed delivery wears the wrong clothes. Built by
// tmp/extract-props.mjs; see public/mascot/README.md.
// `holdArms` lists the arms that hold something and rest lifted.
export const PROP_SETS = {
  doctor: { url: '/mascot/props/doctor.glb', label: 'Stethoscope & clipboard', holdArms: ['right'] },
  'long-vest': { url: '/mascot/props/long-vest.glb', label: 'Science flask', holdArms: ['left'] },
  vest: { url: '/mascot/props/vest.glb', label: 'Briefcase & coffee mug', holdArms: ['left', 'right'] },
  // The approved Scholar render points the pencil out to the side.
  graduation: {
    url: '/mascot/props/graduation.glb',
    label: 'Pencil & books',
    holdArms: ['right'],
    holdPose: { right: { down: 12, forward: 8 } },
  },
};

export const getOutfitAccessories = (outfit) => {
  if (!outfit) return null;
  if (outfit.accessories) return outfit.accessories;
  const set = POSED_VARIANTS[outfit.id] || PROP_SETS[outfit.id];
  return set ? { label: set.label, builtIn: false } : null;
};

// Returns the model that should be displayed for an outfit: a matching posed
// character, the approved garment holding its props, or the plain garment
// when accessories are switched off.
export const resolveOutfitVariant = (outfit, accessoriesEnabled = true) => {
  const posed = outfit && POSED_VARIANTS[outfit.id];
  const propSet = outfit && PROP_SETS[outfit.id];
  if (!accessoriesEnabled || (!posed && !propSet)) return outfit;
  if (!posed) return { ...outfit, props: propSet, variant: 'props' };
  return {
    ...outfit,
    type: 'glb',
    url: posed.url,
    unitScale: 1,
    fullCharacter: true,
    fullCharacterOffsetY: 0,
    // Garment lifts do not apply to a complete character; its feet share the
    // base body's floor.
    modelOffsetY: 0,
    brainMaterials: posed.brainMaterials || [],
    hold: posed.hold,
    variant: 'posed',
  };
};

export const readPreferences = () => {
  if (typeof window === 'undefined') return {};

  try {
    const preferences = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || '{}');
    return preferences && typeof preferences === 'object' ? preferences : {};
  } catch (error) {
    return {};
  }
};

export const isKnownPreference = (items, id) => items.some((item) => item.id === id);
