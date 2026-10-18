# SIGNAL WATCH — full rules, challenge economy and authored-art audit
Date: 2026-10-18. Basis: current GitHub main after PR #215, plus proposed code in this branch.
IMPORTANT: runtime source takes precedence over older concept documents when values disagree.

## 1. Source-grounded current runtime mechanics (before this PR)

1. **50 authored stages**, each with an individual raster floor and boss gameplay data. `src/ui/survivors-stage-art.ts` and `src/engine/survivors-boss-gameplay.ts` hold source contracts. Boss categories include ACTION, PATTERN, PUZZLE, SURVIVAL, MULTI, FINAL, with the Stage 50 FINAL sequence.
2. **180-second base survival / 3-wave authored director** (`src/engine/survivors-difficulty.ts` and `src/engine/survivors-operation.ts`). Wave 1 introduces readable threats, Wave 2 alternates pressure and recovery, Wave 3 intensifies and preludes a stage boss. Reaching a controlled extraction can also terminate victory.
3. **4 fixed player-selected contracts**. Actual `PATROL_DIFFICULTIES` at audit date: story HP ×0.75, spawn interval ×1.25, speed ×0.9; standard HP ×1.15, spawn ×0.9, speed ×1; hard HP ×1.35, spawn ×0.8, speed ×1.08; extreme HP ×1.55, spawn ×0.7, speed ×1.12. The older 2026-10-09 plan cited standard HP ×1.8; that is not the current source value. Spawn multipliers multiply intervals: lower value means a faster spawn cadence, not a raw enemy quantity.
4. **Telegraph caps are difficulty-independent** and maintain visual readability; stage number influences introduction time, spawn limit, wave pressure and boss patterns. Higher difficulties currently reduce free tactical drops by requiring more controls and a longer minimum delay (18/16s, 24/22s, 28/26s, 32/30s respectively). Three-wave pause/shop is independent of these tactical drops.
5. **Credit economy** is not one multiplier on all income. Successful bosses and score produce credits, with score clear income multiplied by difficulty; `stageClearReward` adds clear, global-first-clear, and 3-star mastery. `firstClear` is claimed once PER STAGE across difficulties by an authoritative wallet claim; higher-difficulty replay must NOT give that same claim again. Signature event payouts and terrain cleanup (+40) are separate mechanics. Loss yields a fraction of score without the stage clear award. Wallet receipt only commits once per terminal run in `settleRun` and `persistStoreWallet`, preserving compatibility and avoiding duplicate payments on retries.
6. **Existing game agency**: manual movement/dash, equipment/offense evolution, boss weak point and telegraphed counterplay, a timing-dependent ultimate, safety equipment, crew extraction, hazard control, rewards/pickups and wave maintenance. Using a boss's authored pattern correctly is not equivalent to raw HP depletion.

## 2. Gaps and changes

| Observed gap | Mitigation in this PR | Boundary |
|---|---|---|
| Higher HP, speed and faster spawns can feel like endurance instead of decision-making | Waves 2–3 favor recognizable authored complex hazards more on hard/extreme and less on story while preserving Wave 1 introductions and telegraph limits | No new unreviewed boss AI or map geometry |
| Reacting correctly to a signature often provides only numeric bonuses | Successful counterplay also reserves a short deterministic spawn-free collection/reposition window | No automatic HP heal, credits, or invisible adaptive difficulty |
| One global stage-first-clear flag hides skill improvement on later difficulty | Best 1–3-star mark per stage and per difficulty, monotonic and persisted atomically with the authoritative wallet | Difficulty mark has no gameplay advantage, no repeated first-clear payout |
| Star-based mastery income was difficulty-independent, unlike clear/first rewards | Mastery stage-clear component now also receives the selected existing difficulty multiplier, capped at 3 stars | Existing monetary reward remains bounded, no per-difficulty first-clear credit |
| Text formerly omitted what hard/extreme play changes | Preflight card explains relative mix, earned breather and durable best-star record | No misleading claim of entirely new boss patterns |
| Existing foreground equipment looks static even while alerting | Three approved physical equipment sprites get bounded warning-state motion, respecting reduced-motion | Does NOT replace 50 original background paintings or 8-way animation sheets |

## 3. Four difficulty contracts after patch

| Contract | Enemy HP | Spawn interval | Movement | Credit multiplier | Wave 2/3 mix shift | Counterplay respite | Tactical supply |
|---|---:|---:|---:|---:|---:|---:|---|
| Story | ×0.75 | ×1.25 | ×0.90 | ×1.0 | −0.20 | 2.4s | 18 controls, 16s |
| Standard | ×1.15 | ×0.90 | ×1.00 | ×1.0 | baseline | 2.0s | 24 controls, 22s |
| Hard | ×1.35 | ×0.80 | ×1.08 | ×1.5 | +0.12 | 1.5s | 28 controls, 26s |
| Extreme | ×1.55 | ×0.70 | ×1.12 | ×2.0 | +0.20 | 1.2s | 32 controls, 30s |

Mix shifts are additive offsets to an existing time-dependent bias threshold, not percentages of total enemies. Story de-emphasizes harder combinations; normal one-off authored signature sequences and boss encounters remain identical. Warning/readability caps do not decrease on high difficulty.

## 4. Rewards and proof of skill

- Stage clear and first clear retain the existing difficulty multipliers.
- Star-based mastery bonus scales with the same multiplier (0–300 PSI for 0–3 stars; story/standard maximum 150, hard 225, extreme 300), but no additional amount exists for *merely selecting* a high tier or failing.
- A global first-clear claim remains global: replaying the same stage on Extreme records an Extreme medal but does not regrant the first-clear credits.
- The best-earned star record survives repeat sessions and shop purchases in the authoritative wallet. No new wallet key or save-version migration needed. Corrupt records are rejected and a failed wallet write does not create a medal.
- Example at stage 01 / 3 stars / first clear: Standard = 200+400+150 = 750 PSI, Extreme = 400+800+300 = 1500 PSI. After claiming the global first clear on Standard, an Extreme 3-star replay pays 400+0+300 = 700 PSI in the **stage-clear sub-award** (separate from in-run score and special events).
- Balance gate before further pay raises: compare measured PSI/minute, clear and retry probability, equipment diversity, 3-star completion rates, and PC/mobile touch parity. No human data measured in this turn, so numerical win-rate claims are intentionally absent.

## 5. True Final-Art requirements (not falsely marked complete)

The current 50 **opaque painted backdrops** have no approved 50-file foreground segmentation mattes in the source inventory available for this change. Geometry-based automated matte generation without checking the actual images would produce incorrect clipping, cover safety telegraphs and violate the production art policy. Therefore this PR **does not claim** to extract 50 alpha-accurate foreground layers.

The next art production job must, for every stage, deliver: (a) original raster and unchanged world projection; (b) separately painted/reviewed structural foreground RGBA cutout; (c) pixel-matched alpha matte, independent of HUD, hazards and characters; (d) vertical anchor and equipment/actor occlusion sample; (e) side-by-side 390×844 and 844×390 captures; and (f) approval and commercial provenance for the underlying artwork. Mask assets should ship only when the matching originals and author review exist. In the meantime approved equipment sprite alpha and Y-sorting supply genuine (but limited) foreground occlusion.

The existing 8-way character and authored action/contact animation remain in production. This PR strengthens equipment warning-state articulation without claiming new character frames, motion capture or full art lock.

## 6. Automated acceptance gates

- 50-stage deterministic difficulty introductions and comparative complex hazard proportions without unsafe unwarned crowds;
- independent story/standard/hard/extreme medals, best-star monotonicity, malformed-save rejection, and atomic wallet write failure tests;
- hard/extreme reward ceilings and no retroactive first-clear duplication;
- reduced-motion equipment pivot and zero unsafe movement on active/idle props;
- existing build, full regression, and four-viewport fifty-stage browser QA.

## 7. Further gameplay candidates requiring session data or separately authored art

- For run quality: introduce *optional* non-credit risk-response and weak-point scoring breakdown and replay guidance, using authoritative engine metrics only.
- For late-game: validate stage-specific boss response timings and HP-to-weakpoint utilization on actual touch devices before strengthening density.
- For art: finish approved stage image mattes and separate animation spritesheets before calling this a final visual upgrade.
