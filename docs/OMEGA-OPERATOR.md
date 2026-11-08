# OMEGA OPERATOR — Master-exclusive playable character
Status: **art and gameplay integration NOT yet shipped**. Main-title unlock identity, Watch locked preview, and record-based entitlement contracts are implemented on a draft PR; runtime player selection remains disabled.

## Identity / art direction
- Original adult woman, premium sci-fi safety-response operative; elegant, confident, visually appealing without violating PPE expectations.
- **Canonical appearance is the CURRENT deployed main illustration**: `/assets/reignition/veteran-return.webp`. Preserve its silver-white hair, signature layered bangs, white/graphite tactical field jacket, magenta identification accents, radio/PPE details, fitted dark undersuit, boots and gloves. The new in-engine model must remain recognizably the same character from every angle. Do not replace her outfit or hair based only on separately generated promotional mockups.
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

## Live UI status as of this development branch
- The RE:IGNITION main title shows a compact OMEGA badge using the same saved 50-clear / 50-master-3-star criteria as the Watch roster.
- GameHub refreshes entitlement on the wallet's `psi:meta-updated` event and on focus/storage changes.
- Pure frame sampler `src/ui/omega-operator-motion.ts` defines 8 facings and 12 action types, including idle/walk/run/fire/combo/dash/hit/knockdown/recover/ultimate/victory/defeat. **This is a contract, not final authored animated graphics.**
- Run `node scripts/check-omega-operator-art.mjs --release` before any PR enables actual play. Missing art fails deliberately. The normal script without `--release` reports the outstanding files and exits normally.
- Generated interface illustrations are **art direction only**, not production gameplay assets. Do not crop a menu screenshot to impersonate a directional character animation.
