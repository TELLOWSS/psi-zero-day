# CODEX RUN PROMPT — Gameplay-First 50 Boss System

Implement the Director-approved gameplay rebaseline on branch `codex/boss-incident-system-20261006`.

Read in this order:
1. `AGENTS.md`
2. `GAMEPLAY_DOCTRINE.md`
3. `docs/SURVIVORS-50-BOSS-GAMEPLAY-BIBLE-20261006.md`
4. `content/design/survivors-boss-gameplay-v1.json`
5. `docs/CODEX-HANDOFF-BOSS-INCIDENT-SYSTEM-20261006.md`
6. `docs/SURVIVORS-50-BOSS-INCIDENT-BIBLE-20261006.md`
7. `content/design/survivors-boss-incidents-v1.json`
8. `content/design/survivors-boss-control-gates-v1.json`
9. existing boss engine/phase documents

Critical rebaseline:
- Gameplay comes first in player experience: target perception 80% game / 20% explicit safety explanation.
- Incident Bible is the realism source, NOT a player-facing checklist.
- Ordinary bosses have one mandatory signature mechanic, not 2–3 explicit safety steps.
- Combat loop is PATTERN → READ → WEAK POINT → BURST → FINISHER.
- Raw DPS cannot erase the signature pattern, but build strength must matter strongly during burst.
- Premium gear may improve combat expression and burst efficiency; it must never auto-solve the pattern.
- Equipment/process danger may be visually exaggerated into a strong boss silhouette, but workers never become targets and machinery must remain recognizable.
- Keep combat text short. Real-world meaning appears after clear in one sentence.
- Stage 50 alone becomes the whole-site Boss Wave.

Start with Slice A:
1. Add typed loader/registry for `survivors-boss-gameplay-v1.json`.
2. Validate exactly 50 stage mappings and incident bossId references.
3. Add no gameplay behavior yet.
4. Run unit tests and typecheck.
5. Stop and report using AGENTS.md format.

Do not implement old all-gates-before-core behavior. That rule is superseded by this gameplay rebaseline.
