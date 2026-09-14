# TASK-010A — Non-aging Character Growth

## Decision locked by Director

Character growth must never be shown as the character getting older.

Growth changes only:
- expression/confidence,
- posture,
- equipment/items,
- later: unlocked field actions/skills.

Face identity, apparent age, body identity and role silhouette remain stable.

## Implemented

- `content/episode01/items.json`: authored field-equipment catalog.
- `content/episode01/character-growth.json`: initial/focused/skilled presentation for all 8 characters.
- `src/app/character-growth.ts`: explicit flag -> growth projection. No hidden XP formula.
- `CharacterCard`: shows current growth stage and equipped items.
- Episode 01 reporting route: reinforced reporting sets `growth.lim_junho=focused`.
- Focused Junho keeps the same person identity and gains confidence + site radio.
- Suppressed/missed route does not grant that growth.

## Rules

1. `growth.<character_id>` is an explicit authored state flag.
2. Allowed values: `initial` (implicit), `focused`, `skilled`.
3. No age progression.
4. No automatic threshold formula yet.
5. Skilled stage is not granted in Episode 01 yet; it is reserved for later earned progress.
6. Equipment additions must match the character's role and visual identity.

## Engine boundary

No `src/engine/*` changes are required. Existing flag effects already provide the deterministic mutation boundary.
