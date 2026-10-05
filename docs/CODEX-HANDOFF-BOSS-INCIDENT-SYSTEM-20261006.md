# CODEX HANDOFF — 50 Stage Boss Incident System

**Branch:** `codex/boss-incident-system-20261006`  
**Director approval:** 2026-10-06  
**Goal:** 50개 스테이지를 50개의 서로 다른 공정 재해사건으로 전환한다. 기존 보스 엔진을 버리지 않고, 스테이지별 사고 메커니즘·필수 안전조치·원화 전환·검증 피니시를 데이터 주도로 추가한다.

## 1. Read first

1. `AGENTS.md`
2. `GAMEPLAY_DOCTRINE.md`
3. `docs/SURVIVORS-50-BOSS-INCIDENT-BIBLE-20261006.md`
4. `content/design/survivors-boss-incidents-v1.json`
5. `content/design/survivors-boss-incident-art-v1.json`
6. `docs/SURVIVORS-BOSS-PHASES-20261005.md`
7. `docs/SURVIVORS-BOSS-DIRECTION-20261005.md`

## 2. Existing runtime facts that MUST be preserved

- Pure TypeScript engine owns gameplay state/rules.
- Existing boss encounter already has `arrival → combat → secured`.
- Arrival currently freezes gameplay by early-returning from the engine step.
- Existing stage boss is spawned once after operation timing/controls.
- Existing boss families: `RUNAWAY_CART | CRANE_BOSS | FALLING_DEBRIS | GAS_LEAK`.
- Existing phase 2 latches at <= 50% at safe attack boundaries.
- Existing `bossCoreFloor` / `bossCoreStatus` provide an interlock concept.
- Reduced-motion behavior must remain functional.
- Existing save/unlock/stars must not be broken.
- Workers remain guide/rescue targets, never attack targets.

## 3. Target architecture

### 3.1 New domain model

Create `src/domain/survivors-boss-incident.ts`.

Recommended contract:

```ts
export type BossIncidentEngineFamily =
  | 'RUNAWAY_CART'
  | 'CRANE_BOSS'
  | 'FALLING_DEBRIS'
  | 'GAS_LEAK'
  | 'MULTI';

export interface BossIncidentDefinition {
  id: string;
  stageId: PatrolStageId;
  bossName: string;
  codeName: string;
  engineFamily: BossIncidentEngineFamily;
  accidentClass: string;
  caseArchetype: string;
  telegraphs: readonly string[];
  requiredControls: readonly string[];
  uniqueMechanic: string;
  finisher: string;
  learningPoint: string;
  presentation: {
    intro: 'full_bleed_original_art';
    introSeconds: number;
    gameplayFreeze: true;
    skippableAfterSeconds: number;
    returnToMapSeconds: number;
  };
}

export interface BossIncidentProgress {
  incidentId: string;
  phase: 'arrival' | 'read' | 'control' | 'verify' | 'secured';
  discoveredSignals: string[];
  completedControls: string[];
  verificationReady: boolean;
}
```

Do not bind localization text directly into engine logic. A loader/registry may ingest JSON and convert it to typed content.

### 3.2 Stage contract

Extend `PatrolStageDefinition` with:

```ts
bossIncidentId?: string;
```

Map all 50 stages to exactly one incident ID. Stage 50 uses the dedicated `MULTI` final-wave path.

### 3.3 State contract

Extend `SurvivorsGameState` without removing the existing `bossEncounter` compatibility fields.

Recommended:

```ts
bossIncident?: BossIncidentProgress;
```

During migration, `bossEncounter.phase` remains the external compatibility state. `bossIncident.phase` owns detailed incident progression.

## 4. Gameplay rule

Raw damage must NEVER be able to skip required safety controls.

Recommended rule:

```txt
arrival
  -> read at intro completion
  -> control after minimum signal discovery
  -> verify when all stage-required controls are satisfied
  -> secured after verification window/condition
```

Before `verify`, `bossCoreFloor` clamps HP/risk above a protected floor. After all required controls are met, the protected floor drops and the existing damage/response loop can close the encounter.

This preserves the current satisfying impact system while changing the reason the player wins.

## 5. Control gates

Do NOT implement 50 unrelated one-off systems first.

Create a small reusable gate vocabulary and compose it per stage:

- `STOP_WORK`
- `EVACUATE_ZONE`
- `SEPARATE_ROUTE`
- `LOCKOUT_TAGOUT`
- `VERIFY_ZERO_ENERGY`
- `ISOLATE_STORAGE`
- `VENTILATE_MEASURE`
- `RESTORE_GUARD`
- `VERIFY_RIGGING`
- `STABILIZE_LOAD`
- `SHORE_SUPPORT`
- `CLEAR_BELOW`
- `ESTABLISH_SPOTTER`
- `HANDOFF_CONFIRM`
- `VERIFY_EGRESS`

Translate the 50 human-readable `requiredControls` strings in the design JSON into these semantic IDs in a separate authored mapping. Do not infer them at runtime from Korean text.

## 6. Unique mechanic adapters

Implement a small adapter layer instead of branching the main engine 50 times.

Suggested `BossIncidentMechanicId` examples:

- `LINE_CHARGE_WITH_SPOTTER_GATE` — Stage 01
- `SWING_ARC_EXCLUSION` — Stage 02
- `DUAL_DROP_RIGGING_BALANCE` — Stage 03
- `INVISIBLE_PULSE_SENSOR_GATE` — Stage 04
- `TOPPLE_MOMENTUM` — Stage 05/18/38/43 variants
- `HIDDEN_SOURCE_DISCOVERY` — Stage 06/19/29/44
- `PROGRESSIVE_COLLAPSE_POINTS` — Stage 07/11/32/34
- `VERTICAL_LAYER_INTERLOCK` — Stage 24/39
- `STALE_ROUTE_MISMATCH` — Stage 25
- `EGRESS_AND_ATMOSPHERE` — Stage 30
- `CHAPTER_MULTI_INTERLOCK` — 10/20/30/40
- `ZERO_DAY_WHOLE_SITE` — Stage 50

Each adapter may alter warning geometry, discovery information or interlock progression, but must not mutate unrelated systems.

## 7. Boss introduction UI

Replace the current text-only boss alert experience with a dedicated component:

`src/ui/SurvivorsBossIncidentTransition.tsx`

Rules:
- full-bleed original art from `content/design/survivors-boss-incident-art-v1.json`
- 5s ordinary boss / 8s chapter boss
- gameplay remains frozen during arrival
- title + one-line accident clue may be DOM text, never baked into artwork
- user may skip only after 1.5s
- transition back to exact gameplay position within 0.3–0.5s
- 16:9 first; 9:16 safe crop required
- reduced motion: no zoom/parallax, simple dissolve
- no generic fallback artwork is production-acceptable. Missing final asset = keep feature flagged/off for that stage.

Do not make this a modal with a card floating over the game. It should read as a page/scene transition.

## 8. Art asset naming

Final assets:
- `public/assets/survivors/boss-incidents/stage-01-intro-v1.webp`
- ...
- `public/assets/survivors/boss-incidents/stage-50-intro-v1.webp`

Portrait safe-crop optional companion:
- `stage-XX-intro-portrait-v1.webp`

Use `content/design/survivors-boss-incident-art-v1.json` as the source of truth.

## 9. Finisher / clear presentation

Do not explode bosses into fantasy debris as the primary finish.

Required finish sequence:
1. danger motion stops
2. active hazard audio drops
3. control/verification state becomes visibly stable
4. short strong confirmation cue
5. workers/routes/equipment visibly move into a safe state
6. result text states what was controlled and what can safely resume

The 'dopamine' moment is the sudden release of tension and visible restoration of control.

## 10. Stage 50 special rule

Stage 50 is not a giant `CRANE_BOSS`.

Implement it last.

- no single monster/entity as the final meaning
- whole site is the boss wave
- combine vehicle, lifting, falling, stored-energy and communication signals
- reuse learned gate vocabulary
- previously established records/relationships may reduce discovery delay or auto-surface a signal, but must not auto-win
- climax: all site audio narrows/dropouts → STOP WORK → signals resolve one by one → normal site audio returns
- final meaning: accident did not happen because the chain was broken early

## 11. Implementation slices

### Slice A — content + registry
- typed loader
- 50 IDs unique
- stage mapping
- schema validation tests
- no gameplay change yet

### Slice B — generic incident state machine
- detailed phases
- generic control gate progress
- HP/risk interlock integration
- existing 4 base boss families unchanged when incident feature disabled

### Slice C — intro transition
- new transition component
- asset manifest loader
- reduced-motion path
- responsive portrait/landscape tests

### Slice D — first 5 representative incidents
Implement and tune:
- Stage 01 vehicle blind reverse
- Stage 03 lifting balance
- Stage 04 invisible atmosphere
- Stage 07 progressive demolition collapse
- Stage 19 electrical backfeed

These five cover moving, lifting, invisible, structural and electrical patterns.

### Slice E — Chapter Bosses
- 10 / 20 / 30 / 40

### Slice F — remaining 41 ordinary incidents
Use adapters, not 41 giant bespoke engine branches.

### Slice G — Stage 50
Whole-site final wave after all reusable mechanics are stable.

## 12. Tests / acceptance

### Data tests
- exactly 50 incident definitions
- all stage IDs 01–50 exactly once
- boss IDs unique
- each incident has >=3 telegraphs and >=3 required controls
- no blank learning point/finisher
- every art manifest entry matches an incident

### Engine tests
- raw damage cannot cross protected floor before gate completion
- completing the right controls exposes verify phase
- wrong/unrelated control does not advance incident
- phase 2 still changes only at a safe motion boundary
- ordinary non-boss hazards retain current behavior
- pause/store/arsenal remain blocked during non-combat arrival/secured transitions
- reduced-motion does not change collision/timing

### UI tests
- transition is not a floating modal
- 360x800, 390x844, 844x390, 1440x900 no overflow
- title remains DOM text
- portrait safe crop preserves hazard clue
- skip unavailable before 1.5s
- return-to-play camera/map location remains coherent

### Stage 50 tests
- no requirement for a single boss sprite
- all required hazard classes appear as authored signals
- STOP WORK transition cannot be skipped by DPS
- victory only after final verify/handoff state

## 13. Non-goals for this task

- Do not rebalance the entire weapons economy.
- Do not redesign the 50 stage maps.
- Do not alter unrelated Episode 01 story content.
- Do not add backend/cloud systems.
- Do not fabricate real named accident victims/sites.
- Do not call placeholder art 'Production Locked'.

## 14. Completion report format

Follow `AGENTS.md` exactly:

- IMPLEMENTED
- FILES
- TEST
- TODO
- DIRECTOR REVIEW

## 15. Director intent in one sentence

> 50개의 스테이지를 50개의 서로 다른 실제 현장형 재해사건으로 기억하게 만들고, 플레이어가 위험을 이해해야만 통제할 수 있게 한다.
