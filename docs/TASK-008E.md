# TASK-008E — Stop-work restart chain

## Purpose
A stop-work order is not complete when someone says “resume.” The game must distinguish:
1. who gave the restart instruction,
2. what conditions were attached to it,
3. whether those conditions were actually restored in the field.

## Episode 01 chain
`E01_08I_RESTART_PRESSURE -> E01_08J_RESTART_RETURN`

The chain starts after the TASK-008D changed-work/TBM consequence.

### Player choices
- `restart_follow_verbal`: accept that the construction side said to resume and continue work.
- `restart_trace_instruction`: trace who passed the instruction and what condition was lost during relaying.
- `restart_verify_controls`: hold the restart until the physical safety controls and restart conditions are verified in the field.

### Returned consequences
- Verbal restart -> an incomplete protection condition is found after work resumes -> second stop-work.
- Instruction trace -> the original message was “resume after safety controls,” but only “resume” survived the relay chain.
- Control verification -> physical restoration, work-zone control, restart condition and responsible person are confirmed before restart.

## Field-realism rules
- “The construction team told us to work” is not a complete restart basis.
- “Safety said OK” is not a complete restart basis unless the actual field conditions were checked.
- A restart authority and a restart condition are separate facts.
- A conditional instruction can be distorted without any one person necessarily lying.
- A premature restart should be able to create a second stop-work and relationship fallout.
- The best long-term response is not paperwork alone; it closes the physical condition, communication path and responsibility for restart.

## Architecture boundary
This task uses existing event conditions, flags, relation effects and player-stat effects. `src/engine/**` is unchanged.

## Default regression path
Existing Episode 01 regression paths use `restart_verify_controls`. The two alternative branches are tested separately in `tests/episode01-restart.test.ts`.
