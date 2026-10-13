# Radio tool emission projection

## Scope and mechanism
The existing carriedTool/baseToolSocket system mounts the radio at the belt while preserving the tablet-hand original pose. This change does not invent a hand-held firing pose. radioToolOffset uses that exact existing socket and actorTorsoPoint transform, including facing, directional frames, lean and recoil. It is active only for voice_lens with a displayed radio_boost tool and loaded actor.

RadioEmissionProjection records a launch-time offset by projectile ID. Launch feedback, airborne flight and non-worker/non-blocked contact feedback share that immutable visual offset. Later walking, turning, gear removal or recoil do not drag an in-flight shot back to the actor. Ground contact receipts, simulation coordinates, velocities, aim, collision geometry and damage remain unchanged. Presentation events are copies; engine events/state are not mutated. Records prune when neither a live projectile nor current feedback references them, reset with a new state object, and cap at128. Unsupported tools/assets retain existing presentation.

Ingest was moved after current-frame actor pose calculation so real shot feedback uses the same pose as the rendered tool, rather than a guessed universal vertical lift. The feedback clock still advances only through the existing active update path. Existing event-based animation/audio receipts continue using original engine coordinates.

## Evidence
Four new tests: eight sampled pose directions match shared torso/socket math; source/tool/gear exclusions; launch-time pinning across flight/contact; unchanged state/events; worker/blocked preservation; terminal tick retention, pruning, new-run reset and bound128. Combined emission/radio focused8 passed.
Three-view actual UI fixtures show binding to original proj_radio_1, offset x4.397/y-33.3, all six authored frames, pause hold and unequip quiet, zero page errors/overflow. Actual portrait screenshot inspected; the visible source is raised from foot position toward the mounted tool. Evidence: artifacts/radio-launch/report.json. These are controlled fixtures, not all-character/all-direction visual production approval.
Full suite1,526 passed /one skipped. Initial build found a widened numeric facing type in the test fixture; explicit SpritePose annotation repaired it. Typecheck/build then passed; existing shooting chunk509.56kB warning remains.
Production build CvBU2g98 portrait390x844 DPR2 /4x CPU,60-second continuous walking with radio level5,voice_lens plus five other gear,three remaining evolutions and48 high-HP hazards: heavy P9517.7ms,one long task; boss/ultimate P9533.4ms. Pause/rotation held, zero page errors/failed requests/overflow. Evidence: artifacts/production-stress/radio-projection/report.json. This modified controlled composition is not comparable as an isolated before/after improvement to the earlier five-evolution fixture. Not physical S26 acceptance. All required test/browser processes finished.

## Remaining
Hand firing and passing-foot original drawings remain unapproved. Other weapons/communication purchases/evolution use their existing sources. All-character attachment and natural crowded fire review remain pending. This is not a completed universal hand-muzzle system, cinematic parity, physical-device acceptance or campaign lock. GitHub/Vercel untouched.
