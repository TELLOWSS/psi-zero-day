# TASK-014C — Growth variants + final commercial asset pass

Status: **IN PROGRESS — growth presentation implemented, production WebP gate implemented, final media still pending**

## Implemented

- Character growth remains presentation-only and uses authored `initial / focused / skilled` stages.
- Apparent chronological age and character identity stay fixed at every stage.
- Growth is communicated through confidence, framing, equipment organization and professional-read cues rather than wrinkles, grey hair or older facial structure.
- `art-slice-014c.css` adds restrained visual differentiation for the three stages and keeps small Android landscape layouts compact.
- Existing art precedence remains `final WebP -> RC SVG -> deterministic SVG fallback`.
- A strict production-art gate now verifies that all 17 final image slots exist as actual WebP files before commercial release:
  - 1 foundation map
  - 8 character portraits
  - 8 character map pieces
- `npm run assets:production-check` checks exact production files only; RC/fallback assets are intentionally not accepted by this gate.
- `npm run release:production-check` runs the strict art gate before the existing full release verification.
- The normal development/CI path still permits RC/fallback art so gameplay work is not blocked before the final art files land.

## Final production paths

Background:
- `public/assets/episode01/backgrounds/foundation-map.webp`

Characters use these stable pairs:
- `player-portrait.webp` / `player-map.webp`
- `kang-taesik-portrait.webp` / `kang-taesik-map.webp`
- `yoon-sungho-portrait.webp` / `yoon-sungho-map.webp`
- `lee-jaehoon-portrait.webp` / `lee-jaehoon-map.webp`
- `lim-junho-portrait.webp` / `lim-junho-map.webp`
- `choi-minseok-portrait.webp` / `choi-minseok-map.webp`
- `seo-jeongmin-portrait.webp` / `seo-jeongmin-map.webp`
- `oh-seungjae-portrait.webp` / `oh-seungjae-map.webp`

## Non-negotiable visual rules

- Same person and same apparent age at all growth stages.
- No fantasy armour, aura, magical power-up or age transformation.
- Preserve each character's silhouette, face proportions, body type and signature role prop.
- Growth may add only plausible field equipment, better organization, stronger posture/expression and role-specific communication/leadership cues.
- Final art must remain legible at map scale and portrait scale independently.
- No real company/site logos or pseudo-text on helmets.

## Still pending before TASK-014C is complete

1. Land the 17 approved commercial-quality WebP files at the exact paths above.
2. Run `npm run assets:production-check` and require PASS.
3. Rebuild the manifest so the resolver automatically selects WebP rather than RC SVG.
4. Replace procedural/temporary audio only when final BGM, ambience and SFX files are approved for scene fit.
5. Run the full `npm run release:production-check` gate.

No `src/engine/**` change is required for this task.
