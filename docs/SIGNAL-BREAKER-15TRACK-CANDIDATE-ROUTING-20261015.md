# SIGNAL BREAKER 15-Stage Audio Candidate Router — 2026-10-15
## Stage mapping
|Stage|Operation|Source|Preview asset path|
|---|---|---|---|
|01|첫 반사|Ricochet Logic|`./audio/ep01/ch01_ricochet_candidate_v01.ogg`|
|02|이동 반입|Belt Tension|`./audio/ep01/ch02_belt_candidate_v01.ogg`|
|03|집진 통로|Unfinished Architecture|`./audio/ep01/ch03_unfinished_candidate_v01.ogg`|
|04|장력 릴레이|Steel Under Tension|`./audio/ep01/ch04_steel_candidate_v01.ogg`|
|05|복합 전력망|The Final Relay|`./audio/ep01/ch05_relay_candidate_v01.ogg`|
|06|반사 공명|Point of Contact|`./audio/ep02/ch06_point_contact_candidate_v01.ogg`|
|07|역류 컨베이어|Iron Ratchet Pressure|`./audio/ep02/ch07_ratchet_candidate_v01.ogg`|
|08|잔류 분진|Locked Behind The Glass|`./audio/ep02/ch08_glass_candidate_v01.ogg`|
|09|장력 잔향|The Asymmetric Lock|`./audio/ep02/ch09_asymmetric_candidate_v01.ogg`|
|10|제로 시그널|Manual Override|`./audio/ep02/ch10_manual_override_candidate_v01.ogg`|
|11|교차 쇄도|Brushed Steel Pursuit|`./audio/ep03/ch11_brushed_steel_candidate_v01.ogg`|
|12|측면 포위|Gantry Walkway|`./audio/ep03/ch12_gantry_candidate_v01.ogg`|
|13|폭풍 돌파|Perimeter Breach Imminent|`./audio/ep03/ch13_perimeter_candidate_v01.ogg`|
|14|낙하 경보|Tension at the Winch|`./audio/ep03/ch14_winch_candidate_v01.ogg`|
|15|최종 합주|The Architect's Last Stand|`./audio/ep03/ch15_architect_candidate_v01.ogg`|
## Limits and QA
- Director uploaded 15 MP3s; corresponding 15 Ogg 48 kHz stereo 64s listening candidates in private handoff ZIP `PSI_SIGNAL_BREAKER_15_STAGE_AUDIO_CANDIDATES_20261015.zip`.
- All files **CANDIDATE_NONAPPROVED**: No independent commercial rights verification. Exclude audio binaries from public GitHub until written approval. 
- The preview audio is **not committed** to this PR, so the live UI safely falls back to its previous BGM until media is explicitly imported. No claim of production deployment.
- Stage score selection is keyed on `episode=1|2|3` and `CH-01..05`; non-campaign modes keep existing score.
- No boss/music multi-stem synchronization here; current per-event battle sounds and voice ducking remain. Loop boundaries require actual human listening and Android validation.
- After media clearance, import relative `audio/ep01`, `audio/ep02`, `audio/ep03` directories, update service worker cached paths and rebuild release hash. Confirm real-file fetch and offline playback in browser.
- `node --test public/signal-breaker-dev/tests/stage-score-candidates.test.cjs` tests 15-way routing, fallback, scene switch, pause/resume. GitHub CI may have unrelated baseline simulation snapshot drift.

## Director-accepted 15-song import — 2026-10-15
Director reviewed all 15 soundtracks and explicitly requested main/Vercel synchronization. 15 Ogg files (64-second loop previews; 14,914,604 bytes combined) are now included at the paths above, and their sizes, SHA-256 fingerprints, and Git blob hashes are verified. This is acceptance for current use, not an independent third-party commercial license determination. Stage audio is loaded on demand rather than precached at service worker install; phone offline score availability requires separate session caching validation.
