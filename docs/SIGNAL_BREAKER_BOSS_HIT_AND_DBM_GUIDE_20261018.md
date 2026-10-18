# PSI SIGNAL BREAKER — BOSS impact and voice-independent raid monitor

Implemented on Draft PR #210, not main. The requested game is the offline **Signal Breaker raid** at public/signal-breaker-dev, distinct from defense tower mode.

## Issue
Five boss counter types (bank bounce, conveyor belt reversal, mist intake, anchor rail lock, scan circuit) had deterministic underlying mechanics, but the monitor mostly presented a single advisory line; hearing an optional Korean voice materially improved comprehension. A raid boss contact emitted bosshit with generic sparks but lacked enough tactile confirmation.

## Implemented
- Added a **read-only two-step visual interpreter** that displays each phase clearly: fake dashed warning (wait), confirmed lane danger (exit in computed direction), counter tool/action, support cores (actual remaining count), stagger, weak point burst, retry.
- It reads true engine snapshot, laneX, half, remaining, counter, and boss nodes; no gameplay automation or fabricated timer.
- Honours existing full/essential/off preferences; TTS is not required. Mobile landscape and portrait typography retained without a central blocking banner.
- Added ring/impact radial shards for real boss hits and counter/burst/failure engine events. Max boss-contact hit stop 35ms with 120ms throttle; counter 85ms, burst 55ms, and shake capped at 15. Disabled motion pulses under reduced motion. No HP/reward/damage/boss rules changed.
- HUD meter confirms actual boss impact briefly, not a fake hit counter.

## QA gates
- Unit test: tests/signal-breaker-raid-visual-guide.test.ts.
- Browser: scripts/verify-raid-boss.cjs (1440×900, 390×844, 844×390, 320×568), no-audio seed, practice with valid rail aim, fake→true warning and burst.
- Commercial art, premium audio mix, real Android touch, sustained-fire frame times, and subjective feel remain pending approval.
