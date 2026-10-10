# 시그널 브레이커 전면 화면 고도화 — 검증 결과

2026-10-10 · 기준 main 6d4733f · 구현 후 로컬 production build 검증.

## 사용자 흐름

홈의 단일 브레이커 카드 → 기존 독립 브레이커 경로 → 준비 → 작전 개시 → 전면 전장 → 두 손가락 이동/조준·발사 → 정지 → 재개 → 기록/다음 작전.

## 결과

| 경계 | 상태 | 근거 |
|---|---|---|
| 홈 진입 | PASS | production build: 폰 390×844 / PC 1440×900. 브레이커 링크 1개, 중복 mode navigation 0개, ready→playing |
| 브레이커 전장 | PASS | 390×844 / 844×390 / 768×1024 / 1024×768 / 1280×800 / 1920×1080. canvas x/y=0, 크기 viewport 일치 |
| 입력 | PASS | held aim 반복 발사, release/cancel 중단, 두 손가락 이동·조준, 패드 해제 정지 |
| 회복 | PASS | 정지 동안 game.time 유지, 재개 후 발사 유지 입력 없음, 390×844→844×390 회전 반영 |
| 장비 | PASS | 수동 장비 선택 유지, 자동 ON 작은 코어 net / 큰 코어 pulse |
| 런타임 | PASS | 6화면 pageerror/400 이상 asset 응답 0개 |
| 엔진·저장·UI 회귀 | PASS | 브레이커 node 테스트 31개 |
| 본편 포함 전체 회귀 | PASS | 351 test files passed / 1 skipped. 2,037 tests passed / 1 skipped |
| 타입·빌드 | PASS | npm run typecheck / npm run build / 최종 npm run build --ignore-scripts. 사전 build gate도 앞선 전체 build에서 통과 |
| 코드 공백 검사 | PASS | git diff --check |

스크린샷은 이 폴더의 해상도별 JPG와 home-390.jpg / home-1440.jpg. 원본 screenshot PNG를 용량 절약용 JPG로 변환했다. 검사 수치 원본은 viewports.json.

## 검수 중 수정한 문제

- 이전 game-card 높이 차감과 canvas-wrap 1450px 최대폭이 전장을 계속 축소함: viewport 계약으로 교체.
- 이전 toast bottom과 신규 top이 같이 적용되어 안내창이 수직으로 늘어남: bottom:auto 고정.
- standalone 페이지는 한글 웹폰트를 로딩하지 않아 headless 환경에서 한글이 깨짐: 기존 공용 Pretendard 연결/오프라인 캐시, 로컬 preview는 해당 글꼴 한 개만 제공.
- 세로 header의 2행 버튼 정렬로 상단 버튼이 잘리고 정지와 겹침: 세로 상단 정렬과 별도 정지/생명 배치.
- 홈 테스트 2개는 중복 메뉴와 이전 카드 수를 전제로 함: 새 단일 진입 계약으로 수정 후 전체 재실행 통과.

## 범위와 남은 확인

브라우저 검증은 Linux headless Chromium에서 실행했다. Android 실물 기기의 프레임률·터치 지연·발열·장시간 피로도·OS 전체화면 동작을 검증했다는 의미는 아니다. 실제 폰/태블릿의 10분 이상 플레이와 시그널 워치 동시 비교가 남는다.

기존 공유 캐릭터·최종 배경·장비 아틀라스는 활용했지만 신규 전체 스테이지 아트·캐릭터 애니메이션·오디오 믹싱을 완성한 것은 아니다. 최종 그래픽 LOCK은 보류한다. 물리·스테이지·보상 엔진은 변경하지 않았다.

전체 build는 기존 500kB 초과 chunk 경고를 출력했으나 실패하지 않았다. 별도 Vercel 배포 호출과 배포 후 production URL 검증은 하지 않았다.
