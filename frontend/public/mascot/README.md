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

## Requirements for a future animation-ready delivery

For studio-quality elbow, cloth, and facial motion, the design export should
provide one glTF 2.0 GLB set with:

- one shared skeleton and one A-pose bind/rest pose for the body and outfits;
- matching origin, units, and joint names across every garment;
- no more than four normalized joint influences per vertex;
- self-contained clips named `Idle`, `Wave`, `Focus`, and `Celebrate`;
- facial morph targets such as `Blink`, `Smile`, and `Curious`;
- zero errors in the Khronos glTF Validator before handoff.
