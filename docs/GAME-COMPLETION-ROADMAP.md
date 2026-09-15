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

### TASK-011B — Episode 01 vertical-slice polish — IMPLEMENTED
- 11–16 event routed playthrough remains the single playable slice.
- Strategy map stays visually primary; dialogue is a compact lower support panel.
- Event changes reset map focus and use short reduced-motion-aware transitions.
- Map action results keep relationship feedback visible before the next situation is exposed.
- Browser autosave/resume uses the existing domain `SaveEnvelope` contract with local corruption detection.
- Browser storage failure does not block play.
- Authored `GameState.audio` BGM/ambience/SFX buses are wired to browser playback.
- Short procedural UI feedback cues cover execute/result/continue until final audio assets are registered.

### TASK-012 — Executable verification — IMPLEMENTED
- GitHub Actions `Verify vertical slice` runs on Node 22.
- Deterministic Episode 01 SVG fallback assets are regenerated and verified.
- Tests, app/engine typecheck and production build are CI-gated.
- Generated SVG files remain intentionally gitignored; generator/spec + committed manifest remain the source of truth until final WebP art replaces the fallback.

### TASK-013A — Web release bundle + Vercel contract — IMPLEMENTED
- Explicit Vercel Vite build contract is committed.
- Web title/description metadata is production-ready.
- `npm run release:check` provides one local release gate.
- GitHub Actions uploads the exact verified `dist/` only after tests/typecheck/build pass.

### TASK-013B — Vercel deployment — DEPLOYED / VERIFIED
- Vercel project `psi-zero-day` is linked to `TELLOWSS/psi-zero-day`.
- Production deployments are driven from `main`.
- Checked deployments return HTTP 200 and runtime-error checks have been clean in the verified windows.

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
- Unsigned release AAB artifact is generated successfully for packaging verification.
- Required signing secrets are documented; no keystore or password is committed.

### TASK-013E — Store listing + privacy foundation — IMPLEMENTED
- Public `/privacy.html` policy page is committed and ships with the Vite build.
- Korean Play Store listing copy foundation is committed.
- Google Play technical/release checklist is committed.

### TASK-014A — Vertical Art Slice RC — IMPLEMENTED / VERIFIED
- Foundation construction map has a hand-authored 2.5D RC asset with stronger depth, road, crane, apartment frame, yard, gate and foreground hierarchy.
- Player, Kang Taesik and Lim Junho have distinct RC portrait + map art.
- HUD/rail/roster were reduced so the site map becomes the visual hero.
- Dialogue panel is shorter and less dominant.
- Asset precedence is `final WebP -> hand-authored RC SVG -> deterministic generated SVG`.

### TASK-014B — Remaining cast RC art + field visual language — IMPLEMENTED / VERIFIED
- Matching RC portrait/map art is present for Yoon Sungho, Lee Jaehoon, Choi Minseok, Seo Jeongmin and Oh Seungjae.
- Full cast keeps distinct silhouette + face + outfit + prop + posture; helmet color is not the sole differentiator.
- Field-risk markers and equipment/item treatment read as world-space game affordances rather than dashboard counters.
- Character progression is explicitly non-aging.

### TASK-014C — Growth variants + production-art gate — IMPLEMENTED FOUNDATION / FINAL MEDIA PENDING
- Initial/focused/skilled presentation is live without chronological aging.
- A strict production-art gate requires all 17 final WebP slots before commercial release: one foundation map plus portrait/map art for all eight characters.
- `npm run assets:production-check` rejects missing/non-WebP final files.
- RC/fallback art must never be mislabeled as final production media.

### TASK-014D — Production layout visual lock — IMPLEMENTED / VERIFIED
- Real Production screenshots drove the final map-first layout changes.
- Left rail, stage banner, roster, dialogue panel and labels were compressed so the playable construction map remains primary.
- Bottom dialogue clipping was fixed for ordinary desktop/browser chrome heights.

### TASK-015A — Core economy / PSI / monetization contract — IMPLEMENTED / LOCKED
- Canonical PSI definition: `사고 전 신호를 모아 다음 위험을 먼저 읽는 안전지능.`
- Six PSI indicators are fixed: 위험인지도 / 교육이해도 / 실천참여도 / 보호구·수칙준수 / 소통·보고성 / 작업중지 감수성.
- Core resource principle is locked as `돈 = 시간 = 공정 = 안전`.
- Paid-item families are locked as action / facility / equipment.
- Paid items cannot directly buy PSI, erase an occurred incident, or make the correct safety choice purchase-only.
- No economy conversion ratio, PSI weighting, item price or probability has been invented.

### TASK-015B1 — Factual field-resource loop — IMPLEMENTED / VERIFIED
- Strategy HUD shows factual money / time / schedule / safety state instead of an unapproved synthetic PSI percentage.
- Field actions expose related resource axes without claiming unapproved numeric gain/loss.
- PSI remains a behavior/result cue rather than a purchasable or fabricated score.

### TASK-015B2 — Reconsideration pass vertical slice — IMPLEMENTED / VERIFIED
- `현장 재판단권` (internal nickname `까방권`) is a real wallet item.
- A field decision checkpoint is captured before choice execution.
- The pass may restore the same unresolved field-decision checkpoint before irreversible outcome confirmation.
- It cannot restore a different run/event, a completed event or a state whose safety-incident record has changed.
- The item is consumed only after a successful restore; a failed restore never consumes entitlement.

### TASK-015B3 — Facility/equipment activation — IMPLEMENTED / VERIFIED
- Owned field support items can be committed/deployed from the strategy map.
- Activation uses explicit run flags; wallet stock and active field state are separate.
- Facility/equipment stock is consumed only after activation is accepted.
- Prices and numeric time/schedule/safety effects remain balance-pending.

### TASK-015B4 — Support-assisted field actions — IMPLEMENTED / VERIFIED
- Active support items may add convenience aliases for an existing free safety action.
- Example support shortcuts cover inspection kit, temporary access lane, traffic-control set and radio support.
- Support shortcuts execute the same authored free engine choice rather than creating a paid-only better safety outcome.
- Disabled/free-action requirements are inherited; paid support cannot bypass a disabled legitimate action.
- Core Episode 01 remains completable without purchase.

### TASK-016A — Commercial title/main screen using live game art — IN PROGRESS
- Main page uses the same Foundation world art as gameplay.
- Player, Kang Taesik and Lim Junho are layered from the same live character asset slots used in the game.
- Final WebP replacement will therefore update title and gameplay together without a second art system.
- Title UI is being shifted from a minimalist web-like splash toward an adult-friendly casual-strategy game start screen.

### TASK-016B — Final production WebP replacement — NEXT AFTER TITLE ACCEPTANCE
- Replace one Foundation map + eight portrait + eight map-piece slots with final commercial WebP.
- Preserve `final WebP -> RC SVG -> deterministic SVG` fallback order.
- Run `npm run assets:production-check` and `npm run release:production-check`.

### TASK-016C — Final BGM / ambience / SFX
- Replace procedural/placeholder cues with approved final audio.
- Verify volume, looping, transitions and Android behavior.

### TASK-016D — Real browser + Android visual/device acceptance
- Full Episode 01 manual playthrough on desktop browser and real Android device.
- Check common landscape aspect ratios, touch targets, text clipping, save/resume, sound and visual readability.
- Capture final in-game store screenshots only after this pass.

### TASK-017A — Release signing + internal test
- Finalize upload keystore.
- Configure GitHub Actions signing secrets.
- Generate and verify signed AAB.
- Upload to Play Console Internal testing.
- Test restart/save/resume and a full Episode 01 route on installed build.

### TASK-017B — Final store creatives / production decision
- 512 x 512 store icon.
- 1024 x 500 feature graphic.
- At least 3 strong landscape in-game screenshots for the game listing.
- Final Play Console declarations, content rating, data safety and production rollout decision.

## Do not drift into

- endless character redesign after identity is approved,
- unrelated new episodes before Episode 01 is playable and verified,
- new PSI/career/economy formulas without Director approval,
- visual mockups that are not tied to an implementation or release task,
- paid safety outcomes that replace legitimate free safety decisions.

Every next task should either improve the playable slice, connect final assets, verify execution, or prepare release.
