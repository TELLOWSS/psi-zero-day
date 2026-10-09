# 현장 휴게실 핀볼 구현 · 2026-10-10

## 플레이와 그래픽

기존 보급 상자 회수 화면을 전용 현장 핀볼로 교체했다. 준비·성공·실패 화면의 기존 보너스 입장 경로를 사용한다. 전투가 진행되는 화면에 진입 버튼을 새로 넣지 않았고, 본게임의 전투 시간·몬스터·장비 능력은 보너스에 개입하지 않는다. 휴게실 오락기라는 표현으로 현장 위험을 오락 대상으로 수행하는 설정과 구분한다.

- **전용 원화:** 금속·청록 에나멜·황동·주황 조명으로 이어지는 테이블, 투명 패들, 투명 크레인 자재를 built-in imagegen으로 제작했다. 새 도형이나 이모지를 설비 원화로 대신하지 않는다. 공은 실제 위치에 반사광·그림자를 그리는 동적 구체이고, 접촉광·범퍼 점등은 라이브 합성 효과다.
- **충돌:** 600×900 기준 좌표와 원화의 실제 범퍼 중심·외곽에 충돌을 맞췄다. 최대 1/240초 간격, 속도 상한, 원형 범퍼·캡슐 레일·회전 패들의 실제 접촉 속도를 사용한다. 위쪽 범퍼와 레일 사이에도 공이 통과할 공간을 둔다.
- **삼세번:** 한 입장에 공 세 개, 공당 최대 30초. 다음 공은 직접 발사하므로 읽는 동안 기회를 쓰지 않는다. 처음 4초의 빠른 배수는 공당 한 번 보호한다. 네 번째 발사는 거부한다. 기존 메뉴에서 새 판을 여는 것은 허용되며 전체 서비스 횟수 제한이나 유료 재도전은 추가하지 않았다.
- **손맛과 연쇄:** 패들 타이밍에 따른 반사, 금속·둔탁한 반동·연쇄의 기존 녹음 음원, 범퍼 세 개 점등 시 자재 인양·조명과 1,000점 연쇄를 제공한다. 빠른 이펙트나 점수 팝업으로 공을 덮지 않는다.
- **보상:** 첫 발사에 100 PSI를 확보하고, 점수 100당 5 PSI가 추가되어 한 판 최대 400 PSI. 기존 최고 보상 400을 유지하면서 초보자 최저 획득을 보장하는 시작값이다. 패들 보조와 유료 장비에 따른 보상 배율은 없다. 일찍 마쳐도 확보한 보상을 기존 장비 지갑에 저장한다.
- **일시정지:** P/Esc, 일시정지 버튼, 창 이탈·숨김에 대응한다. 돌아왔다고 자동으로 다시 움직이지 않는다. 읽기·창 이탈로 시간을 잃지 않는다.
- **모바일:** 두 손가락 동시 패들, 취소·캡처 해제·키 해제, 세로·가로 레이아웃, 포커스 순환을 지원한다. 원화의 2:3 비율을 강제로 늘리지 않는다.
- **가로 화면 HUD:** 제목·점수·공 사용 수·남은 시간은 안내 스크롤 밖에 고정한다. 테이블과 두 패들은 전체가 보이는 독립 칸에 배치한다.
- **성능:** 기존 smooth/recommended/vivid의 픽셀 비율을 사용한다. smooth와 감소된 움직임 설정은 장식 섬광·인양 움직임을 줄이며 물리·판정·보상은 유지한다. 정지한 화면은 변경 없는 캔버스를 다시 그리지 않는다.
- **캐릭터·기억:** 선택 캐릭터의 짧은 휴식 대사와 개인 최고 점수·최고 연쇄를 제공한다. 최고 기록은 보상 저장 성공 뒤 선택적 로컬 기록으로 저장하며 지갑과 분리한다. 기록 저장 불가가 지급 완료한 보상을 취소하지 않는다.

원화가 준비될 때까지 발사는 비활성화한다. 로딩 실패는 안내하고 임시 아트를 보여주지 않는다. 저장 실패 시 보상 값을 유지하고 재시도하며, 성공 뒤 중복 지급하지 않는다. 보너스 도중 브라우저 자체를 닫거나 새로고침하면 진행 중인 판은 복원하지 않으므로 **마치기 버튼으로 저장한 뒤 나가는 흐름**이 현재 구현 범위다.

## 파일과 원화 출처

엔진: `src/engine/survivors-pinball-engine.ts`. UI·렌더러: `src/ui/SurvivorsBonusStage.tsx`, `src/ui/survivors-pinball-renderer.ts`, `src/ui/survivors-bonus-stage.css`. 개인 기록: `src/app/survivors-pinball-record.ts`. 한국어 문구: `content/localization/survivors-bonus-ko.json`.

실제 소비 자산:

| 파일 | 용도 |
|---|---|
| `public/assets/survivors/pinball/factory-playfield-v2.png` | 케이블·자재를 분리한 최종 테이블 후보 |
| `public/assets/survivors/pinball/flipper-v1.png` | 회전 패들의 투명 원화 |
| `public/assets/survivors/pinball/crane-cargo-v1.png` | 인양 자재의 투명 원화 |

테이블의 초기 원본 `factory-playfield-v1.png`는 제작 출처이며 v2를 실제 사용한다. 도구는 built-in `image_gen.imagegen`, CLI/API 우회 없음. 생성 원본은 `C:/Users/user/.codex/generated_images/01a11d14-64ed-7052-a499-63110506a078/`에 있으며 모두 프로젝트 안으로 복사했다. 현재 후보는 실제 화면 검수를 거쳤으며 Director의 최종 아트 Lock을 자동 선언하지 않는다.

### 사용한 최종 프롬프트 세트

테이블 생성:

> Use case: game-art. Production asset for a high quality industrial nostalgic pinball game, not a mockup. Create a portrait 2:3 perfectly orthographic top-down pinball PLAYFIELD BACKGROUND, edge-to-edge. Premium detailed hand-painted realistic 3D game art, brushed gunmetal, aged teal enamel, brass fasteners, amber practical lighting, Korean construction site themed miniature conveyor and crane mechanism on upper perimeter, precise fabricated rails. Geometry important: playable inner field from x=8% to92%, y=8% to90%. THREE circular physical bumper housings centered exactly (32%,30%), (68%,30%), (50%,48%), radius5% of width. Upper perimeter integrated miniature crane and steel bundles, left/right rebound rail edges; keep center travel area clean textured steel. Lower 25% a mostly OPEN empty playfield for real animated flippers; NO painted flippers, NO balls, NO characters, NO UI, NO lettering, NO scoreboard. Narrow launch lane on far right x=94%. Lower center drain gap at x=42%-58%. Sophisticated material texture, depth in mechanical components, no perspective foreshortening or isometric camera. Strong readable silhouettes, rich warm and cool light, pleasing tactile toy craftsmanship, no neon overload. Final game background image only.

테이블 v2 편집 — 실제 출력에서 범퍼 좌표를 다시 측정하여 엔진에 적용했으며 프롬프트 좌표를 그대로 믿지 않았다:

> Edit target: this factory pinball playfield. Change ONLY the centrally suspended steel beam bundle, its hook and the vertical cable hanging from the overhead crane near the very top center. Remove that central cargo, hook and cable cleanly, reveal matching worn steel floor beneath, keep the horizontal overhead crane bridge and all peripheral machinery. This is a production background for an animated cargo sprite to be layered there. Keep ALL three round bumpers, positions, side rails, materials, lighting, size, orthographic composition and every other part exactly unchanged. No text, no new objects, no flippers, no balls.

패들 — transparent_background=true:

> Use case: game-art. A single premium industrial pinball FLIPPER paddle sprite on truly transparent background. Orthographic directly overhead, horizontal pointing RIGHT. Left circular pivot at x=15%,y=50%, elongated tapered capsule extends to x=95%,y=50%. One isolated object, canvas width:height approximately 3:1. Fabricated brushed steel upper face with beveled chrome rim, aged dark teal enamel on narrow inset strip, tiny brass bolts, thick amber orange rubber bumper edge, physically credible beautiful tactile mechanism matching a realistic miniature factory pinball table. Top-left warm practical lighting, subtle metal highlights. No floor, no baseplate outside the paddle, no cast external shadow, no text, no glow, no other objects, no perspective. Clean antialiased silhouette alpha. Production game sprite.

자재 — transparent_background=true:

> Use case game-art. Production isolated sprite on transparent background matching a premium realistic industrial pinball playfield. Perfect orthographic top-down view of ONE short bundle of silver steel I-beams lying horizontally LEFT to RIGHT, bound by two ochre brass lifting straps, a compact dark crane hook at upper center attached to the straps. Top-down miniature fabricated industrial machinery with very fine brushed steel, warm amber highlights, charcoal metal recesses, realistic tactile material. Tight composition approximately 2:1 width:height, object entirely inside frame. No floor, no background, no text, no additional objects, no perspective foreshortening, no long cable, no external shadow. Actual alpha transparency.

## 검증과 남은 범위

`tests/survivors-pinball-engine.test.ts`는 충돌 관통·회전 패들·세 공·보호·연쇄·보상 상한·시간 검증과 자연 보조 시뮬레이션을 검사한다. `tests/survivors-pinball-record.test.ts`는 최고 기록·잘못된 값·저장 불가를 검사한다.

`tests/verify-survivors-pinball.mjs`는 실제 앱에서 입장·원화 로딩·2:3 비율·키보드·두 손가락·보조·일시정지·세 공 완료·지갑 저장·중복 방지·새로고침 후 유지·실패 재시도를 확인한다. PC 1440×900, 모바일 390×844와 844×390. 완료·최고 보상 경로는 QA가 공을 범퍼에 배치하고 시간을 줄여 검사한다. 자연 입력 샘플과 실제 사용자 체감 검증을 구분한다. 녹화·스크린샷·보고서는 `artifacts/pinball/`, 회귀·빌드 로그는 `artifacts/pinball-tests.log`, `artifacts/pinball-build.log`.

최종 전체 회귀 **1,949개 통과 / 기존 1개 건너뜀**, 타입 검사·프로덕션 빌드 통과. PC·모바일 두 화면의 브라우저 오류·가로 넘침 없음. 모바일 가로의 테이블·두 패들·제목이 화면 안에 전부 들어오는 것까지 검사했다. 초기 검수에서 보인 원화 늘어짐·세로 안내 줄바꿈·가로 버튼 잘림을 실제 레이아웃에서 보정했다. 기존 500kB 초과 청크 경고는 유지한다.

테트리스형 자재 적재왕은 다음 카드로 남긴다. 입장 횟수 정책과 실제 장비 구매 속도를 보며 보상 시작값을 검토할 수 있다. 휴대폰 실기기 성능·터치 감각·스피커 타격감과 최종 아트 판정은 실제 플레이 검수 대상이다. GitHub/Vercel 배포는 이번 요청에 포함하지 않았다.
