# Premium Equipment Visibility Review

## Scope And Finding

The previous verification established playback, state isolation, and lack of browser errors. It did not establish adequate paid-equipment visibility at actual character scale. That was an insufficient acceptance criterion for the user's request.

- Body mantle selected two signatures normally and one under crowding. Acquired evolutions were selected first, so paid equipment could receive no body signature.
- Material ribbon peak idle alpha was 0.20, and worn-item glow was only 13x11 world pixels at alpha 0.18.
- Five equipped items reduced premium detail even without a crowded scene.
- Short acquisition/deployment effects are not a substitute for visible ongoing equipment presence. Independently animated equipment coverage remains partial.

## Local Changes

- Added a six-frame continuously flowing authored body corona, aligned and cached once at load, with three cached material color variants. It draws behind the opaque character and worn layers, not as a ground-range circle.
- Body presence increases with valid unique equipped-item count rather than decreasing at five items. Two material palettes share the corona's left and right halves; this is a shared material layer, not sixteen unique authored animations.
- Acquired equipment reserves two mantle slots even with multiple active evolutions; normal mantle budget is four, crowded budget two.
- Ribbon idle peak alpha is 0.46, action peak 0.70. Socket glow is 21x17 with a simulation-clock pulse around 0.58. Shield presence and confirmed shield-feedback brightness were increased.
- Action peaks increase corona size and brightness within bounded dimensions. Reduced-motion mode suppresses the authored corona; no input, damage, range, gameplay time, camera flash, or purchase rules changed.
- Three color caches total approximately 4.5 MiB of RGBA canvas storage, excluding source-image decode. No per-frame corona canvas allocation. This is not a physical-phone performance measurement.

## Verification Evidence

`scripts/verify-survivors-premium-visibility.mjs` compares controlled six-item fixtures using the previous HEAD mantle/ribbon/gear renderers against the new renderers. Both use the same actor, wearable assets, pose, scale, time, and background. Previous renderer snapshots are retained locally under `artifacts/premium-visibility/baseline-*.ts` and are not production assets.

The comparison gallery includes unequipped, one-item, previous six-item, new six-item, and new action-peak views. Backgrounds are the actual stage-one floor image, bright concrete, and a dark floor sample. Pixel thresholds measure visibility relative to the same equipped body without decorative VFX; they are not a visual-quality score or a Diablo-equivalence metric.

- Actual floor and bright/dark samples all passed increased visible and strong-contrast pixel thresholds.
- Crowded presentation retains more than 55% of normal contrast energy; action peak exceeds idle energy.
- Multiple evolutions no longer erase paid presence; successive animation times change the visible corona.
- Actual local game screenshots use six equipped IDs in a controlled fixture, not the user's production inventory. PC 1440x900, portrait 390x844, and landscape 844x390 loaded without page errors or horizontal overflow.
- Portrait recording: `artifacts/premium-visibility/six-equipped-portrait.webm`.
- Gallery: `artifacts/premium-visibility/1440x900-comparison.png`; measurements: `artifacts/premium-visibility/report.json`.
- Full unit suite: 1421 passed, 1 skipped. Production build including type checking passed.

## Director Review

At the actual game scale, the local six-item character has clearly visible gold/cyan side energy and brighter attachment lights, including on bright concrete. The face and body remain readable because the broad corona is drawn behind them. This is a visibility correction, not a declaration of cinematic or Diablo-level graphics. Unique per-item shapes, higher-quality intermediate walk art, purchase-to-equip flow verification on the user's inventory, and physical-device performance are not established by this evidence.

The raw corona candidate needs runtime alignment to satisfy cell margins; it is not approved as a uniform-grid raw sheet. The alternate generated edit was not selected. Existing normalization contains and aligns the selected authored frames without creating new walk art.

## Publishing

GitHub and Vercel synchronization remain stopped. The published website does not contain these local changes. Preview locally at http://127.0.0.1:5196.
