# AIRA V2 / silver-white canonical action delivery contract

Date: 2026-11-09  
Branch: `feat/omega-protocol-roguelite-core-20261108` — **DRAFT / DEV REVIEW ONLY**  
Main and Vercel Production: **do not merge, switch or deploy**

## Exact status

- Eight 384×512 AIRA V2 **neutral direction illustrations** exist in GitHub's
  `public/assets/omega/canonical-review/aira-v2/`, SHA-256-pinned and
  explicitly **not** certified as eight 3D-camera-correct turnarounds.
- `NW` in GitHub still has an inaccurate rear-left perspective. A separately
  generated candidate `AIRA-V2-NW-rear-left-review-candidate.webp` (384×512
  RGBA, SHA-256 `d103b07eb23f42255a24ea72e5ee04335ef7a2a14ec5b0e106a4a11f86c35a74`)
  exists in conversation deliverables, **not** in the GitHub source tree.
  Do not change roster SHA-256 or replace production sprites without inspection.
- The **old E-only** authored walk/fire/dash/hit/special studies are
  separate black/rose illustrated material, not validated as frames from
  the silver-white nine-original source set. They must not silently be
  composited over silver AIRA or counted as the silver source's completed
  animation library.
- Actual native Watch silver pilot uses the neutral original for each
  `E,SE,S,SW,W,NW,N,NE` direction in DEV; Guard displays original S
  as a **noncombat** commander observer, not a controllable character.
- `omega-silver-watch-native-actions.ts` now samples native movement,
  close-to-player handheld launch events, real dash, and HP-change reaction.
  It **only emits review metadata**, never promises an art frame.

## Asset quantities and phase-gates

| Action | Independently authored image frames per heading | Eight-heading total | Native event |
| --- | ---: | ---: | --- |
| walk | 6 | 48 | collision-corrected displacement |
| fire | 3 | 24 | native radio/grout launcher fire |
| dash | 3 | 24 | native player dash active |
| hit | 3 | 24 | native actual HP damage reaction |
| ultimate | 3 | 24 | native special ability action |
| finish | 2 | 16 | actual victory/end sequence |
| **Total** | **20** | **160** | **No artificial cooldowns** |

Priority four actions alone: **120 independent keyframes**. Each frame
requires direction-accurate anatomy, fixed AIRA costume and hair identity,
foot contact anchor, transparent alpha, weapon alignment and per-action
consistency. Another 320 author-reviewed occlusion/contact mask assets are
an independent release gate, not something auto-satisfied by drawing a
single alpha matte twice.

## Proposed file naming, not current asset claims

`public/assets/omega/aira-silver-actions/v1/{heading}/{action}-{index}.webp`

- `heading` is uppercase E/SE/S/SW/W/NW/N/NE, no mirrored stand-ins.
- `action` is walk/fire/dash/hit/ultimate/finish; index is zero-based.
- Source must be an **individually authored illustration**, not a cutout
  warp, sprite mirroring, duplicated image, or rendered QA mockup.
- Preflight: 384×512 RGBA, no clipped boots/hair or glow outside frame,
  SHA-256 per file, unique content check, alpha bounding box and boot pivot.
- Art importer rejects incomplete rows, missing files, swapped identities,
  unexpected hashes, wrong scale, unsupported frames and unapproved masks.
- DEV review must require opt-in and a complete independently inspected
  identity pack; fail closed to existing game art on any mismatch.
- Native Watch performance targets and final acceptance require full
  actual-play testing on desktop, mobile browsers and physical Android
  hardware at multiple graphics settings, including high threat count.

## Implementation order

1. Finalize 3/4 view visual standard for S, N, W and **correct NW**; approve
   silhouette continuity before generating large batches.
2. Produce action keyframe strips individually, not technical silhouettes;
   complete six walk images per heading, then three each fire/dash/hit.
3. Integrate only the inspected four-action silver pack with the real
   action sampler and foot/occlusion anchor. No unlock or stat changes.
4. Produce ultimate/finish and 320 masks, then repeat Guard/Watch in-game
   art review. Guard's tower-defense mechanics must remain independent.
5. Perform native Playwright QA on actual source build, physical device
   QA and full journey gameplay; keep PR Draft until gates pass.

## Certification scope

Source code compilation and animation state detection **are not** original
action artwork. Schematic diagrams, concept sheets and generated status
posters **are not** independent production animation frames. Vite DEV
viewport screenshots **are not** Android hardware validation. No paid
Vercel API or service is required for any of these DEV checks.
