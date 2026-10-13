# Galaxy S26 Ultra Device Check

Requested target: Galaxy S26 Ultra (user-provided model). Actual device model, OS and performance are not assumed.

## Implemented

`scripts/verify-survivors-android-device.mjs` performs a read-only ADB probe, records the actual model/manufacturer/Android version/display/density and battery status/level/temperature. It can attach to an existing production game tab in the phone's Chrome and sample 30 seconds of visible active gameplay RAF intervals and long tasks. It records P50/P95/P99 instead of substituting desktop-emulation numbers.

The probe uses an ephemeral local forwarding port, removes only its own forwarding and disconnects without closing the phone's browser. It does not install an APK, open a tab, change phone settings, alter gameplay state, or record private browsing history. Device serial is used for selection but excluded from the output report.

If a device is unauthorized/offline, more than one is connected without explicit selection, the page is hidden, gameplay pauses/ends, or the game tab is absent, the script records an incomplete reason and exits with code 2. Device detection and completed gameplay measurement are separate fields. A 30-second sample is not full-stage/thermal/touch acceptance.

## Actual Run

Google's [official SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) was downloaded locally into ignored/untracked `artifacts/android-tools`, not installed system-wide or added to Git. `adb devices -l` returned no attached devices. Probe result: `verified: false`, `measured: false`, `reason: no-device`. No S26 Ultra FPS, temperature or input latency was measured.

## Run When Connected

1. Open the production game in the phone's Chrome and start active gameplay. Keep that tab visible.
2. Configure `CODEX_PRIMARY_RUNTIME_NODE_MODULES` to the bundled Node dependencies. Set `ADB_BIN` to an existing ADB executable if not using the local tools above.
3. If multiple devices are attached, set `ANDROID_SERIAL` explicitly.
4. Run `node scripts/verify-survivors-android-device.mjs`. Report is written to `artifacts/android-device/report.json`.
5. Repeat in portrait and landscape and keep both reports. Record the commit and gameplay scenario separately; this script does not claim to know engine state from an optimized production bundle.
6. Follow the full-stage and thermal acceptance checklist in `SURVIVORS-MOBILE-PERFORMANCE-20261006.md` before closing the physical-device TODO.

## CPU Profiling Follow-Up

The desktop-emulation tool now supports `PSI_PERF_CASE=390x844-4x` and `PSI_PERF_PROFILE=1`. It saves a Chrome CPU profile and reports sampled hotspots. This run was NOT performed on an S26 Ultra.

The 15-second profiled early-combat run recorded 642 playing frames, with natural level-up interrupting the end. P95 frame interval was 49.8ms; 14 long tasks, maximum 191ms. Profiling adds overhead, so this is not a controlled before/after benchmark.

Top image-compositing stacks included `drawRiggedActor -> drawImage` (652 sampled hits) and `drawRiggedActor -> bake -> triangle -> drawImage` (404). These identify pose rasterization/compositing as a profiling priority, not proof that cache enlargement will fix all latency. CPU samples also included React development JSX and garbage collection. Local profile: `artifacts/mobile-performance/390x844-4x.cpuprofile`.

Next: measure pose-cache hit/miss rates and memory on repeated movement before changing cache capacity or raster resolution; confirm using a production build and physical device. No frame-rate improvement is claimed in this change.

## Unfinished Acceptance

- Real connected-device measurement and thermal/touch validation.
- Profiling/optimization for the 4x CPU-emulation long tasks identified previously.
- Approved eight-direction raw animation and per-frame equipment anchors. No incomplete candidate was substituted into gameplay.
