# TASK-013D — Android Release Packaging Foundation

Status: IMPLEMENTED / UNSIGNED RELEASE BUNDLE VERIFIED

## What is implemented

- Android package identity remains `com.tellowss.psizeroday`.
- Capacitor Android project targets API 36 and compiles with API 36.
- `android/app/build.gradle` supports release signing only when all release-signing environment variables are present.
- `.github/workflows/android-release.yml` builds the verified web bundle, syncs Capacitor, runs `bundleRelease`, verifies the AAB exists, and uploads the result as a GitHub Actions artifact.
- Release secrets are never committed to the repository.

## Verified evidence

GitHub Actions workflow `Build Android Release Bundle` run #1 completed successfully.

- web build: PASS
- Capacitor sync/configure: PASS
- `./gradlew bundleRelease`: PASS
- release AAB existence check: PASS
- artifact upload: PASS
- signing verification: intentionally skipped because release signing secrets are not configured yet

Artifact: `psi-zero-day-release-aab`

The current artifact is an unsigned release AAB used to prove packaging. It is not the Play Store upload artifact until signing is configured.

## Required GitHub Actions secrets for signed AAB

Configure these repository Actions secrets only when the upload keystore is finalized:

- `ANDROID_KEYSTORE_BASE64` — base64-encoded upload keystore file
- `ANDROID_KEYSTORE_PASSWORD` — keystore password
- `ANDROID_KEY_ALIAS` — upload key alias
- `ANDROID_KEY_PASSWORD` — upload key password

When all four values are available, the existing release workflow will load the keystore outside the repository, attach the release signing config, build the AAB, and run `jarsigner -verify` before artifact upload.

## Security rules

- Never commit `.jks`, `.keystore`, passwords, aliases with passwords, or decoded keystore files.
- Keep an offline backup of the upload keystore and its credentials.
- GitHub Secrets are deployment inputs, not source files.
- Do not use the debug keystore for Google Play release signing.

## Release identity

- applicationId: `com.tellowss.psizeroday`
- versionCode: `1`
- versionName: `1.0`
- minSdk: `24`
- targetSdk: `36`
- compileSdk: `36`

## Next gate

1. Create/finalize the Google Play upload keystore.
2. Add the four repository Actions secrets.
3. Re-run `Build Android Release Bundle`.
4. Require the `Verify AAB signature when signing is enabled` step to PASS.
5. Use the resulting signed `.aab` for Play Console internal testing first.
6. Complete store listing assets, privacy policy, content declarations and device testing before production release.
