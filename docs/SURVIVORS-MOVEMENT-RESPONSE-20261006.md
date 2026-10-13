# Movement Response and Walk Cadence

Director supplied a Galaxy S26 Ultra gameplay video reporting unnatural walking and slow/buffered direction changes. Local video frames were reviewed; the recording is 30 fps and cannot establish input-to-photon latency or the phone's true display frame rate. Personal recording/contact-sheet files remain local and are not committed.

## Changes

- Authored eight-direction player walking now uses a separate 112-world-unit full-cycle cadence, identical for horizontal, vertical and diagonal travel. It no longer inherits the legacy mesh's short, vertically compressed stride. Equipment sockets select the same authored cycle as the body.
- Stopping selects the nearest existing contact frame instead of always jumping to frame zero. Same-simulation-tick recoil updates retain the moving pose, avoiding an idle-frame flash between fixed physics steps. No new idle source art was fabricated.
- Fractional camera coordinates remain fractional rather than snapping to whole world pixels.
- Touch movement updates its input ref immediately and moves the joystick knob via its DOM ref; it does not commit the large React game tree on every touchmove. Start/end remain React-owned. Dead zone is 4 px instead of 6 px; full analog radius remains 55 px.
- Only the selected character's runtime body/command assets are prepared. The directional player bypasses unused legacy mesh and command preparation. Other selected actors retain their existing authored-command path. Directional alpha extraction no longer allocates a neighbor array for every opaque pixel.

Physics frequency, movement speed, collision rules and difficulty are unchanged. There is no new movement easing or delayed direction blending.

## Verification

Full suite: 1394 passed, 1 skipped. Typecheck and production build passed.

Profiler-backed UI test: 20 touchmove events produce zero additional React commits; reverse direction reaches the next engine update and release clears movement. Motion tests cover eight-angle cadence equality and same-tick action updates. Camera test verifies fractional travel.

Chromium desktop 1440x900, portrait 390x844 and landscape 844x390 pass real movement/reversal/release and all eight direction inputs, with no page errors or horizontal overflow. Directional raster checks still pass all 64 frames and zero canvas allocations across steady drawing. Local reports: `artifacts/movement-response` and `artifacts/eight-direction-runtime`.

Event-to-engine displacement timings in the movement report are local desktop browser samples, not physical-phone input-to-photon latency, FPS certification or an A/B benchmark. Director should repeat the recorded route on S26 Ultra after deployment. Other characters' complete eight-direction source art and further sustained-load profiling remain separate work.
