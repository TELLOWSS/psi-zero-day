# B3 Runtime Evidence And Remaining Work

Scope: current source audit after production PR153. This is not final animation,
listening, natural crowd combat or physical-device approval.

## Existing Implementation

| Requirement | Active implementation | Remaining proof |
|---|---|---|
| Passing feet | `survivors-directional-art.ts` loads walking and passing sheets; frames 8/9 enter phases 1.5/5.5 through short boundary blends | All-direction small combat-size foot order, weight transfer and physical-device review; do not claim missing files solely from old TODOs |
| Stable body/socket frame | `survivors-rig-renderer.ts` torso transform; directional body sockets and front/back wearable layers | Moving/turning/command overlap with the actual equipped combination |
| Independent carried motion | `EquipmentMotion` stores per-entity, per-item channels; radio/armor/pack/wrist/belt have distinct bounded spring profiles | This is independent inertia, not equipment-specific event choreography: all receive the actor's action value |
| Inspection deployment | `InspectionFlightTracker` samples actual gear/state and body dock | Natural deployment, return and crowded hazard readability; a forced phase is not natural evidence |
| Shield feedback | Engine decrements feedback, sets .45 on absorption and .6 on recharge; renderer reads shield ratio and feedback | Absorption and recharge use the same feedback field; shield-zero branch does not draw the shield VFX. Need actual-event timeline before proposing distinct existing-art playback |
| Voice priority | PR153 protects current speech owner from shared SFX budget eviction | Natural combat/listening fatigue and physical-device approval remain separate |
| Reduced motion / pause | Equipment clock reads playerMotionTime/gameTime, springs reset under reduced motion; same timestamp retains angle | Actual renderer pause/turn combinations, not only coefficient tests |

## Superseding Baseline: 2026-10-09

The findings above describe the earlier source revision, not the current remaining
implementation queue. At product revision `5444a9ec2aafe90b49bd1b82b9352f31912e1dec`,
the premium renderer calls `ShieldPresentationTracker`, and directional art prepares
authored/contact sheets and samples `authoredMotionWeights`. Visual budgets now
control presence, cinematic flights and floating feedback. Existing source-alpha
and forced-light diagnostics do not certify the newer character sheets.

See `../SURVIVORS-GRAPHICS-UPGRADE-IMPLEMENTATION.md` for the separate work's
verification and remaining foot-slip/device limits. Runtime deployment does not
change candidate metadata or grant VISUAL PRODUCTION LOCK. The earlier asset and
shield findings below must not be repeated as current missing implementations.
This update is a source/document comparison, not an independent full regression.

## Historical Next Engineering Bundle

1. Observe actual `absorbPremiumDamage` and recharge transitions without changing
   damage, capacity, cooldown or save schema. Record shield-before/after, feedback,
   simulation time and renderer branch.
2. Test absorption that leaves charge, absorption that exhausts charge, recharge,
   pause/resume, reduced motion and equipment replacement. A state fixture must be
   labelled as such; actual engine calls are stronger than hand-set feedback.
3. Only then distinguish event playback using already-approved art and authored
   timings. Do not introduce a new ring, placeholder sheet, fake activation or
   permanent glow as a substitute for the specified independent choreography.
4. Capture the actual body and mounted art at combat size on PC/phone portrait/
   landscape, preserving warning readability. Director visual review is separate.

## Asset And Approval Boundaries

- `content/survivors-equipment-check-v1.json` currently records FINAL_CANDIDATE and
  directorVisualApproval false. Its runtime presence does not prove final file
  approval. Preserve current assets; do not silently upgrade that metadata.
- Existing walking/passing/command files remain unchanged. No new final sprite
  is approved by this source audit or by the BR-LOGO-02 approval.
- ScoreV2 music, SFXV1 and background rights still need their own evidence. The
  user's four voice-bank/impact SFX rights confirmation is not a blanket grant.
- B3 remains in progress. B4 long-device play and B5 external promotion must not
  be marked complete from these source findings.
