# Signal Watch — common graphics standard across STAGE 01–50

## IMPLEMENTED

Apply the STAGE 01 live-pose cast shadow, existing foot contact/lock and static actor fill to all fifty existing workfaces. Preserve all fifty distinct floor binaries, coordinates and authored stage content. Six restrained lighting palettes match foundation, excavation, open daylight, winter, interiors and industrial rooms. The baked floor bounce and actor fill share a tint; real equipment shadows follow the same key direction. Flat puddles and crane warning zones do not cast false solid-equipment shadows. Inspection beams retain more strength in enclosed workfaces and less over bright concrete. Low quality and lighting-off retain the existing contact rendering while omitting the extra ambient/cast-shadow pass. Reduced motion retains static light without adding animated effects.

No engine, reward, difficulty, save schema, unlock, growth, collision, camera or HUD changes. Existing animation sheets and stage art are reused. This does not claim fifty newly painted backgrounds, new character animations, a foreground-layer reconstruction or an Android hardware performance lock.

## FILES

- `src/ui/survivors-stage-light.ts`: complete fifty-stage palette mapping.
- `src/ui/survivors-scene-lighting.ts`, `src/ui/PatrolSurvivorsGame.tsx`: consistent world/actor/equipment lighting.
- `tests/survivors-stage-light.test.ts`, `tests/verify-survivors-stage50-visual.mjs`: coverage, geometry and runtime evidence.
- `.github/workflows/verify-signal-watch-stage50.yml`: four-view matrix with independent capture artifacts and full regression/build job.
- `scripts/verify-survivors-mode-previews.mjs`: repair historical locked-preview assertions to test the current live Guard/Story entry contract, retaining decoded card-art and Watch launch/exit checks.

## TEST

STAGE 01 gate at `9aad23e`: CI typecheck/full regression/build and eight viewport/motion variants plus two synthetic crowds passed (workflow 39110141817). The next legacy smoke failed because it still expected a locked preview dialog even though Guard and Story are live modes. This is repaired in the script above, not reported as an existing green workflow.

Current fifty-stage scope: 53 focused tests and typecheck passed locally. Complete four-view browser matrix, low quality, synthetic crowds, regression/build and current preview results must be recorded after execution. Browser save fixtures seed credits/upgrades/stars/unlocks and assert those values remain unchanged through render/start/pause; existing tests cover sequential unlock and growth recovery. Fixture captures are not fifty natural victories.

The runtime matrix opens each stage through the real hub and launch controls. Each stage is captured in normal and reduced motion at 1440×900, 390×844, 844×390 and 1024×768: 400 planned stage/viewport/motion cases. It checks the actual floor drawn to canvas, current profile/shadow, existing authored contact stretch, horizontal overflow, browser exceptions and seeded save integrity. Low-quality representative cases additionally verify optional shadows are omitted. Synthetic crowds use STAGE 03/05/50 on phone orientations, sample peak hazard/projectile counts, and verify movement; naturally resolved hazards need not remain alive at the end of the sample.

## TODO

Record the latest commit-scoped CI and Preview outcome; inspect capture sheets. Physical Android frame times, heat and touch input are not established by Chrome viewport tests.

## DIRECTOR REVIEW

The user explicitly authorized merging GitHub main at 17:18 KST on October 18. Complete the requested technical and visual regression checks, then merge PR #211 and verify the resulting deployment. This supersedes the earlier draft-only instruction. The user's all-fifty rollout instruction authorizes this implementation; it is not evidence of final art approval or a reason to label unfinished source-art work complete.
