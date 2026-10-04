# PSI GRAPHICS VERTICAL SLICE 01 — Stage 01 GPU Presentation Bridge

Date: 2026-10-04
Branch: `codex/graphics-vertical-slice-01`

## Goal

Raise the shooting mode from a flat 2D presentation toward the reference-ad level of depth and impact **without rewriting the simulation, progression, stage logic, safety semantics, or React HUD**.

This is the first production experiment for the agreed hybrid direction:

`existing Survivors simulation → authoritative Canvas gameplay → transparent WebGL production FX → React HUD`

## Why this is a vertical slice

Only `stage_01` receives the new GPU presentation layer. Other stages continue to render exactly through the existing Canvas path.

If the slice does not look materially better on a real Android device, do not expand it to stages 02–20.

## Runtime contract

The WebGL layer:

- reads projectile feedback facts but never changes damage, collision, timing, movement or targeting;
- ignores worker confirmation events;
- ignores non-emissive extinguisher/cone contacts;
- gives premium optical loadouts a visibly larger/brighter launch/impact light response;
- adds GPU floodlight pools and a subtle premium player light pool;
- is transparent and pointer-events disabled;
- clears itself outside Stage 01;
- disables animated GPU presentation in reduced-motion mode;
- may fail or be unavailable without blocking gameplay.

## Acceptance gate

Do not call this Production Locked until all are checked on a real device:

1. Stage 01 standard equipment: no washed-out warnings or unreadable telegraphs.
2. Stage 01 premium equipment: premium state is recognizable without reading the HUD.
3. Dense fire: stable frame pacing and no long-lived full-screen glow.
4. Landscape: GPU layer remains aligned with the authoritative Canvas camera.
5. Portrait: GPU layer remains aligned after resize/orientation changes.
6. Reduced motion: new GPU pulses are disabled.
7. Android: no black WebGL canvas, context-loss crash or touch interception.
8. Audio/VFX timing: launch light, projectile travel and impact sound feel synchronized.

## Next decision

Only after visual/device QA:

- PASS → extend the same renderer contract to stages 02–05, then 06–20.
- PARTIAL → tune pulse size/intensity and camera registration first.
- FAIL → keep the current Canvas renderer and do not expand WebGL.

This slice is a rendering upgrade, not a new game and not an engine rewrite.
