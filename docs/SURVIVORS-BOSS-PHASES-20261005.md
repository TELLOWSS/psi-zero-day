# Readable Boss Phases

## Runtime Rules
- Designated bosses latch phase 2 at or below 50% health only at an approach/recovery boundary. Existing warnings and attacks finish unchanged; no healing resets the phase.
- Cart bosses retain the 1.2-second locked-heading warning. Phase 2 increases the burst by 18%; both phases provide 1.5 seconds of braking with no contact damage. Ordinary carts are unchanged.
- Crane bosses lock the observed player location, provide a 1.4-second warning, activate a 0.65-second drop, then rest for 2.2 seconds (1.7 in phase 2). Warning and recovery are contact-free. Normal, non-designated cranes retain their original behavior.
- Rubble bosses retain the 1.25-second warning and 0.65-second fall; recovery changes from 3 to 2 seconds in phase 2.
- Gas bosses retain the 1.25-second warning, pulse for 0.65 seconds (0.9 in phase 2), then recover for 1.5 seconds without contact damage.
- Phase transition emits the existing boss alarm once. No new recording, duplicate layered voice, hidden damage multiplier or additional enemy spawns.
- Anchored crane/rubble warnings ignore knockback so their advertised danger location remains valid.

## Presentation
- Existing finished crane raster follows the final 0.3-second descent and recovery lift. Reduced-motion mode keeps the load still while retaining functional warning and collision phases.
- Phase, real boss name, remaining risk, active/recovery status and targeted guidance appear in the existing compact objective surface. HUD mirrors motion/phase changes independently from whole-second time and integer health changes.
- Warning rings appear only during actual warning/fall, not the safe recovery interval. Existing ordinary crane presentation is preserved.

## Verification and Limits
- Unit tests cover phase boundary, single alarm, warning position lock, contact windows, recovery, ordinary hazard preservation and continuous descent/reduced motion.
- Controlled browser cases cover cart, crane, gas and rubble on their actual stages at desktop, portrait and landscape sizes, including warning-to-recovery HUD changes, finite geometry and nonblank artwork.
- Normal-input scripted calibration: 150 runs across all 50 stages; 140 objective victories, 10 defeats, at least one victory per stage. This is not human win-rate evidence.
- Finished industrial artwork is reused; individually illustrated fifty-boss assets and authored cinematic animation frames are not included. Physical-device performance and speaker/headphone approval remain Director review.
