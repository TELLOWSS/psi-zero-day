# Recovery rear occlusion

Directional actor chest mounts deliberately return no visible socket on rear
poses. RecoveryFlow previously treated this as unavailable presentation and
returned false, allowing its caller to draw the legacy recovery stamp. That
could make equipment effects reappear when the actual chest equipment is hidden.

The authored slot now retains ownership when the directional chest socket exists
but is rear-occluded. No stamp is drawn in that case. Genuine missing actor/art,
unknown socket and reduced-motion behavior remain unchanged. No rear art or new
equipment rule was fabricated.

Focused tests: five passed, including hidden rear ownership and unknown-socket
fallback. Typecheck/build passed. Browser recovery tests at 1440x900, 390x844 and
844x390 all passed six-frame playback, full-HP settlement, pause and unequip.
The unit rear regression exercises the socket contract with a mock.

## Actual rear follow-up

The browser verifier now also holds the real player's north input, observes
missing visible chest sockets in the served RecoveryFlow module and records
authored draw calls. On all three viewports, 21-22 rear calls occurred with zero
recovery-cell stamps while the engine continued actual recovery. Returning south
resumed authored playback. Pause, full-HP settlement and unequip still passed.
Evidence: `artifacts/recovery-flow/report.json` and `*-rear-recovering.png`.

The 390x844 rear capture was visually inspected. The chest flow is absent; other
equipped items' shared gold presence and the flashlight remain visible. Therefore
this does not establish that every floor/presence effect is resolved, approve all
characters visually or supply rear-specific authored animation. No production
debug hook was added: the browser response interception is test-only.
