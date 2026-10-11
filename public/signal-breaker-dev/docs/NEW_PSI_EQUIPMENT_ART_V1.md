# NEW-PSI industrial equipment art v1

Production candidate, generated with the built-in image generation tool on 2026-10-11. Original industrial containment machine and safety relay; no external reference image was supplied. Commercial trademark and completed-build rights review remains open.

Source: `generated_images/exec-50abebd9-9657-4a59-84e8-ec5d20b9d946.png` (1254×1254 RGBA, alpha 0–255).
Runtime: `public/signal-breaker-dev/art/boss-equipment-v1.webp` (450892 bytes, WebP quality 90, method 6, unchanged dimensions/alpha; format conversion only).

Measured crops: upper left/right 627×600; lower left/right 627×654 beginning at y=600. The authored transparent row gap is around y=595–605; mathematical half-height would cut the relay top. Boss rendered at 104×104 around the existing radius-48 body; circuit at 44×44, boss relay at 2×existing display radius. Existing collider, source/support, devices, camera and engine rules retained. Existing equipment stays available during loading and for rollback. New asset is boot-loaded and precached under v0.19.1.

## Exact final prompt

Use case: stylized-concept. Asset type: final production sprite atlas for original NEW-PSI industrial safety arcade game. Create one square transparent RGBA 2x2 sprite atlas, four equally sized square cells, centers precisely at quarter positions. Each sprite occupies 70 percent of its cell with clear transparent padding; no overlap across cells. TOP LEFT: front-facing compact industrial overload containment machine, six steel iris shield plates CLOSED over central insulated power chamber, cyan status lamps, broad circular steel housing, readable silhouette, no long dangling cables. TOP RIGHT: exactly the same machine, same camera/scale/housing, iris shield plates OPEN to reveal warm amber ceramic and copper power chamber, mechanical change clearly visible. BOTTOM LEFT: front-facing compact industrial safety relay unit, rounded triangular steel housing, three insulated terminal sockets, central unconfirmed amber status lens. BOTTOM RIGHT: exactly the same relay with confirmed mint-green central lens and illuminated mint terminal strips. Premium polished 3D painted game sprites, highly crafted beveled brushed steel, restrained wear, copper, ceramic insulation, readable broad forms and crisp contour lighting for a dark industrial scene. Consistent frontal orthographic view, no perspective floor, no cast shadow outside silhouette, transparent background between all sprites. Original functional industrial equipment, not creatures or people. No words, letters, numerals, logos, interface, watermark, scenery, references to other games. Do not use magical fantasy orbs; luminous centers are protected industrial lenses and power chambers. Final game art, not a mockup.

## Verification

73 standalone regression tests passed. Baseline 80 deterministic input runs reproduced the previous recorded dataset. Post-art simulation is compared with the complete baseline, rather than only aggregate success counts. Browser CI includes actual sealed/exposed fixtures at four viewport sizes, plus normal movement, manual firing, source control, recovery and blocked-lane handling. Human immersion, native device FPS and commercial clearance are not inferred from automated tests.

Final capture review found the short-landscape guide overlapping the boss status label. Presentation now selects a visible label position outside the guide band. A regression and live blocked-guide bounding-box assertion cover this correction. No engine rules change.
