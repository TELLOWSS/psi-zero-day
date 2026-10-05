# PSI : ZERO DAY — Survivors SFX V2 Technical QA

**Date:** 2026-10-06  
**Source:** `PSI_ZERO_DAY_SFX_V2_WAV_PACK.zip` produced from the Director-approved Manus prompt.

## Result

The pack contains **43 WAV assets** plus README. All 43 WAV files decode as 48 kHz / 24-bit PCM. Short effects are mono; the 30-second site ambience is stereo.

This is a **technical QA pass, not perceptual production lock**. Final approval still requires listening on phone speaker, headphones and desktop speakers.

## Important findings

The generated sound design follows the requested target durations well, but source loudness is not consistent enough for direct runtime use.

Examples from the supplied WAVs:
- Drone precision A: 0.19 s, about 0 dBFS peak with 3 full-scale samples.
- Extinguisher B: 0.27 s, effectively 0 dBFS peak with 1 full-scale sample.
- Steel impact C: 0.20 s, effectively 0 dBFS peak with 1 full-scale sample.
- Hunter burst A has a large DC offset and is much louder than B.
- Concrete footsteps A/B and Tesla B are much quieter than their sibling variations.
- UI denied is much quieter than UI equip.
- Night ambience is intentionally very low and needs runtime-level preparation.

Therefore the raw Manus WAV files must be kept as source assets, while runtime copies are normalized separately.

## Runtime preparation rule

The V2 ingest script performs:
1. 20 Hz high-pass / DC cleanup.
2. Category RMS normalization.
3. -1.5 dBFS peak ceiling.
4. Very short edge fades.
5. 48 kHz Vorbis q5 runtime render.

Targets:
- normal repeated SFX / impact: -20 dBFS RMS
- drone launch/dock: -22 dBFS RMS
- pickup: -23 dBFS RMS
- UI / footsteps: -24 dBFS RMS
- boss/secured cues: -19 dBFS RMS
- site ambience: -34 dBFS RMS

## Integration priority

### Wave 1 — connect immediately
- radio_release
- extinguisher_release
- drone_release
- drone_premium_release
- drone_hunter_burst
- drone_launch / drone_dock
- tesla_control
- impact_steel / impact_concrete
- player_hit
- pickup
- ui_equip / ui_denied
- target_controlled
- boss_alert / incident_secured

### Wave 2 — connect after movement/ambience hooks are confirmed
- footstep_concrete A–D
- footstep_steel A–D
- site_night ambience

## Sound identity rule

V2 must replace the old single-note/synth-like feel with:
**TACTILE · INDUSTRIAL · PRECISE · CONTROLLED · PREMIUM**

Premium variants must not simply be louder. Their distinction comes from detail, body and precision.

## Production lock gate

Before marking any V2 row production-approved:
- listen to A/B/C repetition at real attack cadence for at least 20–30 triggers,
- compare phone / headphones / desktop,
- confirm no piercing 2–6 kHz fatigue,
- confirm equipment identities remain distinct without looking at the screen,
- confirm premium drone sounds more refined rather than simply louder,
- confirm boss alert reads as dangerous work escalation, not a fantasy monster cue.
