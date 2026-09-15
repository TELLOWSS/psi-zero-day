# PSI : ZERO DAY — Player Visual Lock

Status: LOCKED for TASK-016C production media.

## Purpose
This document is the single production-art identity contract for the Player character. The portrait and map asset must depict the same person and must remain consistent across title, dialogue, map, tutorial, store creative and future expression variants.

## Production paths
- Portrait: `public/assets/episode01/characters/player-portrait.webp`
- Map: `public/assets/episode01/characters/player-map.webp`

Runtime precedence remains:

`final WebP -> hand-authored RC SVG -> deterministic SVG`

## Character identity
- Role: rookie field safety manager / player avatar.
- Gender read: woman.
- Age read: late 20s to early 30s.
- National/context read: contemporary Korean construction-site professional.
- Personality read: observant, composed, approachable, capable of taking command when a risk signal appears.
- Body type: compact athletic adult proportions; upright, practical field posture.
- Face: soft oval face, alert eyes, natural adult features; not childlike, doll-like or idol-stylized.
- Hair: short-to-medium black hair visible naturally below the helmet.
- Helmet: white construction helmet with one simple blue PSI-style stripe; no letters, company marks, fake glyphs or readable text.
- Clothing: navy/blue safety vest over practical field workwear; realistic PPE layering with no company branding.
- Signature prop: black inspection tablet.
- Signature gesture: one hand controls/holds the tablet while the other hand directs attention toward a work condition.

## Shared render language
- premium adult-friendly casual-strategy 2.5D character art,
- stylized realism rather than anime, chibi or caricature,
- clean, readable shapes for mobile scale,
- slightly exaggerated silhouette only where needed for gameplay readability,
- physically plausible daylight/material response,
- believable Korean construction PPE and workwear,
- clean transparent cutout with no environment, floor plate, text, UI, frame or baked-in shadow background.

## Portrait lock
Minimum source size: `1024 x 1024`.

Composition:
- transparent background,
- upper body / three-quarter portrait,
- helmet fully visible,
- tablet fully identifiable,
- shoulders not cropped so tightly that PPE silhouette disappears,
- head/face remains the strongest focal point,
- neutral-to-focused default expression suitable for dialogue reuse.

The portrait must still read clearly around 160–220 px tall in actual dialogue UI.

## Map lock
Minimum source size: `768 x 1024`.

Composition:
- transparent background,
- full-body 3/4 strategy-map pose,
- same face, age, hair, helmet, vest and tablet language as portrait,
- stable planted stance,
- active field-lead posture rather than fashion/model pose,
- hands and tablet readable at reduced scale,
- adult body proportions; no oversized head or shortened limbs.

The map figure must remain recognizable at approximately 80–140 px tall.

## Identity anchors that may not drift
The following five anchors must match between portrait and map variants:
1. face shape and age read,
2. hair length/part and visible silhouette below helmet,
3. white helmet geometry plus simple blue stripe,
4. navy-blue safety vest/workwear language,
5. black inspection tablet.

If three or more of these change, the asset is rejected as identity drift.

## Contrast against other Episode 01 characters
The Player must not visually converge with:
- Lee Jaehoon: tall/slim male assistant manager, white helmet, rolled drawings.
- Lim Junho: smaller early-20s male rookie worker, yellow helmet, green vest, radio.
- Seo Jeongmin: mid-40s male inspector, glasses, clipboard, dark formal inspection jacket.
- Oh Seungjae: broad early-40s male manager, white helmet, navy field jacket, phone/radio.

Helmet color alone is never accepted as character differentiation.

## Reject conditions
Reject any candidate with one or more of the following:
- anime-school or idol styling,
- chibi/child proportions,
- same-face appearance as another cast member,
- glamor/fashion pose inappropriate for field work,
- excessive makeup or doll-like facial rendering,
- unsafe or implausible PPE geometry,
- incorrect helmet type,
- pseudo-text, letters, company logos or meaningless marks,
- missing/ambiguous inspection tablet,
- baked-in construction background,
- baked-in title/HUD/dialogue/mission UI,
- extra fingers, fused limbs, malformed hands or tablet,
- portrait/map identity mismatch.

## Acceptance checklist
A final Player pair is accepted only when all are true:
- portrait is WebP with alpha and at least 1024×1024,
- map is WebP with alpha and at least 768×1024,
- same person is immediately recognizable across both assets,
- helmet/vest/tablet survive reduced game scale,
- adult field-professional read is clear,
- no branding or pseudo-text exists,
- no clipping is introduced in title/dialogue/map placements,
- Player is visibly distinct from every other Episode 01 cast member before reading any name label.

## Automated production gate
After both final files are placed at the locked production paths, run:

`npm run assets:production-player-check`

The Player gate passes only when both exact final paths exist and both files are valid WebP assets. It also enforces the minimum portrait/map dimensions above and requires alpha transparency for both files. RC SVG or deterministic fallback art never satisfies this gate and must not be relabeled as final production art.

After the Player gate passes, regenerate the manifest with `npm run assets:manifest`. The existing runtime precedence automatically promotes the final WebP pair over the RC SVG pair without changing gameplay code or asset IDs.

## Production order
1. `player-portrait.webp`
2. visual acceptance against this lock
3. `player-map.webp` derived from the accepted portrait identity
4. `npm run assets:production-player-check`
5. pair consistency / reduced-scale UI check
6. Batch A integration gate
