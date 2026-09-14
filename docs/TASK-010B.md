# TASK-010B — Training + Inventory + Loadout

## Status

IMPLEMENTED on `astra/task-007-casual-strategy-foundation`.

## Locked model

Character progression is split into three explicit layers:

1. **Growth** — expression/posture/confidence and item unlock eligibility. Never ages the character.
2. **Inventory** — items currently owned by that character (`inventory.<character_id>.<item_id>`).
3. **Equipment** — items actually equipped in a slot (`equipment.<character_id>.<slot>`).

A growth-stage item is not automatically equipped. Starter gear stays equipped by default; new gear only equips through an authored choice or an explicit authored auto-equip reward.

## Equipment slots

- `primary_tool`
- `secondary_tool`
- `communication`
- `document`
- `ppe`

Each item in `content/episode01/items.json` owns one slot.

## Live training hooks

### Lim Junho — 위험신호 보고훈련

When `reporting_return_reinforced` occurs:

- `training.lim_junho.reporting = true`
- `growth.lim_junho = focused`
- grants `item.site_radio`
- equips it to `communication`

This NPC reward is authored as auto-equip.

### Player — 현장안전 기본훈련

Choosing Episode 01 evening `study`:

- `training.player.site_basics = true`
- `growth.player = focused`
- grants `item.inspection_camera`
- opens an equipment choice node

The player then chooses:

- `training_equip_camera` → equip camera in `secondary_tool`, or
- `training_keep_loadout` → keep current equipment while retaining the camera in inventory.

## UI

- Character cards show growth stage and equipped loadout separately.
- Training completion shows a reward panel.
- Equipment slot names are localized.
- No equipment choice is inferred from a hidden score or random roll.

## Files

- `content/episode01/items.json`
- `content/episode01/training.json`
- `src/app/character-loadout.ts`
- `src/app/training.ts`
- `src/content/episode01-progression.ts`
- `src/ui/VisualSlot.tsx`
- `src/ui/PlayableEpisode.tsx`
- `src/ui/character-growth.css`
- `tests/training-loadout.test.ts`
- `tests/character-loadout-ui.test.tsx`

## Engine boundary

No `src/engine/*` changes are required. Training and equipment mutations remain normal authored event-choice flags.
