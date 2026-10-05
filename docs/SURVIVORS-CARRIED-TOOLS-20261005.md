# Body-Mounted Base Tools - 2026-10-05

- Removed universal world-local radio/extinguisher coordinates and the duplicate stationary satellite prop beside the player's feet.
- Existing character fitting profiles provide belt attachment positions; existing tablet poses retain their authored hands.
- One dominant communication/extinguisher tool shares the exact torso transform used by wearable layers, including facing, gait, brace, and action recoil.
- Actual satellite/cryo acquisition selects the existing evolved equipment appearance at full growth. Level five alone remains a base tool; evolution aura identity is unchanged.
- No new hand-grip artwork, placeholders, hitboxes, combat stats, rewards, or audio recordings were added.

## Verification

- Full suite: 1,337 passed, one intentionally skipped; typecheck and production build passed.
- Three new tests cover evolution selection, every fitting profile/legacy alias, torso-transform sharing, state immutability, and one rendered tool rather than a ground duplicate.
- Browser checks passed at 1440x900, 390x844, and 844x390. Nine actual character/alias images rendered a visible level-five mounted radio in idle, right-facing action, and left-facing action poses (27 combinations).
- Contact sheet reviewed for body placement and direction. Existing boss, score, aura, controls, overflow, and page-error regressions passed.
- Development entry loaded meaningful content without a Vite error overlay.

## Review Boundary

This reuses existing equipment tiers and fitted bodies, not new distinct evolved-tool sprites or hand-grip animation art. Dedicated carried/held final art and visual review of all paid-item combinations remain Director decisions. Controlled checks do not establish long-session physical-device performance.
