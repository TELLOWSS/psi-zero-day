# Boss and ultimate hitch context

The production stress verifier now retains each long task's measurement-relative
start and duration, plus the engine phase, boss phase, hazard/projectile counts
and game clock at observer delivery. Pending observer records are drained before
disconnect. Existing count/max summaries remain compatible.

Latest C1SOhMGQ production run: portrait390x844, DPR2, CPU4x,60-second controlled
radio/six-gear walking fixture. Heavy P9516.8ms, no long tasks. Boss P9516.8ms
with one101ms task at2.397s; observer saw combat,2 hazards and4 projectiles.
Ultimate P9516.8ms with one65ms task at0.2ms; observer saw combat,1 hazard and2
projectiles. Early play had one71ms task. Pause/rotation passed, no errors,
failed requests or overflow. Processes finished.

Evidence: `artifacts/production-stress/hitch-context/report.json` and adjacent
segment CPU profiles. Approximate profile windows around these events included
Canvas drawImage and the minified render loop; the boss window also included
audio source creation. The independent profiler and page clocks were not exactly
calibrated, so these approximate windows do not prove causation. Observer state
is post-task state, not an exact snapshot at the beginning of the task.

Small projectile counts contradict a simplistic "too many projectiles" diagnosis.
The remaining next step is calibrated trace attribution around event onset before
choosing a runtime optimization. No effect was indiscriminately removed and no
performance fix is claimed. This is browser simulation, not actual S26 evidence.
Syntax check and actual browser execution passed; shipped runtime was unchanged.
