# Episode 01 Release Gate

Last synchronized: 2026-09-20

## Production visual/audio gate

- Immersive final backgrounds: READY — 8/8 exact 1920×1080 WebP binaries
- Character performance wave 01: READY — 5/5 exact transparent WebP binaries
- Production-v1 audio: READY — 8/8 exact binaries
- Release production gate: BINARY-READY

## Responsive browser gate

The repository CI verifies both the title surface and Episode 01 entry scene with real Chromium at:

- 1440×900 desktop
- 1920×1080 desktop
- 390×844 phone portrait
- 844×390 phone landscape
- 820×1180 tablet portrait

Required checks include horizontal overflow, primary-frame bounds, broken visible images,
framework error overlays, Episode 01 immersive event rendering, and 44 px minimum touch
targets on touch layouts.

## Regression gate

- TypeScript typecheck
- Production Vite build
- Episode 01 visual production checks
- Full test suite
- Responsive screenshot/report artifact

This document records the release baseline after exact binary ingest. It does not replace
the automated checks in .github/workflows/verify.yml.
