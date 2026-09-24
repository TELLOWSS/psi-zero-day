# GitHub-First Development Mode

Status: ACTIVE  
Effective: 2026-09-24

## Rule

GitHub is the canonical development and synchronization target.

Normal development:
- commit and push to GitHub
- no automatic Vercel deployment
- no automatic heavy GitHub Actions

Vercel is used only when a gate requires:
- browser visual QA
- responsive/mobile QA
- stakeholder preview
- release-candidate verification
- production deployment

## Vercel

`vercel.json` sets:

```json
"git": {
  "deploymentEnabled": false
}
```

This disables automatic Git-triggered Vercel deployments. Manual/on-demand Vercel deployment remains available when required.

## GitHub Actions

Main-branch workflows that previously ran automatically on push are retained but changed to `workflow_dispatch` only.

Historical branch-specific workflows are preserved because they do not run unless those historical branches are pushed again.

## Cleanup

Prefer non-destructive cleanup:
- preserve source/history
- disable automatic execution before deleting workflow definitions
- remove temporary diagnostic files after use

Past GitHub Actions artifacts live outside the repository tree. The connected GitHub tool can inspect/download them but does not expose artifact deletion, so storage cleanup of old artifacts requires GitHub UI/account controls.

## Gate flow

Development -> GitHub only  
Gate candidate -> manual Actions if needed  
Visual QA -> manual Vercel deployment  
PASS -> Production Lock / merge  
Next cycle -> GitHub only
