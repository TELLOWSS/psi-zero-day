# Crane Boss Load Upgrade

The designated crane boss now uses an original final-candidate suspended load: fractured concrete, steel beams, a heavy electromagnet/spreader, braided chains, worn red/yellow plating and amber beacon. Ordinary cranes retain `crane-load-v4.webp`. The first generated candidate had a cropped upper pulley; it was rejected and regenerated before integration.

Asset: `public/assets/survivors/crane-boss-load-v1.webp`, 1199x1312, 327506 bytes, RGBA WebP. Transparent alpha is preserved; all four corners have alpha zero. No chroma key or placeholder replacement. Rendering uses the existing pre-baked sprite cache, unchanged size and collision rules.

Crane art, health bar and title now share the actual elevation-aware pose. Mobile omits the redundant overhead boss title because the compact HUD already names the boss; warning geometry and avoidance captions remain. This avoids the title overlapping the landscape boss strip.

Verification: typecheck/build pass; full suite 1308 passed, 1 opt-in skipped. Elevated-pose regression confirms anchored X, top/bottom alignment and 70px lift. Boss phase browser fixtures cover 4 industrial families at desktop/portrait/landscape, 12 cases. Actual crane screenshots are in `artifacts/boss-phases/`, including warning and spent frames. These are controlled render fixtures, not physical-device playthroughs.

Remaining: gas/debris dedicated boss art, physical mobile performance and Director visual acceptance. This candidate integration is not a declaration of final cinematic art lock.
