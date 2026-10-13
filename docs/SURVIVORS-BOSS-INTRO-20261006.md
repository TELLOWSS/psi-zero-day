# Registry intro timing and replay skip

Local only, no synchronization. Engine now uses each stage's approved firstPlaySeconds:regular2.4,major3.2,chapter4.2,final5.5. Encounter stores duration, replay eligibility and approved0.35s skip threshold. Both physics and combat clock remain frozen during arrival. Presentation normalizes by actual duration rather than3.5.

Replay eligibility comes from an existing validated stage-clear record (including legacy stage stars), not an untrusted button-only shortcut. Engine constructor receives that eligibility; engine methods reject first-play, too-early, paused, combat or repeated skip. Skip starts the same pattern state as natural intro completion, never exposes a free burst, grants no reward and clears alert timers. UI uses localized accessible44px icon button with focus outline; parent alert remains pointer-transparent except the button. Existing clear/reward-once behavior is unchanged.

Evidence:50-stage timing/freeze tests plus replay boundary/pause/reward test, focused boss group63 passed; Stage20/operation fixtures updated to wait registry duration instead of assuming all introductions3.5s. Browser first/replay at1440x900,390x844,844x390 passed actual rendered button click and engine pattern transition, no overflow/errors. `artifacts/boss-intro/report.json`.

Full integrated suite1,508 passed/one skipped, typecheck/build passed. Earlier run caught a JSX brace error and stale chapter/final timing assertions; these were repaired and the full suite rerun. Shooting chunk507.20kB warning remains. Stage50 intro timing is implemented; ZERO_DAY_WAVE semantics are not.

## Director clarification retained
Director resolved timing on2026-10-06: the entire final segment is8s, not6s plus8s. JSON/Bible/regression assertion now agree. The three major chain members, overlap timings and full-site control predicate are still not concrete enough for a faithful engine-owned final wave implementation. Do not replace this uncertainty with a guessed HP-only victory or new checklist. Other local quality work can continue independently.
