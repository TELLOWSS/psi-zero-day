# TASK-016B — Final Production WebP Replacement

Status: IN PROGRESS

## Objective

Replace the Episode 01 release-candidate/fallback art with final commercial WebP media without changing engine rules, event content, asset IDs, or runtime asset precedence.

The locked visual target is an adult-friendly casual-strategy 2.5D construction-site diorama. Final media must remain readable at actual in-game scale and preserve construction-role/PPE differentiation.

## Locked asset contract

Exactly 17 final WebP files are required.

### Foundation background — 1

- `public/assets/episode01/backgrounds/foundation-map.webp`

### Character portrait/map pairs — 16

- `player-portrait.webp`
- `player-map.webp`
- `kang-taesik-portrait.webp`
- `kang-taesik-map.webp`
- `yoon-sungho-portrait.webp`
- `yoon-sungho-map.webp`
- `lee-jaehoon-portrait.webp`
- `lee-jaehoon-map.webp`
- `lim-junho-portrait.webp`
- `lim-junho-map.webp`
- `choi-minseok-portrait.webp`
- `choi-minseok-map.webp`
- `seo-jeongmin-portrait.webp`
- `seo-jeongmin-map.webp`
- `oh-seungjae-portrait.webp`
- `oh-seungjae-map.webp`

Do not rename these files or create a second production-art path. Existing asset IDs and fallback order remain authoritative:

`final WebP -> hand-authored RC SVG -> deterministic SVG`

## Production gate

`npm run assets:production-check` must reject:

- any missing final slot,
- any non-WebP file in a production slot,
- malformed/unreadable WebP media,
- portrait art below `1024 x 1024`,
- map-character art below `768 x 1024`,
- any production set that is not exactly 17 slots.

After all 17 files are accepted, run:

- `npm run assets:production-check`
- `npm run release:production-check`

## Visual acceptance rules

1. Portrait and map art for the same character must immediately read as the same person.
2. Every character must remain distinguishable by silhouette plus at least two of face, outfit, prop, or posture before reading a name label.
3. Helmet color alone must never be the only differentiator.
4. No real company logo, pseudo text, or meaningless lettering is allowed on helmets.
5. The Player uses the approved white helmet with a simple blue PSI-style stripe, not text lettering.
6. PPE and trade details must remain plausible for a Korean construction-site setting while staying within the approved stylized casual-strategy art direction.
7. Character art should use transparent background so map placement and title composition remain reusable.
8. Final art must not be mislabeled from RC/fallback media.

## Batch order

### Batch A — Title + first-play visual lock — 7 assets

These assets affect the commercial title screen and the earliest playable impression first:

- `foundation-map.webp`
- `player-portrait.webp`
- `player-map.webp`
- `kang-taesik-portrait.webp`
- `kang-taesik-map.webp`
- `lim-junho-portrait.webp`
- `lim-junho-map.webp`

Batch A acceptance checks:

- title composition remains readable at 16:9,
- Player / Kang Taesik / Lim Junho are visibly different at a glance,
- portrait/map identity remains consistent,
- safety helmet/PPE silhouette remains readable at reduced map scale,
- no dialogue/HUD clipping is introduced by replacement media.

### Batch B — Remaining cast — 10 assets

- Yoon Sungho portrait/map
- Lee Jaehoon portrait/map
- Choi Minseok portrait/map
- Seo Jeongmin portrait/map
- Oh Seungjae portrait/map

Batch B acceptance checks:

- Kang Taesik vs Yoon Sungho do not converge into the same veteran-foreman silhouette,
- Lee Jaehoon vs Lim Junho remain distinct in age/body proportion and prop,
- Seo Jeongmin vs Oh Seungjae remain distinct despite both using white helmets,
- Choi Minseok's dual signal batons remain legible at map scale.

## Out of scope

TASK-016B does not change:

- Episode 01 story/events,
- PSI formulas or thresholds,
- economy balance,
- game-state/domain rules,
- BGM/ambience/SFX,
- Android signing/store rollout.

Those remain separate tasks.

## Completion condition

TASK-016B is complete only when all 17 final WebP assets are present, the production-art gate passes, the full release-production check passes, and the browser title/gameplay screens use those final media through the existing asset system.
