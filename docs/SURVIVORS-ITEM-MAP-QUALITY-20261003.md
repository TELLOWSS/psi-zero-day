# Shooting item, equipment growth and floor quality implementation

## Direction fixed from Director screenshots 87628/30/32/34
- Pickups must depict actual site supplies, not rotating cyan diamonds or green squares.
- Five weapon families show physical progression: Lv.1 base, Lv.2 added power/control module, Lv.3 intermediate body, Lv.4 added module, Lv.5 final body. Fifteen drawn source bodies plus texture modules/scales give five rendered levels, not twenty-five separately drawn sprites. Equipment icons, upgrade before/after preview, carried radio/extinguisher, deployed cones and airborne drones use the same atlas. Floodlight/radio effects still follow actual engine equipment levels.
- Geometry and danger timing remain in pure engine. Background art does not create collision shapes. Perimeter equipment and flat central paths preserve mobile risk readability.
- Full fixed dynamic viewport with restored body scrolling after exit addresses the cropped top HUD seen in Director screenshots.
- One small combo HUD replaces duplicated central combo text. Completion captions shrink to 11px and cap at six recent messages; every danger telegraph and engine reward remains.

## Gameplay diversity
Seven collectible types: safety record (XP), first-aid case (+25 HP), recall beacon (XP recall only), radio battery (+30 ultimate), control kit (two contacts/12s), field recovery supply (3 HP/s for8s, total24), route lantern (+20% movement for10s). Five tactical types cycle every12 controls: recall/battery/kit/recovery/lantern. Designated bosses still provide one kit. Buff refresh does not stack; pause freezes timers; regen caps at maximum HP; speed never mutates base stats. No new score for collecting supplies. Existing IDs and permanent saves retained.

## Final assets and actual native dimensions
| File under public/assets/survivors | Source PNG | Dimensions | WebP bytes |
| --- | --- | --- | --- |
| concrete-ground-v3.webp | exec-d519eb07-ec94-4ec4-8fad-b8964a6bc709.png |1547×1016|521126|
| industrial-ground-v3.webp |exec-5a9e4005-d5af-4c01-9caa-7526ebd85fbd.png|1548×1016|321444|
| demolition-ground-v3.webp |exec-0d3e1d86-0ec8-408e-9de4-9dd221afa250.png|1548×1016|552650|
| pickup-atlas-v2.webp |exec-597b2417-8897-46d1-896f-cf75c07ff0eb.png|1774×887 RGBA|378696|
| equipment-growth-v1.webp |exec-6b106721-dd84-4e11-a0bc-8bcebe4af5d8.png|971×1620 RGBA|326254|

Built-in image generation/editing used, faithful WebP conversion quality90; no raster upscaling or Pillow content editing. Initial gear atlas rejected for tight dish/rotor margins, corrected through built-in edit preserving all15 designs with15% reduction in each cell. Source outputs did not meet requested2048 widths: report actual dimensions, not2K/4K. Old stage01 was already1564×1006; its new map is a material/contrast revision, not a resolution increase. Other process maps used627×627 quarters before; now use independent full1548-wide sources. Stage01/03/04/08 share concrete; Stage02/06 keep approved1536×1024 excavation; Stage07 demolition; Stage05/09/10 industrial. Four themes across ten stages, not ten unique maps. Only selected stage floor loads; previously loaded floors are reused.

## Prompt specifications
Built-in edits referenced the approved stage01 background or four-quadrant process atlas. Concrete: preserve overhead camera, vertical green walkway, open flat arena, detailed rebar/formwork/drains at perimeter, neutral crisp concrete, restrained scuffs, text/people/UI/obstacles0. Industrial: only bottom-right quadrant theme, independent overhead metal/concrete panel arena, vertical painted walkway, edge cable trays/cabinets/rails, clear flat middle, no HUD/letters/items. Demolition: only bottom-left quadrant theme, independent overhead screed floor, edge demolition stacks and tile remnants, vertical painted walkway, no holes or interior structures. All requested high-detail realistic painted construction-game style.
Pickup atlas: exactly4 columns2 rows transparent; record booklet, medical case, recall beacon, battery; control kit, orange recovery pouch, cyan-lens route lantern, twin-LED tripod. Same3/4 camera and contained silhouettes; lettering/labels/UI0.
Gear atlas: exactly3 columns5 rows transparent; radio, extinguisher, floodlight, cone, drone rows; base/intermediate/final hardware columns. Physically distinct body silhouettes; no text or gridlines. Padding correction only reduced props15% within own cells, keeping camera/materials/designs.

## Verification and scope
Full tests/typecheck/build; four viewport real gameplay; actual upgrades/charged shout/cart/fall/supply flows and Stage02/03/07/10 maps. Separate enlarged presentation fixture renders all25 level appearances and8 sprites with production draw functions and checks per-row unique pixel signatures; fixture is not proof of natural progression. Gameplay uses actual production simulation with saved valid unlock/permanent-upgrade fixture for late-stage QA. Physical-phone endurance is not verified by headless browser. Source alpha scans occur once at asset load; cached256×256 drawImage frames are reused each frame. No server/backend introduced.
