# G8-A Foundation Lock Candidate V2

Source musical reference:
`floor_twelve_ledger.mp4`

Decision:
**SELECTED AS G8-A FOUNDATION TONAL REFERENCE**

This derivative is the working lock candidate used to author the remaining G8-A score layers.

## Processing

- selected beat-aligned source region begins at 66.456 s
- tempo normalized to locked 84 BPM grid without pitch shifting
- exact target: 16 bars / 4/4 / 45.7142857 s
- 500 ms wrap-crossfade constructed from source audio immediately after the loop boundary
- additional source gain trim: -3.6 dB
- runtime derivative: 48 kHz Ogg/Opus 160 kbps
- source/native generator provenance remains the original 44.1 kHz AAC-in-MP4 and is not falsely labeled native 48 kHz

## Observed V2 runtime candidate

- OGG duration: 45.720792 s
- sample rate: 48000 Hz
- channels: 2
- codec: opus
- integrated loudness: -14.0 LUFS
- loudness range: 1.2 LU
- true peak: -3.6 dBFS
- seam single-sample delta metric: 0.033063
- first 20 ms RMS: 0.161703
- last 20 ms RMS: 0.119122

## Project status

This candidate becomes the **tonal/mix reference for 02 Pressure and 03 SWIFT Threat**.

It is not yet marked AUDIO_PRODUCTION_LOCKED because the project requires:
- remaining 23 assets,
- complete in-game mix,
- actual Android listening QA,
- oscillator fallback = 0.

Unless the later full mix reveals a regression, do not spend another Gemini generation on Foundation.
