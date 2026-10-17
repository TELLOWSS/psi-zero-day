# Crew / story release verification

Verified source commit: `637b76916b2221cf1cc2d69ad2f2a793013ec563`.

[GitHub Actions run](https://github.com/TELLOWSS/psi-zero-day/actions/runs/39029570082) completed successfully on 2026-10-17. Full screenshots and logs are available in its `crew-story-sync-evidence` artifact (14-day retention); selected evidence is preserved in this directory.

- Typecheck and production build passed.
- Full regression: 391 files passed, 1 skipped; 2,296 tests passed, 1 skipped.
- Complete 26-event story playthroughs at 320×568, 390×844, 568×320, 844×390, and 1440×900. No captured page errors or HTTP failures. Reader settings and audio pause checked at every size; manual prologue and reload/resume checked at 390 pixels.
- Recovery: corrupt original preserved until explicit restart; quota failure retains playable session; missing required art blocks entry and retry recovers without advancing save; optional Watch/Guard entry preserves story engine state.
- Crew motion: five characters, 160 authored frames prepared per character; eight directions and four sampled poses rendered. Rendering contracts do not substitute for an artistic review of head/neck composition, identity, and marking quality.

Screenshots are automated captures during story progression. Transition/voice state may be visible; these are technical verification evidence, not final art or readability approval. Real Android performance and listening tests remain outside this web-runner verification.
