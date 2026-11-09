# PSI : ZERO DAY — silver AIRA V2 and male M01 review import

**Status: SOURCE IMPLEMENTATION / DRAFT PR #235 / NOT DEPLOYED**

The user explicitly confirmed the adult female AIRA V2 identity: silver-white/lavender high ponytail, violet eyes, white Ω tactical coat, black combat armor and violet highlights. **SIGNAL GUARD** and **SIGNAL WATCH** are the two main games. Male M01 is a separate candidate; neither the existing character selection nor player progression has changed.

## Actual art inventory

- 8 original AIRA V2 angle-labelled *candidate* WebPs, each RGBA 384×512 and 1 separate male M01 candidate, exist in the conversation ZIP `AIRA_V2_SILVER_8방향_검수원화_남성요원_업데이트_20261109.zip`.
- Exact SHA-256 hashes are recorded in `public/omega-canonical-art-review/roster.json`.
- **None of the 9 art binaries have yet been committed to GitHub.** This branch contains the verified roster, import staging code, and a browser-local live-preview mechanism only.
- The eight labelled candidate images are **NOT** a verified 8-angle animation set: NW must be redrawn, E/SE/SW/NE perspective require approval, male M01 remains a design candidate. Do **not** count technical pose interpolation or black-haired E action studies toward silver V2 painted frames.
- The formal commercial animation gate `src/ui/omega-protocol-art-slot.ts` remains locked (160 approved independent action frames / 320 approved masks still absent).

## Opt-in preview on a local or preview build

1. Open `/omega-canonical-art-review/index.html` from a running Vite build of **this development branch**, not the production site. Choose the original ZIP directly or its extracted `game_sprites_384x512` folder.
2. The browser lists individual angles; choose **원화 8개 확인 후 전투 시험하기**. All eight female WebPs must match the known original SHA-256 and 384×512 dimensions.
3. The assets are stored **only in this browser** in an isolated IndexedDB database `psi-omega-canonical-review-v1` under `sprites`; there is **no server upload**.
4. The button opens `/?omegaLab=1&omegaSilverPreview=1`. The authentic OMEGA special-edition test renderer, which wraps SIGNAL WATCH combat, temporarily renders the silver 8-angle *neutral* candidate images. Old black-haired E attack studies are intentionally suppressed to prevent identity contamination.
5. `/?omegaSilverPreview=1` opens the two-game main screen with an **opt-in preview** of the silver AIRA S illustration replacing the mismatched cinematic character image. The actual SIGNAL GUARD and SIGNAL WATCH game sprites, progress, records and production screen are unchanged.
6. **로컬 시험 원화 지우기** deletes the test store. Without the query string, the app uses its original assets. An absent, modified or unverified WebP is rejected.

## Verification / security

- Core: `tests/omega-canonical-local-preview.test.ts` rejects a production-labelled roster, missing heading, accidental non-opt-in entry and partially assigned image maps.
- Browser: `scripts/qa-omega-silver-preview-browser.mjs` generates **synthetic, non-AIRA test WebPs**, checks a deliberately mismatched SHA is rejected, tests direct DEFLATE ZIP loading, launches the true OMEGA Watch-engine Canvas with temporary original-angle file sources, verifies the two-game home UI with the same local art, deletes all local data and verifies preview fails closed afterward.
- Synthetic fixture screenshots are explicitly labelled SYNTHETIC-QA-ONLY. They are NOT evidence of commercial AIRA art quality.
- No new public uploads, network/AI runtime calls, paid APIs, changes to hitboxes, projectiles, equipment, game progression, `main` or Vercel Production are part of this preview.

**Release blockers:** upload original signed/hashed binaries to the repo by an approved binary-write workflow, correct NW and perspective mismatch, produce original eight-angle motion frames/masks, visual QA with real art on desktop/portrait/landscape, Android performance/foot pivot QA, and explicit art director approval.
