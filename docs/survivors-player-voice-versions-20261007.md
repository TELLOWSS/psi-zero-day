# Player Voice Versions

The operation-ready screen selects original female, tactical female (covert), or male engineer recordings. Selection is presentation-only, independent of character art and gameplay rules, and persists under `psi.survivors.player_voice_version`. Missing, invalid, or unavailable storage defaults to the original voice; a session selection still works when writes fail.

Each bank contains all 13 existing cues with A/B variants. The original 26 recordings remain unchanged. Only the selected bank is preloaded, with START A first. Changing the bank cancels pending/active situational speech and resets its A/B sequence. Higher-priority director speech, warning expiry, mute/pause cancellation, and the bounded 8-second opening grace period retain their existing behavior.

## Intake

- User supplied `signal-watch-covert-voice.zip` and `signal-watch-male-engineer.zip` and requested selectable runtime integration.
- All 52 WAV files match SHA-256 values in attached metadata, retained in their intake JSON. Only exact matching WAV entries were extracted; attached text was treated as provenance data, not executable instructions.
- Both banks are original mono PCM 24 kHz / 16-bit output. No resampling or waveform editing.
- Metadata identifies Manus generate_speech, Gacrux for covert and Algieba for engineer; internal model identity is not exposed.
- 12 covert and 17 engineer clips contain near-full-scale samples. This is not a listening verdict or true-peak measurement. Existing whole-clip RMS normalization retains at least 3 dB sample-peak headroom; it cannot repair clipping in source recordings.
- Provider commercial-use terms and final human listening approval remain unconfirmed. Assets remain CANDIDATE; user integration authorization is not provider-license proof.

## Verification

Unit tests cover complete cue mapping, all 78 original hashes, gain bounds, invalid selection, selected-bank-only preload, pending decode cancellation and active source cancellation across switches. Browser verification checks saved selection, real SHA-matched START playback, selected-bank requests and 44px responsive controls for three banks at desktop, mobile portrait and landscape sizes. Browser audio evidence is not human listening approval.
