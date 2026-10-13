# SURVIVORS Q01 — session stability

Base: main 32b07b34affd15a314814f5296bf03905bd5aedf. Scope: Q01 only.

## IMPLEMENTED
- Lazy session AudioContext reuse; tracked synth sources/gains, 24-voice ceiling, ended-node disconnection, mute/pause/hidden/restart/exit cleanup and idempotent close. Synth remains development audio, not orchestral final.
- Blur/hidden/touchcancel reset keyboard and joystick input; pause through engine API. Key repeat cannot toggle pause. Resume resets the render clock.
- Live engine stageId drives stage background, star storage and next-stage unlock. Engine characterId already drives character rendering.
- Legacy storage keys/formats preserved; malformed JSON/null/unknown stage IDs/nonfinite numbers and out-of-range upgrades recover safely. No migration deletes existing storage.
- WeakSet marks each engine's result payout once. Reward state updates no longer reinitialize completed sessions; ready-screen upgrade purchases still refresh the ready engine.
- Render feedback counters reset when the active engine changes; restart clears transient visuals.

## TEST
- npm run typecheck: PASS.
- npm test: PASS, 181 files / 989 tests.
- NODE_OPTIONS=--max-old-space-size=8192 npm run build: PASS (including prebuild gates).
- G8-A final audio asset gate: PASS, 24/24.
- Q01 + existing survivors suite: 28 tests pass; includes Stage 01→02 victory, stage_02 stars, stage_03 unlock, result retention and one-time credits, blur/touchcancel, repeat pause, corrupt save recovery and audio lifecycle.
- Audio mock: 600 repeated seconds, one context, no ended voices retained, overlapping voices capped at 24, disposal closes once. This is simulated lifecycle evidence, not real-time audio/memory/Android evidence.
- jsdom canvas/media warnings are environment limitations, not browser visual evidence.

## TODO / NOT_RUN
- Browser rendering smoke attempt blocked: Playwright chromium executable and agent-browser CLI are absent in this runtime. Production build succeeded; actual browser loading remains NOT_RUN.
- Actual Android focus/touch behavior, real 10-minute memory/audio trace and direct listening NOT_RUN.
- Q02–Q06 unchanged; no balance, world premise or production audio asset changes.

## DIRECTOR REVIEW
No new design choice required for Q01. Explosion/control redesign and final orchestral choices remain future review items.
