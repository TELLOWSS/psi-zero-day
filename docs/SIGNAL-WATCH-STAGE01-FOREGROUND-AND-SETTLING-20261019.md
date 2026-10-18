# Signal Watch Stage 01 foreground and authored locomotion settling

## Delivered scope
- One Stage 01 bottom railing / material-stack alpha coverage asset, generated through built-in image_gen from the exact current stage-01-ground-v3.webp (Git blob 9005eba23f35033605dab6c1e8d8d3e14a2122fa).
- The generated colors are intentionally discarded. A one-time canvas preparation takes alpha from the coverage file and color from the original floor at the same pixel coordinates.
- Crop: source x=0, y=935, width=1564, height=71. World width=1400; world bottom=900; world crop height=900*71/1006.
- Alpha <= 8 is removed once during loading. The center green lane remains clear. No map, physics, collision, layout, camera or gameplay change.
- Prepared texture is reused for every frame. The current stage's buffers are released when the stage changes.
- Actual coverage: Stage 01 has one layer; Stages 02–50 have no new matte. This is not a 50-mask completion claim.

## Animation change
The genuine 20-pose authored renderer now follows the tracker's decaying gait blend after a walk/run stops, retaining the last locomotion mode. Contact cadence, world position and paused samples remain frozen. Actions, brace and pivot retain priority. This shared presentation change applies wherever the authored renderer is used, across the campaign; it does not create new character art.

## Review and limits
The first generated cutout was rejected for floor remnants. The selected second cutout is used only for coverage; native source colors are restored and near-transparent noise is removed at runtime. Registration and original green-lane opening were reviewed. Final pixel/render validation is recorded by scripts/verify-survivors-matte.mjs, including source-color error, invalid-crop rejection, player overlap, danger-warning alpha and three viewport captures with normal/reduced motion. Main merge requires green regression and browser checks. Physical Android testing and final animation-art lock remain outstanding.

## Reproduction prompt
Use case: background-extraction. Edit the exact original 1564×1006 Stage 01 source. Extract only the bottom railing, timber/rebar crates and lamps at their original coordinates. Make the remainder, including the central green-lane opening, fully transparent. Preserve object silhouette, camera and scale; no text, logo, HUD, people or new objects. Output true RGBA coverage. This asset is read as alpha, not replacement color.

## Shared release and browser boundaries
The shared Breaker actor delivery matches the canonical CI build (150481 bytes, SHA-256 95a29abdd5299981ceb9774aee50054a7f9be86918574ed03ff853c956394c90); release.json matches its complete generated fingerprint. Existing ending QA now acknowledges the earned boss-loot dialog using the actual continue button before replay/result actions. Dedicated legacy boss phase fixtures explicitly omit raid state; the causal gate additionally runs current real-pointer raid counterplay, practice/no-reward, guide and pause tests. These fixtures do not claim that legacy boss presentation is the current raid path.

Legacy fixtures must set raidEnabled=false before beginNextWave, rather than deleting raid from an already-created boss: raid creation replaces the legacy nodes and HP. The UI load-phase loop is bounded and reproduces all four stages and anchor acceleration in the exact current engine. Repeated-clear save-failure QA acknowledges its real reward modal before pressing save retry. Each browser script has a 600-second process limit so a stuck fixture reports failure without consuming the entire workflow.

Replay regression exposed an actual Escape propagation defect: the ending consumed Escape and then the outer application handled the same event, bypassing results. The ending now stops propagation of that consumed key. Release hashes include this runtime fix. Legacy source-guidance/UI fixtures select the supported non-immersive layout explicitly because those HUD panels are intentionally absent from the current immersive layout; current default immersive raid guide/pointer flow is tested separately. Existing camera-fit assertions remain intact.
