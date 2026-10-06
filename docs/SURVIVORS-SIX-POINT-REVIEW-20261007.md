# 2026-10-07 Six-Point Review

## Implemented

- Operation preparation restores the last actually launched stage, including its chapter. Browsing the stage list does not overwrite the played-stage record. Invalid, locked and inaccessible storage values fall back safely to stage 01.
- The initial floor is no longer incorrectly marked as already loaded. Launch waits for the selected map's image.
- Typography retains one UI family, adds an explicit Korean system fallback, aligns changing numbers and separates title/body weights and line heights. This is a hierarchy improvement, not a new font asset.

## Asset Findings

- Premium shop uses a 4x4 atlas with 16 distinct equipment silhouettes and 16 distinct cell indices. An identical premium image was not established by inspection of the source atlas.
- General weapon levels 1/2, 3/4 and level 5/evolution intentionally share atlas cells in `equipmentAppearance`. Added modules and level pips do not constitute independent item artwork. Independent final evolution artwork is still required; this review does not mark it complete.
- Existing rejected walking candidates remain rejected. Actual alternating-foot poses and item-specific multi-frame silhouettes must replace reused poses, not be hidden by brighter glow or faster frame playback.

## Remaining Work And Acceptance

1. Identify the exact duplicate item labels and screen; replace the corresponding production slots with distinct final art. Check shop, pickup, evolution, HUD and equipped view, not only the atlas.
2. Identify the locked Defense/Story image screen. Current hub action buttons have no bitmap lock images, so replacing unrelated portraits would not fix the report. Inspect original resolution, displayed size, crop and filters after receiving the exact screen.
3. Identify the reported last-phase 15-second popup. No matching 15-second popup string was found in this working tree. Once identified, keep its gameplay timer unchanged, move the status to a compact non-modal edge indicator and ensure it does not intercept movement input or cover the destination.
4. Author walking contact/passing/opposite-contact frames with stable feet and torso attachment anchors; verify 8 directions, abrupt reversal and slow movement with actual captured video.
5. Replace equipment aura stamps with independently changing authored discharge, pressure, shards and mist sequences. Idle stays readable but restrained; firing/contact/evolution owns strong effects. Verify 1/3/6 equipment without whitening, hidden contributions or detached ground movement.

## Verification

- Full suite: 1537 passed, 1 skipped; typecheck and production build passed.
- Stage restoration browser check covers PC, portrait and landscape with actual launch, pause-menu exit and re-entry. Reports and screenshots are in `artifacts/stage-resume`.
- These checks do not establish final visual quality, real S26 performance, or completion of the remaining art replacements.
- No GitHub push or Vercel deployment in this review.
