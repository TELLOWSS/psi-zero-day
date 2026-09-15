# PSI : ZERO DAY — Locked Completion Roadmap

Purpose: finish the game without drifting back into endless concept-image work.

## Locked visual direction

The approved commercial-style casual strategy construction-site screen is the target. Concept images are references, not the main workstream.

## Execution order

### TASK-010A — Character growth foundation — IMPLEMENTED
- Same face/age identity.
- Growth through expression, posture, equipment and confidence.
- First live story unlock: Lim Junho `initial -> focused`.

### TASK-010B — Training + inventory/loadout actions — IMPLEMENTED
- Playable training/equipment interaction added.
- Growth, owned inventory and equipped loadout are separate states.
- Player training grants a field camera and asks whether to equip it.
- Junho reporting training grants and equips a radio.
- No loot-box/random monetization logic.
- Equipment carries explicit field-purpose slots.

### TASK-010C — Growth/skill action unlocks — IMPLEMENTED
- Growth stage + actually equipped gear expose additional field actions.
- Player camera unlocks next-day photo/state comparison.
- Junho radio unlocks a next-day radio reporting-channel check.
- Keeping an earned item in inventory without equipping it does not unlock the equipment skill.
- Skill choices remain normal authored event choices and use the existing `choose_event` path.
- No hidden XP formula, PSI threshold or new engine rule.

### TASK-010D — Approved art export integration — IMPLEMENTED
- 8-character portrait/map asset slots are live.
- Foundation map asset slot is live.
- Production-generated SVG art replaces CSS silhouettes/map when final WebP is absent.
- Approved final WebP can replace SVG through the same asset IDs without changing game logic.
- Asset generation and manifest update are wired into dev/test/build scripts.

### TASK-011A — Core strategy loop completion — IMPLEMENTED
- Select a person, risk signal, work zone or whole site first.
- Inspect the current field context on the map.
- Field actions carry both an explicit actor and a target.
- Choosing an action opens a confirmation card instead of executing immediately.
- Confirmation shows `actor / target / action` before dispatch.
- Execution still uses the existing `choose_event` command.
- Relationship changes and authored results return through the map result card.
- Actions that end an event immediately still receive UI-level action feedback before the next situation is exposed.
- Loop is visibly structured as `target -> action -> result -> map`.
- Time/resource/PSI costs remain unimplemented until Director-approved values exist.

### TASK-011B — Episode 01 vertical-slice polish — IMPLEMENTED
- 11–16 event routed playthrough remains the single playable slice.
- Strategy map stays visually primary; dialogue is a compact lower support panel.
- Event changes reset map focus and use short reduced-motion-aware transitions.
- Map action results keep relationship feedback visible before the next situation is exposed.
- Browser autosave/resume uses the existing domain `SaveEnvelope` contract with local corruption detection.
- Save data is rejected on content-version mismatch or malformed/checksum-invalid payloads.
- Browser storage failure does not block play.
- Authored `GameState.audio` BGM/ambience/SFX buses are wired to browser playback.
- Short procedural UI feedback cues cover execute/result/continue until final audio assets are registered.
- Generated SVG art remains a production fallback, not the final commercial-art quality ceiling.

### TASK-012 — Executable verification — IMPLEMENTED
- GitHub Actions `Verify vertical slice` runs on Node 22.
- Deterministic Episode 01 SVG fallback assets are regenerated, then `npm run assets:check` verifies 17 generated assets and the committed manifest.
- `npm test`: **39 test files / 319 tests PASS**.
- `npm run typecheck`: **PASS** for app/tests and engine tsconfig.
- `npm run build`: **PASS**.
- CI workflow completed all verification steps successfully before release preparation.
- Generated SVG files remain intentionally gitignored; generator/spec + committed manifest remain the source of truth until final WebP art replaces the fallback.

### TASK-013A — Web release bundle + Vercel contract — IMPLEMENTED
- Explicit Vercel Vite build contract is committed.
- Web title/description metadata is production-ready.
- `npm run release:check` provides one local release gate.
- GitHub Actions uploads the exact verified `dist/` as `psi-zero-day-web-dist` only after tests/typecheck/build pass.

### TASK-013B — Vercel Preview deployment — DEPLOYED / TRANSPORT SMOKE VERIFIED
- Vercel project `psi-zero-day` is linked to `TELLOWSS/psi-zero-day`.
- Feature-branch Preview deployments are READY.
- Latest Preview returns HTTP 200 with the expected title, metadata, JS and CSS bundle references.
- Vercel runtime-error query reports no runtime errors for the checked 24-hour window.
- Full pointer-by-pointer interactive playthrough still requires a real browser/device manual smoke pass before production promotion.
- Old `main` remains unsuitable for production promotion until the completed branch is reviewed/merged.

### TASK-013C — Capacitor / Android debug packaging — IMPLEMENTED / VERIFIED
- Capacitor 8.5.2 is integrated.
- Application ID: `com.tellowss.psizeroday`.
- Android landscape configuration is applied.
- Android native project is generated and committed.
- Java 21 CI runs `assembleDebug` successfully.
- `psi-zero-day-debug-apk` artifact is generated successfully.
- Android target/compile SDK is API 36.

### TASK-013D — Android release AAB foundation — IMPLEMENTED / UNSIGNED VERIFIED
- Release signing is conditional and reads credentials only from environment/GitHub Secrets.
- `Build Android Release Bundle` CI runs `bundleRelease` successfully.
- Unsigned `psi-zero-day-release-aab` artifact is generated successfully for packaging verification.
- Required signing secrets are documented; no keystore or password is committed.
- Signed AAB verification becomes active automatically after release secrets are configured.

### TASK-013E — Store listing + privacy foundation — IMPLEMENTED
- Public `/privacy.html` policy page is committed and ships with the Vite build.
- Korean Play Store listing copy foundation is committed.
- Google Play technical/release checklist is committed.
- Current Android target API 36 meets the 2026 new-app submission target requirement.

### TASK-013F — Release signing + real-device internal test — NEXT
- Finalize upload keystore.
- Configure GitHub Actions signing secrets.
- Generate and verify signed AAB.
- Upload to Play Console Internal testing.
- Test on real Android devices in landscape.
- Verify app restart save/resume, full Episode 01 route, sound fallback and common aspect ratios.

### TASK-013G — Final store creatives / production decision
- 512 x 512 store icon.
- 1024 x 500 feature graphic.
- At least 3 strong landscape in-game screenshots for the game listing.
- Final commercial WebP art/audio replace fallbacks only where approved.
- Final Play Console declarations, content rating, data safety and production rollout decision.

## Do not drift into

- endless character redesign after identity is approved,
- unrelated new episodes before Episode 01 is playable and verified,
- new PSI/career/economy formulas without Director approval,
- visual mockups that are not tied to an implementation or release task.

Every next task should either improve the playable slice, connect final assets, verify execution, or prepare release.
