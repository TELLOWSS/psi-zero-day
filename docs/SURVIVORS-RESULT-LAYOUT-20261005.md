# Result dialog usability

- Victory and defeat use a scrollable record body and persistent action footer. Portrait stacks actions; compact landscape retains a horizontal row with 44px minimum touch targets.
- Result dialogs have named modal semantics, focus the main action on entry, and contain keyboard Tab navigation. The record body is keyboard focusable for scrolling.
- Automated browser checks use controlled engine terminal states, not natural playthroughs. Victory and defeat pass at 1440x900, 390x844, 844x390, 667x375 and 568x320: buttons stay in view and fixed during record scrolling; no horizontal overflow or page errors; retry returns to preparation.
- Full suite: 1,343 passed, 1 skipped. Typecheck and production build pass.
- Reward persistence failure recovery and physical-device testing remain pending. No new art/audio or production visual lock is claimed.
