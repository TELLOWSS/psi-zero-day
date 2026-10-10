# v0.10 — flow identity and manual controls

- Full repository: 351 files / 2037 tests passed, 1 file/test skipped. Full rerun after updating the real direct-entry href contract. Final CSS/presentation refinements additionally checked by focused/browser verification.
- Focused engine/UI: 45 passed, 0 failed.
- Typecheck and build passed; existing >500kB bundle warning remains.
- Four viewport full story: 390×844, 844×390, 768×1024, 1024×768. Home scroll, actual card link→direct play, both-orientation movement, simultaneous two pointers, drag without fire, release one shot, stable angle, three waves, result→next stage, rotated control bounds.
- Five stages × two mobile orientations: all scene assets loaded, no JS errors, direction mirrors, joystick vertical motion leaves elevation unchanged, manual release shot, cancel/pause.
- No real device FPS or human play duration claimed. Generated successful score in screenshots is a browser fixture, not a human score. Existing rewards and unlocks preserved; 3-wave personal best stored separately.
- GitHub sync and production deployment are separate. Final visual/audio lock pending real device and Director review.

- Final manual-angle command verified at the world edge; no aim-point boundary clipping.
- Six viewport regression flow also passed (scene coverage, tactical pause, canceled/released fire, retry equipment, local records).
