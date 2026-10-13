# Evolution-aware upgrade choices

Upgrade choices now display the evolution connected to the selected weapon or support, along with the projected weapon level and support prerequisite. Readiness means the next level-up can offer evolution; it does not grant evolution automatically. Existing probability, damage, range, and PSI costs are unchanged.

The calculation lives in the engine layer and never mutates active perks. The presentation consumes that result. Desktop supports side-by-side comparison; smaller viewports retain a vertically scrollable selection dialog. Keyboard focus starts on the first choice and cycles within available choices.

Verification: 1,214 regression tests pass with one existing skip. Six pure preview tests cover all five recipes, missing support, supporting selections, level caps and already evolved status. Typecheck/build pass. Browser QA covers 1440x900, 390x844 and 844x390, including reaching the final choice and keyboard focus cycling. Level-up QA uses a development-only experience trigger, not a natural progression claim.

Remaining Director gates: final cinematic art/sound approval and identification of seven opaque-name audio files. No new asset or sound assignment is included.
