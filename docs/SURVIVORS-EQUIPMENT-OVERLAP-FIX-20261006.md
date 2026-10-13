# Equipment contact independence

## Implemented
Shock mantle feedback now has an independent presentation cooldown from generic electric companion feedback. Drone-first and Tesla-first receipt order both retain the dedicated discharge; repeated same-channel receipts remain throttled. Combat timing, damage and equipment rules are unchanged.

Dedicated shock/barrier sheets no longer depend on the legacy ground atlas having loaded. Unavailable sheets still use the existing material path when available; no new fallback artwork was introduced. Canvas save/restore remains balanced even when all assets are absent.

Busy contact rendering uses one nearest authored frame instead of two blended frames per contact. Existing three-contact busy draw cap remains: at most three raster draws, versus six before. Normal rendering retains adjacent-frame blending. This is a bounded draw-count improvement, not a measured physical-device FPS claim.

## Verification
Focused contact suite: 11 passed, covering both receipt orders, duplicate throttling, missing legacy atlas, independent barrier drawing, reduced motion and state immutability. Full suite: 1,438 passed, one skipped. Production build and TypeScript compilation passed; existing >500kB shooting chunk warning remains. git diff --check passed with existing line-ending warnings.

Premium visibility browser regression passed 1440x900, 390x844 and 844x390 without browser errors or overflow. This fixture uses controlled contacts and does not establish unmodified combat quality or S26 Ultra frame pacing. Portrait actual-game capture visually inspected. Evidence remains in artifacts/premium-visibility/report.json and 390x844-actual-game.png.

## Follow-up: bounded retention
The contact pool and busy draw selection now reserve the newest live shock and barrier contact, at most one reserved slot per identity. Remaining slots retain newest receipts; selection preserves chronological drawing order. Expired contacts are excluded before draw selection even when observe has not run. Pool limits remain eight normal/four busy; draw limits eight normal/three busy. No asset or combat rule changes.

Six valid simultaneously equipped items reproduced the old busy-pool eviction. Regression now verifies both authored identities plus a generic contact survive, with exactly three busy raster draws and no expired draws. Focused suite: 12 passed. Full suite: 1,439 passed, one skipped. Build and TypeScript compilation passed; existing large-chunk warning remains.

`scripts/verify-survivors-equipment-overlap.mjs` renders production contact code and real prepared sheets at ages .08/.24/.4 in normal and busy modes. All 18 samples across desktop/portrait/landscape browser viewports passed; busy counts exactly shock 1, barrier 1, generic 1. Evidence: `artifacts/equipment-overlap/report.json` and viewport PNGs. First attempt was interrupted by a development reload; clean rerun passed. Existing premium visibility actual-game regression also passed all three viewports with no browser errors/overflow.

Visual inspection shows same-origin simultaneous acquisition effects can merge into a single bright cluster. Retention is verified; unique silhouette separation at that exact overlap is not visually locked. The fixture is a fixed-scale canvas at three browser viewports, not a mobile performance measurement or independent proof of responsive layout.

## Follow-up: acquisition choreography
Simultaneously acquired authored gear is ordered by identity, not inventory order: shock starts immediately, barrier follows after .18 seconds. Generic acquisition contacts follow the authored group (.36 seconds when both are new, .18 when only one is new). Single authored acquisition remains immediate. The delay is presentation only and uses gameTime: pause freezes progress; confirmed weapon receipts and actual line deployment remain immediate.

Pending acquisition contacts do not draw or consume the active draw budget before their start. Pending contacts are cancelled when their source is no longer acquired; already started world contacts finish normally. New run clears the queue. Life is measured from scheduled start; pool/draw limits remain unchanged. No new art, damage changes or wall-clock timers.

Focused suite: 13 passed; full suite: 1,440 passed, one skipped. Build and TypeScript checks passed, retaining the existing chunk warning. Browser overlap fixture passed all 18 samples and premium actual-game regression passed all three viewports without errors/overflow. The controlled gallery suppresses development HMR only inside its browser test to avoid evidence writes interrupting samples; production behavior is unchanged.

Updated gallery visually inspected: first sample shows electric branches without the generic white/gold core; the second adds barrier; the third introduces generic contacts. This reduces simultaneous onset merging but does not establish fully separated silhouettes during later overlapping tails or cinematic production lock. Evidence is updated in artifacts/equipment-overlap. Physical S26 Ultra validation remains outstanding.

## Follow-up: local material compositing
Coincident generic contacts of the same material, within 24 world units and .08 seconds of onset, draw once using the stronger representative (newest on equal power). Different materials, authored identities, remote contacts and separated onsets remain distinct. This is draw-time presentation deduplication: stored receipts, damage and weapon behavior are unchanged.

Generic contacts draw below loaded authored sequences. Their alpha is reduced only where a selected loaded authored contact overlaps locally, with up to 70 percent attenuation at the shared origin; the attenuation releases over the authored contact's final quarter-life. Remote contacts and unloaded authored fallback retain their original brightness. Unrenderable contacts no longer occupy the active draw budget. Existing pool/draw limits remain unchanged.

Focused suite: 15 passed, including same-material deduplication, distinct-material retention, layer order, local attenuation and remote/unloaded brightness. Full suite: 1,442 passed, one skipped. Build and TypeScript compilation passed; existing chunk warning remains. git diff --check passed with existing line-ending warnings.

Overlap browser fixture passed all 18 samples across three viewports. At .4 seconds busy rendering draws generic first, shock then barrier; generic alpha is .1197. Actual-game premium visibility regression passed all three viewports with no errors/overflow. Updated gallery visually inspected; technical ordering and reduced generic wash are verified, not independent silhouette production lock.

Fixture correction: the previous six-item overlap list contained repeated equipment categories and was sanitized to four equipped items. The current fixture uses six distinct categories and asserts six remain equipped. Earlier overlap evidence demonstrates four-item rendering, not six-item saturation. The separate premium-visibility fixture already used six valid categories. Current artifact reports supersede earlier overlap snapshots.

## Remaining
No new equipment animation art or alternating-foot gait art was completed in this change. Other equipment-specific sequences, long natural combat review and physical-device performance remain outstanding. Independent cooldowns retain the shared bounded contact pool; they do not guarantee every simultaneous effect survives saturation.

Local only. No GitHub push, commit or Vercel deployment.
