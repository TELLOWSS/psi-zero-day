# PSI Industrial Action Art

## Direction

Reference action-game principles, not a franchise's proprietary artwork: clear silhouette, compact contact core, strong anticipation/contact/release rhythm, distinct materials. PSI's identity is grounded construction equipment, hazard stripes, inspection light and safe control. Workers receive instruction and rescue, never violent hit sparks.

## Implemented Production Slots

- One RGBA six-cell atlas replaces regular carts, reinforced carts, falling concrete and gas shapes. Cable carts belong to data-center workfaces; reinforced carts retain their existing engine variant. Single and split vapor have different silhouettes. Pulsing gas animation follows the existing variant, with reduced-motion support.
- One RGBA six-cell contact atlas distinguishes metal, concrete and vapor, with regular and critical contacts. Engine events now carry the actual hazard type. No inferred target, fabricated hit, new attack range, HP buff, hit-stop or simulation delay.
- Material contacts apply to signal/beam/arc weapons only. Powder, frost, cones and barriers retain their existing weapon-specific materials; launch and flight identities remain unchanged.
- Existing warnings, health indicators, control rings, crate/boss rig and worker sprites remain. Each texture is loaded once and alpha-trimmed through the existing prop cache. No per-frame image processing. Contacts replace rather than stack the old contact renderer. Existing bounded 64-effect pool and busy/reduced-motion limits remain.

## Asset Provenance

Built-in image generation, original PSI-directed hand-painted 2.5D art. No downloaded franchise sprites. 1536x1024 RGBA originals preserved in the Codex generated_images directory.

- Hazards selected original: `exec-57d3ed0d-8d6c-4afb-8611-01930af1bded.png` (six equal cells; transparent background correction of `exec-f8d01263-0e2e-4c97-8d2c-c50f4db70f8d.png`). WebP quality 90, 520170 bytes.
- Contacts selected original: `exec-55a46dd6-2b41-4af6-89c8-323a60f1274a.png`. WebP quality 90, 544558 bytes.
- Art briefs: yellow concrete transport; red/white roll-cage reinforcement; blue cable service cart; fractured rebar concrete; amber single vapor core; turquoise split vapor cores. Contact materials: angular amber metal splinters, pale concrete flakes/dust, torn cyan vapor ribbons. No people, faces, text, logos or blood.

## Verification And Remaining Gates

Pure identity selection and actual engine event attribution are tested. Browser verification uses explicitly constructed hazard/contact fixtures, not natural-play completion. Director visual lock is not implied by passing tests.

Verified: 1290 regression tests passed, one pre-existing skip; typecheck and production build passed. Desktop 1440x900, portrait 390x844, landscape 844x390: no page errors/overflow, alpha transparency confirmed, all six contacts produced nonzero pixels. Gameplay and native-size contact screenshots inspected. The verification script is `scripts/verify-survivors-industrial-art.mjs`.

Remaining: multi-frame authored vehicle/debris animations and more distinct boss art, natural-play effects density, low-end physical-device FPS, character/enemy palette coherence review. These require finished art, not new geometric stand-ins. Existing five hazard types remain five behavior families; visual variants are not new enemy AI.
