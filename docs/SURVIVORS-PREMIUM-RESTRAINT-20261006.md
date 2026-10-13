# Premium idle restraint

## Change
Removed the recurring180-unit suppression radius circle following the player in drawPremiumGear. Suppression mechanics/range are unchanged; actual affected-target links and contact ellipses remain. Existing shield raster presentation now has a compact42x58 idle envelope at0.10 opacity, with62x76 /0.70 for actual engine feedback. Reduced motion keeps feedback at0.24. This is a presentation cleanup, not a new dedicated protection animation or production-art lock.

## Evidence
Two unit tests verify no large follower radius, actual nearby target links, out-of-range quiet behavior, idle/feedback/reduced/empty shielding, and unchanged game state.
Actual UI with six valid gear passed1440x900,390x844,844x390. Canvas stamps confirmed idle42x58 alpha0.1 and feedback62x76 alpha0.7 at every viewport, with zero browser errors/overflow. Portrait idle screenshot inspected. Evidence: artifacts/premium-restraint/report.json and idle/feedback screenshots. Controlled wallet/shield-feedback fixtures are not natural progression or purchase-economy proof.
Initial typecheck found a missing explicit this type in the canvas test stub; repaired. Full regression1,517 passed /one skipped; typecheck/build passed, existing shooting chunk warning507.97kB.

## Remaining
Body-local premium presence remains visible, and target contact ellipses were not removed. Follow-up removed the protocol layer's duplicate feedback shield stamp: drawPremiumGear is now the sole owner in gameplay and fitting. Combined-pass unit test and three-view actual UI checks confirm zero76x86 duplicate stamps. This resolves this specific shield duplication, not all multi-item stacking. Rescue-wing/protection replacement art and alternating-foot walk candidates remain unapproved. No copied commercial assets, new placeholder art or publishing.
