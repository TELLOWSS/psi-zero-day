# Item animation and automatic preparation music

## Implemented

- Painted communication and drone flight envelopes now advect pulses on simulation time. Communication pulses spread; drone pulses converge. Small stretch/compression preserves the attack's position and collision radius.
- Confirmed contact cores expand rapidly, then settle. Evolved hot cores shrink while fragments decelerate; Tesla and hunter marks have distinct angular motion.
- Actual industrial contact rendering uses the same fast-attack expansion principle. Worker confirmations, grounded cones, reduced-motion and crowded-combat budgets remain unchanged.
- Preparation music is enabled by default. Ordinary pointer/keyboard interaction resumes browser-suspended audio without requiring a separate music button.
- Fixed initialization ordering: engine reset previously cancelled the score queued by the earlier effect. Score scheduling now follows reset and reruns when the preparation configuration changes.
- Existing crossfades, mute preference, pause cleanup and evolution cue hold are preserved. No new recordings or final-art approval claims.

## Verification

- Typecheck and production build passed. Full suite: 1,314 passed, 1 intentionally skipped.
- `scripts/verify-survivors-animation-music.mjs`: real Chrome with activation-required autoplay policy, 1440x900 / 390x844 / 844x390. All passed: music begins without touching its button, running context and nonzero output RMS; toggle-off produces silence; toggle-on and preparation difficulty reset restart playback.
- Four flight and four evolved contact renderers sampled with the loaded raster atlas: nonblank frames and changed pixels. Repeated simulation time and reduced-motion flight produce identical pixels. These are controlled renderer samples, not natural playthroughs.
- Existing material-response browser verification: nine controlled actual engine hits across three materials and three viewports passed, no page errors or horizontal overflow.

## Remaining Review

- Physical iOS/Android autoplay recovery and speaker/headphone listening require device review. Automated nonzero RMS is not a subjective sound-quality approval.
- This is animation of existing painted assets, not newly authored frame-by-frame sprite sheets or cinematic production lock.
