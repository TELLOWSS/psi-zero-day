# Industrial Boss Direction

## Scope

Original PSI crane lifting assembly replaces the existing crane-load slot: visible hook, shackles, short slings, yellow spreader, secured structural steel and rebar. RGBA asset is alpha-trimmed once through the existing prop atlas cache. New asset: `/assets/survivors/crane-load-v4.webp`, 1254x1254, 324194 bytes. Original generated asset `exec-847f8192-b82d-45e2-89f3-c0e5f0f3ae8a.png`; first candidate `exec-b35e5efc-d9f8-44d8-8250-ec1bc572b4d5.png` was rejected for a clipped top pulley. No franchise artwork used.

Cart pose follows existing approach/warning/charge/cooldown facts. Anticipation compression uses the real .9-second regular or 1.2-second designated-boss warning window. Locked horizontal charge direction drives facing. A bounded chassis lean and compression distinguish acceleration and braking without moving ground anchors or altering collision. Reduced motion removes these transients and freezes crane sway.

Crane shadow stays near the actual warned contact zone, one rope joins the painted hook, the title and health bar sit above the complete lifting assembly. Damage response is a restrained load brace. No new impact phase, artificial fall, hit-stop, combat timing, range, HP, AI or reward changes. This is rig-style motion using finished textures, NOT authored multi-frame sprite animation.

## Verification Gates

Unit tests cover phase bounds, designated-boss timing, no state mutation, load sizing and reduced-motion freezing. The existing browser QA adds an explicit crane fixture alongside industrial hazards at desktop/portrait/landscape viewports. Constructed fixtures are not natural-play completion or physical-device performance evidence.

Verified: 1293 regression tests passed, one existing skip; typecheck and production build passed. All three browser viewports passed with no page errors or document overflow. Raster comparison observed 25772 changed channel values for crane sway, zero for reduced-motion sway, and 8345 for cart preparation versus charge. Screenshots show the complete lifting assembly and the preserved ground warning.

Remaining: authored frame-by-frame movement, other boss families' dedicated assets, natural-play readability and low-end-device FPS. Director visual production lock still requires review.
