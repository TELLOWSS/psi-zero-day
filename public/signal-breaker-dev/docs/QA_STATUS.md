# QA snapshot — 2026-10-10 · v0.4 branch

- Checked against local v0.3 baseline; v0.4 modifies adaptive layout and default profile for touch vs mouse.
- `node --test tests/*.cjs`: **PASS (4 test files, 0 failed)** on the local development snapshot. Automated tests include collision/score/boss, VFX, UI smoke, and layout/PWA file contracts.
- A local headless Chromium screenshot attempt did not produce a screenshot in the execution environment. Therefore no claim of verified rendering at 390×844, 844×390, 1024×768, or desktop can yet be made.
- GitHub/Vercel preview build was **not** requested. `main` navigation and saves remain untouched.
- Regression risk: mobile landscape at very small viewport, iOS virtual browser bars and the PWA update lifecycle require physical-device review.