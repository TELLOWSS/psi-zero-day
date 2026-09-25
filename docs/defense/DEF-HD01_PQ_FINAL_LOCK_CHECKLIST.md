# DEF-HD01-PQ — FINAL G2 LOCK CHECKLIST

Date: 2026-09-25  
Branch: `sol/def-hd01-pq-benchmark-20260924`  
PR: #48  
Final fresh-QA source SHA: `04f2d90eb18ea7a20461ff418fd9efcf08597d6a`

## Scope

G2 is limited to one representative production-quality benchmark set:

- CONTROL L1 response
- SWIFT vehicle/pedestrian risk
- CONTROL ↔ SWIFT intervention/braking FX

No additional tower/risk family expansion belongs in this Gate.

## Implementation state

### CONTROL L1

- Runtime semantic: traffic marshal + temporary pedestrian/vehicle segregation.
- Runtime implementation uses the dedicated CONTROL PQ composite path.
- Existing legacy CONTROL SVG remains available for rollback.
- Generic attack-flash-only presentation is not the intended G2 semantic.

### SWIFT

Dedicated movable asset:

- `assets/defense/enemies/swift-pq01.svg`
- transparent outside the vehicle clip
- visual lineage: `assets/defense/board/ramp-01-hd01.webp`
- MASTER WORLD bytes are embedded inside the SVG (`data-self-contained="true"`)
- no runtime-relative board image dependency remains
- runtime helper: `defenseSwiftPqAsset()`
- runtime renderer consumes the dedicated asset directly
- the previous live MASTER WORLD crop renderer is no longer the active SWIFT PQ path

This removes the defect where a rectangular fragment of the MASTER WORLD could move with a SWIFT enemy.

## Protected contracts

The following must remain unchanged through G2:

- board: 1000×600
- eight install pad centers
- 10-wave shape
- tower/enemy/support IDs
- save/load/recovery
- scenario/event IDs
- upgrade/sell/target mode
- pause/speed controls
- defense balance
- Episode 01 defense story bridge

## Current evidence

Earlier actual browser evidence established:

- DefenseGame completed 10/10 waves
- result: WON
- stars: 2/3
- shield: 18
- CONTROL and SWIFT candidate paths both rendered

That evidence is retained as regression evidence only because it predates the final dedicated SWIFT asset switch.

Latest Vercel deployment for the final dedicated-SWIFT branch state:

- branch: `sol/def-hd01-pq-benchmark-20260924`
- commit: `b7dd4c6a44060b8bc69d49e9c0ba464e9ccb8f0d`
- deployment state: READY
- Vercel status: success

## Production approval state

**APPROVED — G2 PRODUCTION LOCKED.**

Fresh schema-v2 actual-browser evidence passed on GitHub-hosted runner `1000001411`.

- workflow run: `36066893099`
- attempt: `5`
- result: WON
- waves: 10/10
- stars: 2/3
- shield: 18
- failures: none
- SWIFT: `assets/defense/enemies/swift-pq01.svg`
- CONTROL L1 count: exactly 1
- `runtimePromotion.approved=true`
- `runtimePromotion.previewCandidateOnGateBranch=false`
- `runtimePromotion.status=PRODUCTION_LOCKED`

## External QA blocker

**RESOLVED.**

The repository was changed from private to public. The ultra-light `GitHub Runner Probe` then received runner `1000001408` and completed successfully. Final G2 QA subsequently ran on runner `1000001411` and passed.

The earlier `runner_id=0 / steps=[]` condition is retained only as historical diagnosis and is no longer an active blocker.

## Final G2 PASS conditions

All of the following are required before Production Lock:

1. Fresh actual DefenseGame browser run on the dedicated-SWIFT implementation.
2. SWIFT appears in Wave 8 from `assets/defense/enemies/swift-pq01.svg`.
3. CONTROL L1 appears exactly once in the Wave 10 QA setup.
4. CONTROL reads as a site-safety intervention rather than a weapon/portal.
5. SWIFT reads as a construction-vehicle risk rather than an abstract enemy.
6. No moving MASTER WORLD rectangle/background fragment is visible.
7. 10/10 waves complete successfully.
8. Protected topology, IDs, save/story and balance contracts remain unchanged.
9. Final runtime screenshots pass visual inspection at representative desktop/mobile board scale.
10. The standalone SWIFT SVG is self-contained and contains no external relative board reference.
11. `runtimePromotion.approved` is changed to `true` only in the final G2 approval commit.

## Next Gate

All G2 PASS conditions are satisfied.

**NEXT: DEF-CORE-01 — vehicle/pedestrian “한 걸음” Vertical Slice**

G2 Production Lock is complete; DEF-CORE-01 may begin after PR #48 is merged to `main`.


## Promotion transaction

After the fresh manual G2 browser QA has written schema-v2 evidence into `qa/def-hd01-pq`:

1. Run the guarded dry check:
   `npm run defense:g2-promote`

2. The dry check must report `[DEF-HD01-PQ PROMOTION] READY`.
   It rejects:
   - old schema-v1 evidence
   - missing/invalid QA source SHA
   - QA older than 72 hours
   - any browser failure
   - anything other than a WON 10/10 run
   - wrong MASTER WORLD
   - wrong SWIFT asset URI
   - CONTROL count other than exactly one
   - asset SHA256 drift
   - source/code changes after the browser QA

3. Only after the dry check is READY, apply the Production Lock:
   `npm run defense:g2-promote -- --apply`

4. The apply transaction must set:
   - `runtimePromotion.approved=true`
   - `runtimePromotion.previewCandidateOnGateBranch=false`
   - `runtimePromotion.status=PRODUCTION_LOCKED`
   - approved CONTROL/SWIFT asset records
   - fresh QA source SHA and generated time
   - `staticQa.productionApproval=true`

5. Re-run the focused G2 contract/verifier before marking PR #48 Ready.

6. Only then merge PR #48 and begin DEF-CORE-01.

Do not hand-edit the Production Lock flags individually.


## Final closure record

- Runner Probe PASS: run `36067770735`, attempt 9, runner `1000001408`
- Final browser QA PASS: run `36066893099`, attempt 5, runner `1000001411`
- Fresh evidence generated: `2026-09-25T05:15:12.134Z`
- QA source SHA: `04f2d90eb18ea7a20461ff418fd9efcf08597d6a`
- Production Lock commit: `ae547a3ca7c34c392407d5f8a33f5606b8742cb4`
- Final report: `qa/def-hd01-pq/step4-browser-report.json`
- Visual evidence: `qa/def-hd01-pq/05a-pq-swift-wave8.jpg`, `qa/def-hd01-pq/06a-pq-control-l1.jpg`
- Protected gameplay coordinates/balance: unchanged
- Vercel automatic deployment: remains disabled
