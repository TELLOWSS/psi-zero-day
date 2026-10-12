# PSI 세계관 원화와 UI 부품 제작 기록

제작일: 2026년 10월 13일. 도구: built-in imagegen. 신규 독립 생성 4종과 UI 배경 추출 보정 1회. 타 게임·작가·브랜드를 참조하지 않았다. 배경 3종은 불투명 PNG, UI는 투명 RGBA PNG다. 아래 파일은 프로젝트의 최종 후보 자산이며 화면 적용과 최종 미술 승인은 별도다.

## PSI-WORLD-01

파일: `public/signal-breaker-dev/art/psi-rpg-world-v1.png`

규격: 1672×941, 2844052 bytes, Git blob 920a227c44ffda6aad0129e449250761e6e16e19.

용도: world-entry.

실제 생성 프롬프트:

Use case: stylized-concept. Asset type: original production background key art for PSI construction-site character-growth game, cinematic wide landscape 16:9. Scene: a believable contemporary Korean construction site at dawn, partially completed concrete building rising from foundation work, cranes, rebar staging, carefully maintained pedestrian barriers and clean access paths, a modest on-site coordination cabin on the right, distant city in morning haze. Human-scale, hopeful and serious, the story is people noticing small warning signs before accidents. No disasters, monsters, explosions, guns, military imagery, people, text, logos, numbers or watermark. Materials: realistic concrete, worn galvanized steel, navy equipment enclosures, restrained teal indicator lamps and amber work lights. Composition: deep layered world, center area spacious and lower contrast for interface text, focal site structures on the outer thirds, details remain legible on a phone, no dark empty void. Premium cinematic game environment illustration with physically coherent lighting, detailed yet readable, natural colors. Entirely original design, no franchise or artist imitation.

## PSI-BASE-01

파일: `public/signal-breaker-dev/art/psi-rpg-base-v1.png`

규격: 1672×940, 2351646 bytes, Git blob 0c89330e14811a0275add7ff6fc7fc6239ad2fcd.

용도: shared-base.

실제 생성 프롬프트:

Use case: stylized-concept. Asset type: original production background for a PSI game shared operations hub, wide 16:9 landscape. A contemporary Korean construction-site coordination cabin interior at sunrise, human-scale and practical, navy steel cabinets, weathered brass fittings, neat paper records without readable writing, small teal equipment indicator lamps, a rugged tablet cradle and safety helmet on the far-right workbench, broad windows showing a partially built concrete building and cranes outside. The place feels maintained and inhabited by a thoughtful safety team but contains NO people. Composition for actual game UI: left 45 percent is a softly lit low-contrast graphite interior with believable shelves/wall texture, enough quiet visual space to overlay navigation and character growth controls; right and upper portions carry the workspace and site context. Keep depth and daylight visible, no blank black void, no floating holographic menus. Premium cinematic environment illustration, physically believable concrete/steel/glass, restrained teal and warm amber work lights, natural lighting, fine material detail. No text, symbols, logos, numbers, UI controls, watermark, firearms, military imagery, fantasy motifs, franchise imitation.

## PSI-LAB-01

파일: `public/signal-breaker-dev/art/psi-rpg-lab-v1.png`

규격: 1672×941, 2149849 bytes, Git blob 01d69fee8d543d46ccacc37e9ebb33371be971d0.

용도: weapon-research.

실제 생성 프롬프트:

Use case: stylized-concept. Asset type: original production background for a PSI industrial weapon-research game screen, cinematic wide 16:9 landscape. Inside a small contemporary construction-site engineering workshop, precision research bench with original signal-control equipment: a compact brass-and-steel electromagnetic coil, a ceramic optical laser module with a violet glass prism, neatly coiled protective cables and a mesh containment pod. Devices are research components, not rifles, no guns. Small restrained teal and amber indicator lights, finely worn metal, practical drawers, natural morning light through upper windows with concrete site structures outside. Composition for actual UI: equipment is clearly arranged in the left third and lower left foreground; the right 60 percent is low-contrast layered navy/graphite workspace and softly lit frosted interior panels, visibly part of a real workshop yet quiet enough for a branching research tree overlay. Preserve spatial depth and realistic material detail, no empty black void, no floating UI or holographic interface. Premium cinematic game environment illustration, original coherent industrial design. No people, text, numbers, logos, labels, watermark, franchise or artist imitation, magic, military motifs or explosive effects.

## PSI-UI-PARTS-01

파일: `public/signal-breaker-dev/art/psi-rpg-ui-parts-v1.png`

규격: 1536×1024, 2345439 bytes, Git blob 9355123a88c2aa85efe0772560b589dd38783a71.

용도: growth-ui-components.

실제 생성 프롬프트:

Use case: stylized-concept. Asset type: original production transparent game UI component atlas for PSI industrial character-growth game. Precisely spaced 3 columns by 2 rows, six independent components centered in equal square cells with generous transparent padding. No grid lines or text. Row1: an empty industrial research card bezel, beveled graphite and weathered steel rectangular frame with small brass corner fixtures, its entire interior is transparent; an active selection bezel of same language with restrained teal edge illumination, entire interior transparent; a locked inactive bezel in neutral dull steel with a small mechanical clasp, no letters, its interior transparent. Row2: an observation skill medallion with a real glass sensor lens and compact protective metal housing; a cooperation skill medallion depicting two mechanically joined protective cable couplings, brass and navy metal; a path-control skill medallion depicting a small angled polished reflection plate and a restrained teal signal arc. High-quality finely rendered industrial metal/glass/ceramic detail, legible at small game UI size, realistic bevels and restrained light, no extravagant spikes or ornate fantasy scrollwork. Keep silhouettes distinct, objects do not touch each other. All space outside components and all empty bezel interiors must be genuine alpha transparency, no baked checkerboard, no backdrop. No words, numbers, letters, logos, watermark, franchise or artist imitation.

## UI 보정 이력

초기 UI 아틀라스를 대상으로 배경 추출과 개방 영역 정리를 요청했다. 원래 소재와 배치를 유지했고 가장 최근 생성 이미지 1개만 편집 대상으로 사용했다. 최종 납품은 보정본이며 초기본을 별도 최종 자산으로 납품하지 않는다.

실제 보정 프롬프트:

Use case: background-extraction. Edit the most recent six-component industrial UI atlas only. Preserve exactly the six metal/glass components, their original placement, dimensions, surface detail and colors. Remove the entire blurred brown/gray backdrop and every cloudy haze layer: the canvas outside the components and the open centers of the three rectangular bezels must be truly fully transparent alpha, not painted black, brown, white or checkerboard. Also remove the backdrop visible through the open circular gaps of the bottom cooperation and reflection medallions while preserving the actual cable couplings, reflection plate, metal rings and cyan arc. Preserve the sensor's glass lens as an actual component. Restrained edge glows only very close to metal. No new objects, text, logos, shadows covering the empty background, or compositional changes. This is a production cutout atlas to overlay a game world, so open spaces must let that world show through.

## 검증과 권리 구분

PNG 규격과 채널 정보를 확인하고 UI의 실제 픽셀 alpha를 확인했다. 원화 생성·보정은 imagegen만 사용했으며 JavaScript 디코딩은 검사에만 사용했다. 로컬 실행 환경 연결이 끊겨 WebP 변환·크롭·9-slice·실 화면 연결과 오프라인 검증은 진행하지 않았다. 사용권·제3자 권리·최종 미술 검토는 전체 RPG 기획의 상업 출시 기준을 따른다. 독립 생성 기록만으로 전체 법적 검토의 완료를 선언하지 않는다.
