# Survivors Runtime V2 Integration

## Scope

PR #119 handoff commits were cherry-picked, not merged or closed. Original WAV ZIP SHA256 matched the source provenance. Runtime OGGs were locally rendered from those originals; they are not claimed byte-identical to the Library OGG pack.

34 Wave 1 cues are connected. Independent shuffle bags consume all A/B/C variants before reuse and avoid adjacent repeats across bags. Gameplay RNG is untouched. Premium drone and Hunter use distinct recordings. Boss alarm and incident secured have explicit lifecycle hooks. Worker receipts remain calm. Recorded playback suppresses duplicate procedural effects. V1 assets remain selectable with `VITE_SURVIVORS_SFX_VERSION=v1`.

All 43 normalized OGGs are retained with source/runtime hashes and decoded peak checks. Footsteps and night ambience are Wave 2 assets only, not wired into gameplay.

The Director authorized reuse of the previous player walking source. Image cleanup removed baked background/shadows. The runtime extracts 64 frames once, isolates the largest body component, normalizes ground pivots and retains eight genuine views. Equipment sockets use the same selected direction/frame bounds, with rear chest occlusion. Cached raster drawing bypasses the legacy player mesh; steady drawing creates no canvases.

Only the canonical player actor and its existing alias use this sheet. Other characters retain their existing art. Stationary poses hold frame zero. True authored breathing, directional command/ultimate frames and artist-authored per-frame socket polygons remain outstanding; this is not cinematic final-quality approval.

## Verification

- Full suite: 1378 passed, 1 skipped; production build passed.
- Chromium: desktop 1440x900, portrait 390x844, landscape 844x390; real input produced directions 0 through 7 in order, 64 nonblank frames, distinct directional silhouettes, stable ground pivots, no page errors, zero canvas allocations over 100 steady draws.
- Audio browser decode: 43 nonblank, unclipped OGGs in both mobile orientations; 34 Wave 1 preloads, 17 family triggers, mute cancellation.
- Unit regression covers independent bags, material/equipment routing, voice limits, decode cancellation and secured-once behavior.

Artifacts remain local under `artifacts/eight-direction-runtime` and `artifacts/recorded-sfx`. Browser viewport emulation is not a physical Galaxy S26 Ultra performance result. Human phone/headphone/speaker listening and final art approval remain pending.
