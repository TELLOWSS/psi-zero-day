# GitHub-First Development Mode

Status: ACTIVE  
Project: PSI : ZERO DAY  
Effective: 2026-09-24

## Operating rule

GitHub is the canonical development and synchronization target.

Normal development commits:
- commit/push to GitHub only
- do not trigger Vercel automatically
- do not run heavy GitHub Actions automatically

Vercel is used only when a production gate requires:
- actual browser visual QA
- responsive/mobile QA
- stakeholder preview
- release candidate verification
- production deployment

## Vercel

`vercel.json` sets:

```json
"git": {
  "deploymentEnabled": false
}
```

This disables automatic Git-triggered Vercel deployments.

A Vercel deployment must be started deliberately when a gate requires it.

## GitHub Actions

Heavy current QA workflows are manual-only via `workflow_dispatch`.

Main-branch automatic workflows that previously consumed Actions minutes were converted to manual-only on the active G2 branch, including:
- Episode 01 background inbox ingest
- Episode 01 performance inbox ingest
- Episode 01 audio materialization
- Episode 01 character performance materialization
- Episode 01 final background materialization
- Episode 01 final-art verification
- vertical-slice verification
- DEF-HD01 PQ benchmark QA

Historical branch-specific workflows are preserved because they do not run unless those historical branches are pushed again.

## Cleanup policy

Prefer preserving historical source and workflow definitions over destructive deletion.

Safe automatic cleanup:
- obsolete temporary repository files after validation
- temporary diagnostic workflows after diagnosis
- superseded QA files when a newer locked baseline replaces them

Do not delete without explicit gate evidence:
- production assets
- master manifests
- saved QA evidence referenced by a lock
- main history
- current gate branch files

## GitHub Actions artifacts

Past GitHub Actions artifacts are stored outside the repository tree.

The current connected GitHub tool can inspect/download workflow artifacts but cannot delete them. Artifact deletion must therefore be done in GitHub UI/account settings when storage cleanup is required.

No new workflow should rely on artifact upload while the storage quota is constrained. Compact QA evidence should be committed into the repository only when required by a Production Lock.

## Gate deployment rule

Development -> GitHub only  
Gate candidate -> manual Actions if runner capacity is available  
Visual QA required -> manual Vercel deployment  
PASS -> Production Lock / merge  
Next development cycle -> GitHub only

## Manual G2 QA launcher

The default branch contains `.github/workflows/manual-g2-production-qa.yml`.

It is `workflow_dispatch` only and never runs automatically. When GitHub-hosted runner allocation has recovered, use this launcher once with:

- target ref: `sol/def-hd01-pq-benchmark-20260924`

The launcher checks out the G2 branch, runs Typecheck/contracts/build/Chromium actual-browser QA, and writes only compact QA evidence back to the G2 branch. It does not trigger Vercel.
