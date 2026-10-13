# QA snapshot — 2026-10-10 · v0.4 branch

**후속 검증:** 0.5 변경·실제 화면·기획 보강·검사 결과는 [구현 검토서](IMPLEMENTATION_REVIEW_20261010.md)를 기준으로 한다. 아래는 인계 당시 기록이다. 최초 재현에서 루트 ESM 설정에 따른 2개 실패를 확인해 독립 폴더의 CommonJS 범위를 명시했다.

- Checked against local v0.3 baseline; v0.4 modifies adaptive layout and default profile for touch vs mouse.
- `node --test tests/*.cjs`: **PASS (4 test files, 0 failed)** on the local development snapshot. Automated tests include collision/score/boss, VFX, UI smoke, and layout/PWA file contracts.
- A local headless Chromium screenshot attempt did not produce a screenshot in the execution environment. Therefore no claim of verified rendering at 390×844, 844×390, 1024×768, or desktop can yet be made.
- GitHub/Vercel preview build was **not** requested. `main` navigation and saves remain untouched.
- Regression risk: mobile landscape at very small viewport, iOS virtual browser bars and the PWA update lifecycle require physical-device review.
