# Drone Repetition Fatigue Mix

Director feedback: repeated drone fire is noisy and tiring. This pass changes runtime mixing, not the approved source recordings or gameplay firing cadence.

- Base, Premium and Hunter share one playback admission key, independent of event kind. Minimum interval is 220 ms, or 300 ms during busy scenes. Suppressed recordings do not invoke procedural replacement sounds.
- First-shot gain is 0.30 instead of 0.60 (approximately -6 dB). Repeated fire within 800 ms uses 0.22 (approximately -8.7 dB relative to the previous mix). A quiet gap restores first-shot gain.
- Base/Premium tails are capped at 120 ms; Hunter retains up to 160 ms. The last 40 ms fades out to avoid hard cuts. Original assets remain unchanged, and A/B/C shuffle selection remains intact.
- Impact, boss, music and UI levels are unchanged. These changes do not claim subjective listening approval; sustained phone and headphone listening remains the Director review gate.

Focused recorded-audio suite: 9 tests passed. Typecheck and production build passed. Chromium loading and recorded-audio lifecycle checked separately from human listening.
