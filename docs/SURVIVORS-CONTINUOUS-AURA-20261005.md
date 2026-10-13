# Continuous actor and aura presentation

- Cached leg mesh poses remain bounded. A continuous residual translation removes quantized torso action/reaction and gait bob steps; wearable sockets use the same continuous torso coordinate.
- Dominant premium/evolution mantle signatures now use three independently phased rising raster wisps and a curved silhouette ribbon instead of two large rigid raster panels. Wisps fade to zero at recycling boundaries, preserving temporal continuity.
- Attack response changes wisp width and opacity. Existing simulation clock, movement drag, mirroring and equipment identities are retained. Busy mode uses one signature and two wisps; normal mode draws at most six wisps.
- Gameplay damage, range, economy and item ownership are unchanged. No wall-time animation or new placeholder artwork is introduced. Reduced-motion and paused rendering remain stable.
- Verification: 1,345 tests passed, 1 skipped; typecheck and build pass. Real-browser PC/portrait/landscape controlled encounter and raster animation regression pass.
- This is an incremental improvement using existing raster assets, not new hand-animated attack frames. Authored separated arm/cape layers and item-specific animation atlases remain future art work. Device performance and subjective motion quality still need director review.
