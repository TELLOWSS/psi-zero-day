# Ground light facing correction

The broad yellow wedge in the radio character captures is the always-rendered
flashlight, not the voice-lens release. It must not be counted as a second radio
launch or removed on that assumption.

The existing renderer compressed the ground vertically by 0.58 before applying
the world facing angle. This skewed diagonal light axes away from the movement
direction. `groundFacingAngle` compensates the angle before that transform so
the displayed center axis remains aligned in all eight directions. Beam size,
palette, gameplay, collision, movement speed and premium ownership are unchanged.

Verification:
- Two unit tests cover all eight directions, uncompressed projection and invalid inputs.
- Full suite: 1,528 passed, one skipped (277 passed files, one skipped).
- Typecheck and build passed; existing 500 kB chunk warning remains.
- Real browser loading and radio playback/pause/unequip regression passed at
  1440x900, 390x844 and 844x390 with no page errors or horizontal overflow.

This is a geometric correction, not approval of the flashlight art or brightness.
Independent equipment animation and alternate-foot walking source art remain open.
