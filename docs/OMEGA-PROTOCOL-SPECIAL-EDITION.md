# PSI : ZERO DAY — OMEGA PROTOCOL / Special Edition
Status: **DRAFT — REAL WATCH-ENGINE INTERNAL QA LAB** (no released mode, no public menu card, no Production merge).

## Product direction
Build an original, high-replayability 2.5D roguelite action **special mode** while preserving the existing SIGNAL GUARD and SIGNAL WATCH campaigns unchanged. Keep original workplace-safety identity, industrial enemy taxonomy, OMEGA/AIRA character art, premium equipment ownership and baseline damage logic separate from the new run.
This is not an entitlement to use the unfinished OMEGA master-character skin.

## Seeded planning and progression contracts (pure domain)
- Module: \`src/domain/omega-protocol-run.ts\`.
- Deterministic 32-bit-seeded encounter director, no \`Math.random\`; 5 sectors × 3 waves = 15 waves and mid/final boss encounters at wave 9 and 15.
- Encounter variety: existing Watch-type threats (no invented server inventory) plus changing environmental modifier: crosswind, reduced visibility, unstable footing or standard.
- **Superseded 2026-11-09:** OMEGA unlock requires **all 50 SIGNAL WATCH Extreme difficulty stages** with valid per-stage clear records; 10 normal clears and Mastery badges alone never unlock. AIRA cosmetic approval is a separate release/art gate, not a second Mastery medal prerequisite.
- A run starts at 100 HP; after every two successful waves, the player chooses from up to 3 distinct temporary upgrades. The director offers variety by role (offense/mobility/control/survival) and rewards build synergies while respecting stack caps.
- Lose or reach 0 HP: that run ends; beginning a new run resets all temporary upgrades. Completing wave 15 ends that run in victory.
- No permanent currency, purchase, or stage progression granted by an OMEGA run. The unlock reader accesses existing Watch Extreme records **without writing**. No public OMEGA menu CTA exists. This preserves every existing player's save and combat-balance code.
- Unit contract \`tests/omega-protocol-run.test.ts\` tests reproducible seeded runs, variation across seeds, exact boss boundaries, 7 reward windows, no repeated card choices, allowed/blocked entry, no duplicate settlement, and loss reset.

## Planned action implementation (not shipped)
1. Finish and sign off PR #234 OMEGA master character: **true** 160 separate authored and approved actor frames plus equipment/PPE occlusion, binary SHA and real-device QA. Currently only derivative candidate sprites and closed release gate exist.
2. Dedicated in-run combat adapter: retain existing Watch projectile/weapon systems but sandbox all temporary modifiers from wallet and persistent items. Make route pacing independent of old 50-stage progress.
3. Original gun-and-blade combat: actual Watch ranged fire plus 3-hit sword arc against nonhuman industrial constructs only. Damage, combo cooldown and two sword upgrades wired in DEV; source art, sounds, final balance and paid item design remain separate.
4. Connected map expedition (5 acts, 15 internal event locations), not individually selected/cleared stages. Telegraph bosses at nodes 9/15. Automatic Watch ranged fire is live in DEV; manual aiming, seamlessly streamed maps and full act transitions require further work.
5. Separate \`psi:omega-protocol:run:v1\` storage **after explicit persistence design**; never reuse Watch's saves or premium/wallet keys. Include migration, interrupted-run continuation and tamper limitations; no false account-based anti-cheat claims.
6. Full keyboard/touch Android and tablet verification, profiling budgets at 390×844 and 844×390, gamepad accessibility, pause/restart flow, 15–25 minute target *measured not assumed*, all seeds replayable.

## Release/branch rules
The current prototype lives on its own draft PR based on \`main\`, isolated from PR #234's 49-file art work. Do **not** merge both as one unverified change. The special-mode's menu CTA stays absent until the playable loop works, and the OMEGA master skin stays inaccessible until real signed-off assets and achievement requirements pass.


## 2026-11-08 integration: real Watch combat physics in an isolated session

**Implemented on PR #235, not main:**
- \`SurvivorsEngine.enableProtocolEncounter()\` is an explicit opt-in per engine instance. It disables old campaign automatic spawns, signature events, stage-star/victory settlement and XP level-up during that instance, while preserving the existing movement, attack/projectile, collision, contact damage, dodge and targeting systems. The default Watch mode runs with the new flag OFF.
- \`SurvivorsEngine.spawnProtocolEncounter(...)\` calls the actual engine's private hazard creator for 1–32 validated hazards. The planned run caps active threats at **15**. Two boss waves instantiate actual CRANE_BOSS hazard physics, but cannot end the native campaign or be eliminated by a single huge Shout hit.
- \`src/engine/omega-protocol-combat.ts\` bridges deterministic 15-wave encounter plans to real spawned enemy instances, terminal damage and wave settlement; it freezes the real engine for the 3-choice intermission and resumes after a selected temporary upgrade. Specific cards call actual \`applyPerk()\` to change weapon/passive behavior; mobility/survival cards change the current isolated engine actor's stats only.
- \`tests/omega-protocol-combat.test.ts\` simulates seeded real spawn coordinates, Watch movement, award intermissions, all fifteen waves and both bosses, run-only builds, pause/death/abandon, and non-mutating default Watch engine behavior. Running individual synthetic clear actions in tests is NOT a full user playthrough.
- \`tests/omega-protocol-performance.test.ts\` profiles 360 simulation steps at 60Hz and logs Node/CI CPU step cost, projectile and hazard maxima. It **cannot** establish mobile GPU FPS, heat, memory pressure or touch responsiveness.
- \`src/ui/OmegaProtocolPlaytest.tsx\` is an opt-in keyboard/touch internal Canvas QA screen. It draws basic geometric placeholders for enemies and the player; **no OMEGA premium art** is granted. It supports pause, seeded retry, combat progress, 3-choice cards and loss/win. An internal route \`?omegaLab=1\` is available only when Vite \`DEV\` or explicit \`VITE_OMEGA_PROTOCOL_LAB=1\`; the default live build does not expose a menu item or entry path.
- No changes were made to Watch's persistent stage records, player wallet, cosmetic ownership, paid item counts, premium inventory, campaign difficulty awards, or store schema. No save is written by the special edition.

**Real release acceptance is separate from developer tests:** new OMEGA animation is still warped/derived and 320 masks still lack artist signoff. The v3 archive was also found to contain a **0-byte** \`OMEGA_finish_front_8x2.webp\`. A repaired v3.1 *candidate* ZIP was delivered separately in chat (not in GitHub and not release-approved), but this does not fix gait/occlusion quality. PR #234 art QA and real Android/tablet performance must pass on their own merits before enabling the cosmetic.

### Remaining QA gates (not completed by PR #235)
1. Character: human-reviewed source drawings for all 8×20 action frames, individual front/back alpha masks and true equipment/socket fit, approved SHA manifest, independent NE and in-game collision checks.
2. Device: at least two distinct Android performance tiers, long-run worst-wave FPS/frame-time and memory/thermal budgets, portrait/landscape UI, touch/auto-aim, real pause/resume; collect measured evidence rather than assumptions.
3. Complete playable mode: actual player run from wave 1→15 with boss telegraphs, viable upgrade combinations, death/retry, audio feedback, accessibility and save continuity.
4. Release: audit both PRs separately, retain draft status until required QA passes, then opt in to preview/staging before an explicit main/Production release decision.


## 2026-11-09 director's superseding decision

The final five-act setting, strict Extreme-50 unlock, sword/gun mechanics, exploration UX and QA/release gates are recorded in [OMEGA-PROTOCOL-EXTREME-50-GUN-BLADE-MASTERPLAN-20261109.md](OMEGA-PROTOCOL-EXTREME-50-GUN-BLADE-MASTERPLAN-20261109.md). All former 10-stage-unlock and 50×Mastery-star conditions are withdrawn. The fifteen encounter indices are internal route locations rather than WATCH-style selectable stages. Live map continuity and cinematic transitions are not yet finished.
