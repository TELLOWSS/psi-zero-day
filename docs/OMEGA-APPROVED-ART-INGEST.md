# OMEGA PROTOCOL — AIRA final art asset ingest / release guard

**Status: ART PENDING · development gate, not a production release.**

The current AIRA battle actor is a procedural technical placeholder. The user-owned main title portrait is an **identity reference, not a sprite sheet**. The earlier 8×6 technical pack (48 frames) is rejected for final use because its pose variation and boot pivot are inadequate. Never rename or duplicate those files to impersonate 8×20 finished artwork.

## Required deliverables

- 8 unique directions: `E SE S SW W NW N NE` (not mirrored substitutes).
- 20 actually authored poses per direction, fixed order: `walk` ×6, `fire` ×3, `dash` ×3, `hit` ×3, `ultimate` ×3, `finish` ×2.
- For EACH pose: **actor RGBA + rearMask RGBA + frontMask RGBA** at **384×512**, 480 actual image files. Both masks may be empty in an individual frame if occlusion is not needed; **all 320 masks collectively blank is invalid**.
- Technical actor alpha (>220) must end at foot pivot row **454±2** for the six walk frames per direction; a soft ground shadow can extend below that, but must be semi-transparent.
- No near-identical adjacent walk frames (change ratio, on union of visibly painted pixels, minimum **1%**).
- All 160 actor poses must differ in **raw decoded pixels**, not only filenames or encoded metadata. A left/right source that is an exact horizontal flip is rejected. Human review must still evaluate movement naturalness, identity, equipment occlusion, and commercial rights.
- Signed/approved visual, battle, Android device review results, and a unique SHA-256 for every binary manifest entry.

## File placement

Place binaries in `public/assets/omega/approved/`, with unique basename matching `^[a-z0-9_-]+\.(png|webp)$` (case insensitive). Declare every file's absolute **web** URL and SHA-256 in `content/art/omega-approved-v1.json`, conforming to `OmegaApprovedSpriteManifest` in `src/ui/omega-protocol-art-slot.ts`. Example of one element:

```json
{
  "action": "walk",
  "actor": "/assets/omega/approved/aira_e_00_actor.png",
  "rearMask": "/assets/omega/approved/aira_e_00_rear.png",
  "frontMask": "/assets/omega/approved/aira_e_00_front.png",
  "actorSha256": "ACTUAL_SHA256_64_HEX_DIGITS",
  "rearSha256": "ACTUAL_SHA256_64_HEX_DIGITS",
  "frontSha256": "ACTUAL_SHA256_64_HEX_DIGITS",
  "authoredUnmirrored": true
}
```

The outer manifest must contain:

- `identity:"AIRA_MASTER"`, `status:"ARTIST_APPROVED"`, nonempty artist signoff,
- `visualQa:"PASS"`, `combatQa:"PASS"`, `mobileDeviceQa:"PASS"`,
- `width:384`, `height:512`, `feetLine:454`,
- `frames` with exactly 8 heading keys and exactly 20 action elements per heading.

## Checks and security

```bash
# Read-only development status; missing art is expected and is NOT a false CI failure:
npm run omega:art-status

# Fails with exit code 1 unless the entire declared pack is validated:
npm run omega:art-verify

# Separate intentionally synthetic fixture tests (not an art signoff):
npm run omega:art-test
```

The gate reads the **actual image bytes** with Sharp and validates SHA-256, dimensions, transparency, opaque foot contact, pixel-level uniqueness, near-static gait, mirrored headings, 480 valid paths, all masks and nonempty equipment occlusion. Paths are anchored to the project's `public/` directory and canonicalized; traversal, symlink escapes, 0-byte files, oversized individual binaries, and corrupt files fail. JSON evidence goes to `qa-omega-art/approved-art-audit.json`.

A **synthetic** technical image pack can pass *binary structure* checks; it cannot become approved commercial art by doing so. The report deliberately sets `releaseEligible:false` and `requiresManualProductionApproval:true` even if `binaryAuditPassed:true`.

**Release remains doubly locked:** the runtime constants `OMEGA_PROTOCOL_APPROVED_ART=null` and `OMEGA_PROTOCOL_BINARY_AUDIT_PASSED=false` in `src/ui/omega-protocol-art-slot.ts` must stay that way until independent human art approval and Android/playthrough QA. The audit does not write those constants, merge to `main`, deploy Vercel, purchase services, or unlock a game menu.

## Real project readiness vs synthetic QA

As of **2026-11-08**, `content/art/omega-approved-v1.json` does **not** exist on the PR #235 branch, and none of its 480 approved binary files are in that branch. Correct status: **BLOCKED**. Seven locally executed synthetic fixture scenarios passed: full 160+320 structure, corrupted SHA, undecodable image, duplicate actor, foot pivot mismatch, missing rear mask, missing manual signoff. The entire game build, GitHub Actions and Android performance remain separately unverified.