# OMEGA OPERATOR — Master-exclusive playable character
Status: **art and gameplay integration NOT yet shipped**. An unlock-intelligence preview in the Watch operator selector is phase 1 only.

## Identity / art direction
- Original adult woman, premium sci-fi safety-response operative; elegant, confident, visually appealing without violating PPE expectations.
- Keep a fixed master model sheet: silver-violet hair, signature bangs/ponytail silhouette, charcoal tactical suit with controlled magenta accents, boots, gloves, protective smart visor. This sheet is a source of truth for **both** the RE:IGNITION main art and in-engine model.
- Original design; no borrowed game-character trade dress, armor emblems, or copyrighted iconic accessories. Match the final approved artwork before sprite production.

## Unlock (current implementation, visual-only)
- Verified local normal campaign completion: **50/50**.
- Separate validated difficulty records: **3★ in Master mode on all 50 stages**.
- UI reads records, does not issue rewards or mutate wallet; no blocked legacy characters.
- LocalStorage is **not tamper-proof**. Server-issued signed results tied to account would be needed for authoritative competitive rewards. Do not describe local verification as anti-cheat.

## Animation contract (to produce before enabling selection)
- 8 facing directions (N, NE, E, SE, S, SW, W, NW).
- Base locomotion: idle breathing/eye motion, walk, run, start/stop, turn, directional transitions.
- Action: weapon aim/shot+recoil, combo/control command, dash evasions, hit reaction, stagger, equipment check, ultimate anticipation/impact/recovery, victory/defeat.
- Deliver a consistent 8-direction base atlas, attack/skill frames and metadata (feet, hip, chest, wrist, head, equipment occlusion and collision origin), transparent premultiplied backgrounds. **No whole UI mockup or a single idle portrait used as a gameplay sprite**.
- Maintain 1 model identity and outfit under all directions with no hair-color swaps, equipment clipping or sudden scale jumps.
- Keep original engine collision, stats, damage, premium gear and saved user profiles unchanged until dedicated balance verification.
- Validate 390×844, 844×390, 1024×768 and 1440×900, touch controls, mobile frame time and reduced-motion settings.
- Release gate: render/animation/gear tests, unit tests, true playthrough, CI success, Vercel Preview READY, then separate production promotion.

## Future implementation phases
1. ✅ Phase 1: verified reward rules, truthful in-game locked preview and progress.
2. TODO Phase 2: final signed-off character sheet + transparent directional and action animation assets.
3. TODO Phase 3: add CharacterId/profile/portrait + art mapping, directional loader and runtime selection gated by the same reward logic.
4. TODO Phase 4: rig anchors, carried equipment and hit effects, gameplay/audio sync and QA. Only then turn on the playable CTA.
