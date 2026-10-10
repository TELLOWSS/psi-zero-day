# 시그널 브레이커 v4 이미지 제작 프롬프트

2026-10-10 · 내장 imagegen 사용. 내용 재편집 없이 WebP94 인코딩. 실제 원본 크기는 가로1672×941, 세로1024×1536. 4K 업스케일 주장 없음.

## CH-01 가로 / art/map-delivery-v3.webp

```
Use case: stylized-concept. Asset type: original final-candidate production background for a 2D side-view industrial physics arcade game, no UI. Create a beautiful coherent construction delivery yard at dawn, exquisitely detailed steel framing, wet concrete, warm task lamps, distant cranes and layered mist. SINGLE continuous environment, not a collage, not an atlas. Wide landscape 16:9, highest native resolution available, 3840x2160 if supported. Crucial composition: straight horizontal walkable steel platform surface at exactly 86.5 percent of total image height, spanning full width; under it the remaining 13.5 percent shows believable continuous platform supports and pipework, no separate pasted floor strips. Open uncluttered playable space above platform, structural framing mostly at left and right edges, low-contrast distant background. Fixed side-on camera, consistent vanishing point and restrained cinematic teal/warm lighting. Sharp foreground metal joints and clear material distinctions, no mushy blur or excessively intricate visual noise. No people, no enemies, no floating sci-fi devices, no firearms, no letters, no signage, no text, no HUD, no icons, no logos, no watermarks. Preserve readable open central action space. Do not copy any existing game's art.
```

## CH-01 세로 / art/world-delivery-v4.webp

```
Use case: stylized-concept. Asset type: ONE continuous production game environment, tall world extension for responsive side-view industrial physics arcade. Generate portrait 2:3 at highest native resolution available. Original construction delivery yard at dawn, exquisitely detailed steel framing, concrete, task lamps, distant cranes and atmospheric depth. Crucial composition: a straight horizontal walkable steel platform spans full width at approximately 76 percent of total image height; below it 24 percent depicts continuous realistic steel supports, beams and pipework. Above it, an extremely tall coherent construction hall/yard with towers rising into the sky, same fixed side-on camera and consistent vanishing point, open central space for gameplay, framing primarily at edges. This is a single tall camera-plane background, NOT separate panels, NOT a collage, NOT a sprite atlas. Fine texture and defined metal joints, cinematic teal/warm light, not excessively busy. No people, no floating game devices, no enemies, no guns, no letters, no labels, no UI, no HUD, no logo, no watermark. The scene must remain coherent if its middle section is cropped horizontally for landscape view. No repeated floor, no stretched bands.
```

## 나머지 세로 4개 현장의 공통 지시

```
Use case: stylized-concept. Asset type: original production camera-plane background for side-view industrial physics arcade. Portrait 2:3, highest native resolution. ONE continuous tall environment, not collage or atlas. Exactly one straight horizontal walkable platform spans full width at 76 percent of image height, with continuous detailed supports and pipework in remaining bottom24percent. Upper76percent tall coherent environment, lots of open central playable space, framing at edges. Single fixed side-on camera, consistent vanishing point, detailed sharp foreground, low-contrast background with depth, cinematic coherent materials. Must crop coherently in landscape without resizing individual bands. No people, enemies, floating gameplay devices, weapons, text, signs, UI, HUD, logos, watermark. 
```

개별 장면 지시:

- conveyor: An indoor construction materials receiving hall with long conveyor structures in the far background, corrugated roof, gantry, amber work lights and steel grating. Neutral industrial teal and amber.
- extraction: A deep underground concrete ventilation and dust extraction hall, huge receding intake ducts at edges, pipes, concrete arches, cool work lights, localized dust haze. Clear central area, defined concrete and steel textures.
- hoist: An elevated construction hoist platform with towering building framing and distant city, lifting gantries at edges, overhead structural cables, dawn blue and warm task lamps. Strong height and architectural depth, one walkable deck.
- power: A tall industrial electrical relay hall at night, realistic switchgear and cable columns at edges, receding steel catwalks, violet accent light and warm industrial task lamps. Clear middle with low background contrast and coherent steel deck.

경로: `public/signal-breaker-dev/art/world-{conveyor,extraction,hoist,power}-v4.webp`.

출력은 지시한 바닥 비율과 다르므로 실제 이미지 검사 후 메타데이터로 연결했다. 전경 구조와 장치 고정점의 최종 미술 판정, 고밀도 PC/태블릿 native 해상도 한계는 남아 있다. Final Art Lock 미선언.

