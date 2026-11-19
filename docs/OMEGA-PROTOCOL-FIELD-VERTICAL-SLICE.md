# OMEGA PROTOCOL — Field traversal vertical slice

**Branch:** \`feat/omega-protocol-roguelite-core-20261108\`, draft PR #235.
**Status:** first gameplay prototype; **NOT final 3/4-camera AAA art** and **NOT Production**.

## What is actually implemented
- Existing SIGNAL WATCH engine handles player movement, automatic attacks/projectiles, damage, dodge, ultimate, real enemy collisions and 9/15 boss encounters. OMEGA PROTOCOL opts into independent external wave generation and never uses premium campaign currencies/save keys.
- New optional session flag \`{fieldTraversal:true}\` does **not** alter existing auto-wave compatibility. In field mode, clearing enemies changes the state from \`combat\` to \`objective\` without advancing the wave.
- Each of the **15 nodes** belongs to one of **5 construction/industrial sectors** (night access road, scaffolding, crane zone, underground utility, control center). These are **five terrain palettes, technical vector props, and node-specific checkpoint positions**, not fifteen unique polished hand-authored locations.
- Three event kinds are deterministic from seed and node: power isolation (3 breaker/inspection stops), worker evacuation coordination (2 verification/handoff stops), and structure stabilization (3 brace/control stops). The player has to reach each actual world position within a **100-unit proximity radius** and press PC \`E\` or touch **조작**, in order. A simple click with no approach is rejected.
- The exit remains locked until all checkpoint actions succeed. After opening the exit, the player must walk to its own world position and interact to settle the current wave, receive a tactical draft if appropriate, and enter the next field node.
- Solid industrial props perform a preliminary circle-to-AABB character collision and sweep-distance check against one-frame wall tunneling. **Enemies and projectiles do not yet use the same navigation/occlusion model**; this is a technical limitation, not certified final pathfinding.
- The Canvas technical renderer draws construction floor lanes, barriers, scaffolding, equipment props, 3D-like side elevations, objective/exit markers, a responsive mission tracker and full-field radar; the player uses an original procedural humanoid *placeholder* and is NOT equipped with unapproved AIRA master art.
- Camera follows the player inside the rectangular 1400×900 field. Perspective remains a **technical 2.5D-look study**. The genuine ~40°–45° coherent quarter-view world projection, foot planting, true height layers and final lighting/animation are NOT yet done.
- Developer-only query \`?omegaLab=1\` requires Vite dev mode or explicitly authorized lab flag. Additional dev-only QA states \`?omegaQaState=objective|exit|reward|boss\` use the real in-session engine and required sequential interactions but **teleport the debug actor between checkpoints** to capture deterministic scenes. These are screenshots for QA, not legitimate player clears.
- Pure unit test \`tests/omega-protocol-field.test.ts\` checks progression and proximity gates, all fifteen nodes, two boss encounters, seven reward choices, event checkpoint counts and wall collision. The normal 15-wave simulation without the field flag is independently retained.

## Excluded from "completed"
1. Authored 8-direction × 20-frame original AIRA actor animation and correctly signed 320 front/rear equipment occlusion masks (PR #234 art gate remains CLOSED).
2. Full 3/4 projection and seamless connected multi-screen streaming; currently **node-based transitions** rather than one seamless world.
3. Actual escort follower NPC AI, timed puzzles, engineer-controlled machine animation, true terrain projectile collision, cover AI and boss multi-phase telegraphs.
4. Real Android thermal/FPS/memory/touch verification, long-session balance, accessible cinematic/audio production.
5. Full real playthrough and all PR/CI/browser screenshot checks on the new source revision. Vercel Hobby daily API deployment cap remains blocked; use GitHub Actions source-browser screenshots and localhost without claiming a successful Preview.

## Intended next acceptance checkpoint
Pass TYPECHECK, 15-node contract and actual Vite Chromium navigation/screenshot CI; open its seven captured screenshots (desktop/portrait/landscape/objective/exit/reward/boss); fix visible overlap or runtime exceptions; then prioritize real quarter-view scene projection and a first authored mission vignette before expanding the feature count.

**Release policy:** Keep PR #235 draft and Production on current stable revision. No user save migrations, payment requests or forced paid API calls.
