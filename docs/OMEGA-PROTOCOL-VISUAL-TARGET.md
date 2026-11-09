# OMEGA PROTOCOL — Special Edition final gameplay visual target

Status: **art direction / internal implementation brief, NOT a shipping approval.**
Date: 2026-11-08 · PR #235 DRAFT.

## 1. What is this game?

A unique PSI : ZERO DAY action-roguelite playable in the REAL Watch combat engine.
Third-person 3/4-view movement through five original industrial environments,
15 fixed operation nodes, physical equipment interactions and exits, tactical
run-only upgrade choices, and two distinct bosses (wave 9 / wave 15).
The player is a field operator and must actively steer to complete missions.

The final product MUST NOT be mistaken for a generic arcade menu, pure top-down
survivors auto-play, static cinematic, or an imitation of another copyrighted
game's characters/monsters.

## 2. Hero identity: non-negotiable

- **The actual OMEGA/AIRA silver-haired FEMALE tactical operator from the
  established main-screen character direction**; a dark-haired male protagonist
  generated in some early concept previews is a reference error and is REJECTED.
- White/silver signature head silhouette, independent pink-tail accessory cue,
  asymmetric original tactical equipment, rifle and shoulder attachment points;
  all eight facing directions must preserve her identity, scale and gear.
- 8-direction authored walking, authentic planted foot gait, attack/reload,
  dodge, hit reaction and ultimate; shadow/contact anchors stay aligned to real
  Watch engine hitboxes. Final animator must supply independent NE rather than
  mirroring NW.
- Existing separate PR #234 is an UNAPPROVED movement/art study. The 160-frame
  final art and 320 masks in prior discussions are not already approved assets.

## 3. Target camera and game composition

- Original field physics XY; 3/4 projected world art is rendered separately.
  A readable operator stands in the gameplay world and has room to run around
  actual cover and approaching enemies.
- Walkable area must remain visible in mobile portrait (390×844), landscape
  (844×390), tablet and desktop; aim for 16–25% hero height relative to the
  short viewport dimension when it does not impair enemy awareness.
- Zone-specific near/mid/far materials, construction cranes, roof forms,
  scaffolding, control panels, caution mesh, dust, spotlight pools and
  reflective wet asphalt. Avoid making physical walkable cover visually flat.
- Occlusion and collision shapes match; the player must NEVER look like
  walking through an opaque machine or trapped behind a decorative wall.
- Boss wave 9: boom / hook industrial threat and warning circle.
  Boss wave 15: reactor/induction pylons and a lane-sweep warning.
  Warning phase and damage phase are mechanically synchronized.
- An original cinematic tone is permitted. No unlicensed art or copies of
  recognizable external game characters or their UI.

## 4. Minimal actual in-game HUD contract

Required: WAVE n/15, sector, current HP, real threat count, radar/minimap,
short current objective, on-map E interaction within genuine range,
movement stick with optional classic controls, dodge, charge-gated ultimate,
and real boss HP/warning for boss encounters.

Do NOT render unsupported visual-only game systems just because a mockup
contains them. In particular, a fictitious level 47/58, premium diamonds,
cash shop, invented currency totals, asynchronous multiplayer ranks, weapon
inventory, ammo counts or quest rewards are NOT part of PR #235's logic.
No extra purchasable systems, account rewards, ad monetization or paid API.

Korean HUD text must render in readable glyphs, not tofu boxes.
The player and threat telegraphs must remain visible beneath overlays.
Hide the mission editorial description during active combat;
show physical event details and exit guidance only when unlocked.

## 5. Authentic hit/gameplay visuals

- Rifle muzzle flash only from actual Watch projectile `launch` events.
- Impact sparks and damage numbers only from actual Watch `impact` events.
- Boss warning geography only from real `OmegaBossTelegraph` state.
- Bounded 24 impact effects per frame, <=0.26s visual lifetime to keep
  cheaper Android GPUs responsive; no unnecessary runtime image fetch.
- Render quality options must eventually support low/standard/high tiers
  without changing enemy HP, controls, fire cadence or collision behavior.
- Optionally add original audio/particle material only after device
  performance, audio mixing and copyright reviews.

## 6. Art assets and release gates

A gameplay concept illustration is **NOT** an executable screenshot.
Both concept previews created on 2026-11-08 contain a wrong male character,
fictitious economy/menu details and/or staging that differ from current
mechanics. Use them only for *general lighting and atmosphere*, not as
evidence of playable appearance or a final approved hero.

Before shipping:
1. Approve character front/back/side turnaround against main-screen identity.
2. Approve authored animation frames, limb-contact motion and equipment mask.
3. Implement original 5-sector art, two bosses, 4-stage camera/UI captures.
4. Pass full source TypeScript/Vitest/browser QA and real-device FPS/battery.
5. Complete uninterrupted user-controlled 15-node gameplay including real
   enemy combat, two boss kills, event/exit traversal and upgrade decisions.
6. Receive explicit art/product approval before non-draft PR merge and
   Vercel production deploy. No paid Hobby upgrade or cap bypass.

Maintainer note: GitHub Actions jobs have been queued in this session, so no
unobserved checks are marked passed. The current Canvas figures are prototypes.
