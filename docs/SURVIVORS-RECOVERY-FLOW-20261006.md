# Recovery-cell authored flow

Local implementation only; no GitHub/Vercel synchronization. This is one selected recovery-cell animation, not all protection/rescue equipment production lock.

## Runtime
- `RecoveryFlow` reads actual engine `premiumGear.recoveryAmount`. Missing HP alone cannot trigger it. Duration0.8s, minimum cadence1.4s, at most one live sequence; no permanent ground ring.
- Source is the existing character-specific protection socket plus `actorTorsoPoint`, matching facing/recoil/lean. Six distinct painted stages interpolate with the existing authored sequence timing. Busy rendering uses one frame, normal at most two.
- Loaded/visible authored socket owns the recovery-cell slot even between pulses so the legacy stamp does not fill the quiet interval. Missing image/actor/socket and reduced motion retain the existing restrained legacy behavior. Rescue-wing retains its separate legacy slot, not silently replaced by a recolor.
- Pause uses simulation time and creates no new pulse. Unequip/new session clears. Full HP stops emission; an already emitted0.8s tail may finish.

## Art provenance
Built-in imagegen, transparent output preserved. Selected source:
`C:/Users/user/.codex/generated_images/01a1002a-207a-7242-a0aa-73c7b743c706/exec-4a7ddfa3-48d6-455c-8d3d-c678a97ddda7.png`
Workspace:`public/assets/survivors/recovery-cell-flow-v1.png`,1536x1024RGBA, six512px cells. Emission roots manually registered:[[263,411],[263,415],[265,416],[267,385],[267,387],[267,386]]. Prompt requested exact256,352, but this was not achieved; runtime compensates the actual painted roots rather than pretending alignment succeeded.

Generation brief: original PSI mint-green microfluidic filaments, pearl highlights/amber motes; six chronological bud/stream/peak/breakup/droplets/residue stages;3x2 atlas, transparent gutters, no character/equipment/cross/rune/floor ring/commercial art. Targeted edit: preserve material/chronology, shrink effect and halo, align emission root, remove edge haze and keep outer margins transparent.

Rejected initial recovery candidate:`exec-f877e1bb-e282-4af2-adb2-ff756cd03049.png` (peak reaches y13). Selected edit keeps alpha>32 within32..479; corner alpha<=1, six distinct hashes, final active pixels<35%peak. Requested80px completely clear border was not achieved, so that stricter target is not claimed.

Rescue-wing candidates:`exec-f4d75b5c-7d72-4f47-8b8f-bb7ba4815f4a.png`, edit:`exec-c0625580-28c3-4d17-bc5e-665f0090cdea.png`. Brief: pearl/gold articulated shield slivers, six opening/peak/fracture/decay phases, compact emitter, no floor circle; targeted edit shrank/centered and removed edge haze. Both rejected: late sliver frame still reaches x480(alpha>32)/482(alpha>16), fails the chosen32px active gutter. Neither copied into production. Rescue protection slot remains pending, including existing shared shield dome.

## Evidence
Focused21 tests passed. Browser actual UI+engine recovery with six valid equipped categories passed1440x900,390x844,844x390: real positive receipt, six source frames, pause frame hold, full-health settled silence, zero draws after unequip, no overflow/errors. `artifacts/recovery-flow/report.json`; portrait screenshot inspected. Controlled loadout/HP fixture is not natural-play balance approval. First browser capture timed out because Vite query-version module identity bypassed prototype hook; fixed test-only response capture on the actual loaded engine module. No production QA hook added.

Next: rescue-wing protection asset acceptance, other gear, walk intermediate art. Do not count rejected wing artwork as completion.
