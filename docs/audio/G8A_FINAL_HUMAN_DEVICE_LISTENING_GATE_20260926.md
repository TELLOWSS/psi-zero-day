# G8-A Premium Audio — Final Human / Device Listening Gate
Date: 2026-09-26
Gate: G8-A AUDIO PRODUCTION LOCK
Status: AUTOMATED_RUNTIME_QA_PASS / HUMAN_DEVICE_QA_REQUIRED

## What automation already proved
GitHub Actions run 36221130191 verified:
- 24/24 runtime OGG binaries present
- 48 kHz runtime decode / technical gate
- READY
- WAVE_BUILD
- SWIFT_THREAT
- CONTROL_INTERVENTION
- RESOLUTION
- desktop 1440×900 browser runtime
- mobile viewport 390×844 browser runtime
- premium gameplay binary cues observed: 10
- premium mix play() success events observed: 68
- premium mix play() failure events: 0
- oscillator fallback events: 0

Artifact:
- workflow run: 36221130191
- source SHA: 2d6ff82227817518dda4e035323d7b6ca53fb796
- telemetry artifact ID: 10899193585

## Important boundary
The 390×844 browser run is NOT proof of physical Android speaker quality.
The following acoustic checks must be performed by a human listener before Production Lock.

## 1. Headphone stereo
Use normal listening volume.

PASS only if all are true:
- Foundation is restrained and does not feel like a trailer bed.
- Pressure clearly increases workload tension without becoming chase music.
- SWIFT adds physical mass without masking the reverse alarm.
- CONTROL intervention is immediate and then gets out of the way.
- Air brake, radio and barrier are individually identifiable.
- Resolution feels relieved/reflective, not heroic.
- WIN and LOSS are distinguishable without looking at the screen.
- no obvious click/pop at loops or state changes.

Result: PENDING
Reviewer:
Note:

## 2. Physical Android phone speaker
Use the target Android phone at a normal practical volume, not maximum volume.

PASS only if all are true:
- reverse alarm remains unmistakable during SWIFT.
- WARNING is distinguishable from the SWIFT reverse alarm.
- CONTROL air brake / radio / barrier survive the phone speaker.
- SELECT / PLACE remain distinguishable.
- SINGLE RESOLVE / AREA RESOLVE remain distinguishable.
- LEAK sounds serious but not like horror/game-over.
- SUPPORT reads as coordination, not sci-fi.
- WIN / LOSS remain distinguishable.

Result: PENDING
Device:
Volume:
Reviewer:
Note:

## 3. Small speaker / laptop
PASS only if:
- core midrange gameplay information survives without sub-bass.
- no cue disappears entirely.
- music does not dominate Foley.

Result: PENDING
Device:
Reviewer:
Note:

## 4. 10-minute repetition / fatigue
Run representative play or repeat the QA sequence for at least 10 minutes.

PASS only if:
- Foundation/Pressure loops do not expose an annoying seam.
- reverse alarm remains informative without becoming excessively fatiguing.
- UI SELECT/PLACE/resolve cues are not irritating under repetition.
- hydraulic/engine loops do not reveal an obvious mechanical reset.
- no accumulating timing drift makes the three loop stems sound out of sync.

Result: PENDING
Reviewer:
Note:

## 5. Blind SWIFT vs CONTROL discrimination
Without looking at the screen, listen to representative SWIFT and CONTROL moments.

PASS only if:
- SWIFT is identifiable as moving heavy-vehicle danger.
- CONTROL is identifiable as intervention / stopping / access control.
- the two moments are not confused with one another.

Result: PENDING
Reviewer:
Note:

## Production Lock rule
Only after every section above is PASS may the project:
1. mark all 24 asset listening fields PASS,
2. set all 24 asset states to PRODUCTION_APPROVED,
3. set actualPlay.desktop and actualPlay.androidMobile to PASS,
4. confirm oscillatorFallbackCount = 0,
5. set contract status to AUDIO_PRODUCTION_LOCKED,
6. set productionLockAllowed = true,
7. make PR #63 ready for merge.

Until then:
- PR #63 remains Draft.
- G8-B remains paused.
- QA_READY must not be described as Production Approved.
