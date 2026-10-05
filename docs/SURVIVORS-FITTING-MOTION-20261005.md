# Animated Fitting Preview - 2026-10-05

## Implemented

- Fitting supports idle, walk, and repeating action poses plus pause/resume, existing facing controls, and zoom. Icon controls have localized accessible names and tooltips.
- Preview reuses actual actor, wearable, carried-tool, premium-gear, ground-seal, evolution, and silhouette-mantle renderers.
- An isolated presentation clock drives previews; no engine update, input action, purchase, durability loss, or shared player mutation is introduced.
- Images load on character change, not pose/facing/zoom changes. Canvas paints are capped at 30Hz without per-frame React state updates.
- Animation cancels when the fitting tab is inactive, the document is hidden, playback is paused, reduced-motion is active, or the component unmounts. Resume retains the preview clock without hidden-time jumps.
- Short landscape layouts use viewport-constrained preview sizing and compact zoom controls so sticky tabs do not cover the character or pose controls.
- No new art/audio assets or cinematic production lock.

## Verification

- Full suite: 1,343 passed, one intentionally skipped; typecheck and production build passed. Focused pose/store tests passed again after final rendering adjustments.
- Browser checks passed at 1440x900, 390x844, 844x390, 667x375, and 568x320 using a six-category draft loadout.
- Actual canvas pixels changed during playback and facing changes, remained identical when paused/reduced/inactive, and were nonblank. Stored data remained unchanged.
- Landscape checks assert the canvas stays below sticky tabs and all pose buttons stay within the viewport. Portrait and short-landscape screenshots reviewed.
- React review: isolated effects and clock ref, stable store preview memo, listener/RAF cleanup, primitive asset-loading dependency, bounded canvas cadence, accessible controls.

## Review Boundary

Controlled browser checks do not establish physical-device frame rate or every character/loadout art approval. Director review of motion feel and multi-item visual density remains necessary.
