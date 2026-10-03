# SURVIVORS generated art register

| Asset | Purpose | Source |
|---|---|---|
| stage-01-ground-v2.webp | Stage 01 open loading-yard floor | Built-in image generation, 1564×1006 |
| risk-atlas-v2.webp | Loaded trolley, concrete debris; unused worker/blower candidates | Built-in transparent image generation, 1300×1210 |
| director-yoon-shout-v2.webp | Revised director cut-in speech balloons | Built-in edit of existing director_yoon_shout_cutin.jpg |

Cut-in prompt: replace only both speech-balloon phrases with `작업중지 돌아버려 씨~!!!`; preserve director identity, scene and comic layout. Inspecting the generated result confirmed both phrases; illustration details changed slightly during the generative edit, so it is kept as a versioned sibling rather than overwriting the original. Final Director acceptance remains pending. Director voice supplied and extracted from 68–72 seconds of `마지막_경고.mp4` into `public/assets/survivors/director-shout-voice-v1.mp3`, SHA-256 71f69cb73be9d5908d08d5d35e2473b9381374944fb0133c8e0fb4f5f74b68d7. Original backing music remains. No source separation or direct listening is claimed.


| New asset | Purpose | Source |
|---|---|---|
| safety-monitor-v2.webp | Korean watch officer selection and map sprite | Built-in reference generation, 1086×1448 RGBA |
| worker-korean-v2.webp | Korean unhelmeted risk-exposure worker | Built-in reference generation and clean-shaven edit, 1024×1536 RGBA |
| process-ground-atlas-v2.webp | Four construction floor settings for Stage02–10 | Built-in generation, 1254×1254 RGB, 627×627 quadrants |

Monitor prompt: one Korean male safety watch officer, full body, white helmet with chin strap, lime reflective vest and navy workwear, handheld radio and clipboard; match existing player-map and Kang portrait semi-realistic Korean webtoon linework/materials, transparent padding, no scenery/text/logo. Worker prompt: Korean construction worker with radio and missing helmet, orange vest/navy trousers, neutral concerned pose, full body, reference-matched Korean webtoon style; edit removed moustache and slimmed face to distinguish foreman, preserving clothing/pose. Process atlas prompt: precise 2×2 orthographic floor atlas, excavated basement / reinforced slab / renovation floor / data-center installation, quiet central 75% playable area, green safety walkway, edge-only site materials, muted painted textures, no people/UI/text/central obstacles. Output did not reach 2048 dimensions; no upscaling is claimed. New images were inspected before integration, saved as versioned WebP siblings, original cast art retained.
