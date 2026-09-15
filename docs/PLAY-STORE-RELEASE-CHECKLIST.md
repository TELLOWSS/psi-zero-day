# PSI : ZERO DAY — Google Play Release Checklist

Checked against current Google Play requirements on 2026-09-15.

## Technical package

- Application ID: `com.tellowss.psizeroday`
- Android App Bundle (`.aab`) release path: IMPLEMENTED
- Current release bundle packaging: VERIFIED (unsigned)
- Target SDK: 36
- Compile SDK: 36
- Min SDK: 24
- Version code: 1
- Version name: 1.0

Google Play requires new mobile apps and updates submitted after 2026-08-31 to target Android 16 / API level 36 or higher. The current project target SDK already meets that requirement.

## Release signing — BLOCKED ONLY ON SECRET INPUT

Required GitHub Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The release workflow is already wired for these values. Until they are configured, the workflow produces an unsigned release AAB for packaging verification only.

Do not commit keystore files or passwords.

## Play Store listing graphics

### App icon

- Required
- 512 x 512 px
- 32-bit PNG with alpha
- Maximum 1,024 KB
- No ranking, price, or misleading Play Store badges/text

### Feature graphic

- Required for the planned game listing presentation
- 1024 x 500 px
- JPEG or 24-bit PNG
- No alpha
- Should communicate actual game experience rather than repeat the app icon

### Phone screenshots

For a game, prepare at least 3 strong 16:9 landscape screenshots at 1920 x 1080 px or higher. The game itself is landscape-first, so landscape screenshots are the release target.

Planned screenshot set:

1. Construction-site strategy map + risk signals
2. Character/action confirmation — actor / target / action
3. Result card showing consequences and relationship feedback
4. Character growth/equipment screen
5. Next-day equipment skill action
6. Episode 01 field-friction / inspection sequence

Screenshots must show the actual in-game experience. Do not use concept mockups that the current game cannot reproduce.

## Store text

Prepare:

- App name: `PSI : ZERO DAY`
- Short description
- Full description
- Category / game classification
- Contact email
- Website/support URL if used
- Privacy policy URL

Core description direction:

> 사고 전 신호를 읽고, 사람·공정·책임 사이에서 현장 판단을 선택하는 건설안전 전략 시뮬레이션.

Do not claim unimplemented PSI scoring formulas, online multiplayer, cloud save, or features that are not in the release build.

## Privacy / data declarations

Current vertical slice is offline-first and browser/device-local for save data. Before Play Console submission, verify the final build for:

- network calls
- analytics SDKs
- advertising SDKs
- account/login collection
- personal data collection
- crash reporting
- permissions

The Play Console Data safety declaration must match the actual final binary, not the project roadmap.

## Testing order

1. Signed release AAB generated in CI
2. Signature verification PASS
3. Play Console Internal testing upload
4. Real Android device landscape smoke test
5. Save/resume test after app restart
6. Episode 01 route completion test
7. Audio fallback test
8. No clipped UI on common 16:9 / 20:9 devices
9. Store listing assets captured from the tested build
10. Closed testing / production decision

## Still intentionally not complete

- Release upload keystore secrets
- Final commercial WebP character/map art
- Final BGM/SFX audio assets
- Store icon / feature graphic / final screenshots
- Privacy policy public URL
- Play Console declarations

These are release-production tasks, not reasons to change the established gameplay architecture.
