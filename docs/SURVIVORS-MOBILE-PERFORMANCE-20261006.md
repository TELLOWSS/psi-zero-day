# Mobile Performance Baseline - 2026-10-06

Status: desktop Chrome emulation measured; physical-device verification NOT completed.

## Reproducible Measurement

Run `scripts/measure-survivors-mobile-performance.mjs` with `CHROME_BIN` and `CODEX_PRIMARY_RUNTIME_NODE_MODULES` configured. Start Vite separately; default URL is port 5196, override with `PSI_PERF_URL`. The script dynamically observes the development engine but does not alter gameplay state. It measures 15 seconds of real stationary early-stage combat per case at DPR 2, recording RAF intervals, long tasks, actual active hazards/projectiles, canvas dimensions, errors and overflow.

Results are local at `artifacts/mobile-performance/report.json`:

| Viewport | CPU Limit | Median Frame | P95 Frame | Long Tasks | 30fps P95 Target |
| --- | --- | --- | --- | --- | --- |
| 390x844 | 1x | 16.7ms | 16.7ms | 0 | pass |
| 390x844 | 4x | 16.7ms | 50ms | 16, max 89ms | fail |
| 844x390 | 1x | 16.7ms | 16.8ms | 0 | pass |
| 844x390 | 4x | 16.7ms | 50ms | 23, max 108ms | fail |

No page errors or horizontal overflow. Natural hazard maxima were 8-10 and maximum simultaneous projectiles was 1. One landscape run naturally reached defeat near the end; only playing frames were measured. This is NOT late-stage/crowded VFX validation, touch latency validation, a thermal test, or evidence of phone GPU performance. CPU throttling is not a device equivalent. Timing thresholds are diagnostic targets, not a deterministic CI test.

## Next Performance Work

Capture a CPU trace on the target device before choosing a rendering change. The 4x results expose long tasks even in light early combat; do not claim low-end readiness or blindly reduce all artwork resolution based on this baseline. Profile animation baking, high-DPI canvas work and HUD/layout separately. Re-test walking plus equipped items, evolved weapons, boss arrival and ultimate after any change.

## Physical Device Acceptance

No `adb` command or standard Android SDK platform-tools binary was available in this workspace inspection. A device must be connected or manually tested before closing this item.

Record model, OS/browser, refresh rate, DPR, power-saving mode and build commit. Use the production build, not development instrumentation. Measure both orientations for a full stage and a ten-minute thermal run; include walking, simultaneous equipment, final evolution, boss arrival/clear, ultimate, pause/resume and rotation. Record P50/P95/P99 frame intervals, long tasks, input response, sound unlock/mix and visual readability. Target P95 <=34ms for a 30fps baseline; document misses instead of hiding them in averages.

Do not mark this TODO complete from responsive screenshots or desktop emulation alone.
