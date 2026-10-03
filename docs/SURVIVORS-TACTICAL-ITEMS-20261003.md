# Tactical supplies and build progression

Extend the existing construction shooting missions with three collectible supplies. Existing Korean characters, stage identities and save formats stay consistent. Control rewards still resolve risk; blocking contact gives no control score or environmental credit.

| Pickup | Acquisition | Effect | Limit |
| --- | --- | --- | --- |
| Record retrieval beacon | 12, 48, 84… controlled risks | Move remaining experience logs to the player for collection | Does not move heal packs or other supplies |
| Radio battery | 24, 60, 96… controlled risks | +30 director shout charge | Capped at maximum; no extra pickup charge |
| Emergency control kit | 36, 72, 108… controls, or designated boss resolution | Block two hazard contacts for 12 simulation seconds | Refreshes 2/12 rather than stacking; pauses freeze timer |

Milestone/boss coincidence produces one kit, not duplicate supplies. Pickups display their own atlas art, names, colored ground ring and short acquisition notice. Active kits display a green player ring, remaining contacts and seconds.

Level-up reserves a slot for upgrading an owned weapon. Once a weapon reaches Lv.5, its missing evolution support is prioritized; an available evolution remains first priority. Other choices remain shuffled. Bulk XP preserves the current choices, queues later levels and refreshes the mounted UI on each selection rather than overwriting cards. Existing tests using 100 XP to represent one level were adjusted to explicitly single-level or queued-choice scope.

Ready and pause screens include a collapsible supply/build guide, all five existing recipes and paused-run progress. The beginner manual documents supplies and sequential choices.

## Asset register

- Production file: `public/assets/survivors/tactical-items-v1.webp`, 1254×1254 RGBA, 281,990 bytes.
- Built-in image generation; existing `risk-atlas-v2.webp` used as style reference. Original: `generated_images/exec-8f3eee43-467a-436d-9cab-485db33ac52f.png`.
- Exact 2×2 source cells: top-left blue beacon, top-right orange battery, bottom-left green case/cones/tape, bottom-right transparent. Converted to WebP without resizing or repainting; alpha preserved.
- Prompt: Create one square transparent production pickup atlas, exact equal 2×2 cells. Top-left rugged blue record receiver/clipboard beacon with antenna and cyan light; top-right orange/black radio battery with lightning mark; bottom-left green emergency control case with two cones and yellow tape; bottom-right empty transparent. Match the reference's detailed painted semi-realistic worn construction equipment, elevated 3/4 perspective, warm rim light, clean alpha, chunky readable silhouettes at 44 pixels. Each object contained in its cell with padding. No people, words, labels, background, grid, logo or watermark.

Tests cover milestone and boss drops, exact battery cap, selective recall, kit contact count/expiry/pause/refresh, build priority, queued XP and mounted sequential UI. Browser QA checks three supply cards, five recipes and decoded art at four viewports, then observes actual Stage10 supply spawning and acquisition using explicit unlock/R&D fixtures. Natural progression, item balance and long-device sessions remain review items.


Full generation prompt (built-in tool):

Use case: stylized-concept. Asset type: production game pickup sprite atlas for PSI ZERO DAY Korean construction safety shooting game. Input image 1 is STYLE REFERENCE ONLY, not an edit target. Create one square transparent sprite sheet with an exact 2x2 grid of equal square cells. TOP LEFT: rugged blue handheld record-retrieval beacon, antenna, small cyan light, clipboard/data receiver motif. TOP RIGHT: orange and black portable rechargeable radio battery, clear lightning marking without letters. BOTTOM LEFT: compact green emergency traffic-control equipment case with two folded orange cones and rolled yellow barrier tape, contained as one pickup object. BOTTOM RIGHT: completely empty transparent cell. Each object centered fully within its own cell with generous transparent padding, similar visual footprint and readable chunky silhouette at 44 pixels. Match reference's detailed painted semi-realistic industrial construction equipment rendering, worn plastic/metal textures, consistent slight elevated 3/4 perspective, warm rim light and clean alpha edges. No people, no background, no labels, no words, no UI, no dividing lines, no logos, no watermark. Real transparent background, do not paint a checkerboard. Exact quadrant order is essential for source rectangles.
