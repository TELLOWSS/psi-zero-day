# Tactical UI Refresh

Scope: presentation only. No equipment prices, durability rules, save format, combat timing or voice selection changes.

## Direction

- Quiet field-instrument character, not a neon dashboard or decorative marketing page.
- Self-hosted Pretendard Variable for Korean body and controls; Black Han Sans for major titles only; Chakra Petch Bold for brand and instrument numerals.
- Character, stage and equipment artwork remain existing production assets. No placeholder visual asset added.
- Neutral charcoal materials, mint actions and equipped state, amber currency and maintenance, coral broken-state warnings.
- Restrained 4-6px corners, precise separators and shallow material highlights. No decorative particles, large glow or nested panels.
- Existing shop tabs, filters, fitting tools, purchase/repair actions and sticky wallet retained.
- Prices separated from ownership labels to make scanning and point comparisons easier.
- Fixed font sizes, zero tracking, Korean keep-all with emergency wrapping. Existing touch-target geometry retained.
- Font display swap and system fallbacks retain readable loading states; no runtime external font requests.

## Distribution

Unmodified font binaries and full SIL OFL licenses are included in public/fonts. Source links and versions are in public/fonts/README.md.

## Verification

scripts/verify-tactical-ui.mjs checks 1440x900, 390x844 and 844x390, real font loading, all four shop views, wallet visibility, horizontal overflow and browser errors. Captures entry, operation readiness and each shop tab. Existing maintenance and fitting suites remain required.

Visual acceptance remains Director review. CSS polish does not change any Phase D artwork's production-lock status.
