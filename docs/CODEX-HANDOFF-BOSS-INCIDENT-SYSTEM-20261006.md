# CODEX HANDOFF — 50 Stage Boss Gameplay + Incident System

**Branch:** `codex/boss-incident-system-20261006`  
**Director gameplay rebaseline:** 2026-10-06

## 0. Precedence

Read these in order:

1. `AGENTS.md`
2. `GAMEPLAY_DOCTRINE.md`
3. `docs/SURVIVORS-50-BOSS-GAMEPLAY-BIBLE-20261006.md`
4. `content/design/survivors-boss-gameplay-v1.json`
5. `docs/SURVIVORS-50-BOSS-INCIDENT-BIBLE-20261006.md`
6. `content/design/survivors-boss-incidents-v1.json`
7. `content/design/survivors-boss-control-gates-v1.json`
8. `content/design/survivors-boss-incident-art-v1.json`
9. existing boss phase/direction documents

**Gameplay Bible overrides player-facing pacing, mandatory interaction count and combat presentation.**  
Incident Bible remains the realism/source layer: process, accident mechanism, telegraphs, safety meaning and post-clear learning.

## 1. Director intent

The player should feel:

> “강력한 보스 패턴을 읽고 약점을 열어 폭딜했다.”

before feeling:

> “이 패턴이 실제 현장의 이런 위험을 표현한 것이구나.”

Target perceived ratio: **Gameplay 80 / Safety explanation 20.**

The game must not become a safety checklist simulator.

## 2. New boss formula

```txt
ATTACK PATTERN
→ READ SIGNAL
→ OPEN WEAK POINT
→ BURST DAMAGE
→ FINISHER
→ ONE-LINE REAL-WORLD DEBRIEF
```

Safety logic is embedded under the combat mechanic.

Examples:

| Safety truth | Player-facing game verb |
| --- | --- |
| STOP WORK | STAGGER / PATTERN CANCEL |
| LOTO | SHIELD BREAK |
| Clear below | DROP ATTACK CANCEL |
| Restore guard | SAFE ZONE |
| Separate route | ROUTE CHANGE |
| Verify rigging | WEAK POINT REVEAL |
| Ventilate | HAZARD FIELD SHRINK |
| Stabilize load | STAGGER |
| Verify egress | ESCAPE ROUTE |

Do not display long safety procedure text during combat.

## 3. Mandatory mechanic budget

### Regular boss
- 2 phases
- exactly **one signature mandatory mechanic**
- 2.4s first-play intro
- replay skip after 0.35s
- one clear burst window

### Major boss (stage divisible by 5, not chapter)
- 3 phases
- one signature mechanic plus one escalation
- 3.2s first-play intro

### Chapter boss 10/20/30/40
- 3 phases
- 2–3 previously learned mechanics combined
- 4.2s first-play intro

### Stage 50
- 4 phases
- whole-site final wave
- 5.5s first-play intro
- prior mechanics return as short variants

Do not make ordinary stages require all semantic safety gates as explicit player actions.

## 4. DPS and progression rule

Previous handoff language that required all safety controls before the core can fully open is superseded.

New rule:

- Every boss has one signature pattern the player must engage with.
- Raw DPS cannot delete or bypass that signature pattern.
- Successfully reading/countering the signature pattern creates a **burst window**.
- During the burst window, weapon strength, build quality, upgrades and premium equipment matter substantially.
- Strong builds may clear in fewer cycles.
- Weak builds may need additional cycles.
- No build gets automatic pattern completion or invulnerability.

This preserves both game skill and build progression.

## 5. Premium item rule

Premium gear must feel premium without becoming pay-to-skip.

Allowed:
- stronger burst damage
- richer VFX/SFX
- longer or more forgiving weak-point exposure
- faster cleanup of secondary nodes
- clearer high-quality targeting feedback
- distinctive premium animation

Forbidden:
- auto-identify puzzle answer
- automatic gate completion
- immunity to boss pattern
- one-shot every boss regardless of pattern

## 6. Visual identity

The old restriction “never make bosses monster-like” is narrowed.

Forbidden:
- human workers as enemies
- faces/eyes/mouths pasted onto cranes/equipment
- fantasy creature anatomy replacing the real process

Allowed and encouraged:
- exaggerated scale and silhouette
- crane cables dominating the arena like a web
- hose behaving like a violent whip
- rebar cage reading like a rotating spear field
- vapor behaving like a living zone
- electrical network behaving like a hostile circuit
- collapse propagation behaving like a boss phase

The process stays recognizable; danger may be theatrically amplified.

## 7. Intro transition

Use `SurvivorsBossIncidentTransition`, but it must feel like a boss entrance, not an education modal.

- full-bleed art
- boss name
- one short combat clue, 1–4 words
- no paragraph
- no safety checklist
- ordinary: 2.4s first play
- major: 3.2s
- chapter: 4.2s
- final: 5.5s
- replay skip after 0.35s
- return to gameplay in <=0.5s
- reduced motion = dissolve only

Missing final art keeps the art enhancement off; it must not block core gameplay implementation.

## 8. Data model

Keep the incident content model, but add a separate gameplay overlay.

Source:
`content/design/survivors-boss-gameplay-v1.json`

Recommended typed contract:

```ts
export type BossCombatArchetype =
  | 'ACTION'
  | 'PATTERN'
  | 'PUZZLE'
  | 'SURVIVAL'
  | 'MULTI'
  | 'FINAL';

export interface BossGameplayDefinition {
  stageId: PatrolStageId;
  bossId: string;
  combatArchetype: BossCombatArchetype;
  primarySkill: string;
  patternId: string;
  encounterTier: 'REGULAR' | 'MAJOR' | 'CHAPTER' | 'FINAL';
  phaseCount: number;
  combatLoop: string;
  weakPointId: string;
  burstWindowSeconds: number;
  playerFacingMechanic: string;
  premiumHook: string;
  failureRead: string;
}
```

Engine code must consume semantic IDs, not parse Korean prose.

## 9. Engine architecture

Do not create 50 boss classes.

Use:
- existing four physical families
- reusable warning geometry
- reusable weak-point state
- reusable burst-window state
- reusable pattern adapters
- stage gameplay data overlay

Recommended generic state:

```ts
type BossCombatPhase =
  | 'arrival'
  | 'pattern'
  | 'weak_point'
  | 'burst'
  | 'recovery'
  | 'secured';

interface BossGameplayProgress {
  bossId: string;
  combatPhase: BossCombatPhase;
  phaseIndex: number;
  signatureResolvedThisCycle: boolean;
  burstRemaining: number;
  cycleCount: number;
}
```

The existing boss phase 2 safe-boundary behavior must remain compatible.

## 10. Representative first implementation set

Implement these first because together they test the full design:

- Stage 01 — ACTION / reverse charge
- Stage 03 — PATTERN / dual-drop rigging
- Stage 04 — SURVIVAL / invisible field
- Stage 07 — SURVIVAL / progressive collapse
- Stage 19 — PUZZLE / backfeed
- Stage 14 — PATTERN / pendulum + debris, visual benchmark

Stage 14 is the visual/combat reference:
`PENDULUM → DEBRIS RAIN → DROP ZONE BREAK → 4.5s BURST`

## 11. Chapter bosses

Stages 10/20/30/40 combine learned mechanics. They must not become four-step forms.

Each phase should read primarily through movement, warning geometry, audio and visual state.

At most one short objective label should be active at a time.

## 12. Stage 50

Implement last.

Stage 50 intentionally breaks the single-boss expectation.

- vehicle
- lifting
- falling object
- energy
- communication/process pressure

return as compact overlapping variants.

Three major crisis chains must be broken. Then open an 8-second final ALL CLEAR resolution.

The final realization is narrative, not tutorial text:

> the bosses were faces of accident chains before they became accidents.

## 13. Player-facing text

During combat use only concise game language such as:

- BLIND SIDE
- LOAD UNSTABLE
- CLEAR BELOW
- CORE EXPOSED
- POWER LIVE
- ROUTE BLOCKED
- PRESSURE RISING
- STAGGER
- ALL CLEAR

Real-world safety explanation belongs after clear in one short sentence sourced from the Incident Bible.

## 14. Tests / acceptance

### Data
- exactly 50 gameplay entries
- stage_01..stage_50 exactly once
- gameplay bossId resolves to incident bossId
- archetype is valid
- regular bosses have phaseCount=2
- chapter bosses have phaseCount=3
- Stage 50 phaseCount=4

### Combat
- signature mechanic cannot be bypassed by pre-burst raw DPS
- after signature success, burst window opens
- strong build materially increases damage during burst
- boss can require another cycle if damage is insufficient
- premium gear does not auto-resolve signature pattern
- ordinary hazards remain unchanged
- existing phase-boundary timing remains stable

### Pacing
- no ordinary boss asks for 3 explicit safety actions
- no long safety prose in combat
- ordinary first-play boss interruption <=2.4s
- replay interruption <=0.35s before skip
- five consecutive stages include varied combat rhythms

### Presentation
- boss process still recognizable
- visual exaggeration improves intimidation without fantasy monster faces
- finisher is satisfying stabilization/control rather than gore

## 15. Implementation slices

A. Typed gameplay registry + validation only.  
B. Generic signature → weak point → burst state.  
C. Stage 01/03/04/07/19/14 adapters.  
D. Boss entrance timing/UI rebaseline.  
E. Chapter bosses 10/20/30/40.  
F. Remaining regular/major stages.  
G. Stage 50.  
H. Natural-play tuning for fun, build diversity and repetition.

Do not advance from a failing slice.

## 16. Completion report

Follow `AGENTS.md`:
- IMPLEMENTED
- FILES
- TEST
- TODO
- DIRECTOR REVIEW
