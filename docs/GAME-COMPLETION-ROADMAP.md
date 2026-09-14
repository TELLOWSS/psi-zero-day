# PSI : ZERO DAY — Locked Completion Roadmap

Purpose: finish the game without drifting back into endless concept-image work.

## Locked visual direction

The approved commercial-style casual strategy construction-site screen is the target. Concept images are references, not the main workstream. The generated vector pass is an implementation asset layer, **not a downgrade of the final visual target**. Final painted/3D-quality WebP art can replace it through the same asset IDs without gameplay changes.

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

### TASK-010D — Production art integration — IMPLEMENTED
- Eight distinct character portraits and map sprites have a deterministic generated SVG production pass.
- Foundation map has an actual casual-strategy construction-site background asset.
- `assets.json` now registers 17 image assets.
- Normal `dev`, `test` and `build` commands generate the vector files and refresh the manifest first.
- Final WebP art remains the preferred target; manifest generation automatically prefers WebP and uses SVG only when WebP is absent.
- CSS silhouettes remain only as failure fallback.
- Character silhouettes, props and roles remain deliberately distinct.

### TASK-011A — Core strategy loop completion — NEXT
- Select site target.
- Inspect signal.
- Assign person/action.
- Resolve the consequence and return to the map.
- Make this loop readable without relying on long dialogue.
- Spend time/resources only after Director-approved values exist; do not invent economy or PSI formulas.

### TASK-011B — Episode 01 vertical-slice polish
- 11–16 event routed playthrough.
- Casual strategy map first, dialogue second.
- Replace vector production art with final painted/3D WebP where final art is approved.
- Sound/BGM hooks, feedback, transitions, save/resume check.

### TASK-012 — Executable verification
- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run assets:check`
- fix all failures before release packaging.

### TASK-013 — Android/Web release preparation
- Vercel web build.
- Capacitor/Android packaging when web slice is stable.
- app icon/banner/screenshots/privacy policy/store metadata.

## Do not drift into

- endless character redesign after identity is approved,
- unrelated new episodes before Episode 01 is playable and verified,
- new PSI/career/economy formulas without Director approval,
- visual mockups that are not tied to an implementation task.

Every next task should either improve the playable slice, connect final assets, verify execution, or prepare release.
