# 브레이커 Production 이미지 제작 프롬프트

2026-10-10 · 내장 imagegen 사용 · 래스터 이미지 7개 자산. 각 자산은 별도 프롬프트로 생성했다. 맵은 실제 반환 크기 1672×941이며 4K 업스케일을 원본이라고 표시하지 않는다. 장치 아틀라스는 실제 알파 투명도를 보존했다.

## 반입 야드 → art/map-delivery-v2.webp
Use case: stylized-concept. Asset type: final production background for SIGNAL BREAKER construction-site arcade game, one single wide 16:9 landscape image, target 3072x1728 or highest native detail. Scene: daylight industrial construction delivery bay, massive steel frame and concrete floors, cranes and stacked formwork deep in distance, realistic weathered materials and layered depth, cinematic but restrained neutral natural light. Camera side-on gameplay plane: continuous flat catwalk FLOOR TOP MUST BE at 86.5 percent of image height, horizontal and spanning edge to edge; bottom 13.5 percent shows realistic grated walkway supports. Leave central 70% of image above floor spacious and low contrast for moving targets; detailed structure on left/right edges and distant skyline. No people, no weapons, no floating game objects, no HUD, icons, text, borders, logos or watermark. Sharp physically believable industrial materials, not a poster, no teal orange grading. This is production art not a UI mockup. A distinct delivery yard unique to the game's first reflection stage.

## 컨베이어·집진·양중 공통 명세
아래 Scene 각각을 동일한 공통 명세와 조합해 개별 호출했다.

Use case: stylized-concept. Asset type: one final production background for SIGNAL BREAKER side-on construction arcade game. Single wide 16:9 landscape, highest native resolution and detailed realistic industrial textures. Scene: [각 Scene]. Composition: camera at same side-on horizontal catwalk gameplay plane, continuous flat platform with top at 82% image height edge to edge; remaining bottom18% shows grating and realistic supports. Central 65% above platform must be spacious with subdued distant contrast, foreground structure concentrated at edges. Distinct realistic materials and architectural identity. No characters, no targets, no weapons, no HUD, text, logos, borders, watermark or icons. No collage. Avoid excessive teal orange grading. This artwork is actual game background not UI mockup.

### 컨베이어 → art/map-conveyor-v2.webp
conveyor receiving hall in a concrete construction site. Pale concrete interior, warm morning sunlight entering through large loading doors, real stacks of timber formwork, pallet handling equipment parked at edges, visible belt mechanism integrated into the lower foreground walkway.

### 집진 → art/map-extraction-v2.webp
dust extraction passage in an unfinished underground concrete structure. Cool diffuse work lighting, muted grey stone and earth palette, extraction ducts and filtration machinery on edges, dusty background light shafts, industrial pipes, cavernous layered depth. Clear air in foreground gameplay space.

### 양중 → art/map-hoist-v2.webp
high-rise hoisting and tension assembly platform. Open sky at overcast late afternoon, tower crane and hanging cable mechanisms in distance and frame edges, heavy structural steel bracing, red and yellow construction markings, deep visible urban building levels. Calm neutral lighting.

## 전력 중계실 → art/map-power-v2.webp
Use case: stylized-concept. Asset type: final production background for SIGNAL BREAKER boss stage, single wide16:9 3840x2160 high resolution landscape if supported. A construction site's temporary power distribution and relay room at night, realistic huge switchgear cabinets and braided cable ducts on edges, metallic concrete surfaces, restrained white worklights and purple status lamps, layered deep interior with central spacious low contrast combat area. Side-on flat horizontal catwalk floor top at82percent height, lower18percent grated walkway supports and cable trenches. Very sharp detailed physically plausible texture, unique architecture. No characters, boss, floating targets, HUD, icons, text, logos, borders or watermark. No collage, no painted game UI.

## 장치 6종 → art/industrial-devices-v2.webp
Use case: stylized-concept. Asset type: production sprite atlas for SIGNAL BREAKER, ONE transparent image with exactly SIX separate realistic detailed industrial devices in a strict3-column by2-row grid. Each object centered fully inside its own equal cell with generous padding and no shadow extending out of cell. Camera front orthographic, consistent steel industrial material with scratches and warm neutral highlights, high silhouette clarity. Top row left: long horizontal hydraulic deflector shield bar with black yellow edge stripes. Top row middle: round impact buffer with black rubber center and steel bolts. Top row right: circular electromagnet induction assembly with copper coil and two small teal light poles. Bottom row left: tall narrow dust collection recovery portal, two vertical metallic pillars and a green illuminated central opening. Bottom row middle: compact hexagonal relay junction module with sockets and amber indicator. Bottom row right: substantial round power switching hub boss casing, intricate nested steel rings, three heavy insulated cable outlets, dark violet core. Exactly3x2 equal cells, all six unique silhouettes, no labels, no letters, no text, no HUD, no canvas backdrop, no checkerboard drawn, genuine alpha background. NO characters, NO extra objects.

## 아이콘 → icon-192.png / icon-512.png
Use case: stylized-concept. Asset type: unique final512x512 app icon for SIGNAL BREAKER industrial arcade game. Square full bleed dark graphite textured steel background, a single visually bold forged steel reflection shield plate crossed by a small warm golden pulse spark, a subtle cyan deflected arc conveys reflection and breaking a danger chain. Centered main subject inside central65percent safe zone for adaptive masks. Premium realistic3D industrial construction material, tactile brushed steel bolts and warm emissive impact, crisp recognizable silhouette at48pixels, restrained details, unique to this game. No letters, numbers, text, branding, watermark, borders, grid or UI.

## 검수 및 통합
생성기가 지킨 실제 바닥 위치와 요청 위치는 다를 수 있다. 생성 이미지에서 자동으로 충돌 좌표를 만들지 않았다. 실제 바닥·지지 구조의 경계를 눈으로 측정한 후 렌더러에서 고정 월드 좌표에 연결했다. 장치 아틀라스도 실제 물체별 경계를 측정하여 코드에서 각 영역을 사용한다. 원본 PNG를 색·내용 변경 없이 WebP로 인코딩했고 아이콘은 표준 PWA 크기로 패키징했다. 실행용 저장 경로는 `public/signal-breaker-dev/` 아래다.
