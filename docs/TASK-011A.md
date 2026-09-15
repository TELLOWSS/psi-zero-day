# TASK-011A — Core Strategy Loop

## Goal

Turn the routed Episode 01 content into a repeatable map-first gameplay rhythm without adding unapproved scoring formulas.

## Live loop

1. **Target** — select a worker, risk signal, work zone or the whole site.
2. **Action** — inspect available actions for that target.
3. **Actor** — every field action explicitly identifies who performs it.
4. **Confirm** — review actor / target / action before execution.
5. **Resolve** — dispatch the existing authored `choose_event` command.
6. **Result** — show authored result text and relationship deltas on the map.
7. **Return** — dismiss the result and return to the next live field situation.

## Actor vs target

Actor and target are separate presentation data.

Examples:
- `delegate_kang`: actor Kang Taesik / target Kang Taesik.
- `follow_junho`: actor Player / target Lim Junho.
- `restart_verify_controls`: actor Player / target restart-unverified signal.
- equipment skills: actor Player or the trained NPC / target site or character.

This is UI metadata only. It does not create a second rules engine.

## Immediate-completion choices

Some authored choices move directly to an END node and the EpisodeSession may already settle into the next event.

For map actions, the UI remembers the executed action until the session revision changes. If an authored `SHOW_RESULT` exists, that text is shown. If not, the map still presents:
- executed action label,
- generic applied-action confirmation,
- any relationship deltas emitted by the engine.

The next event remains loaded underneath and is revealed only after `맵으로 복귀`.

## Input safety

While the map result card is visible:
- number keys do not accidentally choose the next hidden event,
- Enter/Space dismisses/advances the result,
- pointer input uses the explicit map-return button.

## Engine boundary

No `src/engine/*` changes.
No new state mutation path.
No time cost, resource cost, accident probability, PSI score or economy formula.
All game-state consequences remain authored event effects executed by CoreEngine.

## Files

- `src/app/strategy-actions.ts` — actor + target metadata.
- `src/ui/StrategyLoopPanel.tsx` — target/action/result panel and confirmation.
- `src/ui/StrategyMapShell.tsx` — loop integration.
- `src/ui/PlayableEpisode.tsx` — action feedback persistence across event transitions.
- `src/ui/strategy-actions.css` — loop/confirmation/result styling.
- `tests/strategy-actions.test.ts` — actor/target projection.
- `tests/strategy-map-shell.test.tsx` — target and result phases.
- `tests/strategy-session-ui.test.tsx` — live session map-loop entry.

## Next

TASK-011B: Episode 01 vertical-slice polish. Do not add another systemic feature before the playable slice is polished and executable verification is run.
