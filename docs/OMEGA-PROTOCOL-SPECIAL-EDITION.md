# PSI : ZERO DAY — OMEGA PROTOCOL / Special Edition
Status: **DRAFT GAMEPLAY RULES PROTOTYPE** (no released game, no menu card, no Production merge).

## Product direction
Build an original, high-replayability 2.5D roguelite action **special mode** while preserving the existing SIGNAL GUARD and SIGNAL WATCH campaigns unchanged. Keep original workplace-safety identity, industrial enemy taxonomy, OMEGA/AIRA character art, premium equipment ownership and baseline damage logic separate from the new run.
This is not an entitlement to use the unfinished OMEGA master-character skin.

## Current technical implementation (pure domain, no UI)
- Module: \`src/domain/omega-protocol-run.ts\`.
- Deterministic 32-bit-seeded encounter director, no \`Math.random\`; 5 sectors × 3 waves = 15 waves and mid/final boss encounters at wave 9 and 15.
- Encounter variety: existing Watch-type threats (no invented server inventory) plus changing environmental modifier: crosswind, reduced visibility, unstable footing or standard.
- Ten normal Watch stage clears are the proposed **mode entry gate**; OMEGA master character cosmetic retains the much stricter 50/50 normal stage clears plus 3-star Master medals for all 50 stages and a separate approved-art release gate.
- A run starts at 100 HP; after every two successful waves, the player chooses from up to 3 distinct temporary upgrades. The director offers variety by role (offense/mobility/control/survival) and rewards build synergies while respecting stack caps.
- Lose or reach 0 HP: that run ends; beginning a new run resets all temporary upgrades. Completing wave 15 ends that run in victory.
- No real permanent currency, no upgrade purchase, no localStorage reads/writes, no stage progression grant, no UI. This preserves every existing player's save and combat-balance code.
- Unit contract \`tests/omega-protocol-run.test.ts\` tests reproducible seeded runs, variation across seeds, exact boss boundaries, 7 reward windows, no repeated card choices, allowed/blocked entry, no duplicate settlement, and loss reset.

## Planned action implementation (not shipped)
1. Finish and sign off PR #234 OMEGA master character: **true** 160 separate authored and approved actor frames plus equipment/PPE occlusion, binary SHA and real-device QA. Currently only derivative candidate sprites and closed release gate exist.
2. Dedicated in-run combat adapter: retain existing Watch projectile/weapon systems but sandbox all temporary modifiers from wallet and persistent items. Make route pacing independent of old 50-stage progress.
3. In-run choices, dodge/aim/vulnerability and hit feedback; time-slowing 3-card drafts; build synergy visual and audio cues; industrial hazard identity without glorifying safety violations.
4. Route screen + bosses with telegraphed attacks and distinct phases; both auto-aim and optional manual target for mobile landscape; portrait UI only where readable.
5. Separate \`psi:omega-protocol:run:v1\` storage **after explicit persistence design**; never reuse Watch's saves or premium/wallet keys. Include migration, interrupted-run continuation and tamper limitations; no false account-based anti-cheat claims.
6. Full keyboard/touch Android and tablet verification, profiling budgets at 390×844 and 844×390, gamepad accessibility, pause/restart flow, 15–25 minute target *measured not assumed*, all seeds replayable.

## Release/branch rules
The current prototype lives on its own draft PR based on \`main\`, isolated from PR #234's 49-file art work. Do **not** merge both as one unverified change. The special-mode's menu CTA stays absent until the playable loop works, and the OMEGA master skin stays inaccessible until real signed-off assets and achievement requirements pass.
