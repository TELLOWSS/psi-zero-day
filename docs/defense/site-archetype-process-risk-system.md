# PSI : ZERO DAY — Site Archetype × Process Map × Dynamic Risk Priority System

Status: DESIGN CONTRACT / NOT YET RUNTIME-IMPORTED  
Target after: DEF-CORE-01 G3 Production Lock  
Rule: ONE GATE AT A TIME — this document may guide future implementation but must not alter the current locked DefenseGame balance until the active gate is closed.

---

## 1. Why this system exists

PSI : ZERO DAY must not feel like one construction-site background with enemy skins changed.

The player should be able to feel:

> "This site is different, therefore the next dangerous thing is different."

The game therefore needs three independent but connected axes:

1. **Project Archetype** — what kind of facility is being built or altered.
2. **Construction Method** — how the structure is being built.
3. **Current Process / Phase** — what work is actually happening now.

These three axes change:
- the visible map,
- access routes,
- vertical layers,
- worker/equipment density,
- hidden information,
- top risk ranking,
- which intervention reads as effective,
- which cinematic event is likely to fire next.

This is not a menu-only difficulty modifier. The world itself must change.

---

## 2. Research basis

This design is based on the following real-world distinctions.

### Underground construction
Korean construction references distinguish open-cut / bottom-up work from top-down work.

- Bottom-up generally exposes the excavation and temporary retaining/support system first, then constructs the permanent structure upward.
- Top-down uses permanent floor slabs as part of the retaining support while excavation proceeds downward.
- Top-down can reduce retaining-wall deformation, but introduces different operational complexity: access openings, underground muck-out, vertical logistics, low-clearance work, and concurrent upper/lower activities.

Game rule:
**Do not label one method globally safer. Change the risk profile instead.**

### Apartment remodeling
Major remodeling is not "new construction with an old texture."

Important differences include:
- existing structural condition,
- drawing/as-built uncertainty,
- load-path change,
- selective demolition,
- temporary support,
- foundation reinforcement,
- existing utility isolation,
- concrete cutting / wire saw / core drilling,
- debris transport,
- hazardous material survey,
- structural connection between old and new work.

Current Korean housing law also means "20-pyeong becomes 40-pyeong by simple enlargement" must not be taught as a normal rule.
The game should represent real categories such as:
- horizontal extension,
- vertical extension where permitted,
- layout / household reconfiguration,
- structural and foundation strengthening,
- common-area improvement.

### Data center
Data centers share ordinary construction hazards early, but risk character changes sharply during MEP installation and commissioning.

Late-stage world features include:
- high-density electrical distribution,
- switchgear,
- UPS / battery energy storage,
- generators,
- chilled-water / cooling systems,
- fire protection,
- server/data halls,
- testing and integrated commissioning,
- transition from construction state to energized/operational state.

Game rule:
A data center must not remain "an apartment map with servers."
The late game must pivot from structural construction risk toward **energy state, system interaction, commissioning, and simultaneous specialist work**.

---

## 3. The top-level selection model

### PROJECT_ARCHETYPE

#### APT_NEW_BUILD
New apartment / residential tower construction.

#### APT_REMODEL
Existing apartment retained and structurally / spatially remodeled.

#### DATA_CENTER
Mission-critical data center construction.

Future archetypes may be added later, but these three form the first complete family.

### CONSTRUCTION_METHOD

For APT_NEW_BUILD:
- BOTTOM_UP
- TOP_DOWN

For APT_REMODEL:
- HORIZONTAL_EXTENSION
- VERTICAL_EXTENSION
- STRUCTURAL_RECONFIGURATION

For DATA_CENTER:
- CONVENTIONAL
- PHASED
- MODULAR_PHASED

Important:
Project archetype and construction method are not cosmetic tags.
They must alter map topology and risk-priority modifiers.

---

## 4. Process-map families

A "process map" is not only a new background image.

Every process map owns:
- master world art,
- playable path network,
- intervention anchors,
- restricted zones,
- vertical transfer points,
- visibility state,
- equipment routes,
- worker routes,
- active-system zones,
- process-specific ambient audio,
- risk-priority modifiers.

### A. APT_NEW_BUILD / BOTTOM_UP

#### MAP A1 — SITE + EXCAVATION
World:
- perimeter retaining wall,
- open excavation,
- ramp,
- spoil/loading area,
- excavator / dump-truck routes,
- dewatering points.

Priority tendency:
1. ARMORED — ground / retaining / structural instability
2. SWIFT — heavy-equipment and truck movement
3. VEILED — groundwater, buried services, unseen ground condition
4. SWARM — congestion at ramp/loading interface

#### MAP A2 — FOUNDATION + BASEMENT
World:
- raft / footing,
- rebar congestion,
- waterproofing,
- tower-crane lifting,
- pits and openings.

Priority tendency:
1. ARMORED
2. SWARM
3. NORMAL
4. VEILED

#### MAP A3 — RC FRAME
World:
- formwork,
- rebar,
- slab edges,
- cores,
- climbing form / gang form,
- temporary supports.

Priority tendency:
1. ARMORED
2. SWIFT
3. SWARM
4. NORMAL

#### MAP A4 — ENVELOPE + MEP + FINISH
World:
- façade work,
- hoists,
- internal openings,
- multiple trades,
- material staging.

Priority tendency:
1. SWARM
2. NORMAL
3. SWIFT
4. VEILED

---

## 5. APT_NEW_BUILD / TOP_DOWN

Top-down must be visually and mechanically different.

### MAP T1 — PERIMETER WALL + TOP SLAB
World:
- diaphragm/slurry wall or equivalent retaining perimeter,
- columns / king posts,
- top slab,
- excavation openings,
- restricted lifting holes.

Priority tendency:
1. ARMORED
2. VEILED
3. SWIFT

### MAP T2 — UNDER-SLAB EXCAVATION
World:
- slab overhead,
- low-clearance work zone,
- muck-out openings,
- excavator below grade,
- vertical lifting / spoil removal,
- temporary lighting / ventilation.

Priority tendency:
1. VEILED — sight limitation / hidden state
2. SWARM — multiple interfaces and constrained routes
3. ARMORED — retaining / slab / temporary-state structure
4. SWIFT — equipment movement in confined space

### MAP T3 — CONCURRENT ABOVE / BELOW
World:
- upper structure continuing,
- lower excavation continuing,
- vertical openings connect work fronts,
- crane and spoil logistics overlap.

Priority tendency:
1. SWARM
2. VEILED
3. ARMORED
4. SWIFT

Design intent:
Top-down's advantage in retaining-wall movement control must not translate into "easy mode."
It changes the player problem from open excavation control toward **concurrency, visibility, openings, and vertical logistics**.

---

## 6. APT_REMODEL

### MAP R1 — EXISTING BUILDING SURVEY / ISOLATION
World:
- old apartment structure,
- marked columns / walls,
- existing utility shafts,
- scan/test points,
- isolated and non-isolated systems.

Priority tendency:
1. VEILED
2. ARMORED
3. NORMAL

Gameplay:
SENSOR value rises because the first job is to know what is actually there.

### MAP R2 — SELECTIVE DEMOLITION
World:
- saw-cut walls/slabs,
- debris,
- temporary supports,
- small excavator / demolition tools,
- protected retained structure.

Priority tendency:
1. ARMORED — structural stability / load path
2. VEILED — unknown existing conditions / utilities
3. SWARM — demolition + debris + support work
4. SWIFT — small plant / debris transport

### MAP R3 — FOUNDATION / STRUCTURAL REINFORCEMENT
World:
- underpinning / foundation reinforcement zones,
- jack supports,
- new columns / beams / frames,
- old-new structural interfaces.

Priority tendency:
1. ARMORED
2. VEILED
3. SWARM

### MAP R4 — HORIZONTAL / VERTICAL EXTENSION CONNECTION
World:
- existing building on one side,
- new extension frame on the other,
- connection joints,
- temporary openings,
- edge work,
- lifting corridor.

Priority tendency:
1. ARMORED
2. SWIFT
3. SWARM
4. VEILED

### MAP R5 — MEP REROUTE + FINISH
World:
- old/new service conflicts,
- vertical shafts,
- ceiling congestion,
- hot work,
- finishing crews.

Priority tendency:
1. SWARM
2. VEILED
3. NORMAL
4. SWIFT

Special rule:
Remodeling receives an **AS_BUILT_CONFIDENCE** state.
Low confidence raises VEILED priority until surveys / scans / verification actions reduce it.

---

## 7. DATA_CENTER

### MAP D1 — CIVIL + STRUCTURE
World:
- large-footprint structure,
- steel / precast / RC zones,
- heavy lifts,
- loading areas.

Priority tendency:
1. ARMORED
2. SWIFT
3. SWARM

### MAP D2 — MEP ROUGH-IN
World:
- dense overhead cable tray,
- duct,
- pipe racks,
- risers,
- multiple specialist trades.

Priority tendency:
1. SWARM
2. NORMAL
3. VEILED
4. SWIFT

### MAP D3 — ELECTRICAL + UPS / BATTERY
World:
- switchgear rooms,
- UPS,
- battery rooms / BESS where applicable,
- busway / distribution paths,
- controlled access zones.

Priority tendency:
1. VEILED — energy state may not be visually obvious
2. ARMORED — high-consequence electrical / stored-energy systems
3. SWARM — specialist interface / testing overlap

### MAP D4 — COOLING PLANT
World:
- chillers / pumps,
- cooling piping,
- valves,
- mechanical rooms,
- rooftop / yard plant.

Priority tendency:
1. ARMORED
2. SWARM
3. VEILED

### MAP D5 — WHITE SPACE / SERVER HALL
World:
- racks,
- overhead services,
- underfloor / distribution zones where applicable,
- constrained material routes,
- clean-zone requirements.

Priority tendency:
1. SWARM
2. VEILED
3. NORMAL

### MAP D6 — COMMISSIONING / ENERGIZATION
World:
- energized-state overlays,
- test boundaries,
- generator / UPS states,
- cooling-system state,
- fire-system state,
- commissioning teams.

Priority tendency:
1. VEILED
2. BOSS
3. ARMORED
4. SWARM

Critical design rule:
At commissioning, "what is live?" becomes gameplay.
The map should visually distinguish:
- NOT INSTALLED
- INSTALLED
- TESTING
- ENERGIZED
- LOCKED OUT
- LIVE CRITICAL

The player must read system state, not simply enemy speed.

---

## 8. Existing Risk IDs become context carriers

Do not create dozens of new enemy IDs yet.

Keep the protected six IDs and reinterpret them per site.

### NORMAL
Visible, routine hazard.
Examples:
- unprotected edge,
- housekeeping,
- ordinary workfront exposure.

### SWIFT
Fast-moving / rapidly changing hazard.
Examples:
- reversing vehicle,
- moving plant,
- lifted load approaching,
- sudden logistics conflict.

### ARMORED
Heavy, structural, high-inertia hazard.
Examples:
- retaining system,
- temporary support,
- heavy member,
- foundation / structural instability,
- major stored-energy equipment.

### SWARM
Concurrency / crowding / many small interacting hazards.
Examples:
- multi-trade congestion,
- repeated deliveries,
- dense MEP installation,
- simultaneous work fronts.

### VEILED
Hidden, uncertain, or state-dependent hazard.
Examples:
- groundwater / buried utility,
- unknown existing structure,
- concealed service,
- unclear energization state,
- incomplete information.

### BOSS
Compound major-event state.
Not a monster.
It represents multiple systems aligning badly at once.

Examples:
- top-down simultaneous logistics failure around a major opening,
- remodeling temporary-support + demolition sequence failure,
- data-center integrated commissioning conflict across electrical + cooling + fire systems.

---

## 9. Dynamic Risk Priority Engine

### Principle

Risk order must be calculated from context, not hard-coded by map title.

### Inputs

`RiskPriorityContext`

- projectArchetype
- constructionMethod
- processPhase
- verticalLayer
- activeWorkfronts
- activeEquipment
- occupancyState
- energyState
- asBuiltConfidence
- groundwaterState
- logisticsCongestion
- weatherState
- timePressure
- currentSignals
- unresolvedHistory

### Game score

This is a **game-priority score**, not a statutory risk-assessment substitute.

Suggested structure:

`score = base + project + method + phase + state + concurrency + uncertainty + signal + memory`

Each component is data-driven and clamped to 0–100.

Do not use one global "danger level."
Calculate one score per risk family.

Example output:

```
APT_NEW_BUILD / TOP_DOWN / UNDER_SLAB_EXCAVATION
VEILED  86
SWARM   78
ARMORED 74
SWIFT   61
NORMAL  42
BOSS    18
```

After the player improves lighting, closes an opening, separates muck-out traffic, and confirms retaining monitoring:

```
VEILED  62
SWARM   51
ARMORED 58
SWIFT   37
NORMAL  40
BOSS    10
```

The ranking changes because the world changed.

---

## 10. Priority changes must affect gameplay

A changed risk ranking must alter at least four things:

1. **Spawn composition**
   - existing six risk IDs only at first.

2. **Signal presentation**
   - what sound / movement / person behavior appears first.

3. **Tower/intervention value**
   - SENSOR becomes more important in uncertain remodeling or energized-state maps.
   - CONTROL gains value in logistics-heavy maps.
   - PULSE gains value when one immediate workfront must be stopped / corrected.
   - BURST gains value in congested simultaneous-work zones.

4. **Cinematic trigger pool**
   - the highest unresolved risk family influences the next event.

Risk rank must not simply add enemy HP.

---

## 11. Map architecture

Future `DefenseMapDefinition` should be extended conceptually with:

```ts
interface SiteProcessMapDefinition {
  id: string
  projectArchetype: ProjectArchetype
  constructionMethod: ConstructionMethod
  processPhase: ProcessPhase

  worldArt: string
  width: 1000
  height: 600

  routes: {
    vehicle: Point[][]
    worker: Point[][]
    material: Point[][]
  }

  interventionAnchors: InterventionAnchor[]
  restrictedZones: Zone[]
  verticalTransfers: VerticalTransfer[]
  systemZones: SystemZone[]
  visibilityZones: VisibilityZone[]

  baseRiskModifiers: Partial<Record<DefenseEnemyId, number>>
}
```

Important:
The current 1000×600 logical board can remain.
Different process maps may change routes and anchor positions only after the current gate is closed and a migration contract is created.

---

## 12. Multi-layer world

Top-down, remodeling, and data centers need verticality.

Do not solve this with a fake 3D camera first.

Use readable layers:
- SURFACE
- B1
- B2
- TYPICAL_FLOOR
- ROOF / PLANT
- SYSTEM_VIEW where applicable

The player can switch layer, but active danger in another layer can still generate weak signals.

Example:
A top-down B2 excavator conflict can create:
- sound on SURFACE,
- vibration / warning signal at B1,
- actual incident path on B2.

This strengthens PSI's identity:
**the player learns to connect weak signals across space.**

---

## 13. Selection flow

Before a campaign / scenario:

### Step 1 — Facility
- 공동주택 신축
- 공동주택 리모델링
- 데이터센터

### Step 2 — Method
Context-sensitive options only.

Example:
Apartment New Build:
- 순타
- 역타

Apartment Remodel:
- 수평증축 중심
- 수직증축 중심
- 구조재구성 중심

Data Center:
- Conventional
- Phased
- Modular / Phased

### Step 3 — Starting process
Campaign determines this in story mode.
Sandbox / training may allow manual selection.

The UI immediately previews:
- process map,
- top three current risks,
- key uncertainty,
- expected logistics pattern.

Never show "easy / normal / hard" based only on construction method.

---

## 14. Example risk pivots

### Apartment / Bottom-up
Excavation:
ARMORED > SWIFT > VEILED

Frame:
ARMORED > SWIFT > SWARM

Finish:
SWARM > NORMAL > VEILED

### Apartment / Top-down
Top slab:
ARMORED > VEILED > SWIFT

Under-slab excavation:
VEILED > SWARM > ARMORED

Concurrent above/below:
SWARM > VEILED > ARMORED

### Apartment Remodel
Survey:
VEILED > ARMORED > NORMAL

Selective demolition:
ARMORED > VEILED > SWARM

Old/new connection:
ARMORED > SWIFT > SWARM

MEP reroute:
SWARM > VEILED > NORMAL

### Data Center
Structure:
ARMORED > SWIFT > SWARM

MEP rough-in:
SWARM > NORMAL > VEILED

Electrical/UPS:
VEILED > ARMORED > SWARM

Commissioning:
VEILED > BOSS > ARMORED > SWARM

These are initial **design priors**, not accident-frequency statistics.
They must be tuned through playtest and safety-domain review.

---

## 15. Human-story consequences

Different site choices also change people.

Examples:

### Bottom-up apartment
- earthwork team,
- formwork / rebar,
- crane / logistics,
- high-rise production pressure.

### Top-down apartment
- civil + building interface,
- underground logistics,
- surveying / monitoring,
- upper/lower team coordination conflict.

### Remodeling
- veteran worker who trusts old drawings,
- structural engineer who wants verification,
- demolition foreman under schedule pressure,
- resident/owner expectation reflected through management pressure.

### Data center
- electrical commissioning engineer,
- mechanical commissioning engineer,
- vendor technician,
- operations representative,
- construction manager,
- permit / isolation coordinator.

The same decision should produce different relationship consequences by project type.

---

## 16. PSI integration

The dynamic risk engine must feed PSI.

Existing PSI concept:
> 사고 전 신호를 모아 다음 위험을 먼저 읽는 안전지능.

New behavior:

`SITE PROFILE → PROCESS STATE → SIGNALS → RISK PRIORITY → PLAYER ACTION → WORLD CHANGE → NEW PRIORITY`

PSI should not say:
"Risk 1 is always fall."

It should say:
"Given this site, method, process and unresolved signals, this is what is rising now."

That is the difference between a safety quiz and a safety-intelligence game.

---

## 17. Production order

Do not mass-produce all maps now.

### Gate G3
Finish DEF-CORE-01 "한 걸음."

### Gate G4 — SITE-PROFILE-01
Implement the selection/data model only.
No new art explosion.

Required:
- ProjectArchetype
- ConstructionMethod
- ProcessPhase
- risk-priority calculation
- top-3 risk HUD
- no save break

### Gate G5 — MAP-FAMILY-01
Produce two representative maps:
1. APT_NEW_BUILD / BOTTOM_UP / EXCAVATION
2. APT_NEW_BUILD / TOP_DOWN / UNDER_SLAB_EXCAVATION

Goal:
prove the same engine produces meaningfully different play.

### Gate G6 — REMODEL-01
One remodeling vertical slice:
SURVEY → SELECTIVE DEMOLITION → TEMP SUPPORT → DECISION.

### Gate G7 — DATA-CENTER-01
One data-center vertical slice:
MEP → ENERGIZATION → COMMISSIONING STATE.

Only after these representative slices pass should full map families be produced.

---

## 18. Non-negotiable constraints

- Do not create a separate mini-game per project type.
- Keep one DefenseGame core.
- Do not create dozens of new risk IDs.
- Do not treat top-down / bottom-up as difficulty levels.
- Do not teach "remodeling = double the apartment area" as a generic legal fact.
- Do not make data center gameplay only about server racks.
- Do not turn risk priority into a static checklist.
- Do not let a risk score change without a visible world reason.
- Do not break WORLD FIRST / IMPACT FIRST / MOBILE FIRST.
- Current G3 gate remains protected until PASS.

---

## 19. Research references used for this design

- 국가법령정보센터, 주택법 — 공동주택 리모델링 정의 및 증축 범위, 2026 시행본.
- 국가법령정보센터 / 국토교통부, 리모델링 안전진단 및 수직증축 안전성 관련 기준.
- 한국건설기술연구원 CODIL, 지하굴착 공법의 종류 및 특성 — 개착/역타 공법 특성.
- 안전보건공단, 리모델링 공사 중 붕괴사고 예방대책.
- 안전보건공단, 철거·해체·정리 작업 공정별 안전보건 자료.
- 국토안전관리원 CSI, 건설공사 안전관리계획서 작성 매뉴얼 체계.
- OSHA, Construction Focus Four 및 Data Center Projects partnership hazard tracking.
- UL Solutions, Data Center fire safety / power distribution / UPS / BESS / cooling system safety references.
- Uptime Institute, mission-critical commissioning and phased data-center construction references.

---

## 20. Final product sentence

> **같은 안전관리자라도, 아파트 순타 현장과 역타 현장과 리모델링 현장과 데이터센터에서는 먼저 봐야 할 위험이 다르다. PSI : ZERO DAY는 그 차이를 맵과 플레이로 체감하게 한다.**
