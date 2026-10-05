# Gait transition refinement

- Cached textured leg animation uses 32 phases per stride instead of 16. Half-step phase coordinates retain the existing rig, knee solver, foot travel and authored actor images.
- Pose cache is bounded to 32 entries per prepared image, enough for one steady gait cycle (previous limit: 24). No full per-frame mesh redraw or unbounded animation atlas is introduced.
- Torso lean approaches its movement/rest target with simulation-time exponential smoothing. Stopping no longer removes lean instantly; pause and frame-rate equivalence remain deterministic.
- Full suite: 1,350 passed, 1 skipped; typecheck and build pass. Raster browser verification checks 32 phase coordinates and distinct renders for all nine character IDs/aliases, producing a contact sheet.
- Local headless Chrome measurement: cached actor drawing P95 approximately 0.1ms; cold frame P95 0.6-4.2ms. This isolates the actor renderer, not total game frame time or physical mobile performance.
- Fitting regression passes five desktop/portrait/landscape sizes. Authored arm/hand attack frames and physical-device motion review remain pending; no cinematic production lock is claimed.
