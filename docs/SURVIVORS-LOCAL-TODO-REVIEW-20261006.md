# Local TODO Review - 2026-10-06

## Implemented

- Automatic ranged targeting prioritizes an in-range open boss weak point, then a boss burst window, then the nearest ordinary hazard.
- Bosses with gameplay state in arrival, pattern, recovery, or secured phases are not automatic ranged targets. Legacy bosses retain nearest-target behavior.
- Gangform weak-point coordinates are used when evaluating targeting range. Existing weapon ranges, damage, phase durations, and movement input are unchanged.

## Verification

- Unit suite: 1408 passed, 1 skipped.
- Type checking and production build passed.
- Browser regression evidence is recorded under `artifacts/gangform-stage14` by the existing verification script.
- Stage 14 pendulum, debris, two weak points, burst, and victory regression passed at 1440x900, 390x844, and 844x390 without page errors or overflow.
- Movement input/reversal/release regression passed at the same three viewports. Input-to-engine movement samples were 0.3-16.7 ms; these are not physical device input-to-display measurements.

## Art Review

- A generated eight-direction intermediate-pose candidate was visually rejected: repeated stance poses, unreliable sheet layout, and insufficient cell padding.
- Candidate retained locally at `artifacts/eight-direction/rejected-intermediate-candidate.png`; it is not connected to runtime or approved for release.
- Existing directional blending is not equivalent to authored intermediate joint motion.

## Remaining

- Produce and review true alternating intermediate walk poses with consistent direction, baseline, body proportions, and wearable anchors before runtime replacement.
- Replace shared material-family presentation with independently authored equipment animation assets and verify idle, launch, impact, and evolution intensity.
- Verify performance on a physical phone; desktop mobile viewport emulation is not S26 Ultra performance evidence.

## Follow-up Asset Attempt

- Reduced the walk generation scope to one east-facing, eight-pose cycle in a 4x2 sheet. Visual review still found repeated extended strides rather than a correct passing-pose/alternating-foot cycle. All eight cells also violate the 10% transparent safety margin. Candidate: `artifacts/eight-direction/rejected-east-walk-candidate.png`.
- Produced two shock-mantle-specific six-frame discharge candidates. The second has distinct ignition, spread, peak, and dissipation drawings, but three of six cells violate the safety margin and frame origins are not consistently centered. Neither candidate is approved or connected to runtime. Candidates: `artifacts/equipment-animation/shock-mantle-candidate-v1.png` and `shock-mantle-candidate-v2.png`.
- Added `scripts/verify-survivors-animation-candidate.mjs` to measure alpha bounds, cell-margin contamination, nonblank frames, and repeated pixel fingerprints. It emits a sibling `.qa.json` and exits nonzero on technical rejection. Fingerprint differences alone never certify correct gait or independent joint animation; visual approval remains explicitly false.
- Both inspected candidates were correctly rejected by the tool. No gameplay source, wearable anchors, or production visual slots changed in this follow-up.
- Next art requirement: authored left/right contact and passing poses with stable pelvis/baseline, plus equipment effects with consistent per-frame emission origins. Repeated bulk sheet generation has not satisfied this requirement.

## Shock Animation Runtime Follow-up

- Raw shock candidate v2 still fails the uniform-grid margin test. Rather than certifying that raw sheet, `prepareShockAnimation` aligns six authored emission origins into a cached 256px-per-frame runtime sheet with a consistent scale. The branching and decay drawings are unchanged; this does not create missing intermediate walk poses.
- The aligned sequence is connected specifically to shock-mantle acquisition and equipped-mantle Tesla feedback. Drone feedback and other gear retain their own existing presentation. Idle floor remains empty after expiry; reduced-motion suppression and dense-event limits remain intact.
- Source: `public/assets/survivors/shock-mantle-discharge-v1.png`. Runtime registration: `src/ui/survivors-equipment-animation.ts`. Normalization happens once on image load, not each draw.
- Browser QA at 1440x900, 390x844, and 844x390: all six normalized frames nonblank, zero visible pixels in the 10% edge safety margin, bright emission-core offsets 0.60-1.56 normalized pixels, no page errors or horizontal overflow. Evidence: `artifacts/ground-contact/*-shock-frames.png` and `report.json`.
- Full suite: 1409 passed, 1 skipped. Type checking and production build passed. A dedicated regression verifies that drone impacts do not select the shock-mantle sequence.
- Visual review confirms separate ignition/expansion/dissipation drawings and stable origins at the normalized scale. This is one localized equipment animation, not an all-equipment cinematic visual lock. The soft glow is not evidence of photorealistic graphics.
- Remaining: true authored alternating-foot walk cycle, other independently authored equipment animations, and physical-phone performance verification.

## Barrier Forge Runtime Follow-up

- Added `public/assets/survivors/barrier-forge-deploy-v1.png`: six authored stages of metallic deployment, with silver fragments and warm sparks distinct from the cyan discharge.
- Both assets share one cached normalization routine in `src/ui/survivors-equipment-animation.ts`, with separate emission-origin metadata. Their drawings, durations, and event triggers remain independent.
- Barrier forge grants tactical control-line charges, not projectile damage. Its independent sequence plays on acquisition and once per newly placed control line, anchored to that line's world position. It is not selected by ordinary shots or drone impacts.
- The observer tracks live line object identity and refreshes the set each observation. Existing lines do not replay their deployment when equipped later, and expired lines do not accumulate in the identity set. New runs reset the observer. No tactical charges, cooldowns, movement, or combat rules changed.
- Unit regressions exercise the real `placeControlLine` engine operation: one-shot deployment, world anchoring, no state mutation, no premium sequence without gear, later equip, expiry, and subsequent deployment.
- `scripts/verify-survivors-barrier-animation.mjs` loads the asset, checks all six aligned frames, and clicks the actual control-line UI button at PC, mobile portrait, and mobile landscape viewports. All passed with zero visible edge-margin pixels, no page errors, and no overflow. The measured local bright-cluster centroid offset is 1.96-7.36 normalized pixels; it is not a claim of perfectly identical fragment centroids.
- Evidence: `artifacts/barrier-animation/report.json`, frame galleries, and deployment screenshots. Shock/ground-contact browser regression also passed at all three viewports.
- Full suite: 1411 passed, 1 skipped; production build including type checking passed.
- Current independent equipment-animation coverage: shock mantle and barrier forge only. Remaining equipment and true alternating-foot walk poses are not complete. These localized effects do not establish an all-equipment cinematic visual lock.

## Dispatch Drive Runtime Follow-up

- Added a separate six-stage ground-contact wake for dispatch drive: `public/assets/survivors/dispatch-drive-wake-v1.png`. The movement slot no longer uses a frozen cinematic-atlas cell for this equipment. Extraction pack retains its existing visual and is not counted as independently animated.
- `src/ui/survivors-dispatch-trail.ts` observes actual player displacement, emitting after 20 world units and at least 90ms between contacts. Dense scenes use 32 units/180ms, at most three contacts; normal scenes retain at most six. Each contact lasts 480ms on the simulation clock.
- Contact origins and headings are fixed at birth. Turning does not turn an existing wake; stopping produces no new wake and allows the previous contacts to expire. Teleport-sized steps are discarded. Unequip/new run clears presentation state; pause emits nothing and freezes animation with game time.
- The independent sheet is registered and aligned once on load, not allocated every draw. Reduced motion hides this decorative layer. No speed, input, collision, or other gameplay behavior changed.
- Five unit tests cover distance, idle, stop, stable world anchors/headings, pause, unequip, teleport suppression, run reset, density caps, and reduced motion.
- `scripts/verify-survivors-dispatch-trail.mjs`: six nonblank aligned frames with no visible pixels in edge safety margins, actual right/down input, preserved old origin/direction, changed new direction, empty idle ground and stop expiry at 1440x900, 390x844, and 844x390. No page errors or overflow. Evidence: `artifacts/dispatch-trail/report.json` and screenshots.
- Initial PC anchor check sampled before screenshot capture and the contact expired during capture. Sampling was moved after capture; all three viewport regressions passed on rerun without changing contact lifetime or gameplay.
- Full suite: 1416 passed, 1 skipped. Production build including type checking passed.
- Independent animation coverage is now shock mantle, barrier forge, and dispatch drive. Remaining equipment and actual alternating-foot intermediate art are still not complete; the subtle wake does not establish cinematic/photorealistic visual quality.

## Publishing Policy

GitHub push and Vercel deployment remain stopped at the user's request. All changes in this review are local only.
