# CODEX HANDOFF — Layered Premium Drone SFX V3

**Branch:** `audio/survivors-sfx-v2-20261006`  
**Director decision:** V2 drone family rejected after listening review. Do not promote V2 drone assets.

## Source of truth

1. `content/design/survivors-drone-sfx-v3.json`
2. `docs/MANUS-DRONE-SFX-V3-PREMIUM-BRIEF-20261006.md`
3. existing `src/ui/survivors-session-audio.ts`

## Runtime goal

Replace a single baked drone shot with a layered event:

```txt
servo_tick
+ pulse_body
+ air_slice
(+ tech_sheen for premium)
(+ premium_accent for premium)
(+ motor_micro for hunter/selected variants)
```

Do not play all layers at equal level. Use the starting offsets from the V3 design JSON and tune by device listening.

## Required architecture

Create a small drone-specific composition path in the session audio layer. It must:
- stay session-owned,
- reuse decoded buffers,
- remain bounded by existing voice limits,
- respect mute/pause/dispose,
- not touch gameplay RNG,
- avoid immediate repeat of the same variant,
- add only subtle pitch/gain randomization,
- preserve distance attenuation,
- keep repeated shots dry and short.

Recommended API shape:

```ts
playDroneRelease({
  family: 'base' | 'premium' | 'hunter',
  position,
  listener,
  busy,
}): boolean
```

Internally choose matching layer variants and schedule them within a very short window.

## Mapping

- `drone_laser` → base family
- premium-equipped drone laser → premium family
- `hunter_beam` → hunter family
- inspection launch → V3 launch
- inspection dock → V3 dock
- target acquisition → V3 target lock, heavily rate-limited
- successful hazard control → target controlled cue if available

## Important

Do not synthesize fake V3 layers procedurally if the authored files are missing. Keep the current fallback path until real V3 assets arrive.

V2 drone files remain archived candidates only.

## Tests

- no immediate variant repeat for 3-variant family
- variant selection never reads or mutates gameplay RNG
- repeated 100 shots remain within voice/rate limits
- premium uses extra premium layers but is not simply louder
- hunter uses coordinated gesture, not three generic base shots
- mute/pause/dispose cancels delayed layer playback
- missing V3 files cleanly fall back without duplicate sound
