# Boss core feedback and firing aura response

## Implemented

- One engine-owned core-floor helper now supplies both damage limits and HUD state. Locked cores and exposed recovery windows have distinct short labels and progress colors on desktop and mobile.
- Confirmed projectile contacts report `blocked` only when a managed boss receives no damage. Blocked hits retain their actual contact point but use a restrained shield receipt, no critical hit stop, no destructive impact audio or camera/light burst, and no release blossom.
- Blocked contact sound reuses the existing quiet EMF release material, with the same voice limits and mute behavior. No new recording or orchestral quality claim.
- The silhouette aura responds briefly to a real local firing event and decays exponentially. Strength, image count and dimensions are bounded; reduced motion omits the firing pulse. Ordinary time-based circulation and movement drag remain intact.
- The secured encounter shows a progress bar during its existing 2.4-second confirmation. Stage rules, attack-cycle requirements and payout timing are unchanged.
- Damage clamping cannot heal a core that is already below its floor.

## Verification

- Full suite: 1,323 passed, 1 intentionally skipped. Typecheck and production build passed; focused boss/contact/aura regression passed after release suppression.
- Updated three-viewport Chrome check verifies real arrival, a confirmed locked engine hit at 50%, locked/open HUD states, controlled secured confirmation and victory, with no page errors or horizontal overflow.
- Loaded raster aura pixels change with simulation time and firing strength; repeated time and reduced motion remain identical. These are controlled renderer samples, not physical-device performance or subjective visual approval.

## Remaining Review

- Human review of core-lock readability, firing pulse intensity and quiet shield-contact audio on physical mobile devices. Existing final raster assets are reused; no cinematic production lock asserted.
