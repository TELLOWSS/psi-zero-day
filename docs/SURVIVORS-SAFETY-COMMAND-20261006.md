# Safety monitor command animation

## Production integration

`public/assets/survivors/safety-command-v1.png` adds eight radio push-to-talk poses to the canonical safety monitor (display name: safety patrol / 안전감시단). Gameplay and fitting share the sheet, normalized by support boot to 256px body height. The neutral supplies the walking rig. Head/PPE above y=.15 and lower body below y=.47 retain canonical pixels; the authored command region supplies radio, wrist and clipboard. Character-specific hips, knees, ankles and sole positions follow the new neutral. Per-frame radio/glove occluders follow the hand in front of chest equipment; the clipboard-side occluder uses a stable region.

All six canonical characters now have their own eight-pose command assets. Park and Jung share their actual Kang/player identities. The separately illustrated legacy Yoon actor is not replaced without matching art. This does not mean every direction or action has bespoke animation. No gameplay, economy, progression or audio rules changed.

## Asset / generation prompt

The built-in generator referenced `public/assets/survivors/safety-monitor-v2.webp`. Selected output was copied from `$CODEX_HOME/generated_images/01a1002a-207a-7242-a0aa-73c7b743c706/exec-afc5780d-5544-4964-82cc-0b89c1a8def1.png`. Original output is retained outside the repo; the raster is not programmatically edited.

Prompt brief: preserve the Korean safety monitor's identity, plain white helmet/chin strap, lime reflective vest, navy workwear, gloves and black/blue boots. Retain a black radio in screen-left hand and clipboard in screen-right hand. Produce a rigid transparent 4x2 sheet with eight full-body poses: neutral, wrist lift, inward rotation, maximum lift below chin, release, halfway down, near-neutral and settling. Keep head/body/legs/boots and clipboard stable, fixed camera/scale, generous transparent gutters, no scenery/text/shadows or invented equipment. The generated spacing remains tighter than requested and registration variations are stabilized by runtime compositing.

## Verification

Full suite: 1,364 passed, one skipped. Typecheck and production build passed. Command-cast browser verification covers all six canonical actors' registered frames, eight distinct composites, identical protected head/lower-body pixels, both facings and walking gear. Fitting verification exercises Kang, Lim, Yoon, Lee and safety monitor at desktop 1440x900, portrait 390x844, landscape 844x390 and compact landscape 568x320. It checks animated frames, pause, reduced motion, exact per-character sheet loading, no horizontal overflow and no browser errors. Local screenshots and JSON reports remain under `artifacts/command-cast`.

## Director review / TODO

Encounter regression also passed desktop, portrait and landscape: boss arrival/core locks/secured handoff, four boss effect renders, all nine character/alias carried-tool renders and soundtrack continuity without audio failures.

Review the monitor's radio grip, wrist timing and equipment overlap. This is not final cinematic quality approval. Source pose spacing is uneven; runtime registration does not replace a full animation art review. True front/back/eight-direction sheets and additional authored action sequences are still outstanding. Left/right currently mirror one camera view. The separately illustrated legacy Yoon remains on its original rig.
