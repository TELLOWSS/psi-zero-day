# Inspection drone presentation

## Implemented

- The inspection wing rests on each character's calibrated docking socket instead of continuously orbiting the player.
- Only living hazards actually suppressed by the engine's existing premium speed rule can trigger deployment. Valid targets remain selected to prevent nearest-target jitter.
- Presentation phases: docked, launching, inspecting, returning. Launch lasts 0.35 seconds and return lasts 0.45 seconds, with eased motion and a moving return socket.
- Pausing freezes flight; reduced motion uses static docked/inspecting poses. Character facing mirrors the physical docking anchor.
- Suppression indicators follow the actual 180-unit engine eligibility rule. Damage, range, inventory, and save data are unchanged.
- Both gameplay and fitting previews use the same character-aware attachment path.

## Verification

- Full suite: 1184 passed, one existing skipped test.
- Typecheck and production build passed.
- Focused tests cover range boundaries, dead hazards, target retention, return, clock reset, pause, reduced motion, facing, and absence of engine mutation.
- Browser fixture: tests/inspection-flight-browser.html. Uses production raster assets and rendering helpers; fixture hazards are test-only.
- Browser captures checked for docked, launching, inspecting, and returning poses.

## Next production prompt

Author independent folded and deployed inspection-wing raster frames, preserving the current character-specific docking sockets. Add rotor articulation and appropriate front/back body occlusion without changing engine balance. Verify all six canonical characters and mobile viewports. Keep reduced-motion poses and pause behavior deterministic. Obtain Director approval before labeling candidate art final.

Orchestral recordings, stems, drone launch/return Foley, mixing, and mastering remain separate production work. This change adds no new recorded audio and makes no film-grade asset approval claim.
