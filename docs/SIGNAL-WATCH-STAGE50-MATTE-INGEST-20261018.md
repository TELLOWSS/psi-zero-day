# Signal Watch – approved Stage 01–50 foreground-matte ingest gate (2026-10-18)

## Ground truth
The repo currently contains 50 mapped, opaque stage ground backgrounds but no art-director-approved, pixel-aligned RGBA cut-outs for all 50. Prior work (#215) gives real 3-type equipment sprite Y-occlusion; it is **not** the same as painted-map foreground separation.

## Implemented: code path only
- `src/ui/survivors-stage-mattes.ts`: explicit per-stage approved cut-out contract, strict stage/source path checks, in-world bounds/feet anchors, local-only assets and approval marker. The approved asset map intentionally starts **empty**, so no fake geometry appears.
- `src/ui/PatrolSurvivorsGame.tsx`: asynchronously loads only approved layer PNG/WebP assets, draws them in the same feet-Y sorting as workers and machinery (NOT on top of the full HUD). A mask fades for the actor and even more for danger warning symbols, never touching game collision/AI/risk events. No per-frame offscreen-mask regeneration.
- `tests/survivors-stage-mattes.test.ts`: all 50 backgrounds remain intact before approvals; invalid/misaligned/unapproved masks are rejected; warning/actor visibility behavior.
- The canvas emits `data-approved-foreground-mattes` for browser QA.

## Actual art-production contract
Every stage must separately produce and review at least one RGBA foreground cut-out, with alpha 0 around everything except the original physically plausible foreground edge:
1. Source raster is exactly `stageGroundUri(stageId)` (do not synthesize a replacement painting or move camera anchors).
2. Produce matching PNG/WebP with full transparent surroundings OR a tightly cropped cut-out; provide world bounds in the 1400×900 world coordinate system.
3. Prohibit logos, HUD, worker characters, warning icons, fictitious equipment and new random geometry in a mask.
4. Review source vs cut-out at native resolution, inspect 390×844 and 844×390 overlap, and check safety warning readability under rush conditions.
5. Add the approved file under `public/assets/survivors/foreground/`, fill `FOREGROUND_MATTE_ASSETS` with source raster URI, cropped world geometry, feetY and approval.
6. Asset must ship together with its matching source/approval; no empty mask files or fake green checkmarks.

**Current status:** pipeline complete pending full 50-stage asset-production and human approval. This is not a claim of completed layer extraction or final art lock.
