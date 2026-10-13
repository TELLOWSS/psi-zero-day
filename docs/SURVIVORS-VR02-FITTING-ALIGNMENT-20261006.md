# VR-02 fitting integration checkpoint

The supplied 80-98s fitting frames show legacy colored floor arcs/arrows. Code
inspection found their remaining production caller in SurvivorsFittingPreview,
not the current gameplay renderer. The preview also bypassed loadDirectionalActor.

Changes:
- Removed preview calls to drawEquipmentIdentity/drawEvolutionIdentity. No
  constant rotating ground identity band is added by those functions in fitting.
- Loaded the same directional actor path as gameplay, preserving existing
  authored-command fallback for actors without an accepted directional sheet.
- Fitting poses now specify right/left directional rows and authored gait cycle.
- Loaded/prepared the existing premium presence asset and rendered it behind
  the actor with the same torso transform, profile and reduced-motion behavior
  as gameplay. Optional presence load failure leaves the actor preview usable.
- Existing body mantle, worn gear, wallet and real game rules remain unchanged.

Verification:
- Full suite:1,529 passed/one skipped; typecheck and build passed.
- Fitting browser checks passed1440x900,390x844,844x390,667x375,568x320.
- Six selected gear, animated walking, direction change, action selection,
  pause, reduced motion, hidden-tab freeze, unchanged wallet and no overflow/errors.
- Portrait action capture inspected: legacy ground arrows/band absent, body
  presence retained. Evidence:artifacts/fitting-motion/report.json and screenshots.
- Build shooting chunk507.60kB retains the existing warning. All QA processes ended.

Limits: current browser run uses the real player actor, not all six-character
visual approval. The preview action is an isolated demonstration, not an engine
damage/defense event. New organic shape-changing aura assets, event-owned defense
timeline, missing-asset browser case, all-character and1/3/6-gear matrix remain
for the complete VR-02/VR-03/VR-05 gates. Legacy identity functions remain in their
module for now but are not invoked by gameplay or fitting. No placeholder art,
new gameplay rule or claim of final Diablo-like quality. No publishing.
