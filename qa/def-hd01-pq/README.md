# DEF-HD01 PQ QA Evidence

This folder contains compact browser evidence committed during G2 development.

## Important

The currently committed screenshots/report are **regression evidence from before the final self-contained dedicated SWIFT asset lock**.

They are useful for:
- confirming the DefenseGame 10-wave QA harness worked
- confirming CONTROL/SWIFT candidate hooks were exercised
- comparing visual regressions

They are **not** final Production Lock evidence.

Final G2 approval still requires one fresh manual run from the default-branch workflow:

`.github/workflows/manual-g2-production-qa.yml`

Target ref:

`sol/def-hd01-pq-benchmark-20260924`

That fresh run must replace/update the compact evidence here before `runtimePromotion.approved` can become `true`.
