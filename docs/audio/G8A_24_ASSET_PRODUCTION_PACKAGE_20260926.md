# G8-A Premium Audio — 24 Asset Production Package

## Global musical grid
- Tempo: 84 BPM
- Meter: 4/4
- Score loop: 16 bars
- Loop length at 84 BPM: 45.7142857 s
- All score stems start at bar 1 beat 1 and end exactly at bar 17 beat 1.
- No pickup before zero. No reverb tail beyond the loop boundary unless printed as a seamless cyclic tail.
- Harmonic center: restrained modal/minor palette. Avoid obvious heroic major resolution.
- Original PSI motif only; do not imitate recognizable film/game melodies.

## Source and delivery
- Source master: WAV, 48 kHz, 24-bit.
- Runtime: Ogg/Opus, 48 kHz.
- Music runtime target: 160 kbps.
- SFX runtime target: 128 kbps.
- No artificial upsampling.
- No clipping.
- Master true peak: <= -1 dBTP.
- Preserve at least 5 LU of useful dynamics in the combined gameplay program.

## SCORE — 5 synchronized stems

### 01 score-foundation-bed
Path: `assets/defense/audio/g8a/score-foundation-bed.ogg`
Length: exactly 16 bars / 45.714 s.
Role: permanent emotional foundation.
Instrumentation: low strings, restrained violas/celli, sparse felt piano, subtle orchestral air.
Energy: 2.5/10.
Prompt direction:
"Original premium hybrid-orchestral game score stem for a realistic Korean construction safety strategy game. 84 BPM, 4/4, 16-bar seamless loop. Low strings and restrained felt piano, quiet human tension, attentive and professional, no melody-forward writing, no trailer braam, no superhero tone, no horror, no vocals, no drums dominating, leave center space for safety alarms and radio. Natural concert-hall depth but controlled tail. Must function as an independent stem synchronized with other orchestral layers."
Reject if: sentimental, generic corporate, dark-drone-only, obvious AI trailer sound.

### 02 score-pressure-ostinato
Path: `assets/defense/audio/g8a/score-pressure-ostinato.ogg`
Length: exactly 16 bars / 45.714 s.
Instrumentation: spiccato strings, low ostinato, restrained timpani/low tom accents.
Energy: 4.5/10.
Prompt direction:
"Original orchestral tension stem, 84 BPM, 4/4, 16 bars, perfectly seamless. Short strings and low pulse suggesting schedule pressure and narrowing attention at a construction site. Controlled rhythm, no chase-scene energy, no EDM, no ostinato cliché copied from existing scores, no giant impacts. Designed to layer over a quiet low-string foundation."

### 03 score-swift-threat
Path: `assets/defense/audio/g8a/score-swift-threat.ogg`
Length: exactly 16 bars / 45.714 s.
Instrumentation: low brass, French horns, celli/basses, restrained percussion.
Energy: 6.5/10.
Prompt direction:
"Original premium orchestral threat stem for a heavy reversing dump truck becoming an immediate safety risk. 84 BPM, 4/4, 16-bar seamless loop. Low brass and horns add physical mass and urgency while leaving frequency space around reverse alarms, air brake and radio. No monster language, no horror sting, no cinematic braam, no heroic brass."

### 04 score-control-intervention
Path: `assets/defense/audio/g8a/score-control-intervention.ogg`
Length: 2.0–3.5 s one-shot, not looped in practice even if represented as score asset.
Instrumentation: strings/brass/timpani short decisive accent.
Energy: 7/10 transient, immediate decay.
Prompt direction:
"Short original orchestral intervention accent for a construction safety stop-work/control action. Decisive and authoritative but not triumphant. Strong transient, rapid decay, leave room for air brake, radio squelch and barrier clack. No victory fanfare, no trailer hit, no sub-drop dominating."

### 05 score-resolution-coda
Path: `assets/defense/audio/g8a/score-resolution-coda.ogg`
Length: 8–16 bars, capable of graceful fade.
Instrumentation: warm strings, restrained horn, sparse piano/woodwind.
Energy: 2.5/10.
Prompt direction:
"Original restrained orchestral resolution for a safety incident avoided. Human relief, seriousness and responsibility for tomorrow. Warm strings, subtle horn, sparse piano/woodwind. No heroic major-key celebration, no sentimental melodrama, no choir."

## FIELD / VEHICLE / CONTROL — 8 assets

### 06 field-excavation-world
Path: `assets/defense/audio/g8a/field-excavation-world.ogg`
Length: 45–90 s seamless stereo loop.
Content: open excavation air, distant machinery, gravel movement, restrained urban/site bed.
Must not include: intelligible speech, branded machine beeps, dramatic impacts.

### 07 field-excavator-hydraulic
Path: `assets/defense/audio/g8a/field-excavator-hydraulic.ogg`
Length: 20–40 s seamless loop.
Content: distant hydraulic whine, bucket/track texture, realistic mechanical rhythm.
Mix role: secondary layer under world ambience.

### 08 swift-engine-loop
Path: `assets/defense/audio/g8a/swift-engine-loop.ogg`
Length: 12–24 s seamless loop.
Content: heavy diesel dump truck at low-speed worksite maneuver.
No manufacturer-specific startup chime or speech.

### 09 swift-reverse-alarm
Path: `assets/defense/audio/g8a/swift-reverse-alarm.ogg`
Length: 4–8 s clean loop.
Content: worksite reversing warning, centered enough for phone speaker recognition.
Critical: distinctive but not painfully loud.

### 10 swift-gravel-tire
Path: `assets/defense/audio/g8a/swift-gravel-tire.ogg`
Length: 1.5–3.0 s one-shot.
Content: slow heavy tire crunch and gravel displacement.

### 11 swift-airbrake
Path: `assets/defense/audio/g8a/swift-airbrake.ogg`
Length: 0.7–1.8 s one-shot.
Content: heavy pneumatic stop punctuation.
Critical: must remain clear under orchestral ducking.

### 12 control-radio-stop
Path: `assets/defense/audio/g8a/control-radio-stop.ogg`
Length: 0.5–1.2 s one-shot.
Content: short radio squelch / non-verbal stop-control cue.
No understandable dialogue so localization is unaffected.

### 13 control-barrier-clack
Path: `assets/defense/audio/g8a/control-barrier-clack.ogg`
Length: 0.4–1.0 s one-shot.
Content: physical access-control barrier/gate clack with believable metal/plastic body.

## GAMEPLAY/UI — 11 assets
All UI SFX must share the same restrained premium identity: tactile, modern, physical, not sci-fi and not arcade.

### 14 ui-select
20–100 ms tactile confirmation, subtle high-mid click with soft body.

### 15 ui-place
60–180 ms placement confirmation, slightly weightier than select.

### 16 ui-upgrade
120–350 ms upward tonal/tactile flourish, sophisticated not magical.

### 17 ui-sell
100–250 ms downward/release cue, neutral not punitive.

### 18 wave-warning
250–700 ms operational warning, recognizable on phone speaker, no horror siren.

### 19 control-resolve
80–220 ms precise successful intervention confirmation.

### 20 area-resolve
120–300 ms broader but restrained multi-target resolution.

### 21 shield-leak
180–450 ms serious loss-of-margin cue. Avoid game-over cliché.

### 22 support-call
200–500 ms readiness/coordination cue with professional radio/tactical texture.

### 23 result-win
1.5–3.5 s restrained positive resolution. No victory fanfare.

### 24 result-loss
1.5–3.5 s sober consequence cue. No melodramatic descending cliché.

## Required listening review notes per asset
Each asset must receive:
- headphones: PASS/REVISE
- Android phone speaker: PASS/REVISE
- small speaker/laptop: PASS/REVISE
- masking against SWIFT reverse alarm: PASS/REVISE where relevant
- fatigue/repetition: PASS/REVISE
- final reviewer note

No asset becomes PRODUCTION_APPROVED from file presence alone.
