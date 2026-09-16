# ACE mascot assets

The source models were supplied by the ACE AP STEM project owner in the shared
Google Drive folder `trang_phuc_mascot` on 2026-08-22.

Web delivery uses the supplied GLB files when available. The base body and
graduation outfit use their supplied FBX files. Models are loaded on demand by
`MascotShowcase`, so opening the landing page does not download every outfit.

## Outfit mapping

- `doctor.glb`: `AO_BS`
- `classic.glb`: `AO_CT`
- `artist.glb`: `AO_HOASI`
- `hoodie.glb`: `AO_hoodi`
- `cloak.glb`: `AO_khoac_trumdau`
- `wizard.glb`: `AO_Phuthuy`
- `graduation/graduation.fbx`: `AO_TOT_NGHIEP`
- `activewear.glb`: `AO_TT`
- `vest.glb`: `AO_vest`
- `long-vest.glb`: `AO_VEST_DAI`

## Web asset QA (2026-08-23)

The current files are usable for display, but they are not animation-ready
character assets:

- All nine GLB outfits are static meshes (`skins: 0`, `animations: 0`) authored
  with horizontal T-pose sleeves.
- The graduation FBX also has no animation clip.
- The base FBX contains a 318-bone DCC control rig and vertices with more than
  four skin influences. Three.js drops the extra influences, so the web adapter
  deliberately renders the approved neutral body as static meshes instead of
  playing that rig.
- `activewear.glb` already contains full-length arms. An older integration also
  displayed procedural arms over them; that duplicate layer was removed in the
  2026-08-23 natural-motion pass.
- `classic.glb` and `artist.glb` contain short sleeves only. They intentionally
  use a calibrated procedural forearm between the supplied sleeve and hand.
- Doctor, Vest, and Long Vest contain intentional multi-layer sleeve islands.
  Every layer must stay on the same shoulder pivot to avoid visible separation.

`MascotShowcase` now partitions the supplied sleeve islands, puts them on a
shared shoulder rig, and applies the same pose to the sleeve, forearm, and hand.
This removes the T-pose and supports the current Hello, Focus, and Celebrate
reactions without modifying the approved source files.

## Approved design look (2026-09-16)

The client supplied the 3D team's own renders (dark background) as the
reference for every role. Changes made to match them:

- **Body colors (all roles).** The base FBX multiplied every body texture by
  0.8 grey and drew the eye layer translucent over the face shell, washing the
  eyes out to grey. `applyDesignBodyLook` in `mascotModel` shows the textures at
  full value and draws the eyes opaque: a pearl-white face, navy eyes and pink
  cheeks, as in the base render. Designer characters keep their delivered
  colors (`configureModel(model, { keepColors: true })`); only garments are
  softened.
- **Arms that hold props.** The delivered skeletons lose Blender's constraints,
  so `mascotArmPose.poseCharacterArms` rebuilds each full character on a small
  procedural arm rig (shoulder and elbow per side, weights from each vertex's
  position along the T-pose arm) and places each palm with two-bone IK
  (`hold.left/right.target` and `pole`). `grip` seats a prop in a curled fist by
  its handle; `props` meshes follow the forearm; `headwear` raises a hat so the
  brain shows under the brim. Garments holding props rest their arms lowered and
  swung forward (`HOLD_ARM_ANGLES`, `HOLD_ARM_FORWARD`, per-set `holdPose`).
- **Roles.** Built by `tmp/build-design-mascots.mjs` into `poses/`:

| Role | Web asset | Source | Notes |
| --- | --- | --- | --- |
| 01 Engineer | `poses/engineer.glb` | `outfits/technician.glb` (mascot_Rig_CN2) | Replaces the duplicate Technician role: its holding pose with the Engineer colors — the white shell material is split by height into a yellow hard hat (y>0.8), light-blue scarf (0.37–0.5), brown tool belt and boots; pale violets in its texture become pearl so the face matches. |
| 05 Creative | `poses/artist.glb` | `BODY_AO_HoaSi2.glb` | Beret on the brain, brush in a fist, palette held out. |
| 06 Singer | `poses/singer.glb` | `body_rig_AO_casi2.glb` | Pink blazer and headphones; microphone in a fist by the mouth. |
| 07 Fashion | `poses/hooded-jacket.glb` | `body_AoKhoacTrumDau2.glb` | Brain shows in the hood; both hands cup the mug. Jacket drawn OPAQUE. |
| 08 Scholar | garment + `props/graduation.glb` | `graduation.fbx` | The gown, cap and tassel share one white material; `regionColors` paints a black gown and cap with a gold tassel. Pencil pointer in the fist, books on the floor (procedural). |
| 09 Cozy | `poses/hoodie.glb` | `body_AO_hoodi2.glb` | Both hands hold the game controller. |
| 10 Fantasy | `poses/wizard.glb` | `phu_thuy.glb` | Wand hand in front, other hand under the book (palm up); hat raised 0.12 so the brain shows. |

Follow-ups (later on 2026-09-16):

- **Dreamy brain color** (`COLORS` id `dreamy`): a soft pink / sky-blue / violet
  blend like the lightbulb render. `applyBrainTint(..., blend)` injects a small
  shader that mixes the three colors by position inside the brain's bounds and
  multiplies them over the brain texture. Not available on Engineer and
  Fashion, whose brains are baked into their textures.
- **Fantasy spell book**: the delivered book was two overlapping scanned shells
  that z-fought into speckles. `tmp/build-wizard-book.mjs` replaces them in
  `poses/wizard.glb` with a clean open book (`spell_book`), held still
  (`hold.fixed`) with the palm under its spine.
- **Engineer wrench**: the delivered wrench material is plain white and vanished
  against the glove; `build-design-mascots.mjs engineer` makes it brushed steel.
- **Scholar layers**: `regionColors.components` colors whole connected pieces
  by bounds, so the gown's nested layers separate: black gown, slate vest with
  gold buttons, white shirt and a gold tie.
- **Jacket sides**: beside the torso only vertices above the armpit follow the
  arm (`ARM_FRAME.torsoX` / `armpitY`), so bulky jackets (Fashion, Cozy) no
  longer open a gap at the hip when the arms bend.

Roles are numbered 01–10 after the Technician merge. Review renders:
`tmp/scene-preview.html` (real scene), `tmp/bone-lab.html?file=…&hold=…`
(one GLB with a hold config) and `tmp/look-lab.html` (material variants).

## Incoming `pose_fbx` review (2026-09-09)

The separate Drive delivery named `pose_fbx` is source/DCC material rather than
a drop-in garment pack. It contains twelve raw FBX exports, including refreshed
versions of existing looks plus `body_AO_CN2.fbx`, `body_rig_AO_casi2.fbx`, and
`mascot_Rig_CN2.fbx`. The raw FBXs are complete character rigs, not overlays;
they have no animation clips, and Three.js reports more than four skin
influences for some vertices.

### Approved Technician exception

`mascot_Rig_CN2.fbx` is the missing full-character Technician (role `04`). Its
three material slots — `Mascot_T`, `Mascot_T.001`, and `glass` — exactly match
the 18 PBR maps delivered in `TEX_MOI`. The web asset
`outfits/technician.glb` is a self-contained 3.74 MB derivative that:

- removes DCC controller nodes and unrelated high-poly `tripo_*` meshes;
- links the three supplied texture sets, preserving the transparent glass
  material; and
- reduces the supplied 4K maps to 2K, omitting flat normal/height maps.

The Technician uses `fullCharacter: true`, so the customizer hides its shared
base while this role is selected instead of layering two mascot bodies. It
still receives the common scene bob, turn, and study-reaction motion, but does
not use the garment sleeve-splitting path.

All other `pose_fbx` files remain source deliveries until they receive the same
asset-specific review and web optimization.

### Corrected re-exports

| Delivery | Role | Web asset | Review |
| --- | --- | --- | --- |
| `phu_thuy.glb` (2026-09-14) | 12 Fantasy | `poses/wizard.glb` | Hat, robe, belt and shoes match `outfits/wizard.glb`; no Technician overalls; props: magic wand + open spell book. Embedded body textures are correct, but the exporter left `metallic=1, roughness=1` on `body`, `mat`, `mieng`, `toc` and `mat_kinh`, which rendered the face grey. The web copy sets those five to `metallic=0, roughness=0.55`. At the client's request the props were coloured (wand: brown wood shaft with a gold tip; book: brown leather cover, cream pages) and the right hand was curled into a fist (middle/ring/pinky phalanges ~70°, small thumb curl) with the wand re-seated through it. Built by `tmp/wizard-props.mjs` from the untouched delivery. |
| `body_AO_hoodi2.glb` (2026-09-14) | 11 Cozy | `poses/hoodie.glb` | Purple ribbed hoodie and shoes match `outfits/hoodie.glb` (rendered colours within a few RGB steps); no Technician overalls; props: over-ear headphones + game controller. Embedded textures, no `cs_*`/`tripo_*`, finite bounds, no metallic fix needed. The hair material (`Material.002`) was exported as `BLEND`, which drew its inner layers as shards; the web copy sets it to `OPAQUE` like the other deliveries' hair. Built by `tmp/posed-export-fix.mjs`. |

### Props on the approved garment (2026-09-15)

Every role now has accessories. Where no posed delivery wears the right
clothes, Acey keeps the role's approved garment from `outfits/` and holds the
props from the 3D team's delivery. `tmp/extract-props.mjs` builds
`props/<id>.glb`:

- every T-pose delivery shares Acey's body — fingertips at
  (±0.6157, 0.3626, 0.0152), palms (hand mesh centres, the same split the web
  base uses) at (±0.5812, 0.3626, 0.0152), measured by
  `tmp/measure-hands.mjs` and checked per file — so each prop is
  re-expressed around the +x palm (`anchor_pos`), the -x palm (`anchor_neg`)
  or the fingertip midpoint (`anchor_body`), in units of the fingertip span;
- held props are gripped (2026-09-15 rework): the open web hand is a flat,
  palm-down mitten, so props laid against it looked like they floated beside
  or skewered the hand. `mascotModel` now curls a holding hand into a fist at
  runtime (`FIST`: fingers bent 2.6 units around a handle under the knuckles,
  thumb turned in beside the index finger), rolls it thumb-up and keeps it
  upright about the wrist joint (`addHandHold`), and makes the hands opaque
  (the body's opacity map let props show through the fingers);
- fist props use `grip_pos` / `grip_neg`: the origin is the centre of the
  handle and +y runs along it. `tmp/extract-props.mjs` turns each delivered
  prop with `align` (its measured axes from `tmp/measure-frames.mjs`: handle
  up, face to the camera), puts its `grip` point at the origin and applies a
  small `tilt`; bags keep hanging from the open palm (`anchor_pos`);
- `mascotModel.attachPropSet` scales the anchors to Acey's hands (span from
  `getHandTip`); hanging props counter-rotate on the wrist, fists in their
  hold frame, so both stay upright while Acey rests or reacts;
- arms that hold props (`PROP_SETS.holdArms`) rest lifted to 20° below
  horizontal (`HOLD_ARM_ANGLES`) so hanging items clear the floor.

Review renders: `tmp/scene-preview.html?ids=…&views=0,35&focus=right|left|chest|face`
(`&pitch=0.02` matches the customizer's eye-level camera).

### Engineer hard hat, brain colors and thumbnails (2026-09-15)

- **Engineer**: the supplied hard hat sat down over the eyes (brim at
  y=63-68, eyes at 62-77) with the glasses rims cutting through the brim, and
  the thick scarf crowded the chin — at the customizer's eye-level camera the
  face looked squeezed. `OUTFITS.classic.gearAdjust` (applied by
  `mascotModel.adjustOutfitGear` after the garment lift, only on
  `non_quanao_1001`) scales the hat to 92%, tips it back 14° about the back of
  the head and lifts it 5 units, and slims/lowers the scarf. The base hair is
  now cut at y=84 so a fringe of brain curls shows under the brim.
- **Brain color** (`COLORS`, `appearance.colorId`): the tint replaces the color
  of the textured brain material — `toc` on the shared base and Fantasy,
  `Material.002` on Cozy (`brainMaterials`). Technician's brain is baked into
  its single texture under the hard hat, so it keeps its color.
- **Buddy name** (`appearance.name`, validated the same way by the backend):
  used across the Dashboard panel, the customizer and Acey's bubbles.
- **Outfit thumbnails** (`thumbs/<id>.webp`, 240 px, transparent) for the
  Dashboard outfit picker are real renders:
  `scene-preview.html?ids=…&frames=120&crop=0,0,360,360&single=1&nofloor=1&save=thumb`,
  then `node tmp/make-thumbs.mjs`. Re-render them whenever an outfit or prop changes.

| Role | Props | Source |
| --- | --- | --- |
| 01 Engineer | Wrench & blueprint roll | wrench from `body_AO_CT2`; procedural blueprint roll (Technician already has the wrench and drill) |
| 02 Healthcare | Stethoscope & clipboard | clipboard from `body_AO_BS2.glb`; procedural stethoscope draped over the coat collar (the delivered one is held in front of the legs) |
| 03 Scientist | Science flask | procedural flask held by the neck (the delivered flask is 31 overlapping ~90k-vertex slices, 93 MB) |
| 05 Business | Briefcase & coffee mug | `body_AO_vest2.glb` (textures 512 px); mug held by its handle |
| 06 Creative | Paintbrush & palette | `BODY_AO_HoaSi2.glb` |
| 07 Performer | Microphone | `body_rig_AO_casi2.glb` (the singer delivery; textures 512 px) |
| 08 Fashion | Handbag | `body_AO_TT2.glb` (the fashion delivery; textures 512 px) — previously shown on Performer by mistake |
| 10 Scholar | Diploma scroll | procedural (no delivery) |

Technician (built-in) and Cozy/Fantasy (matching posed characters) keep their
full characters. `outfits/technician.glb` was repaired by
`tmp/fix-technician.mjs`: it contained `pSphere8`, a static bind-pose copy of
the hard hat, overalls and tool belt that doubled the outfit (two helmet
brims, doubled belt, hair hidden), and its drill was a broken scan; the copy
is removed and the drill replaced with a clean one in the same hand.

Held back from the same 2026-09-14 batch as posed characters (garment kept, 3D team to re-export):

| Delivery | Role | Reason |
| --- | --- | --- |
| `body_AO_BS2.glb` | 02 Healthcare | Teal scrub top without the white shirt and blue tie; darker trousers and shoes than `outfits/doctor.glb`. |
| `body_AO_vest_Dai_doctor.glb` | 03 Scientist | Wrong outfit: grey doctor coat instead of the pink long blazer; still has `Mascot_T`/`Mascot_T.001`/`glass` Technician materials; flask prop ~3.2M vertices (93 MB). |
| `body_AO_vest2.glb` | 05 Business | Suit renders dark slate (≈#283041) instead of the royal navy garment (≈#0A2460); black shoes instead of brown. |
| `BODY_AO_HoaSi2.glb` | 06 Creative | Contains a `Mascot_T` material; overalls darker blue than the garment. |
| `body_AO_TT2.glb` | 07 Performer | Wrong outfit: Technician hard hat and white tool belt/harness; `cs_*` controller meshes. |
| `body_rig_AO_casi2.glb` | (singer) | Not mapped to a role; pink blazer does not match Performer; `Mascot_T` materials and `cs_*` meshes. |
| `body_AoKhoacTrumDau2.glb` | 08 Fashion | Hair pokes through holes in the hood at side/back views; `cs_*` controller meshes. |

Engineer (`CT`) and Scholar (`TOT_NGHIEP`) were not in this batch. `phu_thuy.glb` is byte-identical to the delivery already live as `poses/wizard.glb`.

### Status 2026-09-14: posed roles withdrawn (only Technician ships)

Comparing each posed export with its approved garment in `outfits/` showed the
wrong clothes on every role except Technician:

- every `pose_fbx` file is built on the Technician body, so each role also
  wears the Technician's work overalls and tool belt;
- the FBX files do not include their outfit textures, so berets, hoodies,
  coats and tops lose their colours (e.g. Creative's brown beret and blue
  overalls render grey/navy, Cozy's purple hoodie renders white, Performer
  loses its pink top).

Healthcare had been live briefly and was reverted to its garment. The
Accessories control now appears only for the Technician. Request from the 3D
team, per role: the pose + props on **that role's own outfit** (no Technician
overalls/belt), exported as **GLB with embedded textures** (or FBX plus every
outfit texture). Then register the role in `POSED_VARIANTS` after a
side-by-side check against its garment.

### Designer poses with accessories (2026-09-13, superseded above)

The 3D team confirmed that the `pose_fbx` exports carry each role's pose and
props. Rendering them (with a skeleton-aware clone) shows:

| Source FBX | Role | Pose & accessories | Web asset |
| --- | --- | --- | --- |
| `mascot_Rig_CN2.fbx` | 04 Technician | wrench + yellow power drill | `outfits/technician.glb` (4.24 MB) |
| `body_AO_BS2.fbx` | 02 Healthcare | stethoscope, raised clipboard, pen | `poses/healthcare.glb` (3.39 MB) |
| `BODY_AO_HoaSi2.fbx` | 06 Creative | beret, paintbrush, palette | `poses/artist.glb` |
| `body_AO_TT2.fbx` | 07 Performer | raised handbag | `poses/activewear.glb` |
| `body_AO_hoodi2.fbx` | 11 Cozy | headphones, game controller | `poses/hoodie.glb` |
| `body_AO_PhuThuy2.fbx` | 12 Fantasy | wizard hat, magic wand, spell book | `poses/wizard.glb` |
| `body_AO_CT2.fbx` | 01 Engineer | wrench, power drill | **held back**: two primitives reference invalid joints (NaN bounds) |
| `body_AO_vest2.fbx` | 05 Business | briefcase | **held back**: `Material.00x` face materials, no matching textures |
| `body_AO_Vestdai_doctor.fbx` | 03 Scientist | hand-held prop | **held back**: prop is ~2.7M vertices; needs decimation |
| `body_AO_Totnghiep2.fbx` | 10 Scholar | — | not downloaded yet |
| `body_rig_AO_casi2.fbx` | (singer) | headphones, raised microphone | **held back** (see below) |

Roles map to outfits by their original `trang_phuc_mascot` folder (AO_CT →
Engineer, AO_TT → Performer, AO_HOASI → Creative, …), not by the posed file's
theme. Files using the web base body's material names (`body`, `mat`,
`mat_kinh`, `mieng`, `Material`) are textured from `public/mascot/body`.

Performer is not shipped yet: this export splits the face and dome into
generic materials (`Material.001`–`.007`) that do not line up with the
`TEX_MOI` body maps, and no Performer-specific textures were delivered. Even
with the dome aliased to `glass`, the face renders olive-yellow instead of the
approved purple. It needs either its own texture set or a re-export that uses
the `Mascot_T` / `Mascot_T.001` / `glass` material names.

Corrections to the earlier Technician derivative: the `tripo_*` meshes are the
power drill in the Technician's second hand, not unrelated geometry. The file
contains fourteen overlapping copies of it; the web asset keeps the single
17k-vertex copy (`tripo_node_…_0.014`), which is visually identical.

Asset notes:

- All three share the Technician rig and `TEX_MOI` body maps (`Mascot_T`,
  `Mascot_T.001`, `glass`). FBX2glTF exports them in metres (about 1.44 units
  tall) while the shared base body is in centimetres, so a fixed
  `unitScale` left them about 1% of the body's size. `mascotScene` now fits
  every full character to the base body at runtime (same height, same floor,
  same centre), which also covers future deliveries.
- `body_AO_BS2` has 84 vertices with zero skin weights. Three.js turns those
  into NaN bounds and the whole character disappears; the pipeline copies the
  weights of the nearest correctly weighted vertex.
- DCC controller shapes (`cs_*`) and the `Icosphere` light helper are removed.
- In the customizer, Healthcare and Performer have an Accessories switch
  (posed character on, calibrated garment off). The Technician's props are
  always on because its pose is the only delivery.

The remaining `pose_fbx` roles (Engineer, Scientist, Business, Creative,
Fashion, Scholar, Cozy, Fantasy) were not available locally for review. Add
them to `POSED_VARIANTS` in `src/components/mascot/mascotCatalog.js` after
running them through `tmp/prepare-posed-mascots.mjs` (FBX2glTF → prune helpers
and duplicate tools → repair weights → link `TEX_MOI` → prune/dedup).

## Requirements for a future animation-ready delivery

For studio-quality elbow, cloth, and facial motion, the design export should
provide one glTF 2.0 GLB set with:

- one shared skeleton and one A-pose bind/rest pose for the body and outfits;
- matching origin, units, and joint names across every garment;
- no more than four normalized joint influences per vertex;
- self-contained clips named `Idle`, `Wave`, `Focus`, and `Celebrate`;
- facial morph targets such as `Blink`, `Smile`, and `Curious`;
- zero errors in the Khronos glTF Validator before handoff.
