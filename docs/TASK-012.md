# TASK-012 — Executable Verification

## Goal

Run the Episode 01 vertical slice in a clean Node 22 CI environment and fix every executable verification failure before release preparation.

## Final verification workflow

`.github/workflows/verify.yml` runs on pushes to `astra/task-007-casual-strategy-foundation`.

1. `npm ci`
2. `npm run assets:vector`
3. `npm run assets:manifest`
4. `npm run assets:check`
5. `npm test`
6. `npm run typecheck`
7. `npm run build`

The generated SVG fallback files are intentionally gitignored. The deterministic generator/spec plus `content/episode01/assets.json` are the source of truth until approved final WebP assets replace the fallback.

## Failures found and fixed

- Generated Episode 01 art was stale relative to the current generator. CI now regenerates the deterministic fallback before verifying it.
- Seven next-day equipment-skill text IDs were missing from the Episode locale and caused registry validation failures. Added the missing Korean localization entries.
- Old UI tests incorrectly treated `PSI` as a hidden engine term even though PSI is now a legitimate brand/HUD label. The tests still reject internal result labels such as `BEST_CONTROL`, `NEAR_MISS`, and `RELATION_CONFLICT`.
- Old portrait tests bypassed the asset registry. They now verify the formal `asset_id -> portraitUri` path.
- The UI test driver did not know the routed inspection/report/TBM/restart/training/next-day choice nodes. It now traverses the current 11–16-event routed playthrough.
- Map-first result handling now uses `맵으로 복귀`; the UI regression driver follows that same player flow.
- TypeScript narrowing for signal targets was made explicit without changing runtime behavior.
- Optional `StatMap` assertions in instruction/stop-work tests now use explicit zero defaults for type safety.

## Verified result

A clean GitHub Actions run completed:

- Episode 01 generated asset verification: **PASS** — 17 generated assets.
- Vitest: **39 test files / 319 tests PASS**.
- TypeScript app/tests typecheck: **PASS**.
- TypeScript engine typecheck: **PASS**.
- Vite production build: **PASS**.

No new PSI, risk, economy, accident-probability, career or scoring formula was introduced during verification.

## Engine boundary

`src/engine/*` remains unchanged relative to `main` during TASK-007 through TASK-012 work. Verification fixes were content, app/UI, tests, assets, documentation, and CI only.

## Next

TASK-013 — Web/Android release preparation. Do not add another gameplay system before deployment/package readiness is established.
