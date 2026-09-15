# TASK-013A — Web release bundle + Vercel contract

## IMPLEMENTED

- Added an explicit `vercel.json` contract for the Vite static build.
- Vercel install/build/output are fixed to `npm ci`, `npm run build`, and `dist`.
- Added production web metadata and the `PSI : ZERO DAY` document title.
- Added `npm run release:check` as a single pre-release gate.
- GitHub Actions now uploads the exact verified `dist/` output as `psi-zero-day-web-dist` after tests, typecheck, and build all pass.
- Generated Episode 01 SVG fallback art remains deterministic and is included in the verified web bundle.

## FILES

- `vercel.json`
- `index.html`
- `package.json`
- `.github/workflows/verify.yml`
- `docs/TASK-013A.md`

## TEST

Latest verification run for the web-bundle commit completed successfully:

- deterministic asset generation: PASS
- asset verification: PASS
- test suite: PASS
- TypeScript typecheck: PASS
- production Vite build: PASS
- verified `dist/` artifact upload: PASS

The deployable artifact is generated only after all previous gates succeed, so the release bundle is the same output that passed CI.

## VERCEL STATUS

The connected Vercel account does not yet contain a `psi-zero-day` project. Existing projects are unrelated applications.

The repository is deployment-ready, but GitHub-to-Vercel project linking must be created once in the Vercel dashboard because the available connector can deploy to/list projects but cannot create a new Git-linked Vercel project.

Recommended first deployment is a Preview from `astra/task-007-casual-strategy-foundation`. Do not switch production to the old `main` branch yet; `main` has not received the completed vertical-slice branch.

## TODO

1. Import `TELLOWSS/psi-zero-day` as a new Vercel project.
2. Keep the first review deployment on the active feature branch as Preview.
3. Smoke-test loading, generated art, map actions, autosave/resume, audio fallback, and a full Episode 01 completion in the deployed browser build.
4. Only after preview approval, decide the merge/production-branch step.
5. Then proceed to Capacitor/Android packaging.

## DIRECTOR REVIEW

No PSI formulas, career/economy thresholds, event rules, or CoreEngine behavior were changed in TASK-013A.
