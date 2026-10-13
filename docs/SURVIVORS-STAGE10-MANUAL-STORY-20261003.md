# SURVIVORS 10 missions, Korean cast and beginner flow

Requested scope: preserve current character/graphic style, Korean cast, safety-watch playable agent, ten construction process missions, supplied director voice, beginner manual and the FIELD/STRATEGY progression issue. Original eight cast portraits and map images were visually reviewed together against their existing Korean semi-realistic webtoon identity contract. Existing character art is retained. All eight story cast records now explicitly use `cast.nationality.korean` (대한민국). Shooting selection names and roles use the existing story identities rather than alternate names in parentheses.

## Construction profile mapping

These are training missions across separate sites, not a chronological schedule for one building. Stage01–05 IDs and saved progress remain valid. Winning unlocks the next mission; optional stars do not gate unlock. Stage10 has no Stage11.

| Stage | Existing profile | Main control focus | Additional stars |
|---|---|---|---|
| 01 | apt-new-bottom-up-excavation | Loading and excavation preparation | Isolation exposure 5; shout 1 |
| 02 | apt-new-top-down-under-slab | Under-slab excavation | Exposure 80; finish HP 50% |
| 03 | apt-new-bottom-up-rc-frame | RC slab lifting | Controlled exposure 5; designated boss |
| 04 | apt-new-top-down-concurrent | Concurrent works / winter curing scenario | Fuel isolation exposure 3; designated boss |
| 05 | data-center-electrical-ups | Electrical / UPS installation | Isolation exposure 3; shout 1 |
| 06 | apt-remodel-survey | Survey and power isolation | Controlled exposure 4; finish HP 50% |
| 07 | apt-remodel-selective-demolition | Selective demolition / falling debris | Controlled exposure 5; designated boss |
| 08 | apt-remodel-old-new-connection | Structural connection / lifting | Controlled exposure 6; finish HP 60% |
| 09 | data-center-mep | MEP installation / overlapping routes | Controlled exposure 7; shout 1 |
| 10 | data-center-commissioning | Integrated commissioning | Controlled exposure 8; designated boss |

Every mission has a 180-second completion star. New missions reuse established intervention mechanics with different placements, hazard mixes, pacing and objectives. They do not claim five new engine systems. A boss is now tagged and spawned once on the first spawn opportunity after 60s even if an ordinary cart exists or the exact 60th second was missed. Boss stars require that designated risk to be controlled, rather than any ordinary resolved exposure. Winter isolation and boss descriptions now match their metrics. Terminal defeat no longer grants the survival star based only on elapsed time. Electrical intervention is power isolation with a green controlled-area ring; each exposure is counted once.

## Manual and story recovery

Localized manual: `content/localization/game-manual-ko.json`, opened from home, field guide, story, shooting ready and pause screens. It explains story observation and target → action → confirm → outcome, shooting movement/automatic intervention/experience/perks/shout/pause/unlock, defense basics, local saves and common apparent stalls. Modal keyboard focus is bounded and restores on close. Shooting explanation is accessed while ready or paused.

User identified FIELD/STRATEGY selection as the stall area. The UI had no direct target list when map labels were hard to locate, and an explicitly rejected action dispatch left the execute button permanently latched until target/action context changed. Added a compact expandable target selector without choosing or executing for the player; pending confirmation scrolls into view. Dispatch acceptance propagates from EpisodeSession; rejection releases the latch and displays retry guidance. Accepted dispatches retain the duplicate-submit guard.

Four directed story routes using different enabled-choice preferences complete within the command bound, with all actionable strategy choices projected to the UI. Target-selection and rejected-dispatch retry are covered through mounted UI interactions. Browser CI also drives the actual Episode01 scenes through the next-day bridge.

## Art and audio

New Korean safety watch officer and unhelmeted worker use existing player/foreman art as generation references. Monitor: white helmet, lime vest, navy uniform, radio and clipboard. Worker: bare head, orange vest, navy workwear, radio; no violent pose. Existing eight story images are not regenerated. New atlas backgrounds map four construction settings to Stage02–10; Stage01 retains the separate loading-yard floor. Quiet central space and strong warning overlays support gameplay. Edge decorations are visual and do not add unseen colliders.

Director shout displays exactly `작업중지 돌아버려 씨~!!!`. Supplied MP4's subtitle-matched 68–72s excerpt becomes a 4-second voice clip, warmed after user start, reusing one decode cache, music ducking for the whole clip, and shared mute/pause/exit cancellation. Original accompaniment remains. Source separation and listening acceptance are not claimed.

## Verification scope

Local full regression: 187 files / 1,014 tests passed before final asset wiring; final CI repeats typecheck, full suite and build. Character identity checker passes all eight cast. Browser QA captures manual and monitor gameplay at 360×800, 390×844, 844×390, 1440×900; verifies ten cards, Stage10 formatting, supplied voice decode and lifecycle controls. Stage02/07/10 display captures use a clearly marked saved-unlock fixture, not injected live engine state or natural unlock proof. Full device endurance, natural ten-stage balancing and direct listening remain Director review items.

Director additionally requested a full-length listening entry. Home includes 작업중지 BGM 들어보기 with native playback/pause/seek/volume controls. work-stop-song-full-v1.m4a remuxes the entire supplied MP4 audio stream without re-encoding, no auto-play, and stops on dialog close/unmount. The 4-second in-game shout remains separate.
