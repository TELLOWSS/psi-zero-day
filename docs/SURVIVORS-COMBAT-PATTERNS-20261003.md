# Shooting combat readability upgrade

Scope: improve the existing ten construction shooting missions. Existing Korean cast and approved WebP sprites remain the visual references. No new campaign, weapon family, save format, or art placeholders.

| Risk | Warning | Active behavior | Recovery |
| --- | --- | --- | --- |
| Runaway cart | Within 320 units, lock observed player direction; yellow lane for 0.9 seconds (designated boss 1.2 seconds) | Move along that direction for up to 1.05 seconds at 2.1× speed; cannot steer toward a dodging player | Stop 1.1 seconds; map boundary also stops charge |
| Falling material | Mark observed position within ±90 units, clamped inside map; yellow 52-unit circle and countdown for 1.25 seconds | Red impact circle, stationary for 0.65 seconds | Fade 0.4 seconds; avoided falls expire without control score or drops |
| Worker / diffuse gas / crane | Existing presentation | Existing approach and intervention rules | Existing safe-guidance and isolation rules |

Player contact is disabled during falling warning and recovery. Preemptive automatic intervention and director shout can still resolve a warned fall. Existing session pause, hit-stop, stun, and time dilation apply to the timers. Pure `patrol-hazard-motion.ts` owns motion rules; UI reads those values for warnings. Legacy test/save fixtures without optional motion metadata retain their previous behavior.

The top HUD replaces the ordinary control-count badge with the designated boss's remaining risk percentage and accessible progress indicator while that boss exists. It reverts after control. In-game beginner instructions explain sideways avoidance and leaving marked circles.

Verification: 7 meaningful new tests cover locked direction, warning duration, contact window, pause, expiry without rewards, emergency intervention, and boundary recovery. Full suite: 188 files / 1,021 tests; typecheck and production build pass. Browser QA keeps four existing viewport smoke checks and adds Stage10 real simulation with saved unlock and maximum valid R&D upgrades. This is a readability fixture, not proof of natural stage unlock, difficulty balance, or device endurance.
