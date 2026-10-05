# CODEX HANDOFF — Survivors SFX V2

Branch: `audio/survivors-sfx-v2-20261006`

## Source material

Persistent project Library:
- `/PSI_ZERO_DAY/PSI_ZERO_DAY_SFX_V2_GAME_READY_OGG.zip`
- `/PSI_ZERO_DAY/survivors-sfx-v2-ingest.json`

The original user upload was `PSI_ZERO_DAY_SFX_V2_WAV_PACK.zip`.

## Required implementation

1. Read `docs/SURVIVORS-SFX-V2-QA-20261006.md`.
2. Use `scripts/ingest-survivors-sfx-v2.mjs` when the original WAV directory is available.
3. Keep V1 assets intact as rollback until physical listening approval.
4. Extend the recorded-SFX registry to support variant families rather than one file per semantic event.
5. Rotate A/B/C/D variants deterministically or with bounded non-gameplay randomness; do not alter gameplay RNG.
6. Map:
   - radio/satellite launch → radio_release
   - extinguisher/cryo launch → extinguisher_release
   - base drone launch shot → drone_release
   - premium drone shot → drone_premium_release
   - hunter beam → drone_hunter_burst
   - Tesla confirmed contact → tesla_control
   - material contact → impact_steel / impact_concrete by actor/material
   - player damage → player_hit
   - record pickup → pickup
   - equipment purchase/equip → ui_equip
   - denied transaction → ui_denied
   - hazard neutralized/controlled → target_controlled
   - designated boss arrival → boss_alert
   - boss secured → incident_secured
   - inspection launch/dock → drone_launch / drone_dock
7. Do not stack V2 recorded release over the old procedural release. Recorded cue replaces that semantic event.
8. Retain distance attenuation, bus routing, bounded voices, mute/pause/dispose cancellation and reduced repetition limits.
9. Footsteps and site ambience are Wave 2: connect only after confirming actual movement surface and ambience lifecycle hooks.
10. Keep every row `CANDIDATE` / listening pending until Director device listening review.

## Tests

- every manifest URI exists and SHA matches
- no decoded full-scale sample after runtime render
- variant family calls cycle through available variants without affecting gameplay RNG
- premium/hunter drone map to their own family
- worker confirmations remain calm and unchanged
- no duplicate procedural+recorded event
- 100 rapid triggers stay within voice/rate limits
- mute/pause/dispose cancels delayed decode playback
- Chromium decode passes at mobile and landscape fixtures

Report using AGENTS.md: IMPLEMENTED / FILES / TEST / TODO / DIRECTOR REVIEW.
