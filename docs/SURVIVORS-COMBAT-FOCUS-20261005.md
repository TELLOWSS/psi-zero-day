# Combat Focus / Boss Resolution

## Verified Problem

The previous rule required boss control, additional control quotas, and a separate four-second handoff. Killing the designated boss alone could leave the stage running. Boss spawning also depended on the ordinary spawn tick.

The designated boss now appears independently by 60 seconds, or earlier after sufficient interventions from 15 seconds onward. Actual boss resolution ends the stage immediately. Time alone never awards victory. Control objectives remain achievement targets; rewards and equipment wear use the existing terminal flow, once.

## Mobile Composition

Portrait and landscape combat use a 44px status strip, health, level, elapsed time, pause, and a compact boss name/health/direction/status strip. The left movement area remains free; support/control commands and the ultimate occupy the lower right. Minimum mobile command targets are 44px; the ultimate is 64px. Safe-area insets and the existing dynamic viewport are retained.

Shop purchases/repairs and equipment review remain reachable from pause. Detailed objectives, equipment information, and the audio mixer stay in pause; active play no longer shows the large objective card, equipment tray, or introductory radio transcript. Radio audio, safety decisions, attack telegraphs, and upgrade choices remain intact. PC retains the detailed combat HUD.

## Reference Check

- [Brotato official publisher page](https://store.steampowered.com/app/1942280/Brotato/): default auto-fire; shopping between waves. Its actual Steam gallery was inspected in the browser: edge health/level indicators and a central wave counter leave the arena exposed. Capture: `artifacts/combat-focus/brotato-official-gallery.png`.
- [Vampire Survivors official mobile listing](https://apps.apple.com/us/app/vampire-survivors/id6444525702): minimalistic survival gameplay; the listing's editorial describes one-finger positioning.

Design inference: separating management from live combat and keeping movement unobstructed suits PSI's automatic targeting. This is not a claim that either reference game proves a measurable immersion increase, or that their PC screenshots verify PSI mobile usability.

## Verification

- Typecheck, production build, full suite: 1305 passing / 1 opt-in skipped before the additional deadline regression; deadline regression subsequently checked separately.
- Every one of 50 stages: real designated boss object death through engine collision cleanup produces victory without quota/handoff, rewards remain unchanged on subsequent updates.
- 150 scripted normal-input runs across all 50 stages: 140 victories, 10 defeats; every stage has a successful boss-ending route and every run terminates. No injected HP/upgrades. This is not human win-rate testing.
- Browser: 1440x900, 390x844, 360x740, 844x390, 667x375. All load, nonblank canvas, no horizontal overflow or page errors. Mobile HUD 44px; command hit targets 44px/64px. Touch movement, pause, equipment review, shop access, resume, visible boss status, and actual boss-death terminal path pass. Controlled ending fixtures are not natural playthroughs.
- Screenshots and JSON: `artifacts/combat-focus/`. Script: `scripts/verify-survivors-focus.mjs`.

## Director Review

Physical iOS/Android browser bars, device rotation, simultaneous touch, audio listening, and FPS remain device QA. The existing four authored industrial boss families are retained; this change does not claim 50 individually illustrated bosses or final visual lock.
