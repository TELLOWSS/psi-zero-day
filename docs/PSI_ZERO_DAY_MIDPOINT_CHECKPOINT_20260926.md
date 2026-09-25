# PSI : ZERO DAY — Midpoint Checkpoint

**Checkpoint date:** 2026-09-26  
**Repository:** `TELLOWSS/psi-zero-day`  
**Purpose:** reconcile the 2026-09-24 Complete Master Bible with verified runtime progress and prevent roadmap drift.

---

## 1. Source-of-truth order

1. Locked product principles in `PSI_ZERO_DAY_COMPLETE_MASTER_BIBLE_20260924-1.md`
2. Latest verified `main` runtime
3. Gate-specific QA evidence and test contracts
4. Active gate design contracts
5. Experimental/draft branches only after their gate is explicitly promoted

The Master Bible remains the product constitution. Later gate documents may refine implementation order, but may not override the locked gameplay, visual, mobile, audio, safety, or zero-drift rules without an explicit contract change.

---

## 2. Non-negotiable product identity — unchanged

- Keep one `DefenseGame` core.
- The player experience is: **DEFENSE PLAY → CINEMATIC EVENT → HUMAN DECISION → DEFENSE CONSEQUENCE**.
- Preserve the human layer: field relationships, schedule pressure, judgment, responsibility, PSI signals, TBM/FIELD/OFFICE consequences, and Field Guide knowledge.
- Preserve protected board/gameplay contract unless a gate explicitly migrates it:
  - logical board 1000×600
  - 8 pads
  - 10 waves
  - Towers: PULSE / BURST / CONTROL / SENSOR
  - Risks: NORMAL / SWIFT / ARMORED / SWARM / VEILED / BOSS
- WORLD FIRST.
- IMPACT FIRST.
- MOBILE FIRST.
- AUDIO = GAMEPLAY.
- ONE PRODUCTION GENERATION.
- ONE GATE AT A TIME.
- No global engine rewrite.
- No separate mini-game per project type.
- No uncontrolled proliferation of risk IDs.
- Do not use real company/site/victim identifiers in production fiction.
- Game risk-priority values are not statutory risk-assessment scores.

---

## 3. Midpoint finding: roadmap number drift

The 2026-09-24 Master Bible used a macro roadmap where G4 was described as MOBILE and later gates were STORY / AUDIO / EXPANSION / CAMPAIGN / RELEASE.

After DEF-CORE-01 G3 was production-locked on 2026-09-25 — including 390×844 portrait QA — a newer implementation contract introduced a site/process runtime sequence:

- G4 — SITE-PROFILE-01
- G5 — MAP-FAMILY-01
- G6 — REMODEL-01
- G7 — DATA-CENTER-01
- G8-A — representative Production Map / Final Art gate

### Normalization rule

This is not a product-direction change.

- **MOBILE** remains a mandatory acceptance condition at every gate, rather than a one-time isolated gate.
- **STORY, AUDIO, CAMPAIGN, RELEASE** remain required macro production tracks.
- Numeric runtime gates G4+ now refer to the verified site/process implementation sequence.
- Future documents must name the macro tracks directly instead of reusing old gate numbers where that would create ambiguity.

---

## 4. Verified runtime promotion completed on 2026-09-26

### G3 — DEF-CORE-01: PASS / MAIN
Representative “한 걸음” vertical slice is locked.

Proven:
- SWIFT consequence
- CONTROL intervention
- cinematic/human decision cycle
- audio cue behavior
- desktop and 390×844 mobile event QA

### TITLE-DEFENSE-FIRST-01: PASS / MAIN
The home hierarchy now presents Field Defense as the primary game entry while retaining the broader PSI world.

### G4 — SITE-PROFILE-01: PASS / MAIN
Proven:
- ProjectArchetype / ConstructionMethod / ProcessPhase model
- dynamic PSI risk-priority calculation
- top-3 risk HUD
- field-readable process cues
- site profile persistence outside the protected defense save schema
- desktop and mobile QA with no horizontal overflow

Representative verified priorities:
- bottom-up RC frame: ARMORED > SWIFT > SWARM
- top-down under-slab: VEILED > SWARM > ARMORED
- changing field conditions changes the ranking

### G5 — MAP-FAMILY-01: PASS / MAIN
Proven with the same DefenseGame core:
- APT_NEW_BUILD / BOTTOM_UP / EXCAVATION
- APT_NEW_BUILD / TOP_DOWN / UNDER_SLAB_EXCAVATION
- distinct topology, zones, visibility, transfer points, routes, and runtime map identity
- 8-pad protected contract retained
- desktop/mobile QA passed

### G6 — REMODEL-01: PASS / MAIN
Proven:
- SURVEY / ISOLATION state
- as-built confidence
- temporary-support guard
- selective-demolition progression
- persisted remodeling state
- world/risk priority changes from verified actions
- practice/combat remains blocked until required state checks are satisfied
- mobile QA passed

### G7 — DATA-CENTER-01: PASS / MAIN
Proven:
- MEP → ENERGIZATION → INTEGRATED COMMISSIONING state transition
- energy state and isolation/interlock state
- live-critical / cross-trade concurrency behavior
- dynamic VEILED / ARMORED / SWARM / BOSS priority shifts
- persisted data-center state
- mobile QA passed

---

## 5. Active gate — G8-A PRE-ART

**State:** DRAFT / NOT FOR MAIN PROMOTION YET

G8-A is correctly blocked until genuinely final raster assets exist.

### Representative map
- `map-apt-bottom-up-excavation-01`

### World plate requirement
- master: **4000×2400 or larger**
- runtime: 1000×600
- final format: WebP / PNG
- high-oblique near-orthographic Korean construction-site view
- runtime topology must be preserved
- gameplay coordinates are never authored by the image model
- no text / logo / HUD baked into world art

### CONTROL
Current representative CONTROL runtime composite: PASS.

### SWIFT final-art blocker
Required role:
- reversing construction dump truck converging with a pedestrian route

Required final asset:
- transparent WebP/PNG
- non-SVG source
- source master at least **2048×1536**
- runtime target **78×58**
- high-oblique 3/4 rear or side-rear view
- believable dump-truck mass, tires, chassis and dump body
- unbranded
- no people/background/signage baked into asset
- no monster/fantasy/combat language

Forbidden:
- SVG final art
- rasterized legacy SVG
- low-resolution upscale
- flat pictogram/vector placeholder
- rectangular photo tile
- fake Korean text
- real manufacturer branding
- glowing enemy styling

### Promotion conditions
G8-A may not be promoted until actual-play QA proves:

- NON_SVG_FINAL_ASSETS
- KOREA_LAW_PROFILE_BOUND
- LEGAL_VISUAL_QA_PASS
- DESKTOP_ACTUAL_PLAY_QA_PASS
- MOBILE_390x844_QA_PASS
- ONE_PRODUCTION_GENERATION_PASS
- `activeSvgVisuals = 0`
- `prototypeBoardItems = 0`

The previous representative-map failure caused by prototype art is treated as a correct gate failure, not something to bypass.

---

## 6. Repository hygiene decisions

- PRs for TITLE, G4, G5, G6 and G7 have been sequentially promoted to `main`.
- G8-A remains a Draft PR and is retargeted to `main`.
- Legacy/experimental StrategyMapShell work must not be promoted into the protected DefenseGame line.
- Completed feature branches can remain as audit history; they are not the source of truth after promotion.
- No Vercel deployment should be called “production complete” unless the deployed SHA is verified against the intended `main` SHA.

---

## 7. What is now proven vs. what is not

### Proven
- Core defense play can carry the PSI identity.
- Human decision consequences can coexist with defense gameplay.
- Mobile 390×844 can remain a first-class acceptance target.
- One engine can represent bottom-up, top-down, remodeling and data-center contexts through state/topology/risk changes.
- Dynamic risk priority can change for visible world reasons without changing the protected six risk IDs.
- State-specific guards can prevent unrealistic progression.

### Not yet proven
- Full commercial final-art quality for the representative G8-A slice.
- Final SWIFT raster asset quality at phone scale.
- Full process-family art production across all maps.
- Complete campaign-scale story pacing across the expanded site archetypes.
- Full final audio library/mix across all new map families.
- Release-scale performance, telemetry, localization and store packaging for the expanded runtime.

---

## 8. Immediate production order from this checkpoint

1. **G8-A Final Art Generation**
   - one approved non-SVG bottom-up excavation world plate
   - one approved transparent SWIFT dump-truck master
   - reuse approved CONTROL actor/composite where contract allows

2. **G8-A Runtime Ingest**
   - runtime WebP derivatives
   - bind only approved manifests
   - remove prototype board items from the representative slice

3. **G8-A Legal / Visual QA**
   - Korean construction visual grounding
   - no invented legal numbers
   - no real company branding
   - readable vehicle/pedestrian conflict and control intervention

4. **G8-A Actual-play QA**
   - desktop
   - 390×844 mobile
   - CONTROL vs SWIFT intervention
   - event/cinematic transition
   - no SVG final visuals
   - no prototype board items

5. **G8-A Production Lock**
   - only after all above pass

6. **Then continue one representative gate at a time**
   - top-down final production map
   - remodeling representative final-art slice
   - data-center representative final-art slice
   - story/audio/campaign macro tracks on the locked production foundation

---

## 9. Midpoint decision

The project should **not** be restarted and the engine should **not** be replaced.

The correct path is to preserve the now-proven DefenseGame/runtime foundation and move from “systems proven” to “commercial final-art representative slice proven.”

> **Current focus: stop adding breadth. Make G8-A one complete, legally grounded, phone-readable, commercial-quality production slice.**
