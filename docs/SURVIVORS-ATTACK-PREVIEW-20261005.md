# Attack preview selection

- Fitting uses one native motion menu: idle, walk, communication shot, extinguisher spray and ultimate. Playback, facing and zoom remain available without adding a third toolbar row.
- Attack selection drives the same recoil envelope as gameplay and restarts the isolated preview clock. This is a body-gesture comparison, not a simulated attack or a change of equipped weapon.
- No inventory, credits or engine state is changed by motion selection. The render loop remains outside React state; dependencies include attack selection and existing pause/visibility/reduced-motion controls.
- Updated unit/UI tests verify profile selection and no purchase callbacks. Full suite: 1,354 passed, 1 skipped; typecheck and build pass.
- Browser verification selects all three attack profiles, checks unchanged local storage, animation, pause and reduced-motion stability across 1440x900, 390x844, 844x390, 667x375 and 568x320. Compact landscape canvas and all motion controls remain in view.
- Independent arm/hand frames and physical-device review remain pending. This does not claim new animation artwork or cinematic production lock.
