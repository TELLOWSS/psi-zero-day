# Gas / Collapse Boss Art

## Integrated Candidates

- Gas: original portable wheeled pressure manifold, copper pipe joints, red valves, cracked gauge and localized mint vapor. The first plume touched the canvas edge and was corrected. The fixed-skid candidate was replaced with industrial casters to match the existing approaching/moving boss.
- Collapse: original fractured precast concrete core with a torn diagonal I-beam, bent reinforcing rods and deep cracks. It follows the existing warning/fall/recovery elevation, without changing its collision footprint.

Assets are true-alpha WebP, 1312x1199 each: `gas-manifold-boss-v1.webp` (386990 bytes) and `collapse-core-boss-v1.webp` (443516 bytes). All four corners are transparent. These are separate generated production candidates, not alternate tints of the ordinary hazard atlas.

Only designated bosses select the new assets. Ordinary clouds, split gas and ordinary debris retain the existing atlas. Solid gas hardware is opaque, grounded and not stretched by the cloud breathing animation; the real pressure warning remains visible. Presentation-only minimum sprite extents are 76px/72px; engine radii and damage are unchanged.

Sprite placement and HP/variant labels share one elevation-aware calculation. Redundant mobile boss variant labels are suppressed, while the compact boss HUD and actual warning geometry remain visible.

## Checks

Typecheck/build pass; full suite 1309 passing, 1 opt-in skipped. New placement regression covers solid gas grounding, ordinary cloud centering and debris elevation without radius changes. Browser phase fixtures cover four boss families at desktop, portrait and landscape: 12 combinations with nonblank canvas, finite bars, no overflow or page errors. Fixtures inject render phases and are not natural or physical-device playthroughs. Screenshots: `artifacts/boss-phases/`, particularly stage 22 gas and stage 35 collapse.

The four existing industrial boss families now each have dedicated replacement art. This does not mean 50 individual map-specific bosses, a full monster animation set or final Director visual lock. Physical-device performance and normal-play art readability remain review items.
