# DEF-HD01-PQ — FINAL G2 LOCK CHECKLIST

Date: 2026-09-24  
Branch: `sol/def-hd01-pq-benchmark-20260924`  
PR: #48  
Latest verified branch head before this checklist: `b7dd4c6a44060b8bc69d49e9c0ba464e9ccb8f0d`

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

**NOT APPROVED YET.**

`runtimePromotion.approved` must remain `false` until fresh actual-browser evidence is captured after the dedicated SWIFT switch.

## External QA blocker

GitHub Actions is currently creating the G2 job but terminating it before any workflow step or log is created. API inspection shows `runner_id=0`, an empty runner name, and `steps=[]`.

A temporary one-step `G2 Runner Sentinel` reproduced the same failure on `ubuntu-latest`, proving this is not caused by the G2 workflow body. The sentinel was removed after diagnosis.

The last runner-assigned failure had already passed Typecheck/tests/Build; its browser step failed on Chrome 153 CDP startup and its artifact upload hit storage quota. The current workflow has since hardened Chrome startup, added dynamic CDP port allocation, and removed the blocking artifact-upload path.

This infrastructure failure is not accepted as a code/test failure, but it also does not satisfy the fresh browser QA requirement.

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

After all ten conditions pass:

**DEF-CORE-01 — vehicle/pedestrian “한 걸음” Vertical Slice**

Do not begin DEF-CORE-01 before G2 Production Lock.
