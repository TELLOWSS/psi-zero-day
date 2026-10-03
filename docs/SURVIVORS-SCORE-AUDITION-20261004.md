# Patrol score integration — Director audition

Director requested continuation of the provided Gemini music integration and GitHub/Vercel synchronization. These assets are runtime audition candidates, not listening-approved production masters.

| Candidate | Runtime role | Playback |
|---|---|---|
| M02 Morning Shift | Normal patrol | Full track, overlapping restart |
| M03 Steel and Timber | Dense pressure | Full track, overlapping restart |
| M04 Bearing Load | Boss / critical health | Full track, overlapping restart |
| M05 After the Last Beam | Work stop | First 4 seconds, provisional |
| M06 The Final Notch | Equipment evolution | First 3 seconds, provisional |
| M07 Tools Down | Success | First 12 seconds, provisional |
| M08 The Table Remains | Failure | First 10 seconds, provisional |

All files use the supplied constant-gain review masters. They measure -18 LUFS, with true peaks below -1 dBTP; no dynamic compression was added. Full technical measurements and SHA-256 values are included beside the audio files.

Adaptive selection is presentation-only. Hysteresis stabilizes hazard/health thresholds. Sources crossfade on score changes and track restarts; this does not certify a musically seamless loop. Voice ducking uses the existing Music/Voice buses. Pause, perk selection, mute, visibility pause and exit cancel scheduled score playback, and late decodes cannot restart an exited session.

Validation: 195 test files / 1,057 tests passed, typecheck and build passed. Lifecycle tests cover deduplication, mute/unmute, loop cancellation, incomplete-asset rejection and late-decode cancellation. CI browser QA additionally requires the M02 score to decode after patrol starts. Remote CI at c5369ec passed four viewports including actual M02 decode and Stage10 real simulation (saved unlock/R&D fixtures, not natural progression). The final resume correction adds a UI regression test preserving the evolution cue across perk-choice resume. Local Chromium is unavailable and its download failed, so local browser success is not claimed.

Remaining: real listening approval, deliberate musical loop/cue cuts, Android device mix review, and remaining Foley/ambience generation. Existing approved voice, Episode 01 and defense assets remain in place.
