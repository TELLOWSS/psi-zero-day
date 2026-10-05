# Character growth and fifty-stage patrol

## User-Authorized Scope

Extend the shooting-mode patrol to fifty stages and connect character growth to increasingly complex workfaces. This is not a new Episode 01 story campaign or an implementation of the unapproved Career/Dark Path formula. Existing safety doctrine and canonical character identities remain intact.

## Growth Direction

The character grows from noticing immediate hazards to securing the next team's workface. Five connected chapters provide the story rhythm: field adaptation, linked processes, complex underground work, upper-floor concurrent work, and integrated handover.

Actual victories are attributed to the character who played them. Ready and victory screens show unique cleared stages, highest cleared stage, additional control-goal completions, chapter experience, and milestone narrative. Repeating a stage does not farm clearance count; completing missed goals improves its record. A different character maintains a separate record.

This pass implements narrative/experience memory, not invisible combat stat increases. Existing PSI permanent upgrades and owned equipment remain the mechanical power growth. Future character-specific earned appearance or abilities need authored assets and separately reviewed balance; permanent range or damage inflation would undo the shooting balance already repaired.

## Stage And Map Direction

Stage 01–20 retains existing content and tuning. Stage 21–50 has thirty authored names, briefings, site-profile associations, hazard mixes and designated bosses. Five control layouts combine with process-specific environments, while underground workfaces also contain actual slurry movement penalties. Later chapters require additional control zones before early handover.

There are eighteen actual ground-art families, not fifty bespoke background paintings. Three newly generated production candidates are underground workface, upper-floor skydeck, and integrated plant hall. Existing demolition, rebar, formwork, pour, scaffold, waterproof, finish, data-center and handover assets match their relevant new stages. Ground detail tiers rise from one through eight, with markings anchored to actual interactive equipment. Peripheral scenery is non-colliding; it is never presented as new terrain collision.

The selector uses five keyboard-accessible chapter tabs with ten map-thumbnail choices each. The selected tab remains visible on viewport changes. Advanced stages and the final stage carry explicit labels; the combat HUD shows stage position and workface name even on mobile camera crops.

## Bounded Difficulty

Keep stages 01–20 unchanged. From 21 to 50, spawn opening interval and final interval decrease moderately, hazard HP rises modestly, and the active limit rises from 56 to 66. Simultaneous telegraphs remain capped at four. Existing recovery windows and difficulty modes remain. Boss HP grows from 2600 to 3615 before the existing designated-boss multiplier. Early-handover thresholds stay below the 180-second survival target and within available control objects. This requires sustained natural playtest, not only simulated checks.

## Save Compatibility

Global unlocked stages, stars, PSI wallet, durability and permanent upgrades retain their existing keys. Completing stage 20 unlocks 21 on old-save recovery; completing 49 unlocks 50. No stage 51 exists. Legacy global completion cannot identify a character, so it is not falsely attributed. Character records use `psi.survivors.growth_v1`, reject corrupt rows, merge earned goals and surface write failures with a retry action.

## Generated Asset Provenance

Native image generation produced all three PNG sources. Sharp only converted the inspected sources to WebP quality 88 without replacing original sources.

- `public/assets/survivors/maps/deepworks-v2.webp`: 1536x1024, 505310 bytes.
- `public/assets/survivors/maps/skydeck-v2.webp`: 1536x1024, 543816 bytes.
- `public/assets/survivors/maps/plant-v2.webp`: 1536x1024, 433038 bytes.

Prompts specify orthographic overhead, no text/people/UI, realistic material detail, readable equipment at the perimeter, and central walkable floor without fake collision obstacles. The individual scene specifications are retaining-wall excavation with ventilation/drainage, upper-floor rooftop with scaffolding and lifting logistics, and electrical/MEP commissioning hall with UPS and switchgear. Final visual production lock remains a Director gate.

## Verification

Domain tests cover all thirty new bosses, control coordinates, site profiles, objective feasibility, fifty-stage ordering, save migration, invalid saves, per-character isolation and replay deduplication. Browser script `scripts/verify-survivors-stage50.mjs` covers PC 1440x900, portrait 390x844 and landscape 844x390, real map loading, selected-tab visibility, nonblank gameplay, stage HUD, victory recording and reload persistence.

Browser unlocks, prior growth records and successful clear outcomes are explicit test fixtures, not evidence of natural fifty-stage completion or difficulty fairness. Full regression, typecheck and build are required before publication. Remaining review: real-device performance, long-run difficulty, milestone writing, and final character appearance/ability rewards.
