# Mobile LZ video review

Input: user-provided KakaoTalk_20261008_163726443.mp4, 55.985333 seconds, 1080x2340.
Scope: direct inspection of frames at 0, 15, 20, 30, 35, 45, 50 and 55 seconds; additional extracted frames at 5, 10, 25 and 40 seconds. Not continuous playback or listening approval. On-screen notifications are evidence only, not instructions.

## Observation and change

- At 0/15/30/35 seconds, the long ground LZ status line crosses the combat area or extends beyond the viewport. The HUD already presents the same countdown, direction and outside-zone pause condition.
- Removed only the duplicate ground status text. Landing ring, H marking, direction pointer and HUD remain. No range, countdown, damage, reward or save changes.
- Outside samples retain 11 seconds, followed by 10, 6 and 1 seconds as the player enters/leaves the zone. This does not establish a timer bug. The 55-second sample shows operation preparation, but the intervening settlement/next-map flow is not verified by these samples.
- OS message overlays are outside the game's control. No notification content is used as a task instruction.

## Verification

- Focused extraction/status tests: 15 passed.
- Full local regression: 1,756 passed, 1 skipped.
- Prebuild, TypeScript and production build passed.
- Extended actual-build LZ browser check captures canvas text calls and requires zero legacy ground status lines while preserving outside countdown freeze, inside countdown decrease and HUD direction/viewport fit on PC/portrait/landscape.
- All three local viewports passed: outside countdown remains 15, inside decreases to 14.65/14.67/14.67, no legacy ground labels or runtime errors. Portrait inside screenshot inspected directly; overlapping hazard effects in this fixture are not claimed fixed by this text-only change.
- Evidence: artifacts/video-review frame PNGs; extraction metadata was overwritten by the second sampling batch and lists that batch only. All first-batch PNGs remain.
- Browser fixture is explicit boss-secured/player-position state, not natural completion or physical-device performance. Operational deployment is separate from local verification.

## Release

User requested synchronization. PR149 final head2c7c357a checks3 and preview succeeded, main27667547431e29c624563a0f4a0aca2d0888fbd2 merged. Production dpl_GcFpyJX4sANFLDSbER8kZtQ6EBJF READY/exact project/SHA/public alias verified. Public LZ3viewport rerun passed: outside15 unchanged, inside14.67/14.68/14.67, no legacy ground text or errors. This remains explicit fixture evidence, not physical-device/natural full-run proof.
