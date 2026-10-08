# Workface threat production — 2026-10-09

50 unique authored ordinary risk identities, one per stage, mixed with the existing nine material silhouettes. They share existing cart/vapor/fall mechanics rather than introducing fifty independent AI rule sets. Humans remain workers; dedicated bosses and signature encounters retain their art and rules.

Runtime atlas files: `public/assets/survivors/workface-threats-1-v1.webp` through `workface-threats-5-v1.webp`. Ten slots per atlas in 2 columns × 5 rows, read through baked per-object source rectangles in `content/art/survivors-workface-crops-v1.json`. Uniform grid cropping was rejected: generation retained nonuniform row spacing. The source rectangles follow empty alpha valleys independently per column, preserve every complete silhouette, and the existing loader gives each normalized frame four pixels of padding. No source pixels are repainted or erased. At most two regional atlases retained; preflight preloads the chosen stage. Alpha scanned once per image on load, never per frame. New props are selected for two of each three eligible entity sequence IDs, leaving existing variants in the mix.

Natural motion: grounded chassis suspension follows actual travelled distance; parked and warning carts do not bounce. Vapor has bounded slow asymmetric breathing. Debris rotation follows the existing fall timer and stays at its locked landing point. Reduced motion freezes these art deformations. No health, speed, collision, telegraph duration, damage or save-ID changes.

Localized names and counterplay live in `content/localization/survivors-workface-threats-ko.json`; exact stage/family/cell mapping and subjects are in `content/art/survivors-workface-threats-v1.json`. Names appear in stage briefing and only with low crowd or the closest warning, to prevent labels swamping mobile play.

All fifty raster slots must pass complete-alpha/gutter checks; their hazard families must actually occur in the stage hazard mix. Browser QA covers selection/load across all fifty stages and representative actual gameplay captures, in addition to the existing six-viewport touch/stress/settings checks and full boss/worker/equipment art regression. Fixtures do not claim natural clears or physical hardware FPS.

## Image generation prompt set
Built-in image generation, never CLI. First candidates were rejected because row gutters intersected silhouettes. Spacing-only edits preserve the subjects and materials.

### Atlas 1

Use case: stylized-concept. Asset type: FINAL transparent runtime sprite atlas for PSI ZERO DAY, a grounded construction safety action game. Draw ten distinct industrial risk sprites, not characters or monsters. Portrait canvas around 1024x1536. EXACTLY 2 columns by 5 rows of equal rectangular cells. Each object isolated, centered in its own cell, complete and never crossing a cell boundary; leave minimum 35px transparent gutter at every cell edge, occupy at most 75% cell width and 75% cell height. Draw each list item exactly once in reading order. No dividers, labels, text, numerals, logo, UI, background, checkerboard or floor, no painted shadow.
Style: polished realistic isometric painted 3D game prop sprites, clear bold silhouette readable at 50px, plausible industrial hardware with crisp materials and restrained surface wear, consistent elevated 3/4 camera and upper-left soft light. Wheeled transporters face lower-left with wheels in a plausible ground plane, 4 wheels unless explicitly 2-wheel. Vapor objects are genuinely translucent softly painted clouds with definite differing contours, no solid container underneath. Falling objects are suspended isolated clusters with clear material silhouettes. Non-vapor steel and concrete should be fully opaque. Keep all fine protrusions complete inside the cell. No people, monsters, faces, eyes, fantasy weapons or text. TRUE TRANSPARENT RGBA background.
Cell 1, row 1, column 1: yellow two-wheel trolley carrying a strapped orange closed industrial drum.
Cell 2, row 1, column 2: low rusty four-wheel muck hopper loaded with dark soil.
Cell 3, row 2, column 1: one silver rectangular aluminum formwork panel with stiffening ribs.
Cell 4, row 2, column 2: warm pale amber vapor plume with three stacked rounded billows.
Cell 5, row 3, column 1: icy cyan refrigerant cloud with a low branching fork silhouette.
Cell 6, row 3, column 2: pale olive vapor curling into a thin tall corkscrew.
Cell 7, row 4, column 1: loose cluster of red broken bricks and mortar chunks.
Cell 8, row 4, column 2: two offset thick steel gusset plates with bolt holes.
Cell 9, row 5, column 1: small gray four-wheel trolley carrying a round silver ventilation elbow.
Cell 10, row 5, column 2: compact black battery module strapped on a low blue wheeled transport platform.

### Atlas 2

Use case: stylized-concept. Asset type: FINAL transparent runtime sprite atlas for PSI ZERO DAY, a grounded construction safety action game. Draw ten distinct industrial risk sprites, not characters or monsters. Portrait canvas around 1024x1536. EXACTLY 2 columns by 5 rows of equal rectangular cells. Each object isolated, centered in its own cell, complete and never crossing a cell boundary; leave minimum 35px transparent gutter at every cell edge, occupy at most 75% cell width and 75% cell height. Draw each list item exactly once in reading order. No dividers, labels, text, numerals, logo, UI, background, checkerboard or floor, no painted shadow.
Style: polished realistic isometric painted 3D game prop sprites, clear bold silhouette readable at 50px, plausible industrial hardware with crisp materials and restrained surface wear, consistent elevated 3/4 camera and upper-left soft light. Wheeled transporters face lower-left with wheels in a plausible ground plane, 4 wheels unless explicitly 2-wheel. Vapor objects are genuinely translucent softly painted clouds with definite differing contours, no solid container underneath. Falling objects are suspended isolated clusters with clear material silhouettes. Non-vapor steel and concrete should be fully opaque. Keep all fine protrusions complete inside the cell. No people, monsters, faces, eyes, fantasy weapons or text. TRUE TRANSPARENT RGBA background.
Cell 1, row 1, column 1: bundle of green steel shoring U-heads with threaded stems.
Cell 2, row 1, column 2: orange long low trolley with strapped bent rebar rods.
Cell 3, row 2, column 1: small red wheeled concrete hopper with funnel and attached short hose.
Cell 4, row 2, column 2: one yellow triangular steel gangform bracket with plate and gusset.
Cell 5, row 3, column 1: short stack of galvanized perforated scaffold decks.
Cell 6, row 3, column 2: weathered green four-wheel trolley carrying strapped gray concrete blocks.
Cell 7, row 4, column 1: low broad violet vapor with two thin wisps rising at opposite ends.
Cell 8, row 4, column 2: red low four-wheel A-frame trolley with cream gypsum boards.
Cell 9, row 5, column 1: narrow pale blue upward vapor jet fanning into a flat three-lobe cap.
Cell 10, row 5, column 2: small navy low platform trolley with stacked orange closed steel toolboxes.

### Atlas 3

Use case: stylized-concept. Asset type: FINAL transparent runtime sprite atlas for PSI ZERO DAY, a grounded construction safety action game. Draw ten distinct industrial risk sprites, not characters or monsters. Portrait canvas around 1024x1536. EXACTLY 2 columns by 5 rows of equal rectangular cells. Each object isolated, centered in its own cell, complete and never crossing a cell boundary; leave minimum 35px transparent gutter at every cell edge, occupy at most 75% cell width and 75% cell height. Draw each list item exactly once in reading order. No dividers, labels, text, numerals, logo, UI, background, checkerboard or floor, no painted shadow.
Style: polished realistic isometric painted 3D game prop sprites, clear bold silhouette readable at 50px, plausible industrial hardware with crisp materials and restrained surface wear, consistent elevated 3/4 camera and upper-left soft light. Wheeled transporters face lower-left with wheels in a plausible ground plane, 4 wheels unless explicitly 2-wheel. Vapor objects are genuinely translucent softly painted clouds with definite differing contours, no solid container underneath. Falling objects are suspended isolated clusters with clear material silhouettes. Non-vapor steel and concrete should be fully opaque. Keep all fine protrusions complete inside the cell. No people, monsters, faces, eyes, fantasy weapons or text. TRUE TRANSPARENT RGBA background.
Cell 1, row 1, column 1: flat broad rusty brown low four-wheel trolley loaded with wet dark spoil.
Cell 2, row 1, column 2: olive green low dense fog with a hollow crescent silhouette.
Cell 3, row 2, column 1: small yellow four-wheel skip cart with an angular open steel bin.
Cell 4, row 2, column 2: three cylindrical broken concrete core pieces with rough edges.
Cell 5, row 3, column 1: short dark green hollow steel strut offcut with rusted ends.
Cell 6, row 3, column 2: pale aqua low cloud with two unequal round lobes and tiny curling trails.
Cell 7, row 4, column 1: dark gray low four-wheel metal debris cart with broken tiles.
Cell 8, row 4, column 2: cluster of dark steel anchor plates with protruding anchor bolts.
Cell 9, row 5, column 1: two separate amber curled vapor lobes joined by a thin transparent ribbon.
Cell 10, row 5, column 2: compact orange dewatering pump strapped to a small black wheeled platform.

### Atlas 4

Use case: stylized-concept. Asset type: FINAL transparent runtime sprite atlas for PSI ZERO DAY, a grounded construction safety action game. Draw ten distinct industrial risk sprites, not characters or monsters. Portrait canvas around 1024x1536. EXACTLY 2 columns by 5 rows of equal rectangular cells. Each object isolated, centered in its own cell, complete and never crossing a cell boundary; leave minimum 35px transparent gutter at every cell edge, occupy at most 75% cell width and 75% cell height. Draw each list item exactly once in reading order. No dividers, labels, text, numerals, logo, UI, background, checkerboard or floor, no painted shadow.
Style: polished realistic isometric painted 3D game prop sprites, clear bold silhouette readable at 50px, plausible industrial hardware with crisp materials and restrained surface wear, consistent elevated 3/4 camera and upper-left soft light. Wheeled transporters face lower-left with wheels in a plausible ground plane, 4 wheels unless explicitly 2-wheel. Vapor objects are genuinely translucent softly painted clouds with definite differing contours, no solid container underneath. Falling objects are suspended isolated clusters with clear material silhouettes. Non-vapor steel and concrete should be fully opaque. Keep all fine protrusions complete inside the cell. No people, monsters, faces, eyes, fantasy weapons or text. TRUE TRANSPARENT RGBA background.
Cell 1, row 1, column 1: narrow blue four-wheel trolley with a strapped bundle of square steel tubes.
Cell 2, row 1, column 2: two brown plywood form panels with exposed wooden frame edges.
Cell 3, row 2, column 1: orange metal trolley with distinctive curved U-shaped rebar stirrups.
Cell 4, row 2, column 2: irregular rough gray hardened concrete splatter chunk with pebbles.
Cell 5, row 3, column 1: two short diagonal galvanized scaffold braces crossing with clamp fittings.
Cell 6, row 3, column 2: yellow four-wheel low trolley carrying a blue cylindrical industrial ventilation fan.
Cell 7, row 4, column 1: wide magenta-gray translucent vapor ribbon curling back into a soft hook.
Cell 8, row 4, column 2: light orange low trolley carrying strapped boxes and stacked white ceramic tiles.
Cell 9, row 5, column 1: three silver steel pipe elbows and one short pipe section in a loose cluster.
Cell 10, row 5, column 2: one gray grated steel protective cover plate with a yellow edge strip.

### Atlas 5

Use case: stylized-concept. Asset type: FINAL transparent runtime sprite atlas for PSI ZERO DAY, a grounded construction safety action game. Draw ten distinct industrial risk sprites, not characters or monsters. Portrait canvas around 1024x1536. EXACTLY 2 columns by 5 rows of equal rectangular cells. Each object isolated, centered in its own cell, complete and never crossing a cell boundary; leave minimum 35px transparent gutter at every cell edge, occupy at most 75% cell width and 75% cell height. Draw each list item exactly once in reading order. No dividers, labels, text, numerals, logo, UI, background, checkerboard or floor, no painted shadow.
Style: polished realistic isometric painted 3D game prop sprites, clear bold silhouette readable at 50px, plausible industrial hardware with crisp materials and restrained surface wear, consistent elevated 3/4 camera and upper-left soft light. Wheeled transporters face lower-left with wheels in a plausible ground plane, 4 wheels unless explicitly 2-wheel. Vapor objects are genuinely translucent softly painted clouds with definite differing contours, no solid container underneath. Falling objects are suspended isolated clusters with clear material silhouettes. Non-vapor steel and concrete should be fully opaque. Keep all fine protrusions complete inside the cell. No people, monsters, faces, eyes, fantasy weapons or text. TRUE TRANSPARENT RGBA background.
Cell 1, row 1, column 1: tall white-blue vapor column with layered ring-like curls.
Cell 2, row 1, column 2: long low cyan ribbon plume with three wave crests.
Cell 3, row 2, column 1: heavy navy low four-wheel trolley holding two black ribbed rectangular UPS battery modules.
Cell 4, row 2, column 2: small purple-gray vapor cloud with jagged wisps and an asymmetric triangular profile.
Cell 5, row 3, column 1: one heavy blue industrial motor housing with exposed silver shaft.
Cell 6, row 3, column 2: thin white vapor burst with a narrow waist and broad flat top.
Cell 7, row 4, column 1: two interlocking teal and pale amber vapor swirls forming a hollow oval.
Cell 8, row 4, column 2: green low trolley carrying a silver cylindrical valve actuator and orange toolbox.
Cell 9, row 5, column 1: compact orange service trolley with coiled black hose and metal toolbox.
Cell 10, row 5, column 2: a unique cluster of silver flanges, dark pipe fitting and ribbed metal coupling.

### Final spacing edit

undefined

### Sketch study (documentation only)

Use case: stylized-concept. Asset type: construction-game industrial enemy design sketch study, documentation only, not runtime art. A wide clean ivory artist sketchbook page with twelve distinct expressive industrial-risk concept studies in a tidy 4 by 3 layout: drum trolley, soil skip cart, aluminum formwork panel, falling scaffold deck, gangform triangular bracket, concrete core cluster, wheeled dewatering pump, wheeled industrial ventilation fan, battery module transport trolley, vapor corkscrew, sideways ribbon vapor, falling motor housing. Fine graphite and ink construction drawing, subtle orange, green and steel blue watercolor accents, grounded plausible site equipment. Each study has small secondary sketches showing three natural action poses: wheel chassis compression, a turn with ground contact, vapor slow drift and breathing, or object tumbling around a stable center. Tasteful loose pencil directional arrows and faint construction lines. No human figures, monsters, eyes, fantasy weapons, decorative UI, no written words, letters, numbers, logos or branding. Clearly separated and readable silhouettes, visually rich concept exploration consistent with a realistic isometric safety action game.


## Final assets and sketch

Runtime assets are format-only WebP conversions (quality 90, alpha retained) of the five spacing-edit images. Source images: `exec-6c0fcd6d-7356-4609-81b5-b2ba8a2e966e.png`, `exec-61fa6fd2-4e7d-443d-b090-b316758ab8d7.png`, `exec-ee008bd4-e28d-4514-9362-c003558ec46a.png`, `exec-cf67cf49-73d8-4073-88ba-7543485190b9.png`, `exec-559efcbd-161d-4ba7-861b-d64f2ff42477.png`. Documentation-only sketch: `docs/art/workface-threat-motion-sketches-v1.webp`, from `exec-f2e158fe-858e-4f9b-b885-689aeb9e0fa4.png`; never loaded by gameplay.
