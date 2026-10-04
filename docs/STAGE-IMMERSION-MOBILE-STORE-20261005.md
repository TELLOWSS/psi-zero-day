# Stage Immersion and Mobile Equipment Room

## Implemented Scope

Existing twenty-stage Survivors campaign only; no new campaign or difficulty rules.
Twelve new 1536x1024 raster floor candidates plus three existing workface floors.
Art is loaded per selected stage, not all maps at startup. Generated PNG originals remain intact.
Final-candidate runtime integration is not Director visual production approval.

| Stage | Workface asset | Detail tier |
| --- | --- | --- |
| 01 | Existing loading yard | 1 |
| 02 | Existing excavation | 1 |
| 03 | High-rise city/slab/crane | 1 |
| 04 | Winter tent/heaters/frost | 1 |
| 05 | Data center racks/UPS/cabling | 2 |
| 06 | Existing building survey/isolation | 2 |
| 07 | Existing selective demolition | 2 |
| 08 | Remodel structural splice | 2 |
| 09 | Data center MEP | 2 |
| 10 | Data center commissioning | 3 |
| 11 | Formwork/shoring assembly | 3 |
| 12 | Rebar delivery/fixing | 3 |
| 13 | Night concrete pour/pump | 3 |
| 14 | High-rise formwork lifting | 3 |
| 15 | External scaffold/work platforms | 4 |
| 16 | Roof/penthouse/mechanical plant | 4 |
| 17 | Waterproof membrane/solvent storage | 4 |
| 18 | Interior finishes/material hoists | 4 |
| 19 | Data center electrical isolation | 4 |
| 20 | Finished facility handover | 5 |

Progression never deliberately degrades early-stage resolution. Later unlocked workfaces
gain installation markings, survey ticks, equipment labels and visible finished materials.
Equipment isolation paint follows actual engine equipment state. It changes no spawn,
range, collision, rewards or saved stars. Shared data-center and remodel families are intentional;
twenty unique fully modeled environments are not claimed.

## Mobile Shop

Default view is the equipment list. Three keyboard-accessible tabs separate browsing,
fitting/stat comparison and six equipped slots. Selected gear has a sticky purchase/equip
action in the fitting view. Unaffordable previews remain available without ownership mutation.
The small-screen list is one column, with adjacent 44px purchase and fitting actions.
R&D base upgrades are separately collapsible. Close, Escape, focus containment and focus
restoration are provided. PSI is the existing gameplay wallet, not a real-money checkout.

## Continuing Equipment and Audio Work

Three independent wearable assets now have authored torso sockets for all six canonical
characters, plus existing compatibility aliases. Foreground masks preserve carried tools,
hands and facial identity. Rigged motion shares the same torso transform as the actor.
This does not claim all sixteen premium items have new body-mounted art or a true drone
dock/deploy animation.

Four saved audio-bus sliders control orchestral score, equipment/alarms, voice/radio and
ambience. Values are finite/clamped; setting preferences does not create an AudioContext
before a user gesture. Ducking remains on its independent node and preserves bus volume.
The existing seven orchestral tracks remain CANDIDATE auditions. Procedural equipment
SFX remain development sound. New orchestral recordings, stage ambience recordings,
individual material Foley and Director mastering approval are still required.

## Next Production Prompts

1. Stage variants: author distinct installation-state layers for stages 05/09/10/19 and
   06/08 using the current floor coordinates. Preserve central combat readability and
   existing collision. Inspect desktop/mobile captures before promotion.
2. Premium equipment: finish independently mounted assets for remaining premium IDs,
   authored per-character sockets, source-tool occlusion and actual feedback states.
   Never replace the original character with an unrelated generated portrait.
3. Drone: connect dock, launch, pursuit and return presentation to real equipment
   readiness/target state. Preserve the engine's real suppression and pickup radii.
4. Orchestral production: deliver foundation/pressure/heavy-risk synchronized stems,
   intervention/evolution/success/failure cues, sample-accurate loop points, licensed
   rights and file hashes. Add low-level workface ambience and recorded equipment Foley.
   Validate dialogue intelligibility, mobile speakers, headphones and peak headroom.
   Do not label audition tracks or procedural audio as production locked.

## Verification

Run `npm test`, `npm run typecheck`, `npm run build`, real-browser desktop/mobile map
captures, nonblank canvas pixels, shop overflow/touch-target checks and console errors.
Publish only the verified commit to GitHub main and confirm the same Vercel production SHA.

Verified locally: 1,179 tests passed, one existing skip; typecheck and production build passed.
Browser evidence includes high-rise/remodel desktop, winter/handover mobile, all twelve
1536x1024 images decoded, 390px shop without horizontal overflow, 44px touch targets,
real isolated-wallet purchase persistence, character fitting screenshots and no app errors.
Further production prompts in Korean: `STAGE-IMMERSION-PROMPTS-KO.md`.
