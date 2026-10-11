# SIGNAL WATCH — approved A loading screen (2026-10-11)

**Director choice:** A (cinematic identity). Replaces only the SIGNAL WATCH loading entry. SIGNAL BREAKER and its art/flow are untouched.

- Art: 941×1672 vertical master, original image-derived cinematic key art; WebP quality 93, 424,938 bytes. The static progress/footer area is cleanly vignetted out so browser markup shows the real loading state.
- Source of truth: `public/signal-watch-loading/signal-watch-a-v1.webp`; logo and tagline are already baked into this art. Do not duplicate title over the center of the screen.
- Presentation: full portrait poster preserving the title, subject and hazard markers; blurred letterboxing on landscape rather than destructive object-fit cropping.
- Runtime: progress advances on 4 asset preloads plus `loadGame()`; 100% only after all are ready, minimum 1000ms opening or 300ms completion delay, 20s watchdog and retry/exit. Auxiliary sprite preloads are best-effort, key art is required.
- Accessibility: live progressbar, real status messages, focus-visible controls, reduced-motion support and safe-area padding.
- Android-native OS splash screen and deployed app version are separate; this changes the in-game loading entry.

Validation: `npx vitest run tests/signal-watch-loading-screen.test.tsx`, `npm run typecheck`, `npm run build`, followed by Android portrait / tablet landscape screenshots.
