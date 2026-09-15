# PSI : ZERO DAY — World / Map / UI Visual Lock

Status: LOCKED for Episode 01 production visual integration.

## Purpose
This document prevents the environment, map, HUD and character layers from drifting into unrelated visual styles. Character art, construction-site world art, UI overlays and hazard feedback must read as one commercial game.

## Core visual direction
- adult-friendly premium casual-strategy 2.5D construction-site diorama,
- approachable and readable without becoming childish,
- believable Korean construction-site details rather than generic fantasy/city-building decoration,
- clean game-like hierarchy with strong mobile readability,
- warm natural daylight by default, with controlled dusk/night variants only when story/time-of-day requires them,
- no real company, apartment, project or site names inside production artwork,
- no pseudo-text or meaningless signage lettering baked into images.

## World camera lock
Episode 01 gameplay world uses a strategy-diorama camera language.

- Primary view: elevated 3/4 perspective.
- Camera should reveal routes, work zones, hazards and people simultaneously.
- Avoid ultra-wide cinematic angles that hide playable information.
- Avoid pure top-down orthographic views that flatten worker identity.
- Avoid third-person over-the-shoulder presentation as the main gameplay camera; it may appear only in authored cut/inspection moments later.
- Scale relationships between workers, equipment, formwork, rebar, crane, temporary structures and buildings must remain plausible.

## Foundation map lock
Production asset:
`public/assets/episode01/backgrounds/foundation-map.webp`

Minimum: 1920×1080, opaque WebP.

The map must support readable gameplay layers for:
- main work structure,
- tower crane / lifting influence area,
- material yard,
- temporary access road,
- site gate / approach,
- rebar/formwork work areas,
- worker circulation and exclusion routes,
- foreground / midground / background separation.

The world image itself must not contain baked-in:
- HUD,
- dialogue boxes,
- quest cards,
- resource counters,
- navigation icons,
- map pins,
- readable site/company/building labels.

Interactive information belongs to the game UI layer.

## Construction realism lock
The world may be stylized, but safety and construction cues must remain credible.

Required visual logic:
- guardrails and temporary edge protection appear where context demands them,
- access routes are visually different from material storage / active lifting zones,
- formwork, rebar, scaffolding and temporary works use recognizable construction geometry,
- equipment is oriented and positioned plausibly,
- PPE silhouettes are readable on workers,
- hazard presentation is serious and readable, never slapstick,
- no impossible floating equipment, decorative cranes without support logic, fantasy machinery or unsafe staging used only for visual spectacle.

## Character-to-world integration lock
Character assets use transparent backgrounds and are layered over the map.

At gameplay scale:
- map characters remain recognizable at approximately 80–140 px tall,
- silhouette + at least two identity cues must survive,
- feet must visually contact walkable surfaces,
- character scale must remain consistent across scenes,
- ambient light/tone should harmonize with the map without tinting characters so strongly that PPE colors become ambiguous,
- character artwork must not carry its own floor plate, scenery rectangle or baked-in shadow background.

## UI visual language
UI should read as a modern field-operation interface adapted into a strategy game—not a fantasy RPG frame and not a corporate dashboard.

### Palette behavior
- Base: deep navy / charcoal surfaces.
- Safety information: white text with high contrast.
- Action/selection: controlled blue family.
- Warning: amber/yellow.
- Stop / severe hazard: red only where urgency requires it.
- Verified / safe completion: green.

Color must never be the only carrier of state; pair color with icon, label, shape or motion.

### Shape language
- rounded but not toy-like,
- medium-radius panels,
- restrained borders and shadows,
- strong spacing hierarchy,
- large mobile touch targets,
- icon silhouettes remain simple and industrial/field-oriented.

### Typography
- Korean-first readability,
- short hierarchy labels,
- avoid decorative display fonts in operational HUD,
- names / roles / trades must remain distinguishable in dialogue,
- no tiny low-contrast text over detailed map regions.

## Gameplay state visual lock
The core safety loop must have immediately different visual states:

1. `OBSERVE / SIGNAL`
   - neutral-blue information emphasis,
   - risk markers visible but not visually explosive.

2. `STOP`
   - clear red stop treatment,
   - work interruption must read immediately.

3. `FIX`
   - amber task/action treatment,
   - corrective action object/zone highlighted.

4. `VERIFY`
   - inspection blue/green transition,
   - confirmation must feel deliberate, not automatic.

5. `RESUME`
   - restrained green confirmation,
   - normal world contrast returns after the corrective state.

This state language must remain consistent between HUD, mission panel, map markers and tutorial prompts.

## Hazard marker rules
- Hazard markers are UI overlays, not painted into the background.
- Marker location must correspond to a plausible physical hazard source.
- Marker scale must not cover the worker/equipment that explains the hazard.
- Critical hazards may pulse or animate; non-critical markers remain calmer.
- Icons require shape differentiation, not only color differentiation.

## Map expansion rule
Future Episode 01/02 locations must reuse this visual grammar instead of introducing a new art direction.

Every new map requires:
1. world role / construction phase,
2. camera and playable-route plan,
3. work-zone hierarchy,
4. hazard readability plan,
5. character scale reference,
6. day/time lighting target,
7. production clean plate without baked-in UI,
8. actual gameplay-scale acceptance screenshot before approval.

## Visual acceptance gate
A production screen is accepted only if all are true:
- character and environment clearly belong to the same game,
- worker role/PPE identity survives actual gameplay scale,
- interactive UI is readable over the map,
- map navigation zones are visually understandable,
- no baked-in UI/text contaminates world art,
- hazard and safe states are distinguishable without relying only on color,
- no real project/company identifiers appear,
- construction logic looks plausible enough that a field professional does not immediately read the scene as decorative nonsense,
- title, map, dialogue and mission screens maintain the same art language.

## Production priority
Until TASK-016B completes:
1. keep the verified Foundation final map,
2. complete the 16 locked character WebPs,
3. run actual title/map/dialogue scale acceptance,
4. only then perform UI polish that depends on final character dimensions,
5. do not replace the core map/camera direction with unrelated open-world, anime VN, chibi city-builder or photoreal simulation styles.
