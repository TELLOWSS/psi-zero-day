# Authored tablet command animation candidate

## Scope

Two identity-preserving generation passes produced a four-frame 2x2 transparent sheet for the approved female player. The second pass reduces edge clipping and keeps the tablet-command gestures: neutral, preparation, activation and return. No firearms or fantasy equipment were introduced.

Candidate: `public/review/player-command-v1.png`.
Review tool: `public/review/player-command-v1.html`.

## Visual Gate

The candidate is not referenced by gameplay and is not visual-production locked. AI-generated poses still differ from the approved map sprite in proportions, registration and material detail. Replacing the actor only during attacks would cause an identity/scale transition; those differences need art review and a consistent neutral/walk/attack set before adoption.

The review tool uses per-cell opaque bounds and a bottom-boot centroid to compare alignment. It supports frame stepping, playback speed, raw-cell inspection, original overlay and reduced motion. Alignment is presentation-only and does not alter the generated PNG.

## Reproduction Brief

Reference: `public/assets/episode01/characters/player-map.webp`. Preserve face, ponytail, white hardhat with blue stripe, navy work uniform, blue reflective vest, gloves and black tablet. Four equal square cells, transparent background, stable boots/head/hip registration, generous padding in each cell. Animate the right hand raising, activating the tablet and returning; left hand stabilizes the tablet. No aura or particles in the character sheet. Require anatomically correct hands and consistent materials across all cells.

## Next Gate

Review the candidate at actual 74px gameplay scale, settle character registration and socket coordinates, then produce intermediate arm/hand poses and a consistent neutral/walk set. Do not promote file existence or animation playback to final cinematic quality.

## Verification

Typecheck, production build and the regression suite passed (1,354 tests passed, one skipped). Browser checks passed at 1440x900, 390x844, 844x390 and 568x320: four distinct frames, 74px opaque character height, stable bottom alignment, pause, original overlay, playback and reduced motion. No horizontal overflow or browser errors were observed; compact landscape keeps the stage in view.

The sheet's minimum opaque-to-cell margin is only 3px, so the requested generous padding is not fully achieved. Foot registration is corrected only in the review renderer. Neither these checks nor the candidate publication constitute production character approval.
