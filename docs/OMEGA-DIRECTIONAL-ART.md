# OMEGA v0 eight-direction turnaround — production handoff

**Current artifact:** A 1536×1024, 4×2 generated turnaround, transparent RGBA source. Each figure is extracted into 384×512 PNG and WebP, and arranged into 3072×512 **8×1 directional reference atlas**, plus a turntable review GIF and QA report.

**Important:** The pack is a review deliverable supplied in the conversation, **not installed in this repository**. It is not a playable motion atlas and cannot be deployed to production by adding only its metadata.

## Consistency review
The current live RE:IGNITION heroine is the canonical character. Preserve the light silver-white ponytail and bangs, amber goggles, safety-identity yellow/gray/white jacket over dark fitted tactical suit, radio, gloves, pouch and boot position. Newly generated marketing posters elsewhere in the conversation are not approved source art.

Prototype includes E, SE, S, SW, W, NW, N and NE reference images. **NE is a temporary horizontal mirror of the NW candidate**: shoulder radio / belt / reflective stripes are not directionally authentic. A unique original rear-right render, correct left-right equipment asymmetry, proper hip/foot registration and final art-direction signoff are required.

## Frame production and workflow
- Re-render and approve unique NE; reconcile identity, field PPE and gear asymmetry across all 8 directions.
- Draw a true 8×6 contact-motion atlas (idle, pivot, four gait phases), body height and pelvis anchor consistent. Do not get a 6-frame gait by repeating a single pose or shifting the image.
- Draw 8-direction action atlases with wrist/hand weapon connections: attack, combo, dash, hit, knockdown, recovery, ultimate, victory, defeat.
- Supply indexed sockets for head/chest/back/belt/wrists/knees/feet and occlusion masks. Update `src/ui/survivors-directional-art.ts` and the authored layout. Verify `SurvivorsFittingPreview`, carried equipment, muzzle origins, shadow and head continuity.
- Preserve the existing `CharacterId` gameplay stats and hit boxes, wallet and progress until full tests. Do not mark playable based on unlock records alone.
- Run `node scripts/check-omega-operator-art.mjs --release`: it must be green **only after** every authentic gameplay art atlas and anchor file is installed. Current v0 prototype should fail, which is expected.
- Test 390×844, 844×390, 1024×768 and 1440×900; verify 8-direction turning, 3D camera mimic, feet and hair inertia, equipment overlap, device memory, reduced-motion, save/load and master unlock.
- When the full asset package is added to the branch, use GitHub CI + Preview READY before presenting a production-ready playable character.

## Traceability
See `content/art/omega-prototype-8dir-v0.json` for exact source-cell-to-engine-heading mapping. The generated chat ZIP contains `qa-report.json` and a local `omega-review-check.mjs` that validates dimensions and alpha and intentionally fails `--release`.
