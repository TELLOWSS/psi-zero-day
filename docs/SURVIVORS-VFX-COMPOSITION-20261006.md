# Weapon and equipment VFX composition contract

## Direction
Reference goal: the readable layered timing of high-end action RPGs, not copied Diablo assets or a claim of equivalent art quality. A brighter static aura is not the acceptance criterion. Gameplay physics, damage, aim and projectile lifetime stay unchanged.

## Roles and timing
- Idle equipment: restrained body-local moving presence; no permanent large ground circle. Existing socket and torso attachments remain authoritative.
- Firing: a short muzzle exposure, followed by a directional colored material wake. Launch presentation lasts 0.14 seconds with a smooth short attack.
- Travel: preserve every simulated projectile; reserve cinematic detail for each active eligible weapon kind before spending extra slots on nearby projectiles.
- Impact: immediate high-contrast core decays rapidly; colored material moves outward and survives the core. Normal/critical presentation lasts 0.24/0.30 seconds.
- Release: residual motion only, 0.22 seconds; never another large explosion.
- Equipment: shock discharge, barrier deployment and dispatch wake retain separate authored sequences and event triggers. Shared presence is not sixteen bespoke equipment animations.

## Overlap policy
- Within 28 world units, each launch/impact phase has one hot-core owner, selected by importance. Other contacts retain a colored accent instead of accumulating white flashes.
- Industrial impact material remains the primary core when applicable, but no longer consumes and hides the weapon's colored accent.
- The 64-effect pool reserves representatives of different weapon/phase groups. Held ultimate cut-ins are protected. Worker and blocked receipts retain their independent semantics.
- Cinematic flight budgets remain 42 normal / 28 crowded / 18 busy. Selection is round-robin by weapon kind, then proximity, not array insertion order. Ordinary fallback rendering still draws unselected projectiles.
- Reduced-motion behavior, boss telegraphs and safety receipts must not be replaced by decorative spectacle.

## Acceptance and remaining work
Automated gates: fair selection under saturation, bounded pools, protected ultimate, one local core, immutable simulation input, distinct exposure/material timing, existing gameplay/audio regressions.
Browser gates: actual atlas loads, animation changes over time, six equipped items remain visible across portrait/landscape/desktop, no runtime exceptions or overflow.
Art gates still required: bespoke animation for remaining equipment, actual alternating-foot intermediate walk art, consistent material direction and scale in real combat, boss telegraph readability under maximum load, physical S26 Ultra frame pacing. Technical gates do not constitute cinematic visual approval.

All changes remain local. GitHub and Vercel synchronization is stopped at the user's request.

## Local verification result
- Full Vitest rerun: 1,426 passed, 1 skipped; 262 files passed, 1 skipped. The old ordinary-launch expiry assertion was updated from 0.11 to 0.15 seconds for the deliberate 0.14-second presentation duration; ultimate duration is unchanged.
- Production build and both TypeScript configurations passed. Diff whitespace check passed.
- Browser contact timeline: real cinematic/industrial atlases loaded, all 15 samples nonblank, one core selected for the three-weapon overlap, changing material pixels through 0.01/0.04/0.08/0.14/0.22 seconds. This is a controlled rendering fixture, not proof of full combat art quality.
- Six-equipped actual-game and visibility regression passed at 1440x900, 390x844 and 844x390, without page errors or overflow. Existing bright/dark floor and evolution visibility assertions passed.
- Evidence: `artifacts/vfx-composition/contact-timeline.png`, `artifacts/vfx-composition/report.json`, `artifacts/premium-visibility/report.json`.
