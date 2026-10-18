# SIGNAL WATCH — Production Visual Pass, 2026-10-18

## Intent
Differentiate **Signal Watch** from Signal Breaker: grounded Korean jobsite patrol, field
instrumentation and human pre-incident warning intelligence rather than an arcade neon shooter.

## Implemented
1. Runtime `data-watch-theme` takes the existing typed live stage theme:
   surface_logistics / deep_excavation / highrise_slab / curing_chamber / datacenter.
   CSS gives each theme its own restrained industrial instrument material.
2. Runtime `data-watch-signal` uses the **existing** `checkDanger` computation
   (health, proximity, boss signal, active hazard and cut-in). It updates only
   when the value changes; it does not modify collision, spawns, scores or saves.
3. Optically simplified combat HUD, contrast and hierarchy tuned for portrait,
   landscape and touch, with a 4px live risk pip and an industrial identity tab.
   No oversize fake hologram is added over threats; full-screen edge vignette
   is disabled at low graphics quality.
4. Cinematic loading: retained single original key art, image layering unchanged.
   Implemented vector-like CSS framing, atmospheric grading, subtle range
   instrument, typography and improved portrait/short-landscape compositions.
   No new hard-coded progress delay or duplicate key art.
5. Accessibility: focus states and motion-reduction support.

## Locks / incomplete gates
- All production character sheets, maps, bosses, projectile sprites and audio unchanged.
- This is an **implemented CSS/canvas-composition polish pass**, not newly authored
  hi-res character or world artwork. Graphical final acceptance requires side-by-side
  Chrome/Android screenshots at 320×568, 390×844, 844×390 and tablet, including
  worst-case projectile/hazard crowding.
- Keep PR #210 Draft and production main untouched until final art, Android-device
  measured FPS and human approval.
