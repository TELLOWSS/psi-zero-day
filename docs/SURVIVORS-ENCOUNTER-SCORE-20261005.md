# Encounter Score Continuity - 2026-10-05

## Implemented

- Boss arrival, combat, and secured confirmation retain the existing heavy-risk score, even after the live boss is removed.
- Encounter phase changes bypass the ordinary one-second score polling interval. Terminal frames do not request a temporary foundation score before the result cue.
- Item evolution uses the existing event-cue mixer for a three-second excerpt instead of replacing background music and holding it off for 3.5 seconds.
- Event cues retain ducking, bounded voice priority, mute/pause cancellation, and late-decode lifecycle guards. Invalid excerpt durations are rejected.
- Existing supplied recordings are reused unchanged. No new recording, new gameplay rule, or production-audio approval is introduced.

## Verification

- Full suite: 1,333 passed, one intentionally skipped; typecheck and production build passed.
- Tests cover all encounter score phases, evolution excerpt duration, looping-score preservation, and UI evolution/arrival/secured/success transitions.
- Browser checks passed at 1440x900, 390x844, and 844x390. Actual heavy-risk and success buffers decoded and attached to score sources; the evolution overlay preserved score identity and epoch with no reported audio failures.
- Clear completion now proceeds through the normal render-loop update in browser QA instead of manually forcing an external terminal state.
- Existing control, aura, raster, overflow, and page-error checks passed; development entry loaded without a Vite error overlay.

## Review Boundary

Automated playback checks establish decoding and routing, not subjective orchestral quality, audible output on every device, or production listening lock. Director listening review and physical-device mix assessment remain necessary.
