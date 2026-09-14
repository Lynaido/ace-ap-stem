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

### Designer poses with accessories (2026-09-13)

The 3D team confirmed that the `pose_fbx` exports carry each role's pose and
props. Rendering them (with a skeleton-aware clone) shows:

| Source FBX | Role | Pose & accessories | Web asset |
| --- | --- | --- | --- |
| `mascot_Rig_CN2.fbx` | 04 Technician | wrench + yellow power drill | `outfits/technician.glb` (4.24 MB) |
| `body_AO_BS2.fbx` | 02 Healthcare | stethoscope, raised clipboard, pen | `poses/healthcare.glb` (3.39 MB) |
| `body_rig_AO_casi2.fbx` | 07 Performer | headphones, raised microphone | **held back** (see below) |

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
