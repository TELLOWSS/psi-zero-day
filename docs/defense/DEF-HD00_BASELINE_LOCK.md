# DEF-HD00 — EXISTING DEFENSE BASELINE LOCK

Date: 2026-09-24
Repository: TELLOWSS/psi-zero-day
Baseline source: main @ a32b1f4f25ddc3daa52b97db41d410913a9e88c3

## Purpose

This Gate freezes the existing **DefenseGame** runtime before high-end construction-site visual production begins.

The goal is not to replace the engine. The goal is to preserve the proven defense rules/save/story contracts while replacing presentation, camera behavior, hazard semantics, world art and audio in later DEF-HD Gates.

## Runtime owner

The production defense game is:

- `src/ui/DefenseGame.tsx`
- `src/engine/defense.ts`
- `src/app/use-defense-persistence.ts`
- `src/app/defense-save.ts`
- `src/content/defense.ts`
- `content/defense/zero-breach-v1.json`
- `content/defense/events-v1.json`
- `src/ui/defense-game.css`
- `src/ui/useDefenseAudio.ts`

Episode 01 `StrategyMapShell` is **not** the DefenseGame production target.

## Immutable engine/data contracts for DEF-HD01+

### Board topology
- map id: `ramp-01`
- logical board: `1000×600`
- path:
  - (0,300)
  - (180,300)
  - (180,150)
  - (450,150)
  - (450,450)
  - (720,450)
  - (720,240)
  - (1000,240)

### Install pads
- P1 120,220
- P2 260,220
- P3 360,70
- P4 370,340
- P5 530,240
- P6 600,370
- P7 640,530
- P8 800,320

### Combat identities
Tower IDs:
- PULSE
- BURST
- CONTROL
- SENSOR

Enemy/risk IDs:
- NORMAL
- SWIFT
- ARMORED
- SWARM
- VEILED
- BOSS

Support IDs:
- COORDINATOR
- OBSERVER

### Rules baseline
- waves: 10
- tick: 50 ms
- initial shield: 20
- initial resource: 200
- save/persistence remains active
- pause/speed/upgrade/sell/target mode/support systems remain active

### Story bridge
Episode event:
- `event-ramp-reconstruction-v1`
- map: `ramp-01`
- base scenario: `training-ramp-v1`
- unlock requires training scenario clear + `ep01.ramp-signal-known`

## Legacy visual baseline

The existing files under:
- `public/assets/defense/board`
- `public/assets/defense/towers`
- `public/assets/defense/enemies`
- `content/defense/visual-production.json`

are preserved as **LEGACY PRODUCTION BASELINE**.

Their historical `PRODUCTION_LOCKED` status means they were locked for the previous ZERO BREACH art pass. It does **not** mean they satisfy the new high-end construction-site direction.

Do not delete them until replacement lineage and rollback are verified.

## Current gaps confirmed at DEF-HD00

1. Current board art is a tactical SVG board, not the new cinematic construction-site world.
2. Current portrait-phone runtime pauses combat and shows rotate guidance.
3. Current defense audio uses Web Audio oscillator cues; `BGM_MAIN_THEME_01` is not integrated.
4. The new high-quality MASTER DEFENSE MAP is not yet in DefenseGame runtime.
5. PR #45 targets Episode 01 StrategyMapShell and is outside this production line.

## Protected behavior

DEF-HD01+ must not silently break:
- save/load/recovery
- 10-wave balance shape
- pad IDs or logical coordinates
- tower/enemy/support IDs
- scenario IDs and event unlocks
- upgrade/sell/target-mode behavior
- pause/speed controls
- Episode 01 defense story bridge

Any intentional rule change requires a separate explicit design Gate.

## Next Gate

**DEF-HD01 — DEFENSE MASTER WORLD**

Build a high-quality construction-site world that is authored **to the existing 1000×600 logical board, route, and eight pad coordinates**.

Do not fit the existing engine onto an unrelated pretty image.

Acceptance for DEF-HD01:
- route and pads remain mathematically aligned
- new art reads as a real active construction site
- route is visually believable as site circulation / risk flow
- pad locations have plausible construction-control placement context
- no HUD/text baked into world art
- runtime overlays remain authoritative
- existing engine tests stay green
- visual replacement remains reversible until QA passes

## STOP LINE

Until DEF-HD01 is approved:
- do not merge PR #45 into main
- do not continue StrategyMapShell camera polish
- do not rename tower/enemy internal IDs
- do not rebalance waves
- do not integrate new BGM
- do not mass-produce equipment/characters
