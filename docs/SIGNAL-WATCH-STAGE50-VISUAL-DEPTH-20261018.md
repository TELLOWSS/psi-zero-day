# Signal Watch — STAGE 01–50 perceived visual depth pass (2026-10-18)

## IMPLEMENTED
- Applies to the existing fifty stage IDs through a shared runtime renderer; no stage, collision, save, progression or combat balancing changes.
- Retains all fifty unique authored raster floor assets. Contrast/saturation/brightness are graded per stage/detail tier during real floor draw; the original binaries remain unchanged.
- New bounded, offscreen-cached distance/midfield/near-ground exposure pass with six existing environment light families, preserving hazard telegraph readability.
- Retains one essential world-positioned boot/contact shadow at **low** quality; real equipment cast and actor fill remain enabled whenever the player has selected lighting, while the expensive dynamic ambient lighting still drops at low tier.
- Default and close viewport gain a modest 5.5% focus zoom; user-selected wide mode is unchanged.
- Confirmed non-worker projectile impacts receive a fast ground-plane contact ring before optional cinematic VFX can short-circuit, including crowded/low-quality frames. Reduced motion uses a static, quieter contact; no extra physical impacts or gameplay events are created.

## FILES
- `src/ui/survivors-workface-depth.ts` — cached presentation depth and persistent foot shadow.
- `src/ui/PatrolSurvivorsGame.tsx` — stage renderer integration, grade and camera.
- `src/ui/survivors-scene-lighting.ts` — stronger physically placed equipment shadows.
- `src/ui/survivors-projectile-feedback.ts` — confirmed impact readability.
- `tests/survivors-workface-depth.test.ts` — fifty-stage low/high contract and cache.
- `tests/verify-survivors-stage50-visual.mjs` — browser stage/depth verification at real launch.
- `.github/workflows/verify-signal-watch-stage50.yml` — full regression and 4 device viewport image capture matrix.

## TEST
- PR CI should run `npm test && npm run typecheck && npm run build`, all 50 stages across 1440×900, 390×844, 844×390, 1024×768, normal/reduced motion, sampled low quality and crowded phone simulations.
- CI is not equivalent to physical Android thermals, FPS, visual director approval, or natural play-through victories.

## TODO
- This phase does **not** manufacture or art-direct fifty new foreground cutouts, 3D environments, animation sheets or premium character frames. Those require authored asset-specific art passes, masks/anchor approval and Android field capture.
- Production-quality foreground occlusion based on geometry, material-specific high-fidelity contact art, and final-art signoff remain separate from this **runtime depth integration**.
- Visual review should use before/after captures of same stage, camera, seeded threat and quality tier; revise intensity if readability is compromised.

## DIRECTOR REVIEW
- Scope authorized: visibly strengthen the existing 50-stage Signal Watch rather than repeat imperceptible lighting refinements. Safe gameplay/record boundaries stay locked.
