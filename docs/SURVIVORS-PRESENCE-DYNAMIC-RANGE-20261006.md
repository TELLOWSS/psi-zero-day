# Premium presence dynamic range

The common presence layer previously started at alpha 0.62 and reached 0.77
with six items even without action. This kept a large bright corona visible
through quiet movement and competed with event-owned equipment sequences.

The shared authored presence now has a restrained baseline:
- Six-item idle alpha: 0.232 normal, 0.192 busy.
- Six-item maximum action alpha: 0.772 normal, 0.732 busy.
- Six-item idle dimensions: 106x122; peak dimensions: 138x150.
- Equipment-count growth, palette identity, simulation-clock animation, pause
  behavior and reduced-motion suppression are preserved.

Actual action strength still comes from the existing combat-direction tracker;
no idle timer, fake trigger, extra artwork or new gameplay rule was introduced.
This adjustment does not replace the missing independent equipment sequences.

Verification: profile tests assert restrained six-item idle and a peak more than
three times its idle alpha. Typecheck/build passed. Existing actual-browser
premium/shield regression passed on desktop, portrait and landscape with six
items, zero duplicate shields, zero page errors and no horizontal overflow.
The portrait idle capture was inspected and shows a smaller, quieter presence.
Browser shield measurements do not measure the new presence alpha or prove
cinematic quality; numerical presence contrast is covered by profile tests.

Existing chunk-size warning remains. Rear art, alternate-foot walking art,
independent remaining gear animation and actual handset checks remain open.
