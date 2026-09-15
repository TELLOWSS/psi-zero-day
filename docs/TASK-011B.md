# TASK-011B — Episode 01 Vertical Slice Polish

## Goal

Polish the existing Episode 01 slice without adding another rules system.

The playable rhythm remains:

`map context -> target -> action -> actor/target confirm -> resolve -> result -> map`

## Map-first presentation

- Strategy map remains the primary screen while Episode 01 is playing.
- Dialogue is a compact lower support panel instead of a full-height dominant panel.
- Entering a new event remounts the strategy shell so stale focus does not leak into the next field situation.
- Short scene/panel transitions are used only for readability and are disabled by `prefers-reduced-motion`.
- Result cards remain on the map until the player acknowledges them.

## Save / resume

Episode autosave uses the existing domain `SaveEnvelope` contract.

- slot: `episode01.autosave`
- payload: full `GameState`
- content/rules version copied from the run
- build version copied from `package.json`
- local FNV-1a checksum detects accidental local corruption
- checksum is explicitly not a security/tamper-proof signature
- malformed, stale or checksum-invalid saves are ignored
- `EpisodeSession.resume()` reconstructs CoreEngine from the saved state without an engine change
- localStorage failure never blocks play
- completed/restarted episodes clear the autosave

## Audio

`useEpisodeAudio` is a presentation bridge only.

It consumes existing `GameState.audio`:
- BGM track
- ambience tracks
- SFX bus
- event bus
- master/channel volumes
- mute state

Until final audio assets are registered, short procedural UI tones provide lightweight feedback for:
- action execution
- positive/negative/neutral result
- continue/map return

No outcome, score or state mutation depends on audio playback.

## Visual polish

- registered art assets remain the normal visual path
- generated SVG is a production fallback
- final approved WebP art remains the target quality ceiling and can replace SVG through the same asset IDs
- autosave status is visible but secondary
- small-screen layouts hide nonessential save text and reduce dialogue density

## Tests added/updated

- `tests/episode-save.test.ts`
  - save envelope round trip
  - exact in-progress presentation resume
  - corrupt/checksum-invalid rejection
  - stale content rejection
  - clear autosave
- `tests/episode-audio.test.ts`
  - deterministic short UI cue profiles
- `tests/strategy-session-ui.test.tsx`
  - registered art mode
  - autosave indicator
  - map-first target selection

Existing routed Episode 01 and field-action tests remain the main gameplay regressions.

## Engine boundary

No `src/engine/*` change.
No new PSI formula.
No time/resource/economy formula.
No new event-selection algorithm.

## Next

TASK-012 is executable verification only: test, typecheck, build and asset-manifest verification, then fix every failure before release preparation.
