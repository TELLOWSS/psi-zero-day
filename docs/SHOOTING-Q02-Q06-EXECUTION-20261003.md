# SURVIVORS Q02–Q06 execution and release gates

Source baseline: `32b07b34affd15a314814f5296bf03905bd5aedf`.
Delivery commit: resolve the head SHA of GitHub PR #88; no release deployment or main merge is claimed.
Director decision in this session: **격리·차단·대피형**.

| Gate | Code/deliverable | Verification | Production status |
|---|---|---|---|
| Q01 | Shared context, input interruption, engine stage IDs, save guards, one-time payout | Stage 01→02/credits/stars, lifecycle mock, prior Q01 report | Code PASS; Android/browser NOT_RUN |
| Q02 | Seeded game RNG, local entity IDs, Fisher–Yates, fixed 60Hz simulation accumulator, swept circle collision, defeat precedence, 12Hz HUD mirror | Same seed/scheduled inputs at 30/60/120Hz; small-target fast shot; area/pierce cadence; pause backlog/stall tests | Code PASS |
| Q03 | Measured HUD alert reservation, alert priority, perk/ultimate separation, safe-area and short landscape handling, reduced motion | Focus/touchcancel/repeat regressions PASS; four-viewport browser harness authored | Visual/device NOT_RUN |
| Q04 | Engine event queue, shared buses/Master, cached buffers, synchronized approved stems, async cancellation, voice priority cap, synth spatial pan/attenuation, failure logs | Event drain, mock synchronized stems/cache/decode failure/mute/priority PASS; 600-second mock lifecycle | Runtime foundation PASS; 21 final slots MISSING_FINAL; music state/crossfade and final tool variants remain |
| Q05 | Approved isolation/control model: no drum explosion/self-damage, worker/equipment stop/listen, worker safety-corridor exit, crane signal intervention and no danger-lure reward; updated objectives and completion cues | 3 isolation/crane/worker regressions PASS; final art request and coordinates recorded | Direction implementation PASS; final art/visual trace NOT_RUN |
| Q06 | Engine integration fixtures; browser smoke harness; user/Android/audio forms; release ledger | 185 test files / 1003 tests PASS; typecheck PASS; formal build + prebuild PASS; G8-A 24/24 PASS | RELEASE HOLD |

## Q02 cadence measurement and policy

A controlled stationary area-effect fixture was measured against the original baseline engine and the fixed-step engine: 0.5 seconds, damage=1, pierce=9999, critRate=0, radius=10000. At 30/60/120Hz the baseline delivered **15/30/60** risk-reduction units; fixed simulation delivered **30/30/30**. Assertions passed. This measures frame dependence in a synthetic fixture, not natural gameplay balance or performance. Existing numerical damage/cooldown/upgrade values were not retuned for Q02; it preserves the previous 60Hz cadence. Director-approved Q05 later changes safety semantics and removes bodily knockback/explosion collateral.

Simulation runs at 1/60 second inside the engine. Foreground catch-up is capped at 250ms per render update; excess stall time is discarded rather than fast-forwarding through unobserved hazards. Pause clears fractional backlog. Existing hit-stop and time dilation still affect simulation/game time. Visual particles/shake use presentation RNG independently. Each engine stores its seed; UI chooses a seed once using crypto randomness.

Legacy tests using 0.016 seconds for an entire physics tick now request 1/60. No assertion was relaxed to conceal a failure. The knockback test now verifies stop/listen because Director approved that behavior change.

## Q03 evidence limits

Actual 360×800, 390×844, 844×390 and 1440×900 screenshots were NOT captured. Chromium is not installed and a Playwright browser download attempt failed. The browser report records NOT_RUN and does not return a successful gate code. jsdom canvas/media warnings do not prove browser visuals or native touch behavior. Long labels, multiple fingers, rotation, move-plus-button, reduced-motion presentation and safe-area appearance require actual browser/Android review.

## Q04 limits

The final manifest has no production URI. No G8-A track was copied/promoted to SURVIVORS. Existing synth cues are development fallback only; impact/control currently map to different development cues, not final Foley. Bus/clock tests use synthetic fixtures explicitly confined to tests. Real listening, stem musical compatibility, 10-minute memory/voice trace, Bluetooth latency, variant selection, spray start-loop-end and musical hysteresis/crossfade are still needed. See asset register and orchestral sound brief.

## Q05 compatibility and direction

Internal IDs (`explosive_barrel`, hp/damage, environmentalKills, projectile kinds) remain for compatibility, but now denote risk/intervention/control counts. People are not depicted as taking bodily knockback. The warning-zone control changes apply wherever the existing shared environment type is used, including Stage 03/04. An uncontrolled lifting-zone trigger no longer clears workers or awards environmental points. Stage 01 isolation retains its location, radius and score thresholds while removing explosion output and self-damage. Existing resolution art is reused; no new placeholder binary is represented as final.

Final 8-direction character animation, terrain/foreground art, actual visual continuity, attack/signal direction alignment and target-device traces remain. The final asset request names deliverables and fixed coordinates. Production visual approval is not inferred from engine tests.

## Q06 release blockers

1. Real browser full natural progression: movement → automatic response → collection → perk/reroll → evolution → hazard telegraph → ultimate → pause → victory/defeat → payout/restart.
2. Four-viewport screenshots and actual Android multi-touch/focus/rotation/offline/save-recovery run.
3. The 21 final audio slots, final Stage 01 art, music/variant runtime completion after asset approval.
4. Five new users and actual headphone/phone/small-speaker 10-minute listening/trace.

The integration test intentionally uses controlled fixtures (early maxTime, inserted drop, required perk/ultimate values) to test pathways. It does not claim natural clears, a human study, Android performance or final audio quality. Stage 02–05 expansion is recommended only after Stage 01 release blockers close.
