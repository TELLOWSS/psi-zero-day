# 2026-10-07 Six-Point Review

## Updated Review After Main Integration

### Release Follow-Up

Release CI previously expected playable Defense/Story and the old patrol label, even though main intentionally locks those modes. Current gates verify native previews, no unintended mode entry, real Signal Watch launch, stage resume and fitting; rig/prop/projectile fixture harnesses retain their checks and include current dependencies. Episode browser QA explicitly reports NOT_RUN_LOCKED_BY_RELEASE for cinematic gameplay while checking the real Story gate; this is not a claim of Episode runtime verification.

The user subsequently authorized GitHub and Vercel synchronization. Equipped material flow and socket pulses now follow the body animation clock, so player movement during combat hit-stop does not leave their feedback frozen on world time. Fitting overrides that clock explicitly to avoid inheriting a paused runtime timestamp. Two tests cover actual hit-stop movement, pause freezing and invalid/legacy timestamps. Full suite: 1591 passed, 1 existing skipped; typecheck and production build passed. Walking intermediate art and independent equipment animation completion remain out of this release.

This section supersedes the initial findings below. The initial checkout lacked the reported lock previews and extraction UI. Locally merging origin/main at 6a8b34f exposed both. Existing wave, mastery, dash and extraction mechanics remain intact; these presentation fixes change no engine/domain rules. No push or deployment performed.

1. Item identity: five original evolved weapons now use a dedicated transparent 3x2 atlas. Grouting and EMP no longer reuse extinguisher/floodlight rows; a 4x2 tactical atlas supplies their progression and evolution forms. HUD, icons and canvas use matching sources/cells. Equipped premium props now retain all sixteen shop identities instead of generic category props; dedicated wearables retain priority. This is not completion of all articulated garments.
2. Typography: a single Pretendard/system/Korean fallback family, tighter label tracking, title/body hierarchy and aligned numbers. No decorative font mixture or new font binary.
3. Locked modes: replaced legacy 560x315 images with generated 1672x941 Defense/Story scenes. Titles and controls remain HTML; removed the cover over the old baked button. Unfinished modes remain locked.
4. Resume: last actually launched stage and chapter restore; browsing does not overwrite them. Browser checks launch stage 14, pause-menu exit and re-enter successfully on PC, portrait and landscape.
5. Extraction: 46px desktop / 40px mobile edge status replaces the central banner, cannot intercept input and takes priority over wave/supply notices. Rules remain a 15-second hold inside LZ, paused outside, not a 15-second arrival deadline. Browser status screenshots are explicitly component fixtures over gameplay, not proof of naturally completed runs. Engine tests separately exercise extraction APIs and single reward.
6. Motion/feedback: body and attachments share directional pose, fixing double mirroring in left-facing fitting. All six premium identities survive the aura selection budget, with bounded 32 normal / 16 busy ribbon segments. Five-view fitting checks cover walk/action/left/pause/reduced-motion/hidden-tab and six concurrent items. Actual alternating-foot intermediate art and all independent equipment animation assets remain incomplete.

### Current Verification

- Three-view visual checks: both preview assets resolve at 1672x941; fourteen ordinary/evolved equipment renders populated and pixel-distinct; edge status does not cover the viewport center, intercept input or cause overflow. No browser exceptions.
- Five fitting viewports passed. Reports: artifacts/fitting-motion, artifacts/six-points, artifacts/stage-resume.
- Legacy regression fixtures updated to current entry labels, gated modes and authored boss timing. Boss collision tests isolate incidental actors/environment, allow hit-stop frames and explicitly start/tick extraction as runtime does.
- Final full suite: 1589 passed, 1 pre-existing skipped (286 files passed, 1 skipped). Final typecheck and production build passed. The additional short-run status assertion also passes: its progress uses the real 10-second total rather than assuming 15. Vite retains a >500 kB shooting-chunk warning; no performance claim is based on build success.
- Physical S26 Ultra performance, naturally played fresh-save extraction, genuine opposite-foot walk art and character-by-character articulated garment approval are still required.

### Art Provenance And Revision Prompts

Built-in image generation/editing only; no external paid API or copied third-party game assets. Transparent atlas packing uses Sharp crops/resizing without painted alterations. Prompts below preserve production requirements for further revisions, not verbatim tool transcripts.

- Evolution: five distinct isometric industrial cutouts in 3x2 grid: satellite panels, cryogenic turbine, copper Tesla tower, magnetic rails, red/black six-arm Hunter. Match referenced game equipment and camera; isolated transparent cells, no labels/UI. Output: public/assets/survivors/equipment-evolution-v1.webp.
- Premium: preserve sixteen referenced shop designs in 4x4 cell order; remove backdrops, retain distinct silhouettes/materials, isolated transparent cells, no invented item identity/text. Output: public/assets/survivors/premium-equipment-mounted-v1.png.
- Tactical: eight isometric transparent cutouts in 4x2: three progressing grouting guns plus hydraulic ram; three progressing EMP generators plus plasma grid. Match existing art/camera, no extinguisher/floodlight duplicates or labels. Output: public/assets/survivors/tactical-equipment-v1.webp.
- Defense: detailed widescreen night construction defense scene with worker, machinery, barriers/cranes; readable actual subject, no typography/buttons/logos/lock symbols. Output: public/mode-previews/defense-coming-soon-v2.webp.
- Story: detailed widescreen night-site investigation, workers/documents/supervision; clear characters/environment, no typography/buttons/logos/lock symbols. Output: public/mode-previews/story-coming-soon-v2.webp.

## Initial Review (Historical, Superseded Above)

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
