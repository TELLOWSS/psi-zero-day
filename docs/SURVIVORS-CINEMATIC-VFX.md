# Cinematic equipment VFX integration

Feedback source: player-supplied mobile captures 87715 / 87713, reviewed inline on 2026-10-04. Paid broadcast equipment had a tiny attached product icon, while evolved drone fire still read as thin white lines. Premium ownership was passed to stats and shop art, but not the flight/contact renderer. This was an integration and art-direction gap, not proof that the current Canvas renderer cannot improve.

## Delivered scope

A dedicated transparent 4×3 optical-material atlas replaces beam/signal wire art when loaded. At the existing device-pixel-ratio rendering resolution, flight uses a colored filament wake and pressure head. Level tiers increase visible envelope size; equipped communication/tempo gear changes palette and premium envelope. Broadcast crown / voice lens use gold, command array cyan, tempo equipment violet. Unequipped max hunter beams remain violet and max drone beams cyan. Impact and ignition use the same palette from the actual equipped loadout, preventing a separate unconnected premium system. Raster contact replaces the old white cross instead of stacking on it.

Actual engine launch / impact / release events drive feedback. Worker receipt remains a quiet green check; no impact blossom or sparks are added to a person. No collision radius, damage, cooldown, XP, resource or progression rule changes.

Equipped presence: communication emitter/floor signature; violet cadence arcs; actual pickup-range scan; mobility wake only while moving; shield texture only with remaining shield; recovery texture only while recovering missing HP; tactical floor marks. Existing player sprite and shoulder module remain the wearable base. Max drones gain violet thruster emissions. This is not a replacement full-body character rig or a new 3D world.

HUD: a compact equipped badge joins the health row. A separate status row appears only when shielding actually needs a remaining-capacity/cooldown indicator, removing the mostly empty row in the supplied broadcast-only captures.

## Assets and prompt

Built-in image_gen created the transparent atlas. Runtime asset: `public/assets/survivors/cinematic-vfx-v1.webp`; 1448×1086, 793456 bytes, preserved RGBA transparency, WebP quality 91. SHA and layout: `content/art/survivors-cinematic-vfx-v1.json`. No asset lives only at a temporary source path.

Final generation prompt: transparent production VFX atlas for PSI ZERO DAY construction-safety science-fiction action; exactly four columns × three rows with equally sized cells, no text/UI/objects/people/guns. Cinematic colored optical volume, fine sparks and glowing filaments, small hot white core, rich surrounding gold/cyan/violet. Row 1: gold ignition, cyan ignition, violet ignition, cyan hexagonal shield ripple. Row 2: gold communication pressure front, cyan plasma ribbon bolt, violet plasma ribbon bolt, orange material impact fan. Row 3: gold optical impact, cyan optical impact, violet optical impact, calm mint recovery halo. Rightward flight/ignition orientation; smooth transparent falloff, distinct materials, no opaque disks or icons in boxes.

`docs/PSI-CINEMATIC-VFX-REVIEW.webp` compares previous max drone / current max drone / premium broadcast using the actual game drawing functions, a shared projectile fixture and 2.4× detail scale. Generated through native Canvas rendering, not edited from the user's image or represented as a browser/Android screenshot.

## Performance and limits

One atlas instance is loaded and reused. Flight adds one raster stamp rather than constructing many gradient/blur objects. Screen blending preserves color instead of adding every luminous layer to white. Decorative cinematic flight is capped at 64 projectiles per frame; the existing bounded contact pool remains 64. Crowded frames reduce width/opacity. Reduced motion removes expanding contacts and moving decorative wakes, keeping a compact static projectile. No fullscreen flash or continuous live shadowBlur/filter is introduced.

Primary API references: MDN Canvas optimization (https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) and compositing (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation). These document reusable rendering and blend modes, not a promise of commercial visual quality or frame rate.

Validation: 1157 passed / 1 skipped; typecheck and production build passed. Native Canvas comparison inspected. Tests verify actual premium palette, meaningful tier/envelope difference, reduced/crowded behavior, confirmed non-worker contact, old-wire replacement, context restoration and immutable simulation state. Browser visual and actual Android crowded-scene FPS remain pending. Complete cinematic quality also depends on character animation, environment assets, camera, lighting and sound and has not been declared locked by this VFX change.
