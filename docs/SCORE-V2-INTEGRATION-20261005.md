# User-supplied score 01–09 integration

The user supplied all nine Gemini MP3 recordings and explicitly requested integration on 2026-10-05. Download originals remain unchanged. Derived stereo 48kHz Vorbis files are in public/assets/survivors/score-v2. Conversion does not restore information lost in MP3 encoding. Previous score-v1 binaries remain available for rollback.

## Mapping

| Source | Runtime | Edit |
| --- | --- | --- |
| 01 READY | Ready screen, explicit preparation-music toggle | Full 170.29s |
| 02 FOUNDATION | Early/low-risk adaptive patrol | Full 181.60s |
| 03 PRESSURE | Adaptive pressure state | Full 178.16s |
| 04 HEAVY_RISK | Boss/high-risk state | Full 178.47s |
| 05 EVOLUTION | Equipment evolution cue, then resume score | 3s |
| 06 SHOUT_FX | Ultimate musical effect, alongside existing approved Director voice | 2.5s |
| 07 BOSS_ALERT | Boss warning, then ongoing adaptive score | 1.5s |
| 08 SUCCESS | Victory result | 4s |
| 09 FAILURE | Defeat result | 3s |

Source event recordings were 57–116 seconds, not isolated one-shots. Excerpts start at the first early audible RMS onset and have 15ms attack/250ms ending fades. This is a reproducible technical candidate selection, NOT artistic listening approval. Director review may choose different sections without regenerating the source. Exact start times, gain adjustment and SHA256 of originals/derivatives are recorded in content/survivors-score-v2-ingest.json.

## Mix and Lifecycle

- Music sources were adjusted toward -21dBFS RMS; event excerpts toward -18dBFS RMS, constrained by estimated sample peak. These are RMS targets, not measured LUFS or true-peak certification.
- Browser decoding verified stereo for all nine files. Derived sample peaks were 0.375–0.847, with no decoded samples reaching full scale. Source decoder overshoot is not evidence that the original master was clipped.
- Looped scores use an existing crossfade scheduler, not a claimed sample-perfect authored loop. Previous decoded music is removed from the cache when changing score to limit mobile memory retention.
- Only the five short event cues are preloaded at patrol start. Long score recordings are decoded on demand instead of retaining all four long PCM buffers simultaneously.
- Ultimate and boss recordings use the SFX mix bus, leave the adaptive score intact, and duck music. The approved Director voice remains on the Voice bus. Evolution temporarily replaces the score and returns afterward.
- Redundant evolution, boss, victory and defeat synth effects were removed. Other weapon/pickup/hit effects remain procedural; prompts 10–24 are not yet recorded assets.
- Preparation music starts from an explicit user action to honor browser autoplay policy. Existing global mute, pause, cleanup and voice limits apply to supplied recordings.

## Verification

Browser: all nine production URLs fetched and decoded; measured duration/channel/peak/RMS. Preparation toggle and gameplay launch checked. Regression coverage verifies binary hashes, source mappings, loop/cue separation, mute cleanup and late-decode cancellation. Full suite and production build are required before publication.

No tool providing semantic listening/transcription is connected in this environment. Instrumentation checks do not prove absence of vocals or artistic fitness. All nine new recordings stay CANDIDATE pending listening review; runtime integration is authorized, final production lock is not implied.

## Reproduction

Set FFMPEG_PATH to a local ffmpeg executable, then run:

```powershell
node scripts/ingest-survivors-score-v2.mjs C:/Users/user/Downloads --render
```

Original paths are runtime arguments; no source recordings are overwritten. Inspect the report and listen to the derived cues before approving a different edit.
