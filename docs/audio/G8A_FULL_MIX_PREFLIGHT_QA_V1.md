# G8-A Full-Mix Preflight QA V1

Status: **OFFLINE FULL-MIX PREFLIGHT PASS — HUMAN DEVICE QA STILL REQUIRED**

## Timeline
- 00–12 s: READY
- 12–26 s: WAVE_BUILD
- 26–42 s: SWIFT_THREAT
- 42–46 s: CONTROL_INTERVENTION
- 46–68 s: RESOLUTION
- 68.2 s: RESULT WIN example
- 70.0 s: RESULT LOSS example

## Technical output
- 48 kHz stereo
- Ogg/Opus 192 kbps preview
- integrated loudness: -17.9 LUFS
- LRA: 7.0 LU
- true peak: -1.4 dBFS

## Objective masking preflight

### SWIFT threat
In the 1–6 kHz critical warning band, the vehicle/warning bus is approximately **12.8 dB above the music bus** in the representative SWIFT section.

Result: **PASS for preflight warning readability.**

### CONTROL intervention
In the 1–6 kHz critical information band, the CONTROL Foley/intervention bus is approximately **14.5 dB above the ducked music bus** around the representative intervention.

Result: **PASS for preflight intervention readability.**

This supports the locked project rule: **field safety information must take priority over music.**

## Limits
This does not replace:
- real Android speaker listening
- headphone listening
- laptop/small-speaker listening
- repeated-loop fatigue
- actual browser game timing
- actual premium-binary telemetry
- oscillator fallback = 0

No asset is PRODUCTION_APPROVED from this preview alone.
