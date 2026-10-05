# Ultimate Cutin Handoff - 2026-10-06

## Implemented

- Hold the existing ultimate launch source while the director portrait covers the battlefield (`cutin`, `shout`). Hidden source stamps neither render nor consume their lifetime.
- Protect this held source from eviction when the bounded 64-effect pool receives crowded impact feedback. Other weapon receipts continue normally.
- Resume the source and retrigger the authored ultimate gesture on the first `invert` engine frame. Remove the portrait layer at that handoff so it cannot cover the release; reset held state when clearing the pool.
- No new art, damage/range changes, resource rules, or sound assets. Existing production atlas and authored animation are reused. This is a presentation correction, not a visual production lock.

## Verification

- Full suite: 1,369 passed, 1 skipped. Type checking and production build passed; final CSS handoff was rebuilt successfully.
- Unit regression covers hidden lifetime, hidden drawing, 100 crowded contacts, bounded pool, release expiry, and clear/reset.
- `scripts/verify-survivors-ultimate-cutin.mjs`: real UI activation at 1440x900, 390x844, 844x390, and 568x320. Only ultimate charge is filled by the fixture; engine lifecycle and input remain real.
- All four viewports: hidden source age stays zero, source resumes and expires, gesture is dispatched at `invert`, no horizontal overflow or page errors. Reports/screenshots are local under `artifacts/ultimate-cutin`.
- The transient reveal is observed from engine state, not Playwright visibility: the portrait layer is intentionally transparent at reveal. Earlier visibility waits falsely timed out despite valid engine/source frames.
- Existing ultimate raster release verification passed at three viewports, including busy/reduced-motion rendering paths.

## Remaining / Director Review

- True eight-direction authored performance and equipment anchors remain a separate production-art task. Existing directional adaptation must not be called a completed eight-direction source set.
- Validate perceived impact on physical mobile devices, including reduced-motion preference. Automated viewport checks do not replace device performance or subjective art approval.
- Review the portrait-to-battlefield handoff and existing sound alignment before cinematic quality approval.
