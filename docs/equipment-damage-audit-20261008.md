# Equipment Damage Audit

## Confirmed Corrections

- Ballistic signals, satellite/grout/hydraulic projectiles and EMP/plasma pulses consume pierce on distinct targets. Their overlap no longer reapplies full hit damage every simulation tick. Existing spray, cryo, trap, barrier and Tesla secondary contact charges are intentionally preserved, including the established spray regression cadence.
- EMP and plasma periodic pulses use their projectile collision once. The previous direct area hit duplicated that pulse; plasma continuous DPS remains separate and unchanged.
- Environmental contacts also deduplicate each projectile/target pair.
- Blocked boss hits and core activation without HP loss no longer trigger a false damage flash. Boss pattern gates and burst multiplier remain intact.
- Feedback carries actual clamped HP loss, not nominal damage or overkill. Authored metal/debris/vapor contact frames respond with bounded size variation, preserving their origins, reduced-motion path and dense-scene quality limits.
- Upgrade interval previews use the same 75 percent ceiling as gear-enhanced combat. Base tuning and evolution recipes are unchanged.

## Verification Scope

Tests exercise production weapon and collision passes with explicit isolated fixtures: all seven base weapons at levels 1-5, all seven evolutions, damage multiplier and floodlight bonus, per-target pierce, critical/weak-point scaling, continuous DPS across 30/60/120 Hz inputs, blocked boss/core activation/burst, environmental damage and feedback truthfulness.

This is deterministic rule verification, not a natural-play clear. Natural victory and next-map end-to-end verification remain open. Graphical changes refine existing authored raster sequences; they do not constitute new final-art production or Director visual lock.
