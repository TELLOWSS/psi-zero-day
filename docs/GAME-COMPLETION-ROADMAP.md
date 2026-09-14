# PSI : ZERO DAY — Locked Completion Roadmap

Purpose: finish the game without drifting back into endless concept-image work.

## Locked visual direction

The approved commercial-style casual strategy construction-site screen is the target. Concept images are now references, not the main workstream.

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

### TASK-010C — Growth/skill action unlocks — NEXT
- Growth stage and equipped gear can expose additional field actions.
- Keep rules explicit and deterministic.
- Use authored requirements; no hidden formula or PSI threshold invention.

### TASK-010D — Approved art export integration
- Export 8 approved character portraits/map sprites.
- Export foundation 2.5D map.
- Register through `assets.json` and existing fallback pipeline.
- Stop using CSS silhouettes where final art exists.

### TASK-011A — Core strategy loop completion
- Select site target.
- Inspect signal.
- Assign person/action.
- Spend time/resources only after Director-approved values exist.
- Resolve event consequence.

### TASK-011B — Episode 01 vertical-slice polish
- 11–16 event routed playthrough.
- Casual strategy map first, dialogue second.
- Sound/BGM hooks, feedback, transitions, save/resume check.

### TASK-012 — Executable verification
- `npm test`
- `npm run typecheck`
- `npm run build`
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
