# Natural progression and warning readability

## Unmodified runtime observation
Production build DvFnVEaQ, fresh isolated browser storage, portrait390x844. Read-only engine capture exposes observations; no state, HP, inventory, perks, clock, randomness or boss values were edited. Steering uses actual keyboard events and upgrades are selected through rendered cards. This automation is not human balance approval.

The run chose safety_drone levels2/3/4 at simulation14.6/22.03/36.2 seconds. Actual operation progression triggered the boss before its60-second deadline. The run reached the real pattern/weak-point/Burst loop, then lost at55.52 seconds with boss HP480 remaining, level4,38 neutralizations and129 credits. No false timeout victory, browser errors, failed requests or horizontal overflow. Actual earned storage records credits129, no owned/equipped premium gear. This proves natural progression through a boss Burst and defeat/reward persistence, not victory or the complete campaign.

Evidence: artifacts/natural-progression/report.json, boss-arrival.png, boss-burst.png, outcome.png. Script: scripts/verify-survivors-natural-progression.mjs. The result must not be promoted to full playthrough completion.

## Observed regression and repair
The captured natural boss Burst frame showed a nearby warning label clipped at the left viewport edge. Added presentation-only warningLabelLayout and applied it to the existing nearest-hazard warning text. World telegraphs, hazard positions, contact geometry and timing are unchanged. Labels retain their preferred position when visible, clamp horizontally with an eight-screen-pixel margin, reserve top HUD/bottom baseline space, and shrink only if the measured localized text exceeds available width.

Three unit tests cover left/right edges, zoom/HUD, long text and narrow viewport. Actual canvas fillText transform/measurement checks pass both edges at1440x900,390x844,844x390; all six controlled cases have zero page errors. Portrait-left screenshot visually inspected: complete warning visible. These edge fixtures are controlled QA, separate from the unmodified run. Initial fixture was interrupted by Vite HMR while asset tests regenerated metadata; disabling only the test page's HMR client (retaining style injection) repaired the harness.

Full regression after repair:1,515 passed / one skipped; typecheck/build passed, existing shooting chunk warning508.11kB. No GitHub/Vercel publishing.

## Remaining
Follow-up signal-aware input-only run is preserved separately at artifacts/natural-progression/signal-aware/report.json. Harness now correctly excludes UNHELMETED workers (prior harness used a nonexistent WORKER type), reads locked cart warning/charge direction and requests available support through Q. The new fresh-save run still lost at36.28s, boss HP752, two levelups, one support charge consumed and61 earned credits persisted. It reached actual boss/Burst without errors/false victory. Randomized unseeded runs differ; no difficulty regression or improvement is inferred from their outcome difference. No game values were adjusted to make the bot win.
Unmodified victory/result/replay traversal, human readability and listening approval, physical S26 Ultra testing, unapproved alternating-foot art, remaining independent equipment animation and SliceC adapters are not complete.
