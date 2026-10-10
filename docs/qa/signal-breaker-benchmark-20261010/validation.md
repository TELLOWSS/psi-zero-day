# Signal Breaker v0.9 verification — 2026-10-10

- Full repository: 351 test files passed / 1 skipped; 2037 tests passed / 1 skipped (`npm test`). Run before final presentation-only camera/shade/font adjustments; focused tests and browser checks rerun afterwards.
- Final focused tests: 40 passed / 0 failed (`node --test public/signal-breaker-dev/tests/*.cjs`).
- `npm run typecheck`: passed.
- Final `npm run build --ignore-scripts`: passed; existing >500kB chunk warning remains.
- `verify-benchmark.cjs`: 6 viewport flows passed, scene-plane coverage, no-input fire, manual fire/cancel, tactical pause, manual radar aim without fire, quick retry preserving loadout/upgrade, guide timeout, best-time local persistence, result CTA.
- `verify-linked-art.cjs`: 5 stages × 2 mobile orientations passed; linked left/right aiming, vertical angle adjustment, manual fire/release, all native scene assets loaded, no browser errors.
- `verify-immersive.cjs` now routes to current manual verification, replacing stale automatic-fire assumptions.

Captured result statistics are deliberately generated browser test state to verify persistence and layout; they are not a human-play score. Browser viewport verification is not Android/iPad FPS, thermal, or ergonomic acceptance. No production deployment or Final Art Lock asserted.
