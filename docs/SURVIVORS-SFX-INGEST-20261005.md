# Supplied sound effects: 2026-10-05

## Applied candidates
| Source | Runtime event |
| --- | --- |
| PSI_SFX_RADIO_RELEASE_v01_A.mp3 | Radio and satellite trigger discharge |
| PSI_SFX_DRONE_RELEASE_v01_A.mp3 | Drone and hunter trigger discharge |
| PSI_SFX_TESLA_CONTROL_v01_A.mp3 | Confirmed Tesla contact, excluding workers |
| PSI_SFX_PICKUP_v01_A.mp3 | Record/drop recovery |
| PSI_SFX_DRONE_LAUNCH_v01_A.mp3 | Actual inspection dock-to-deployment transition |
| PSI_SFX_DRONE_DOCK_v01_A.mp3 | Actual inspection return-to-dock transition |
| PSI_SFX_UI_EQUIP_v01_A.mp3 | Successful purchase, repair or loadout commit |
| PSI_SFX_UI_DENIED_v01_A.mp3 | Rejected/failed equipment transaction |

All eight decoded source durations are 0.48 seconds. Sources remain untouched in Downloads. Runtime copies are stereo 48 kHz OGG; gain targets -20 dBFS RMS, with a 0.8 source-peak limit and +12 dB amplification cap. Short edge fades prevent clicks. The very quiet denied sample hits the amplification cap and needs a listening review; noise is not blindly amplified by 31 dB.

RELEASE means discharge here, not projectile expiry. Recorded launches replace the corresponding procedural launch, not stack with it. Calm worker confirmations and unmapped weapon/material sounds retain existing behavior. Candidate recordings share SFX bus, distance attenuation, voice limits, playback rate limits, decode caching and pause/mute/exit cancellation. No new autoplay, always-running loop or independent audio owner is introduced.

## Awaiting explicit mapping
| Source | Decoded length |
| --- | --- |
| DcUDQwad.mp3 | 45 seconds |
| ToX8Y7kk.mp3 | 1 second |
| mDJ0b7al.mp3 | 1 second |
| QsWhV0ou.mp3 | 1 second |
| ilSuAwM9.mp3 | 1 second |
| mpmMBBYn.mp3 | 1 second |
| NS8YwVIF.mp3 | 1 second |

These have no purpose/title tags. Their hashes and technical checks are recorded, but no filename/length-based guesses are inserted into gameplay. Director should supply the corresponding prompt numbers or purposes before runtime assignment.

## Approval boundaries
All 15 sources decode successfully and have zero over-full-scale decoded samples. Original and runtime SHA-256 values are logged in content/survivors-sfx-v1-ingest.json. Technical decoding and user-authorized integration are not semantic listening, final mix, final rights or cinematic production approval.
