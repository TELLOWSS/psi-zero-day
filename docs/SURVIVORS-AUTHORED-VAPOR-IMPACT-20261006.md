# Authored pressure-vapor impact

## Scope
Original six-frame pressure release replaces the prior whole-stamp/fragment contact animation for confirmed GAS_LEAK hits in existing beam/signal/arc paths. Metal and debris keep their own original frame sheets. No weapon physics, HP, boss rules, player gait, equipment animation or audio changes.

Built-in image generation selected edited source `exec-3c59d417-6ef8-42a4-8902-7d1863965b7c.png`, copied unchanged to `public/assets/survivors/vapor-impact-sequence-v1.png`. First source `exec-37bd68c0-0320-4347-8ed8-ec8d9fcf3ada.png` failed the unchanged >=32px active-alpha cell-margin check and is not referenced by runtime.

## Material and rendering contract
Short pressure snap, asymmetric thick lobes, detached billows, separate curling puffs, thin broken wisps, sparse tail. Turquoise/pale-green volume contrasts with amber metal and ivory concrete. These are genuinely changing silhouettes, not six scaled copies. Generated sheet does not exactly satisfy every requested lobe count or margin; only measured acceptance is claimed.
Shared nonuniform frame timing and final fade; material-specific first/second core origins align to confirmed hit. Normal opacity .75 versus .9 for metal/debris; busy .65. Normal max two raster draws, busy one. One local primary core remains; weapon-specific accent survives. No new fullscreen flash, permanent floor circle, per-frame filtering or pixel reads.
Workers, blocked receipts and reduced motion keep their prior presentation; undecoded assets use the established material rendering. No published code or gameplay behavior is changed by QA fixture injection.

## Generation prompt
Use case: stylized-concept. Original PSI ZERO DAY industrial pressure-vapor impact animation spritesheet for top-down 2.5D action RPG. Exactly1536x1024, six512x512 cells regular3columns2rows, chronological left-to-right then next row. Transparent RGBA, absolutely no opaque background, labels, borders, ground, characters, flames, electric bolts or circular magic symbols. Every visible shape including faint haze confined to x80..432,y80..432 of each cell; generous empty transparent margins. Fixed impact origin cell center256256. Cool turquoise vapor with white short-lived pressure core and pale green shadowed whorls; readable volumetric painterly shapes, not neon outline drawings. Genuinely different successive silhouettes: frame1 small compact triangular white pressure snap centered; frame2 three thick asymmetric short curled vapor lobes pushed out from center, brighter compact core; frame3 core collapses, three lobes tear into separated irregular billows curling outward/upward, transparent holes; frame4 no hot core, six disconnected smaller curling vapor puffs further apart, no continuous ring or filled cloud; frame5 thin broken elongated wisps moving sideways and rising, large empty center, dim; frame6 only two sparse faint ragged wisps far from center, no core. Coherent flow from expansion into breakup and dispersal, not one scaled stamp repeated. Rich material painted volume, strong contrast at ignition, understated transparent tails. Original artwork, no copies of other games.

## Targeted edit prompt
Preserve six distinct chronological shape changes, turquoise volumetric material and transparency. EXACT1536x1024,3x2 cells512square. Only fix framing: reduce ALL painted content in each cell by about30percent around origin256256, so all visible vapor including faint glow stays inside local coordinates x80..432,y80..432, leaving completely transparent clear margins. Do not keep current oversized lobes. Initial pressure core must align exactcellcenter256256 in frames1 and2. Keep six stages ignition, thick asymmetric lobes, breakup, detached puffs, thin broken wisps, two faint ragged tail wisps. Do not add text, borders, floor, opaque background, circles, flames or lightning. Genuine RGBA transparency.

## Verification
Selected RGBA sheet is 1536x1024, 1,779,704 bytes. All six cells pass nonblank, distinct-frame, transparent-corner and >=32px active-alpha margin checks. Focused tests passed; full suite: 1,437 passed, one skipped. Production build and TypeScript checks passed. Existing shooting chunk size warning above 500kB remains.

Controlled production-renderer contact gallery: all 15 material/time samples nonblank, one primary core per contact. Playback fixture: 330 samples, 313 distinct pixel states, exactly one paused state, no browser errors. These are animation checks, not device FPS measurements.

Actual game renderer with QA-injected stationary contacts passed 1440x900, 390x844 and 844x390 viewports without errors or horizontal overflow. Authored vapor draw counts were 258, 354 and 172 respectively; metal and debris also rendered in every viewport. QA injection is not shipped gameplay and does not replace long unmodified combat review.

Evidence: `artifacts/vfx-composition/contact-timeline.png`, `artifacts/material-playback/material-motion.webm`, `artifacts/material-playback/report.json`, `artifacts/premium-visibility/390x844-actual-game.png`, `artifacts/premium-visibility/report.json`. Contact timeline and portrait game capture visually inspected for material distinction, contact alignment and clipping.

## Remaining quality work
Full equipment-specific frame animation and alternating-foot walk art remain outstanding. Sampled pixel changes, shader-free bounded draws and desktop mobile viewports are not a cinematic visual lock or S26 Ultra frame-pacing proof. Long unmodified combat review and physical-device performance are still required.

All changes local only. GitHub/Vercel synchronization remains stopped.
