# G8-A 09 UI / Gameplay SFX Reel A — Candidate QA

Source: `PSI_ZERO_DAY_UI_GAMEPLAY_SFX_REEL_A.mp3`

Result: **5/5 LOCK CANDIDATES**

Detected isolated events:
- SELECT: ~0.00–0.50 s
- PLACE: ~0.99–1.37 s
- UPGRADE: ~1.96–2.55 s
- SELL: ~3.06–3.41 s
- WARNING: ~4.03–4.84 s

Runtime derivatives: 48 kHz Ogg/Opus 128 kbps.

Candidate metrics:
- select: 0.501 s, -10.3 LUFS, -6.9 dBFS true peak
- place: 0.459 s, -21.6 LUFS, -5.8 dBFS true peak
- upgrade: 0.624 s, -13.6 LUFS, -5.5 dBFS true peak
- sell: 0.419 s, -17.0 LUFS, -5.9 dBFS true peak
- warning: 0.813 s, -5.8 LUFS, -3.9 dBFS true peak

No regeneration required before actual-play mix QA.

Open acceptance checks:
- repeated SELECT fatigue
- SELECT vs PLACE discrimination
- UPGRADE must not read as magical/gacha
- SELL must not read as failure/error
- WARNING vs SWIFT reverse alarm discrimination on Android phone speaker
- full mix / headphone / Android / actual-play fallback=0

Project candidate count after this reel: **18/24**.

Next: `10 UI / GAMEPLAY SFX REEL B`.
