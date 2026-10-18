# EP01 morning pour director pass — 2026-10-18

## Implemented on Draft PR #210 only
- 09:24 event `e01_06_pump_arrival` selects `pump-arrival-morning-preview.svg` (arrival wide).
- 09:45 event `e01_07_first_pour` selects `first-pour-morning-preview.svg` (slab eye-level).
- These are **distinct artist-authored vector director previews**, not newly approved photographic/AI-painted 1920×1080 WebP production masters.
- Existing eight production backgrounds and the shared original twilight `concrete-pour.webp` remain intact. The preview layer is intentionally routed at runtime and falls back to the original if the preview fails.
- Scene composition uses the same authored cast/choice/signal IDs. No save keys or route graph changed.
- On-camera characters gain a responsive floor-contact shadow; this cannot repair intrinsic alpha fading or mismatched body-source perspective.

## Automated QA
- `tests/episode01-morning-pour.test.ts`: two different SVG compositions, 1920×1080, stable engine identities.
- `scripts/verify-story-player.cjs`: full 26-event browser route asserts each preview decodes, has expected image size and enables contact-shadow pass.
- `scripts/verify-episode01-candidate-audio-review.mjs`: 17 Ogg magic+Git blob integrity, 8 editorial excerpts / 9 Foley, writes machine review evidence.
- Dedicated media CI uploads the candidate audio integrity report. **These tests are not human listening, sound mix, provenance/license approval or physical Android QA.**

## Physical-Android and manual director sign-off — OPEN
- Verify Android WebView at 360×800, 390×844, 844×390 and a tablet. Rotate during dialogue and choices, background/pause/resume, Bluetooth connect/disconnect, media mute, battery-saving/performance mode.
- Walk all 26 events, compare 09:24 arrival vs 09:45 first-pour composition and verify sunshine/camera continuity.
- Check each character's boot-ground point at native pixels, foot alpha, shadow contact and z-index while changing orientation.
- Listen to all 8 edited excerpts and 9 Foley in headphones, built-in phone speaker and Bluetooth; write notes for start transient, loop seam, SFX masking and ducking.
- Retain rights evidence for source Gemini master and any derivatives; preview candidate status remains unchanged.
- Commercial final art gate requires newly painted approved daylight WebP originals and artist-corrected full-body sources; do not call the SVG previews final.

## Merge gate
Keep PR #210 Draft and `main` untouched until **all**: latest GitHub Actions green, Preview READY, director screens reviewed, legal and sonic evidence approved, physical Android reviewed. 
