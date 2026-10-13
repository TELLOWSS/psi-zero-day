# PSI : ZERO DAY — Premium Drone SFX V3 Applied QA

**Date:** 2026-10-06  
**Director source:** `PSI_ZERO_DAY_PREMIUM_DRONE_SFX_V3.zip`  
**Branch:** `audio/survivors-sfx-v2-20261006`

## Technical source validation

The supplied pack contains 27 isolated/master WAV files.

- 48 kHz
- 24-bit PCM
- mono
- zero detected full-scale/clipped samples
- near-zero DC offset
- authored short layer stems
- authored complete `MIX_NORMAL` and `MIX_PREMIUM`
- authored 30-repeat audition file
- authored Hunter A/B gestures
- authored Launch / Dock / Target Lock

This is materially cleaner than the rejected V2 drone family.

## Runtime decision

For the first V3 integration, preserve the producer's sound design intent:

| Runtime role | Authored source |
| --- | --- |
| Base drone shot | PSI_DRONE_V3_MIX_NORMAL.wav |
| Premium drone shot | PSI_DRONE_V3_MIX_PREMIUM.wav |
| Hunter A | PSI_DRONE_V3_HUNTER_GESTURE_A.wav |
| Hunter B | PSI_DRONE_V3_HUNTER_GESTURE_B.wav |
| Inspection launch | PSI_DRONE_V3_LAUNCH_A.wav |
| Inspection dock | PSI_DRONE_V3_DOCK_A.wav |

The isolated Servo / Pulse / Air / Tech / Motor / Premium stems remain preserved for later fine-mix passes. They are not re-mixed arbitrarily in this first runtime application.

## Runtime behavior

- `drone_laser` without tempo-premium gear → Base V3 mix
- `drone_laser` with `relay_core | precision_link | sync_gauntlet` premium look → Premium V3 mix
- `hunter_beam` → authored Hunter A/B alternating gestures
- inspection departure → V3 Launch
- inspection return → V3 Dock
- V1 drone release/launch/dock are no longer runtime mappings
- if V3 loading fails, projectile playback falls through to the existing procedural equipment sound rather than replaying rejected V1 drone audio
- base/premium shots use deterministic tiny playback-rate cycle (.985 / 1 / 1.015), never gameplay RNG
- Hunter gesture preserves authored playback rate and alternates A/B
- existing SFX bus, distance attenuation, voice cap, mute/pause/dispose cancellation remain intact

## Runtime files

All files are 48 kHz Vorbis runtime candidates.

- `drone_base_release.ogg`
- `drone_premium_release.ogg`
- `drone_hunter_a.ogg`
- `drone_hunter_b.ogg`
- `drone_launch.ogg`
- `drone_dock.ogg`

## Approval boundary

Technical QA is passed, but sound quality is a perceptual decision.

Before Production Lock, Director should compare:
1. phone speaker
2. headphones
3. desktop speakers
4. at least 30 repeated base shots
5. base vs premium without looking at the screen
6. Hunter repeated combat cadence

If Base/Premium distinction is still too subtle, use the preserved isolated V3 stems for a second mix pass rather than returning to V2.
