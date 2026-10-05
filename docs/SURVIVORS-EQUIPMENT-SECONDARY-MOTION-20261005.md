# Equipment secondary motion

- Body-mounted base/evolved communication and extinguisher tools pivot around their authored belt socket with a damped presentation spring. Walking and action influence the target; tools settle after stopping rather than moving exactly with the torso.
- Rotation is limited to 0.12 radians. The socket stays fixed, existing equipment art remains intact, and no cloth deformation is applied to rigid chest armor.
- Simulation time controls motion. Identical-time draws are stable; reduced motion returns zero; rewinds, long clock gaps and facing flips reset the spring. WeakMap storage is per session state and does not mutate gameplay.
- Both gameplay and fitting previews pass the reduced-motion preference explicitly. No React animation state or per-frame React renders were introduced.
- Unit tests cover lag, settling, bounds, pause determinism, reduced motion and resets. Full suite: 1,347 passed, 1 skipped; typecheck and build pass. Fitting browser checks pass across five viewport sizes.
- This is secondary motion for carried tools, not a new cloth or arm animation asset. Separated limb artwork and true item-specific attack frames remain pending art production and director review.
