# SIGNAL BREAKER — 기록·세 영역 조작·브랜드 로딩 v6

2026-10-10 · 사용자의 4개 수정 지시를 구현한다. v5의 오른손 드래그 후 떼기 발사는 기본 조작에서 교체한다.

## 1. 메인 기록

해금 구역/현장 연구의 두 숫자 요약을 메인에서 제거했다. 기존 `projectEpisodeJourney`, 실제 `session.review()` 및 `EpisodeRecord`를 재사용하여 **챕터01의 다섯 장면 경로와 선택 기록 상세**를 메인에 복원했다. 다섯 개의 신규 챕터를 만든 것으로 표시하지 않는다.

인물 이미지 카드 → 장면 선택 → 진행 상태·제목·맥락 → 실제 선택 기록을 표시한다. 기록이 없으면 없다고 표시하며 점수·선택을 만들어 채우지 않는다. 전체 기록과 기존 진행 경로 상세로 이동할 수 있다. 가로 화면에서 예전 숫자 요약을 숨기던 CSS와 충돌하지 않도록 명시적으로 표시한다. 스크롤 중 현장 배경을 유지한다. 기존 워치의 연구/해금 데이터는 삭제하지 않는다.

## 2. 세 영역 조작

| 위치 | 행동 | 엔진 결과 |
|---|---|---|
| 좌측 패드 | 수평 드래그 이동 | 선택한 발사 각도와 방향 유지. 상하 흔들림은 무시 |
| 우측 패드 | 방향 벡터 직접 지정 | 좌우 방향과 상향 각도5~90도. 손을 떼어도 유지 |
| 중앙 발사 | 누르면 발사, 누른 동안 쿨다운에 맞춰 연속 발사 | 실제 터치가 유지되는 동안만 발사. 떼기/취소/정지/나가기 즉시 중단 |

오른손 패드만 만져서는 발사하지 않는다. 기본 모드에서 현장을 터치해서 발사하거나 마우스 이동으로 조준이 바뀌지 않는다. 기존 직접 화면 조준은 선택 가능한 정밀 모드로 남긴다. 이전 저장의 연동 모드는 새 기본 `twin`으로 전환한다. PC 수동 발사 키는 유지한다.

이동과 조준 방향은 독립적이다. 우측에서 왼쪽을 조준한 상태로 오른쪽으로 이동할 수 있다. `move(..., false, true)`가 조준점의 상대 거리를 보존하며 `setAimDirection`이 선택한 방향/각도를 지정한다. 조준점의 맵 경계 clamp로 각도가 변하지 않는다. 방향 전환을 위해 별도의 버튼을 추가로 누르지 않는다.

우측 선택 → 손을 떼어 값 유지 → 중앙 발사로 손을 옮기는 두 손 사용이 가능하다. 세 포인터 동시 입력도 브라우저 검증한다. 실제 기기의 손 도달과 감도는 별도 확인한다.

## 3. 화면 가림과 장식

새 투명 고해상도 금속 조준 링을 제작했다. 좌/우 패드와 중앙 발사에 같은 산업용 정밀 장비의 재료 언어를 적용한다. 링의 중앙과 외곽은 실제 alpha 투명이며, 채워진 유리 패널을 덮지 않는다. 작은 이동 손잡이와 조준점만 중앙에 남긴다. 장비·장치 버튼 배경도 낮은 불투명도로 줄인다. 오른쪽에 현재 조준 각도를 표시한다.

레이아웃상 중앙 발사는 변환된 장비 그룹 밖에 배치하여 fixed 좌표가 그룹에 묶이는 오류를 방지한다. 실물 원본 확대의 추가 미술 검수를 Final Art Lock과 구분한다.

## 4. 메인으로 나가기

플레이·결과·전술맵에서 접근 가능한 상단 `↗ 메인` 링크를 추가한다. 이동/조준/발사를 해제하고 진행 중 게임을 정지하며 음향 세션을 종료한 뒤 기존 기록을 저장하고 메인으로 돌아간다. 진행 중 작전 자체의 중간 저장/이어하기를 새로 구현한 것은 아니다. 확정된 기록/보상은 기존 오프라인 저장으로 보존한다. 정지 메뉴의 기존 메인 링크도 유지한다.

## 5. 브랜드 로딩

새 키아트: 정밀 금속 반사 장치, 청록 펄스, 해소되는 금색 위험 연쇄, 산업 현장의 빛과 재료. 이미지에는 글자/버튼을 합성하지 않았다. `SIGNAL BREAKER`와 ‘각도를 바꿔, 흐름을 끊어라.’는 선명한 HTML 글자로 표시한다.

진입 순서: 로딩 키아트 → 필수 자산 실제 준비 비율 → 캐릭터 디코드 준비 → 플레이. 필수 준비 대상은 키아트·투명 링·코어/장치/장비 아틀라스·현재 방향 맵·선택 캐릭터다. 게임 시간은 준비 중 정지한다. 최소850ms의 브랜드 등장 연출 후 준비되면 바로 시작하며 별도의 작전 개시 버튼은 요구하지 않는다. 20초 내 자산이 준비되지 않거나 실패하면 재시도와 메인 복귀를 표시한다.

이미지의 느린 깊이 변화와 청록 광원을 CSS로 연출하며 `prefers-reduced-motion`에서는 끈다. 숫자 진행률은 완료된 실제 자산 수로 계산한다. 대량 입자/실시간 영상 다운로드를 로딩에 추가하지 않는다. 브라우저 게임 내부 로딩을 교체한 것이며 Android/iOS가 설치 앱을 여는 순간 표시하는 OS 기본 시작 화면은 별도 네이티브 영역이다.

## 6. 제작 자산·프롬프트

내장 imagegen을 사용했다. 원본은 키아트1672×941 RGB, 링1262×1246 RGBA이다. WebP94 인코딩만 수행하고 원본 크기를 유지했다. 링 중앙 alpha0을 확인했다. 자산·크기·바이트·해시는 `public/signal-breaker-dev/art/production-v5.json`에 기록한다. 이전 맵·아이콘은 삭제하지 않는다.

### 키아트에 사용한 프롬프트

> Use case: stylized-concept. Production game loading key art for SIGNAL BREAKER within NEW PSI ZERO DAY. Cinematic high fidelity industrial construction safety arcade, an elegant luminous turquoise pulse reflecting off a precision polished steel deflection plate, breaking a dangerous amber energy chain into controlled fragments, realistic crane lattice and wet construction platform at dusk, strong physical materials, volumetric atmosphere. Wide landscape composition but central subject also survives portrait center crop. Leave central upper third calm dark blue space for code-rendered branding. Distinctive curved reflected light path, turquoise and warm amber. No text, letters, UI, logos, borders, watermark. Highest native resolution supported.

### 투명 장식에 사용한 프롬프트

> Use case: stylized-concept. Single premium game control ornament on genuine transparent background. Centered circular precision machined brushed titanium aiming gimbal rim, thin elegant ring with turquoise illuminated radial ticks and subtle warm brass anchor points, extremely high fidelity material detail, industrial optical instrument from construction-site arcade SIGNAL BREAKER. Center aperture must be completely empty transparent, diameter of empty aperture 75% of total diameter. Exterior also transparent, no filled glass disc, no background, no shadow rectangle. Perfect front-on symmetrical circle, one ring only. No letters numbers text logo watermark. Asset for small transparent touch-control overlay.

## 7. 검증

- 순수 엔진: 이동 중 독립 방향/각도 보존, 기존 충돌·장비·3구간·보상 회귀.
- 메인: 실제 장면 카드5개, 선택 상세, 기록 없음 표시, 기존 경로/전체 기록 연결.
- 브라우저: 6viewport, 실제 링크 진입, 실제 자산 대기 상태의 로딩 캡처, 준비 후 자동 진입, 좌/우 독립·중앙 발사, 세 포인터/취소, 현장 터치 무발사, 메인 복귀.
- 미술: 5작전×세로/가로 맵 실제 로드, 패드·발사 화면 경계, 투명 alpha.
- QA 캡처를 위해 링 자산 응답을 일시 보류했다가 해제했다. 제품에 가짜 대기시간/진행률을 추가한 것으로 기록하지 않는다.

검증 증거는 `docs/qa/signal-breaker-twin-20261010/`에 보존한다. 실제 선택 기록이 없는 브라우저는 기록 없음을 표시한다. Android/iPad의 손 감도·FPS와 최종 미술 Lock, OS 시작 화면, 운영 URL 배포는 별도 판정이다. 기존 마스터 바이블의 WORLD FIRST / MOBILE FIRST와 장비·안전·보상 계약을 유지한다.
