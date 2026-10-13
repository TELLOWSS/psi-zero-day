# Player situational voice V1 intake

Status: runtime integration authorized by the user on 2026-10-07; final listening lock is not claimed.

## Source and technical audit

- User ZIP: `Review uploaded pasted content.zip`; only the 12 exact P0 WAV filenames were extracted. Embedded `SKILL.md` and `pasted_content.txt` were treated as reference data, not executable instructions.
- Generator: Manus, confirmed by the user. Underlying model, voice ID and provider licensing evidence were not supplied.
- All files: valid mono PCM WAV, 24 kHz, 16-bit; 2.08-4.24 seconds, 1,828,368 bytes total. Original bytes are preserved with SHA-256 in `content/survivors-player-voice-v1-ingest.json`.
- `nearFullScaleSamples` means samples with absolute amplitude >= 0.999, not confirmed audible distortion. Seven clips contain such near-full-scale samples (2-94 each). Sample peaks range from -0.67 to 0 dBFS. No true-peak or LUFS certification is implied.
- Runtime gain aims at -19 dBFS whole-clip RMS with a -3 dBFS sample-peak ceiling, without changing pitch, timing or original files. Attenuation cannot repair any clipping already baked into the source.
- Files are longer than the prompt targets, especially warnings (2.08-2.60 seconds). Existing immediate warning tones and visible warning areas remain authoritative. Speech is additional feedback, not a change to warning lead time or gameplay balance.
- Automated verification covers PCM analysis, integrity, real browser decoding and playback lifecycle. No ASR transcript verification, human listening approval, physical mobile speaker test or provider-license verification is claimed.

## Runtime mapping

- Only `player` receives this voice. Start once per operation; A/B variants alternate on accepted playback within a mounted session.
- HP crossing below 30%, rearmed above 40%, 20 game-second cooldown. These thresholds only select speech.
- Nearby carts/debris entering actual `motion.warning`, or nearby authored cart/lifting/debris signature warnings. Eight game-second cooldown per warning type; danger outranks low HP.
- Falling debris always uses FALL A. FALL B names a lifting area and is restricted to `lifting_cross`, preventing incorrect site terminology.
- Boss `secured` confirmation once per boss; clear once per victory, with no next-operation voice on stage 50 because both supplied CLEAR lines name a next operation/site.
- One voice owner, with a 25 ms interruption fade. The existing approved Director shout reserves the voice bus and cannot be interrupted by player cues. No stale queue: busy lower/equal priorities are discarded; warnings taking over one audio-clock second to decode are discarded.
- Pause, upgrade choice, defeat, ready/exit, Director cut-in and dialogue focus cancel current/pending player speech. Victory may finish its clear line; it is not restarted by subsequent render frames. Muting/disposal cancels every source.
- Music uses the existing session ducking path; SFX alarms are not attenuated. The Voice mixer remains the existing user volume control.

## Follow-up production review

Director should review word accuracy, consistent speaker, harsh peaks and warning intelligibility with the existing music/SFX on real mobile speakers and headphones. Request shorter warning takes only when clarity is retained. Obtain model/voice ID and licensing evidence before final production listening lock. P1 and a final-map-specific clear line remain unrecorded.

## Verification

- Pure observation tests cover once-only start/clear/secured, HP hysteresis/cooldown, nearby warning transitions, repeated/distant warning suppression, character gating, final-map exclusion and priority ordering.
- Mock Web Audio lifecycle tests cover urgent preemption, shout ownership, slow decode expiry, canceled pending loads, mute and shared-source-budget eviction.
- `tests/verify-survivors-player-voice.mjs`: genuine browser WAV decode/source start/source stop on 1440x900, 390x844 and 844x390. With `PSI_VOICE_FIXTURES=1`, explicit test-only HP/cart/debris/boss-secured/victory state transitions additionally exercise real presentation/audio wiring; these are not natural-play clear evidence.
