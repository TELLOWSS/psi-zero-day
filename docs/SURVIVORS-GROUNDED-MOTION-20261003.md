# Grounded motion foundation

Historical PR94 baseline. Follow-up runtime walk/run joint animation, tool/contact states and rolling wheels are described in [SURVIVORS-ARTICULATED-MOTION-20261003.md](SURVIVORS-ARTICULATED-MOTION-20261003.md). The limitations below describe the earlier foundation, not the follow-up implementation.

The user identified people and mobile risks floating/sliding. Existing rendering added whole-image Y bob from wall time; idle actors also moved vertically, and transparent sprite padding was scaled as part of the actor.

Implemented for every playable character, unsafe worker and guided worker: opaque bounds cached on image load, bottom of boots anchored to ground, restrained breathing/weight compression around the fixed foot anchor, movement lean and facing from actual world displacement, brief contact/interaction brace from HP changes. Distance-based cycle and engine clock preserve poses during pause/level selection and between fixed physics ticks. No walking motion when input is blocked by a boundary; no stride on teleport. Cart wheels meet ground baseline; direction follows actual movement, with body lean and contact compression. Gameplay coordinates, collisions, damage and rewards are untouched.

Quality limit: these are grounded presentation states, not full articulated directional walk cycles. Two generated worker-sheet candidates were rejected: one had overlapping unequal frame cells, the next repeated too-similar leg poses rather than alternating support feet. Neither is referenced or shipped. All existing Korean cast art remains. Proper next asset work needs distinct contact/pass/opposite-contact frames, consistent identity, planted-foot continuity, and direction-specific views; animations for idle, walk, tool action, warning/brace and safe exit. Cart wheel rotation needs separate wheel layers/frames. Do not mark these as finished.

Tests check equal distance cycle at 30/60/120Hz, same pose between physics ticks and in pause, no gait against walls, facing at rest, teleport rejection, and simulation-time contact recovery. Full browser captures verify all existing gameplay/regressions, not final animation production quality.
