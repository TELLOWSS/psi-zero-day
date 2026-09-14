# TASK-010D — Production Art Integration

## Goal

Move Episode 01 away from CSS-only placeholder people/map without reopening the visual direction debate.

The approved target remains a commercial casual-strategy construction game: friendly 2.5D construction diorama, attractive but adult-readable cast, clear silhouettes, clickable field objects and clean mobile HUD.

This task adds an implementation-ready vector production pass so the game can use real image assets now. It does **not** redefine the final painted/3D-quality target.

## Art hierarchy

1. Final exported WebP art, when present.
2. Generated deterministic SVG production art.
3. CSS silhouette/map fallback only if neither asset resolves.

The final WebP paths already authored in `visuals.json` remain unchanged. `build-episode01-assets.mjs` first looks for those WebP files and only falls back to a matching SVG path when the WebP is absent.

## Generated art

`scripts/generate-episode01-vector-art.mjs` writes:

- 8 portraits, 512×512.
- 8 full-body map sprites, 320×480.
- 1 Foundation construction-site background, 1920×1080.

Cast identity remains separated through body shape + helmet/outfit + face cue + signature prop:

- Player: female safety manager, white/blue helmet, tablet.
- Kang Taesik: stocky veteran, orange helmet, moustache, work glove.
- Yoon Sungho: broad rebar foreman, yellow helmet, rebar.
- Lee Jaehoon: slim young construction assistant manager, white/navy helmet, drawings.
- Lim Junho: small young worker, yellow helmet, green vest, radio.
- Choi Minseok: lean signalman, orange helmet/vest, dual signal batons.
- Seo Jeongmin: formal inspector, white helmet, glasses, clipboard.
- Oh Seungjae: broad GC construction manager, white/navy helmet, phone.

No real company logos and no pseudo lettering are placed on helmets.

## Build pipeline

`npm run dev`, `npm test` and `npm run build` now run the visual generation + asset manifest step first.

Available scripts:

- `npm run assets:vector`: generate SVG production art.
- `npm run assets:manifest`: register actual files/hashes in `content/episode01/assets.json`.
- `npm run assets:check`: verify generated SVGs and manifest match their deterministic sources.

Generated SVG files are ignored by Git because the script is their source of truth. The manifest is committed so the content registry remains self-describing.

## Runtime result

The existing `StrategyVisualAssets` resolver now receives registered image URIs for all eight characters and the Foundation map. StrategyMapShell therefore enters `data-visual-mode="art"` instead of CSS mode during a normal generated build.

Map characters use full-body art with larger visual presence and hover/focus lift. Dialogue cards use the same portrait asset IDs.

## Validation

`tests/strategy-assets.test.ts` verifies:

- 17 image assets are registered.
- Foundation background resolves to generated SVG in the current production pass.
- all eight characters resolve both map + portrait art.
- final WebP resolver compatibility remains intact.
- missing assets can still fall back cleanly.

## Visual quality boundary

The vector pass is deliberately cleaner and more character-specific than the old CSS figures, but it is **not the final commercial-art sign-off**. The approved reference quality remains mandatory. During Episode 01 polish, final painted/3D WebP exports replace these SVGs through the same IDs, without changing engine rules, events, placement logic or UI wiring.

## Engine boundary

No `src/engine/*` files are changed. This task is asset generation, manifest, UI presentation and verification only.
