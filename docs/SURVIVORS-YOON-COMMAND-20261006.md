# Yoon Sungho authored command integration

## Implemented

The canonical Yoon Sungho now uses `public/assets/survivors/yoon-command-v1.png` in gameplay and fitting. Eight authored wrist/tool poses share the registered neutral body and existing continuous walking rig. The character retains his yellow helmet, tan reflective utility vest, charcoal workwear, gloves, boots, wire tool and coil. No combat, economy, progression or audio rules changed.

The command band is body-local y=.31 to .60. Head/PPE and lower-body pixels stay canonical. Hip joints, knees and support boots are calibrated to the new neutral. Protected tool/glove/coil regions restore the carried objects over the moving leg mesh. Per-frame equipment occluders follow the tool wrist; the coil-side occlusion remains stable. The separately illustrated legacy `yoon` actor is deliberately not silently replaced.

## Asset generation record

The built-in image generator referenced `public/assets/episode01/characters/yoon-sungho-map.webp`, then refined the first generated sheet. Final output was copied from `$CODEX_HOME/generated_images/01a1002a-207a-7242-a0aa-73c7b743c706/exec-80bfb19c-6901-44cc-86b3-70d635f06332.png`. Original outputs remain outside the repo.

Prompt brief: preserve the exact mature worker identity, helmet, vest, workwear, gloves, boots and wire tools. Produce eight full-body poses in a rigid 4x2 transparent grid: neutral, wrist rotation, small inward/upward tool pull, maximum pull, release, descent, nearly neutral and completion. Keep camera and body scale fixed and keep coil visible in every cell. Refinement requested transparent alpha, generous cell margins and more legible wrist progression. The source PNG's alpha was inspected; background sample pixels are alpha zero. No programmatic image alteration was used.

## Verification

`npm test`: 1,364 passed, one skipped. Production build and both TypeScript projects passed. The command-cast browser script includes player, Kang, Lim and Yoon frame registration checks, eight distinct body composites, stable face/lower-body pixels, walking equipment and both facings. Fitting checks cover the three new command actors at 1440x900, 390x844, 844x390 and 568x320, with moving frames, pause, reduced motion, exact character asset loading, no horizontal overflow and no browser errors. Reports/screenshots remain local under `artifacts/command-cast`.

## Director review / remaining scope

This is not a final cinematic lock. Pose spacing is still uneven and generation did not provide the requested generous gutters. Runtime registration stabilizes the neutral regions; character identity and the timing of the wrist sequence require visual approval. Lee and the safety monitor still need authored intermediate poses. Actual front/back/eight-direction artwork remains outstanding; horizontal facing mirrors the current sheet.
