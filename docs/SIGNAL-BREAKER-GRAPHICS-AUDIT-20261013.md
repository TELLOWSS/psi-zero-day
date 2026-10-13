# 시그널 브레이커 그래픽·이미지 확인검증 및 개선

2026-10-13 / 릴리스 `0.52.0-visual` / 이전 기준 `ed6acfd1`

기준은 기존 산업 현장 세계관, 4종 신호·6장비·5설비 보스와 Phase D visual gate다. 시그널 브레이커의 원본 이미지와 합성된 실제 화면을 함께 검토했다. 파일 해시 통과를 최종 아트 승인으로 계산하지 않으며 `finalVisualLock:false`를 유지한다.

## 확인한 사항

| 범위 | 확인 결과·처리 |
|---|---|
| 로딩 키아트·현장 배경·회복 엔딩 | 기존 건설/집진/전력 현장의 금속·조명·동선 맥락을 유지. 대표 원본과 구역별 화면 확인, 이번에 다시 제작하지 않음 |
| 5종 보스 | 기존 러스트 메탈·산업 설비 원화와 실제 아레나 연결 확인. 재제작보다 카메라·UI 가림 수정이 우선 |
| 캐릭터 | 기존 PPE·방향·발사 연기를 유지. 작은 세로 보스전에서 장식 배경 전체를 축소하느라 몸과 장비가 너무 작게 보이는 합성 문제 수정 |
| 6종 도구·발사체·보급·방출 신호 | 원본 atlas, 투명도, 대표 실행 화면 확인. 기존 구분 색과 재질 유지. 뷰어에서 보이는 투명 경계의 색만 보고 색 번짐 결함으로 단정하지 않고 실제 alpha를 검사 |
| 4종 재질 코어 | 세부 파편/구름이 작은 셀에서 복잡하고 셀 여백이 좁음. 기존 소재·색을 보존한 교체 atlas 제작, 투명 gutter 추가, 측정한 물체 영역을 원래 비율로 그리도록 연결 |
| 세로 보스전 | 배경 전체 높이를 축소 기준으로 쓰던 카메라를 캐릭터·보스·약점 기준으로 변경. 보스 상단 HUD 여유와 발끝 공간 유지 |
| 작은 세로 화면 | 캔버스만 가로로 넓으면 가로 카메라가 선택되던 판정 수정. 실제 브라우저 방향을 기준으로 세로 배경·카메라 선택 |
| 보스 상태/성장/메인/전체 경로 | 성장 정보가 보스 상태창과 겹치거나, 메인/경로 버튼이 보스 윗부분을 가리는 문제 수정. 세로에서는 아래쪽으로 이동 |
| 메모리·배포 | 새 atlas는 원본 생성 PNG 그대로 사용. 1254×1254 RGBA, 1,187,875 bytes. 기존 atlas와 해상도는 같고 전송 파일 크기는 약 0.63MB 증가. 캐시 버전과 98개 자산 해시 갱신 |

## 실제 제작·연결한 이미지

`public/signal-breaker-dev/art/core-materials-v3.png`

- built-in `image_gen`으로 기존 `core-materials-v2.webp`를 편집했다. 첫 후보 뒤 투명 여백만 조정하는 두 번째 편집을 시행했다.
- 2×2 순서: 금속/cyan, 분진/ochre, 전력/violet, 하중/orange. 기존 구분 색·현장 소재·정체성을 유지했다.
- 생성된 원본 PNG를 프로젝트로 복사했다. 별도 픽셀 편집이나 생성 결과를 대신하는 SVG/placeholder를 넣지 않았다.
- 셀별 alpha 영역을 측정하여 `[145,129,407,441]`, `[718,135,416,423]`, `[113,729,467,413]`, `[795,717,297,443]` source crop을 사용한다. 종횡비를 유지하며 최대 변이 기존 물리 지름을 넘지 않게 그린다.
- 전체 1,572,516픽셀 중 1,112,155픽셀이 완전 투명이다. 셀 가장자리 40px 영역에서 alpha>16인 픽셀은 0개로 측정했다. 인접 셀 그림이 들어오지 않는다.
- 기존 코어 반지름, 위치, 안정화/회수 조건, 장비 피해량은 변경하지 않았다. 원본 v2는 보관하고 런타임·로딩·오프라인 캐시는 v3를 사용한다.
- 제작 기록과 SHA-256: `public/signal-breaker-dev/art/production-v7.json`.

## 검증과 한계

- 변경 전 3개 화면×5보스 **15개 구도**를 캡처해 확인했다. 변경 후 390×844/360×640/844×390/1440×900 × 5보스 **20개 구도**에서 본체·약점·발끝 경계, 실제 이미지 로드, JavaScript 예외, atlas gutter를 검사했다.
- 390×844에서는 캐릭터의 렌더 기준 높이가 보스별 **약 51~60px**, 360×640에서는 **약 33px**이다. 작은 화면은 보스·모든 약점·캐릭터를 함께 담는 조건을 우선한다. 실기에서 체감 크기/조작성 확인은 남아 있다.
- 카메라와 원화 source crop 테스트는 렌더 과정이 게임 상태를 변경하지 않으며 이미지가 물리 지름을 넘지 않는지 검사한다. 본편 **2,059 테스트 통과 / 1 skip**, 브레이커 **254 테스트 통과**, 타입 검사·빌드 통과.
- 기존 기기 8개 화면 회귀와 UI·UX 8개 화면 검사 통과. 보스 캡처는 격리된 훈련장 fixture이며 실제 캠페인 승리나 밸런스 증거로 계산하지 않는다.
- 배포 후 운영에서 20구도 및 98개 실제 자산 해시를 다시 확인한다. 기존 대형 번들 경고는 남아 있다.

증거: `artifacts/graphics-20261013/`의 `before-*.png`, `alpha-before.json`, `after/graphics.json`, 변경 후 PNG, `device/`, `uiux/`, 테스트/빌드 로그. 검증 스크립트: `public/signal-breaker-dev/scripts/verify-visual-audit-20261013.cjs`. 요약: `docs/qa/graphics-audit-20261013.json`.

이번 범위에서 모든 배경·캐릭터 원화를 새로 제작했다고 주장하지 않는다. 신규 코어와 합성 개선은 런타임에 통합한 production candidate다. Director의 전체 아트·모션·사운드 최종 승인, Android/iOS 실기 GPU/발열/작은 화면 판독성, 사람의 스타일 이질감 평가는 별도 확인 항목이다.

## 제작 프롬프트 기록

실행 방식: 기본 built-in image_gen, CLI/API fallback 사용 없음. 첫 입력은 기존 v2 atlas, 두 번째 입력은 첫 생성 후보이다.

첫 편집:

> Use case: precise-object-edit / background-extraction. Edit the supplied existing industrial game material-core sprite atlas for the same game, as a production replacement, not a concept sheet. Preserve exactly FOUR sprites in a square 2 by 2 equal-cell atlas, order top left metal steel scrap with cyan signal detail; top right warm ochre construction dust cloud; bottom left paired electrical insulators linked by violet electrical arcs; bottom right orange black hazard-striped crane load hook and steel suspension. Preserve these identities, existing material colors and realistic stylized industrial rendering. Each subject centered in its own equal square cell, entirely contained with at least 12% transparent margin on every side of each cell; no sprite crosses the center divider. Make shapes compact, clean, distinct and legible when a cell is displayed at only 28 to 70 pixels: fewer fine fragments, stronger broad material shapes, no stray noise, subtle restrained cyan/violet energy confined to the subject. Keep metal surfaces solid opaque with neutral highlights; soft dust may have controlled translucent edges. Use clean antialiased alpha edges, truly transparent empty background and transparent gutters; absolutely no black/colored rectangular background, checkerboard drawing, labels, text, extra objects, frame or outer glow filling cell margins. No new fantasy creatures, jewels, weapons or interface. Make a coherent final-quality atlas matching the supplied industrial sprites. Square canvas. Do not change the layout order.

투명 여백 보수:

> Edit target: the supplied four-sprite 2x2 transparent game atlas. Make ONE precise correction only: shrink each of the four existing subjects including all dust/arc edge effects by about 25 percent around its own cell center, so every subject has a wide completely transparent perimeter inside its own equal cell. Four cell centers at normalized (0.25,0.25), (0.75,0.25), (0.25,0.75), (0.75,0.75). Each complete subject must fit inside the middle 70 percent of its cell width and height, with an empty transparent gutter at least 15 percent wide on all four cell edges. Especially move the top-right dust away from the horizontal center divider, and bottom-right load hook away from the horizontal center divider. Preserve all four exact subjects, top-left cyan steel, top-right ochre dust, bottom-left violet electrical insulators, bottom-right orange crane hook, their colors, detail and style. No extra shapes, text or backdrop. Keep square canvas and 2x2 order. Actual transparent alpha, no checkerboard painted into the image.
