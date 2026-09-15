# PSI : ZERO DAY — Core Economy / PSI / Monetization / Visual Contract

Status: LOCKED DESIGN CONTRACT (formula-free)

This document locks the product direction requested for the commercial game. It does not define numerical balance formulas yet.

## 1. Core economy principle

### Money = Time = Schedule = Safety

The four resources are not independent meters. They form one field-management loop.

- Money can buy time through manpower, equipment, logistics, temporary facilities and better preparation.
- Time pressure affects schedule decisions.
- Schedule pressure can create unsafe shortcuts if the player manages it poorly.
- Good safety preparation can consume money/time immediately but prevent much larger delay, rework, investigation, stoppage and cost later.
- Unsafe shortcuts must never be presented as a permanently superior strategy.

The intended player lesson is:

> Saving a small amount of time or money now can create a much larger schedule and cost loss later. Good safety management is also good production management.

No fixed conversion formula between money, time, schedule and safety is approved yet.

## 2. PSI canonical definition

PSI = Proactive Safety Intelligence

Canonical meaning:

> 사고 전 신호를 모아 다음 위험을 먼저 읽는 안전지능.

The six PSI indicators are FIXED and must not be renamed or replaced without explicit product approval.

1. 위험인지도
2. 교육이해도
3. 실천참여도
4. 보호구·수칙준수
5. 소통·보고성
6. 작업중지 감수성

### Gameplay integration rule

PSI must be learned through play, not through a dashboard lecture.

Examples:

- noticing a changed work condition -> 위험인지도
- understanding why the control is required -> 교육이해도
- worker/foreman voluntarily participating in the control -> 실천참여도
- PPE / procedural compliance under real pressure -> 보호구·수칙준수
- reporting, instruction fidelity, escalation and feedback -> 소통·보고성
- willingness to stop or delay work despite pressure -> 작업중지 감수성

The player should see the six indicators as consequences of field behavior. The game may show a PSI summary, but the underlying experience should come from people, schedule pressure, field conditions and decisions.

No PSI score formula, threshold, weighting or reward curve is approved by this document.

## 3. Paid item philosophy — "Time is money"

Paid items may provide convenience, recovery options, logistics capacity or visual customization. They must not teach that money can erase an unsafe act after the fact.

### A. Action items — working name: 까방권

Product-facing name should be more professional in the final UI. "까방권" may remain an internal nickname.

Permitted functions:

- decision reconsideration before irreversible consequence resolution
- call-in expert support
- additional coordination window
- emergency manpower/support request
- one-time re-planning opportunity

Guardrail:

- cannot delete an already occurred injury/incident
- cannot directly buy PSI score
- cannot turn an unsafe choice into a safe choice without performing a legitimate corrective action

### B. Facility items

Examples:

- temporary access route / walkway
- additional material laydown zone
- lighting package
- traffic separation facility
- temporary guardrail / edge protection package
- additional rest / hydration facility
- temporary lifting/logistics support

Design intent: spend money now to reduce lost time, congestion, rework and exposure later.

### C. Equipment / supply items

Examples:

- additional radio set
- inspection camera / tablet
- barricade and cone package
- temporary signage / marking kit
- measurement / inspection kit
- spare PPE / replacement consumables
- signaler / spotter equipment set

Design intent: the player should feel that preparation costs money but creates faster, safer execution.

## 4. Monetization fairness rules

- No loot boxes or random paid safety outcomes.
- No paid item may be required to choose the correct safety decision.
- Core Episode content must remain completable without purchase.
- Paid convenience may save time, add recovery flexibility or increase logistics options, but must not invalidate the educational meaning of consequences.
- Safety failure cannot simply be erased with cash.

## 5. Main page visual direction

The title/main screen and actual gameplay must feel like the same commercial game.

Locked visual direction:

- high-quality 2.5D Korean construction-site diorama
- adult-friendly casual strategy presentation
- cute 40 / field realism 35 / strategy-game feel 25
- fictional site; no real company/site identifiers
- no AI gibberish on helmets, signs or equipment
- clean readable typography
- construction equipment, temporary works, materials and hazards readable at a glance

The existing minimalist dark title screen may remain as a mood reference, but the final main page must use the same visual language as the game world.

## 6. Gameplay visual direction

- the construction map is the hero
- dashboard panels are secondary
- characters remain individually recognizable by silhouette, face, role equipment and posture
- character professional growth never ages the person
- growth is shown through expression, confidence, posture, equipment and organization
- dialogue UI must not hide the playable construction map

Final production target remains WebP commercial art. RC SVG assets are development/release-candidate fallbacks only.

## 7. Implementation order

1. Canonical PSI six-indicator contract in code/data
2. Resource-loop presentation model: money / time / schedule / safety pressure, without formulas
3. Item taxonomy and entitlement hooks: action / facility / equipment
4. Main-page commercial art pass
5. Gameplay production WebP replacement
6. Only after explicit approval: numerical economy, PSI weighting, prices, cooldowns and purchase balance

## Non-negotiable

Do not invent economy conversion ratios, PSI weights, XP thresholds, paid-item prices or safety-success probabilities until they are explicitly approved.
