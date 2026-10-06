# Local production walking stress evidence

## Conditions
Vite production preview on port5197, Chrome headless, DPR2. Portrait390x844 with4x CPU throttling and landscape844x390 without throttling are browser simulations, not physical S26 Ultra evidence. Test-only response instrumentation captures the actual minified engine; shipped source contains no QA capture hook.

After ten seconds of unmodified early play, the controlled fixture equips six valid gear, activates five evolutions and retains48 stationary high-HP hazards. Continuous keyboard walking changes direction every700ms. Boss and ultimate checks follow, then pause and viewport rotation. This is not a naturally earned build, balance assessment or complete campaign playthrough.

## Results
- Prior build B3FwMXRS, portrait4x,600-second continuous-walk baseline:34,749 playing frames, P9517.5ms, two long tasks (maximum76ms),32,445 moving frames. No page errors, failed requests or overflow. Pause held.
- New build DvFnVEaQ,60-second continuous-walk checks: portrait4x and landscape1x each P9516.8ms, zero heavy-segment long tasks. Boss and ultimate segment P95 also16.8ms. Both passed pause/rotation, zero page errors/failed requests/overflow.
- Ten-minute heap samples fluctuated with garbage collection rather than increasing monotonically; this is not a heap-retention proof. End-of-heavy heap36.4MB dropped to13.8MB after ultimate.
- Render-loop and canvas drawImage dominate non-idle profile samples. No specific measured hot spot justified a speculative renderer rewrite.

## Limits
### Latest five-minute integration run

Build C1SOhMGQ, portrait390x844, DPR2, CPU4x, radio-enabled six-gear fixture:
300 seconds,18,000 playing frames,17,973 moving frames,48 hazards, up to15
projectiles. Heavy P95 was16.8ms with zero long tasks. Travel66,040 world units.
59 heap samples ranged13.44-23.06MB; final heavy heap19.41MB, then boss14.70MB.
This fluctuating sample series is not a formal retained-memory leak test.

Boss P9516.8ms nevertheless included four long tasks (max110ms); ultimate
P9533.3ms included three (max148ms). Early loading had nine (max109ms).
The heavy30fps target passed, but occasional boss/ultimate hitches remain
investigation targets. No page errors, failed requests or overflow; pause held
and rotation completed. Evidence:artifacts/production-stress/presence-longrun.
Duration/load differences prohibit an isolated before/after gain claim.
No physical S26, subjective sound, natural earned progression or visual lock is
inferred. All required processes for this run completed.

Duration, ambient host load and CPU profile sampling differ between runs. Do not claim17.5 to16.8ms as an isolated causal performance gain from the movement/audio changes. Heavy fixtures do not naturally generate crit hitstop; dedicated movement browser checks cover a controlled hitstop separately. Screenshot confirms rendering after rotation, not artistic approval or animation quality parity with commercial games.

Evidence: artifacts/production-stress/sustained-walk/report.json and artifacts/production-stress/after-responsiveness/report.json; CPU profiles and rotation screenshots live beside each report. Physical device, sustained subjective listening and unmodified campaign progression remain pending. GitHub/Vercel untouched.
