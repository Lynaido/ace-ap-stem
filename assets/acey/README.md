# Acey model sources

The project owner supplied `drive-download-20261004T080726Z-1-001.zip` on
2026-10-08. This directory preserves all 12 original binary FBX models without
conversion, mesh edits, renaming, or compression changes. `manifest.json`
records each extracted file's byte count and SHA-256 checksum, verified against
the decompressed archive entry.

## Delivery contents

The archive contains FBX files only. It does **not** contain a native Blender
`.blend` project, a preview named `acey.png`, or a separate `textures/` directory.
Embedded materials have not been validated in Blender. Do not assume external
textures are available or that these models are ready to replace the web assets.

To edit a supplied model in Blender, use **File > Import > FBX**. Save the
result as a separate `.blend` project after checking its materials, rig, scale,
and external texture references. Preserve the original FBX. Native Blender
projects and accompanying textures can be added here when supplied; Blender
automatic backup files are ignored.

## Web deployment

These are source assets for artists, stored outside `frontend/public` and the
frontend build. They do not change the mascot displayed on the website or its
download size. The approved runtime GLB/FBX derivatives remain in
`frontend/public/mascot`.

This delivery is based on `Lynaido/ace-ap-stem` production commit
`c81201560abb609884d1a41ba030cb5c468bdd09`. Application code, approved runtime
models, backend configuration, and database migrations are unchanged.
