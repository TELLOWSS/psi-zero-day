# EP01 Audio P0 — QA Timeline Runbook (2026-10-18)

Status: Instrumentation candidate, **not an audio continuity fix**, not Director Audio Lock.

## Scope and privacy
- Enabled **only** when the current URL contains \`ep01AudioDebug=1\`.
- A rolling, in-memory log of the **latest 240 records** (no server requests, storage, voice data, listener identifiers, transcript, or audio capture).
- Captures event ID / approved asset ID, media lifecycle events, readyState, volume, autoplay error name, duck multiplier, scene transitions, gestures, visibility-driven mute, and teardown.
- The browser alone holds the journal. Reloading clears it.

## QA procedure
1. Open the exact branch preview URL with \`?ep01AudioDebug=1\` (or \`&ep01AudioDebug=1\` when the URL already has a query).
2. Enter STORY and enable sound with a touch; begin \`e01_01_arrival\`.
3. Play all 26 events, especially \`e01_04_junho_signal\`, \`e01_06_pump_arrival\`, \`e01_08c_site_pushback\`, \`e01_09_evening\`. Keep the browser/Android volume nonzero and record perceptible transitions.
4. Test rapid advance, voice skip, reader pause/history, background/foreground and return to hub, then reenter.
5. In browser devtools: \`window.__PSI_EP01_AUDIO_QA__.read()\` returns the current journal. For Playwright, \`page.evaluate(() => window.__PSI_EP01_AUDIO_QA__?.read?.() ?? [])\`. Clear with \`.clear()\` before each scenario.
6. Pair lifecycle records with manually observed silence/volume jumps. A \`pause\` event by itself can be legitimate; it does not prove an audible dropout. Conversely a nonzero \`volume\` does not prove output on hardware.

## Failure classification
- **Unexpected bed stop**: a \`scene pause\` before next \`scene playing\`, without authored intentional silence.
- **Autoplay denied**: \`play_rejected\` with \`NotAllowedError\` after a user gesture.
- **Asset stalled/failed**: \`waiting\`/\`stalled\`/\`error\` without a subsequent \`playing\`.
- **Voice pumping**: a near-immediate \`duck_change\` 0.28 → 1; baseline evidence for smoother envelope.
- **Effect tail cut**: \`foley pause\` caused by event-bound cleanup while the effect was still active.
- **Speaker unavailable**: \`voice play_rejected\` or \`voice play_unavailable\`; subtitles and manual game controls must remain functional.

## P1 acceptance / exclusions
A P1 patch must add score/scene crossfades, retain shared beds, smooth voice duck release, and avoid indiscriminate Foley cancellation. It must not change authored event IDs/choices, save schema, narrator source audio, or user mute behavior. QA must cover web, mobile, and Android WebView; actual waveform/subjective listening have **not** been validated in this P0 patch.

Production \`main\` remains unchanged and PR #210 must remain Draft pending Director Visual & Audio Locks.
