# Boss encounter flow and moving character auras

## Encounter Rules

- Real stage spawns enter a 3.5-second arrival state on the player's visible workface. Name, risk guidance and structural interlock instruction are shown while combat physics are held. Pause preserves the remaining introduction time.
- The first structural core cannot drop below 50% until one full warning/attack/recovery cycle completes. Phase two resets that cycle counter and retains an 8% core until its attack settles. All weapon, aura, ultimate and environmental damage paths share these limits; ordinary hazards retain their prior behavior.
- Managed bosses resist continuous instruction-stun and bodily knockback. Otherwise rapid equipment could prevent the required attack cycle indefinitely. Ordinary hazards and pre-existing unmanaged fixtures are unaffected.
- Managed cart and gas approach phases issue their full existing warnings after 2.5 seconds even when kited. Warning duration and locked attack direction remain unchanged.
- Confirmed boss neutralization enters a 2.4-second secured state, holds further combat damage and shows the clear confirmation before awarding victory and credits once. No time-only clear was added.
- Mobile's prior combat mode visually clipped all boss alerts. Arrival and secured notices now explicitly remain visible; ordinary combat continues using the compact boss readout.

## Aura Motion

- Paid equipment seals orbit the foot plane with motif-specific flow; movement adds a short rearward offset, without moving the actual attached item.
- Acquired evolutions circulate painted energy at the feet; silhouette mantles undulate and rise locally with movement drag.
- Simulation time controls the animation. Pause freezes it; reduced motion retains stable markers. Existing atlas-call and busy-combat budgets remain unchanged.

## Verification

- Full suite: 1,319 passed, 1 intentionally skipped; typecheck and production build passed.
- Fifty-stage normal-input calibration, three seeds per stage: 139 victories and 11 defeats, all 150 terminal; every stage has a successful run. This is a scripted balance check, not a human win-rate claim.
- Engine regression covers four boss families, arrival protection, phase core gates, completed motion transitions, delayed clear and single payout. Existing campaign tests now wait for the intentional encounter states.
- Browser verification at 1440x900, 390x844 and 844x390 covers real spawns, visible arrival notices, controlled clear confirmation and final victory. The clear fixture sets boss HP directly; natural damage progression is covered separately by the calibration and engine tests.
- Loaded-atlas aura pixel samples change over time, remain identical at repeated simulation time and remain static under reduced motion. No horizontal overflow or page errors in the three-view check.

## Director Review

- Review attack pacing and the short core-lock feedback on physical mobile hardware. No new boss illustrations, unique fifty-boss models or cinematic production lock are claimed.
