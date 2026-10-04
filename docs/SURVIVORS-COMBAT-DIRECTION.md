# Survivors combat direction — 2026-10-04

## Scope and source

Director request: integrate character motion, scene lighting, camera and sound into the shooting game. Reviewed the attached complete master bible, cinematic event direction (§basic camera grammar / mobile quality gate) and sound direction. Preserve safety identity: hazards receive dramatic control effects; workers receive calm education confirmation. Existing engine, progression and approved actor assets are retained.

## Runtime changes

- Local projectile launch facts trigger the existing rigged action pose; actual travelled distance drives quiet boot contact sounds. Existing IK walk/run/brace animation stays intact.
- Cached floor lighting adds broad warm/cool bounce and an elliptical pool at installed active floodlights. Short optical launch/contact light pools reuse the existing transparent VFX atlas. Drawn below actors and danger telegraphs, not as a full-screen color filter.
- Event camera recoil follows launch direction, maximum 1.1 world pixels for premium launch / 1.8 for local critical impact, with 22/s exponential decay and 140 ms coalescing. Existing boss/shout shake now has deterministic motion instead of random frame jitter. No zoom, forced pan, hit stop or simulation changes.
- Equipped communication/tempo gear selects gold/cyan/violet timbre in cached procedural equipment PCM. Worker confirmation ignores premium timbre. Quiet footstep sources use the existing SFX bus and 24-voice priority limiter; filter nodes are tracked and cleaned even on interruption. Muting and pause preserve existing session lifecycle.
- Dynamic floor pools cap at 8 (4 during dense fire); exclude worker events and non-emissive powder/cones. Reduced-motion mode disables new floor pulses and camera recoil. Camera/light direction freezes with simulation pause.

## Evidence

`PSI-COMBAT-DIRECTION-REVIEW.webp` is a native Canvas detail rendering of the actual game lighting/rig/contact-light functions with approved game floor and character assets. It is not an Android screenshot or browser-play test. The directional image shows floor grading and small grounded action movement; it does not demonstrate camera timing or audible sound quality.

Full suite: 1,162 passed / 1 skipped. Typecheck and production build passed. Final narrowed recoil distance and emissive-family restrictions rechecked with the combat direction / equipment sound tests. Dev index and new module returned HTTP 200.

`agent-browser` is unavailable in this execution environment. Existing Chromium installation attempt was blocked by an invalid download, so no browser/device visual PASS, Android frame rate PASS, or listening PASS is claimed.

## Remaining quality gates

This is integrated gameplay direction, not whole-game cinematic production lock. Original 2D rigged sprites remain; no new multi-direction authored animation or facial performance was produced. Procedural equipment/boot sound is not a replacement for approved final Foley or orchestral recordings. Actual Android dense late-stage gameplay, audio balance, camera comfort, frame rate and Director visual acceptance remain pending. Broader material art, character animation and final audio mastering require their own production assets and review.
