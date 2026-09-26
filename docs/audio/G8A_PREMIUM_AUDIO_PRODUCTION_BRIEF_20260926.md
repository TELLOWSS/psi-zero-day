# G8-A Premium Audio Production Brief

## Goal
Create a premium orchestral-grade sound identity for PSI : ZERO DAY that feels authored for a commercial game rather than generated as generic background music.

The audio must make the player feel:
1. the physical weight and danger of a Korean construction site,
2. the rising operational pressure before an incident,
3. the moment the player recognizes a signal,
4. the decisive CONTROL intervention,
5. the human relief and responsibility that remain after the danger passes.

The score and sound design must work as one system. Music may heighten tension, but gameplay-critical field sounds always remain readable.

## Core aesthetic
- Full orchestral writing with modern cinematic support.
- Strings carry tension and motion.
- Horns/low brass provide gravity, not superhero triumph.
- Woodwinds and restrained piano preserve the human layer.
- Timpani, bass drum, low toms and construction-derived metallic percussion create physical weight.
- Synth/sub layers are support only.
- No generic trailer braams.
- No constant wall-of-sound.
- No horror jump-scare language.
- No recognizable imitation of an existing film/game score.

## Original PSI motif
Create one original short motif that can be:
- reduced to a 2–5 second signal,
- embedded in a low-string ostinato,
- hinted by horn or woodwind,
- expanded into the resolution coda.

It should communicate: “notice the signal before the accident.”

## Adaptive score stems
All five stems must share the same harmonic grid, tempo and loop boundary so they can crossfade without a musical seam.

### 1. score-foundation-bed
Role: baseline site tension.
Instrumentation: low strings, soft violas/celli, restrained piano, subtle air texture.
Feeling: focused, watchful, not sad.
Avoid: obvious melody, sentimental piano, over-dark drone.

### 2. score-pressure-ostinato
Role: work pressure rising.
Instrumentation: spiccato/short strings, low pulse, restrained percussion.
Feeling: schedule pressure and narrowing attention.
Avoid: action-movie chase rhythm.

### 3. score-swift-threat
Role: SWIFT dump truck becoming an immediate risk.
Instrumentation: horns/low brass swells, celli/bass motion, tighter percussion.
Feeling: heavy moving mass and closing time.
Avoid: monster sound, horror sting, explosive braam.

### 4. score-control-intervention
Role: decisive stop/intervention.
Instrumentation: short orchestral accent, brass/strings/timpani, strong but controlled.
Length: brief enough that brake/radio/barrier Foley remains dominant.
Feeling: “act now.”
Avoid: victory hit.

### 5. score-resolution-coda
Role: danger passed, responsibility remains.
Instrumentation: warm strings, restrained horn, sparse piano/woodwind color.
Feeling: release and human consequence, not celebration.
Avoid: heroic major-key fanfare.

## Construction-field Foley
Field Foley must sound like a real worksite, with distance and material weight.

Required layers:
- open excavation ambience,
- distant machinery and hydraulic movement,
- heavy diesel dump-truck engine,
- reversing alarm,
- gravel/tire movement,
- pneumatic air-brake stop,
- short non-verbal radio squelch/stop cue,
- access barrier physical clack.

Critical requirement:
The reverse alarm, air brake and CONTROL intervention must remain distinguishable from the orchestra at phone-speaker volume.

## Gameplay/UI SFX
Replace oscillator cues with authored short premium one-shots:
select, place, upgrade, sell, warning, single resolve, area resolve, leak, support, win, loss.

These must share one sonic identity. UI sounds should feel modern and tactile, not sci-fi or arcade.

## Mix architecture
Buses:
- MUSIC
- FIELD_AMBIENCE
- VEHICLE
- GAMEPLAY_SFX
- UI
- VOICE_RESERVED

Behavior:
- Reverse alarm ducks music slightly.
- CONTROL intervention ducks music more aggressively for less than one second.
- Future voice/dialogue must have top priority.
- Critical warnings retain a center component for phone speakers.
- Wide ambience must not hollow out the center.

## Technical masters
Source:
- 48 kHz / 24-bit WAV.
- Stereo for score and ambience.
- Mono allowed for point-source Foley before runtime positioning.
- No clipping.
- No artificial upsample presented as a master.

Runtime:
- Ogg/Opus 48 kHz.
- Music: 160 kbps target.
- SFX: 128 kbps target.

Master target:
- true peak <= -1 dBTP,
- combined gameplay mix typically within -18 to -14 LUFS integrated,
- retain at least 5 LU of useful program dynamics,
- no brickwall “loudness war” master.

## Listening QA
A track is not Final because it exists or passes a waveform test.

Production approval requires listening on:
1. studio/headphone stereo,
2. Android phone speaker at normal volume,
3. small laptop/Bluetooth speaker,
4. muted -> unmuted transition,
5. ten-minute fatigue session,
6. blind CONTROL-vs-SWIFT cue identification without looking at the screen.

Reject and revise if:
- it sounds like stock AI trailer music,
- orchestra masks site information,
- the field feels fake or weightless,
- loop seams are audible,
- phone playback collapses critical cues,
- repeated cues become irritating,
- the emotional tone becomes heroic, melodramatic or horror-like.

## Production order
1. Compose the five synchronized score stems.
2. Produce SWIFT vehicle Foley pack.
3. Produce CONTROL intervention Foley pack.
4. Produce the excavation world ambience.
5. Produce the eleven gameplay/UI one-shots.
6. Mix all layers in the actual G8-A Wave 8 scene.
7. Headphone/phone listening QA.
8. Only then set AUDIO_PRODUCTION_LOCKED.
