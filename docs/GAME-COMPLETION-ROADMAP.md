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

### TASK-011B — Episode 01 vertical-slice polish — NEXT
- 11–16 event routed playthrough.
- Casual strategy map first, dialogue second.
- Reduce visual clutter and improve transitions/feedback timing.
- Sound/BGM hooks and save/resume review.
- Review generated art composition against the approved commercial casual-strategy visual target.

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
