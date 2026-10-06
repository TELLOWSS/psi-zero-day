# Radio attachment character matrix

## Scope

The real preparation UI selected all six canonical characters. Each loaded actor
was exercised with eight keyboard direction combinations on a 1440x900 viewport.
The test intercepted served development modules for observation only; no runtime
debug interface was added. A controlled radio-only loadout, stationary high-HP
target and high player HP isolate presentation from natural difficulty.

## Evidence

- Command: `PSI_RADIO_MATRIX=1 node scripts/verify-survivors-radio-launch.mjs`
- Results: `artifacts/radio-launch/character-matrix.json`.
- All six characters passed eight directional launch binding observations.
- All six authored source frames were drawn for each character.
- Pause held drawing counts; unequipping stopped further authored radio stamps.
- No page errors or horizontal overflow were observed.
- Character screenshots are saved beside the report. The safety-monitor capture
  was visually inspected: the raised release is visible near the body, but the
  existing broad signal wedge remains visible as well.

## Limits

This checks actual loaded actor integration and finite launch offsets, not a
pixel-perfect mount alignment assertion. It does not approve every pose visually,
natural game balance, mobile hardware performance, alternate-foot source art,
all-equipment independent animation or cinematic quality. Existing three-viewport
default-character results remain separate from this desktop character matrix.

The initial matrix attempt exposed a verifier issue: character starting weapons
can select a different carried tool. The fixture now explicitly isolates radio.
Moving targets are repositioned beside the actor between direction probes to
avoid confusing firing-range loss with attachment failure. Production gameplay
rules and source assets were not changed in this checkpoint.
