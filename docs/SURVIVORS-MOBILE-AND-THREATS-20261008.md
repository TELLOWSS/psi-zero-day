# Survivors mobile responsiveness and ordinary-risk variety

## Trigger and resulting behavior

On slower phones/tablets, large canvases and cosmetic bursts can delay input frames. Landscape phones also used a fixed 1:1 zoom, leaving a short view of the field. Ordinary threats predominantly reused time-based late-wave variants.

- Presentation adjusts canvas density (high/balanced/low), particle count, ambient lighting and cosmetic blur. It does not adjust difficulty, spawn limits, warnings, weapon speed or enemy count. A 2.8M backing-pixel limit bounds large tablets.
- Viewport dimensions are observed rather than read from layout every frame. Landscape zoom uses screen height; portrait keeps a wider view. CSS covers touch phones, short landscape and larger tablets, including dynamic viewport height and safe areas.
- The UI sends at most five fixed steps of elapsed time after a foreground stall, discarding excess wall time. The engine's deterministic 60Hz API remains unchanged. Long stalls therefore slow game-time progression rather than performing 15 simulation steps in one input frame.
- Stage families select pulse/split gas and reinforced carts earlier after the opening introduction. New ordinary-risk behaviors: side approach before a cart's locked charge warning; lateral gas drift; a larger falling-debris footprint with the existing warning duration. New traits do not apply to authored signature hazards or bosses.
- Existing production sprites remain in use. Behavior labels identify the new counterplay. This is a behavior/encounter pass, not 50 newly authored monster artworks or a final art lock.

## Validation

Local Node runtime checks: quality degradation/recovery and pixel limit; six viewport geometries; all 50 stage-family transitions; locked cart warning direction; six seeded 60-second engine simulations with automatic perk selections.

Repository tests: `survivors-mobile-budget.test.ts`, `survivors-stage-threats.test.ts`. Existing full regression, typecheck and production build run in PR CI.

`scripts/verify-survivors-mobile.mjs` adds actual browser touch/release, control geometry and screenshots at 390x844, 360x650, 844x390, 568x320, 820x1180 and 1180x820. It also uses an explicitly synthetic crowd and 4x CPU throttle; this is not evidence of physical Android frame rate or a natural stage clear.

## Remaining production review

Review screenshots and play physical low/mid/high-spec Android devices before declaring performance or visual production lock. New specialist density/labels need play feedback; support/remote-fire archetypes and distinct authored silhouettes remain future scope.
