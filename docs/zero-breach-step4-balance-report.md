# ZERO BREACH Step 4 — Balance & Replay Validation

Status: **AUTOMATION VALIDATED — NO NUMERIC TUNING**

Rules version: `zero-breach-1.0.0`  
Content version: `prototype-1.0.0`  
Balance status: `STEP4_AUTOMATION_VALIDATED_NO_NUMERIC_TUNING`

## Decision

The Step 1 numeric baseline was measured before any balance value was changed. It already satisfied the Step 4 automation gates, so no tower cost/damage/range/cooldown, enemy HP/speed/armor, wave composition, resource, shield, reward, or boss value was changed.

This report records the original measured baseline rather than retroactively presenting tuned values as the starting point.

## Headless strategy results

| Strategy | Opening | Support | Result | Shield | Stars | 1x logical time | Main leaks | Final branches |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
| BALANCED_CORNERS | PULSE@P2 + BURST@P4 | COORDINATOR | WIN | 8 | 1 | 384.4 s | ARMORED 4, VEILED 8 | PULSE L3B, SENSOR L3A, PULSE L3B |
| CONTROL_SPLASH | CONTROL@P2 + BURST@P4 | OBSERVER | LOSS at wave 7 | 0 | 0 | 288.3 s | NORMAL 5, SWIFT 7, ARMORED 8 | BURST L3A |
| PRECISION_PURE | PULSE@P1 + PULSE@P6 | COORDINATOR | WIN | 18 | 2 | 359.8 s | ARMORED 2 | PULSE L3B, PULSE L3B, BURST L3B, SENSOR L3A |
| STATIC_OPENING | PULSE@P1 + PULSE@P6, then no actions | none used | LOSS at wave 6 | 0 | 0 | 225.2 s | ARMORED 6, SWIFT 2, SWARM 6, VEILED 6 | none |
| NO_RESPONSE | no towers | none | LOSS at wave 3 | 0 | 0 | 110.2 s | NORMAL 8, SWIFT 10, SWARM 2 | none |

Two different openings clear the scenario, so the automation does not require one exact opening. A reasonable two-tower opening does not win when the player stops making decisions. No-response loses early as intended.

The two successful strategies use both final branch families: L3A and L3B. The failing CONTROL_SPLASH plan is retained as evidence that role composition and upgrade timing matter; it was not artificially strengthened just to obtain three wins.

## Real UI playthrough

A Chromium playthrough used only visible game controls and the production defense content. Wall scheduling was accelerated for CI, but the engine remained on its fixed 50 ms logical ticks.

Result:
- strategy: PRECISION_PURE_UI
- result: WIN
- shield: 18
- stars: 2
- logical ticks: 7165
- 1x logical duration: 358.3 s
- supports used: waves 4, 7, 10
- L3A used: SENSOR@P8
- L3B used: PULSE@P1, PULSE@P6, BURST@P4
- first-clear cosmetic result path reached

The logical duration is approximately 5 minutes 58 seconds. Together with BALANCED_CORNERS at 6 minutes 24 seconds, this is close to the intended 6–8 minute first-speed target without adding an artificial timer.

## First-run guidance

The first run now provides four contextual steps:
1. choose a pad and place a basic tower;
2. start the first wave;
3. after the first wave, pause when an affordable upgrade is available and point to upgrade;
4. point to the next-wave preview.

The guide can be skipped and can be replayed from the defense settings. It does not insert safety trivia or multi-page modal reading between waves.

## Scope and evidence limit

These automated strategy and Chromium results establish deterministic solvability, failure pressure, branch usage, timing, and tutorial operability. They do **not** establish human enjoyment, perceived difficulty, or first-time comprehension. Human observation remains a separate release-candidate validation task.

## Step 4 conclusion

Numeric tuning: **none**.  
Rules/content versions: **unchanged** because no gameplay number or rule contract changed.  
Balance metadata only was advanced from `UNTESTED_STARTING_POINT` to `STEP4_AUTOMATION_VALIDATED_NO_NUMERIC_TUNING`.
