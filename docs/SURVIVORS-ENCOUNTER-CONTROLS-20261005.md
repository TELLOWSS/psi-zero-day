# Encounter Controls - 2026-10-05

- Engine rejects support and control-line requests during boss arrival and secured confirmation without consuming charges or starting cooldowns.
- Tactical buttons and ultimate are disabled during these intervals; a fully charged ultimate does not show its ready animation/label until combat resumes.
- Shop and equipment-inspection entry are disabled and guarded during the same intervals. Pause and exit remain available.
- Regular combat, ready-screen shopping, damage, rewards, and encounter timing are unchanged. No new art/audio assets were added.

## Verification

- Full suite: 1,329 passed, one intentionally skipped. Typecheck and production build passed.
- Two engine regressions cover arrival and secured charge preservation and successful action requests after returning to combat.
- Browser checks at 1440x900, 390x844, and 844x390 confirm disabled encounter controls, restored combat tactics, and no charge consumption from Q/E during secured confirmation.
- Existing core protection, clear progression, aura, four boss raster, overflow, and page-error checks passed.
- Development entry loaded meaningful content without a Vite error overlay.

Browser checks use controlled encounter fixtures. Physical-device long-session performance and natural-play review remain separate requirements.
