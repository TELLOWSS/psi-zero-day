# NEW PSI : ZERO DAY — 상업화 고화 및 모바일 세로·가로 듀얼 최적화 명세서

## 1. 코어 루프 단일화 (4-Time Slot Day Cycle)
- `PRE_WORK` (07:00): TBM 조회, 작업허가서(PTW) 검토, 동료 8(`trust`, `respect`, `reporting`, `compliance`)  및 정문 게이트(`FG001`~`FG003`) 통제
- `MORNING` (09:30): 시그널 워치 현장 순찰 (현장 실무형 택티컬 장비 6종 & 신입 임준호 `FG005` 제보 연동)
- `AFTERNOON` (14:00): 피크 공정 디펜스 & 위기 임계 도달 시 작업중지권 발동 → 시그널 브레이커(`OBSERVE`  `CONTROL` → `BREAK`) 돌입
- `EVENING` (18:30): 건축감리(서정민)·공사팀장(오승재) 일일 안전점검 결산 및 118개 현장 도감(`FG001`~`FG118`) 패시브 해금

## 2. Phaser 4.2.1 렌더러 브지 (`src/presentation/`)
- 도메인 불변성 유지: `CoreEngine` 스냅샷(`RenderSnapshot`) 단방향 투영 및 `PresentationCommand` 이트 버스 연동
- 그래픽 고도화: 인더트얼 택티컬 누아르 팔레트, Light2D 동적 조명, Ψ 청사진 캔 이더(`PsiScanPostFX`), 41° 정밀 반사 시 45ms 히트스톱 연출

## 3. 모바일 세로(Portrait) & 가로(Landscape) 듀얼 반응형 최적화
- 세로 모드 (`9:16`): 상단 HUD + 중앙 수직 캔버스 + 대화/도감 패널 + 하단 원핸드 엄지 독 4단 분할, 시그널 브레이커 수직(상단 발생원 ↔ 하단 방호판) 축 자동 변환(`toScreenPosition`)
- 가로 모드 (`16:9`~`20:9`): Safe-Area(`env(safe-area-inset-*)`) 노 대응 풀스크린 및 양손 트윈스틱 전술 콘솔 레이아웃
