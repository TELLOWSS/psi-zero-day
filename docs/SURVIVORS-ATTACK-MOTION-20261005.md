# Attack timing refinement

- Shot, spray and ultimate emissions use separate recoil envelopes: 0.24, 0.34 and 0.42 simulation seconds. Fast eased onset and smooth recovery replace the single linear decay.
- Presentation accepts new firing gestures after 65ms rather than ignoring all events until a 240ms gesture expires. Same-frame projectile/audio signals are deduplicated; ultimate can replace a lower-priority same-frame gesture.
- Ordinary automatic fire cannot interrupt an active ultimate gesture before its recovery ends.
- Player projectile gestures are restricted to radio/satellite, extinguisher/cryo and shout emissions near the player. Autonomous drone, traps and unrelated energy projectiles do not trigger this body recoil.
- Fitting attack preview uses the same shot envelope. Existing body transforms, wearable sockets and secondary equipment motion consume the gesture; damage, range and fire cadence are unchanged.
- Tests cover bounded continuous curves, emission selection, retriggering, same-frame cache invalidation and pause. Full suite: 1,353 passed, 1 skipped; typecheck and build pass. Fitting browser regression passes five viewport sizes.
- This is gesture timing, not authored independent arm/hand animation. That artwork remains future production work; no cinematic visual lock is claimed.
