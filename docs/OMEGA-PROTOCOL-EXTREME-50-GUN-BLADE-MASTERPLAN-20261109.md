# PSI : ZERO DAY — OMEGA PROTOCOL
## EXTREME-50 EPILOGUE · AIRA V2 GUN & BLADE · 종합 게임 마스터 기획서
**기준일:** 2026-11-09  
**개발 분기:** `feat/omega-protocol-roguelite-core-20261108` / PR #235 Draft  
**출시 상태:** 잠금 — 최종 원화·전체 플레이·실기기·품질 게이트 미통과. `main` 미병합·Production 미배포.

### 0. 불변의 디렉터 룰

> **SIGNAL WATCH '극한(Extreme)' 난이도로 1~50 스테이지를 모두 클리어한 이용자만 해금하는 독립 특별판.** 원작 WATCH가 제공하지 않았던 고속 총·검 교차전투를 완전한 가상 위기 시뮬레이션 속에서 즐기는 **오염된 산업현장 생존형 2.5D 액션 로그라이트**다. 개별 스테이지 선택식 15단계 게임이 아니다.

1. NORMAL 10개, STANDARD/HARD 50개, MASTER 난이도 50개, 일반 캠페인 50개 완료만으로는 **해금 불가**. `difficultyClearRecords[stage_01..stage_50].extreme>=1` 50종의 유효 클리어 기록만 인정. 마스터리 3성 메달은 **필요 없음**. 저장 손상/미기록은 잠금 유지.
2. 특별판의 15개 **내부 이벤트 노드**는 5개 대형 지역을 통과하는 하나의 작전 경로. 스테이지 선택, 매 전투 후 결과창, 자동 다음 스테이지 전환을 금지. 적 전멸 → 현장 장치/탐색/대피 → 이동 가능한 출구 도달 → **공간적으로 연결된 다음 지역으로 진행**. 내부 엔진 변수 `wave`를 사용하더라도 사용자 HUD에 별도 스테이지 클리어로 표현하지 않는다.
3. AIRA는 총(거리 제어)과 검(정밀 근접 타격)을 주 무기로 사용하는 고속 액션 요원. 일반 WATCH의 PPE·건설 안전교육 규칙에서 무기 사용을 제거한 기존 정책은 **일반 모드에서 유지**. 특별판은 현실이 아닌 '폐쇄된 합성 위기 시뮬레이션'이며 전투 대상은 **안전모를 착용한 가상의 감염 작업자 좀비·오염체·폭주 기계·드론**. 정상 비감염 생존자는 구조 대상이며 전투 대상이 아니다. 이 구분은 특별판에서만 활성화하고 일반 SIGNAL WATCH의 근로자/PPE 모델은 유지한다.
4. 핵심 만족감은 **움직임의 제어감 → 적 약점 판단 → 총기 연타 → 검 3타 → 회피 → 보스 그로기 → 상황에 맞는 장치 조작 → 새로운 지역 진입**의 연결. 이동 중 3선택 카드 때문에 흐름이 끊기는 횟수는 제한하고 보스 후 큰 성장 선택을 준다.
5. AIRA V2의 은백색 머리·눈·오메가 재킷·검/총 장비·신체 실루엣을 8방향 동일 인물로 유지. **정지 8방향과 독립 160액션 원화는 다름**. 게임에 승인되지 않은 생성 콘셉트를 최종 프레임으로 넣지 않는다.
6. 매 릴리스에서 플레이어의 기존 WATCH 속도·HP·충돌·보상·현금성 아이템·소지 기록·50스테이지 진도 **변경 없음**. OMEGA 별도 인스턴스·세이브 스키마만 사용. 기본 외부 API 유료 호출 불필요.

### 1. 세계관 · 전편 50스테이지와 연결되는 한 장면

**가제: 'THE SIGNAL AFTER THE LAST SHIFT' / 마지막 퇴근 이후.**

극한 50스테이지 마지막 경보가 해제된 시각, 디지털 현장에 '03:17'이라는 존재하지 않는 사고의 시간표가 뜬다. AIRA는 최종 클리어 기록 속에서 봉인된 가상 산업단지 Q-17을 발견한다. 미확인 **NEXUS 포자 오염**으로 출근 당시 안전모와 반사조끼를 착용한 작업자 일부가 감염 좀비로 변했다. 오염 통제 AI **BLACK SIGNAL**은 감염 확산을 막으려 현장 전체를 영구 봉쇄하고, 무인 장비까지 적대형 방어체로 전환했다.

AIRA는 이 가상 격리구역의 **감염 좀비와 폭주 장비**에 총과 검으로 맞선다. 안전모·형광 조끼를 착용한 좀비들은 공격적인 적이지만 **비감염 생존자는 구출 대상**으로 식별한다. 오염 발생 시점의 기록과 M01의 원격 구조 신호를 복원해야 격리를 해제할 수 있다. 마지막 작전의 목표는 단순 파괴가 아니라 **기록 보존과 안전한 귀환**이다. 최종 엔딩 문장: **'오늘도 무사히 돌아왔습니다.'**

M01은 아직 게임 캐릭터로 해금되거나 플레이하는 인물이 아니다. 2막 이후 **손상된 음성 기록 및 현장 지휘 통신**으로만 등장시키는 기획. 정식 음성·외형·NPC AI는 별도 승인이 필요.

### 2. 다섯 지역과 연결된 15개 사건

| ACT | 경로 노드 | 공간/카메라/조명 | 스토리와 필수 사건 | 전투 절정 |
|---|---|---|---|---|
| I: QUARANTINE GATE | 01~03 | 오염된 물류게이트, 비와 녹색 포자 안개, 출입 봉쇄선 | 초기 감염 확인 → 정상 생존자 식별 → 격리문 해제 | **안전모 좀비**·무인 카트 |
| II: INFECTED SKYFRAME | 04~06 | 오염된 수직 비계, 안전모 좀비 군집, 흔들리는 발판 | 연결교량 돌파 → 무전 추적 → M01 첫 기록 | **감염 좀비 무리**·고공 습격 |
| III: TITAN HOOK | 07~09 | 오염 크레인 야드, 훅의 실시간 낙하 그림자, 안개 | 정예 감염체 제압 → 크레인 통제 신호 차단 | **NODE 09 중간 보스** |
| IV: NEXUS -4F | 10~12 | 침수된 오염 연구시설, 방진 커튼, 필터실 | 발생 기록 수집 → 가짜 구조 신호 식별 → 오염 차단 필터 복구 | **지하 감염체**·환경 제어 |
| V: BLACK SIGNAL | 13~15 | 오염 제어탑, 붕괴하는 홀로그램과 격리 안테나 | 생존자 탈출 통로 확보 → 오염 기록 보존 → AI 코어 무력화 | **NODE 15 최종 보스** |

각 노드의 고유한 제목·무전·반전·공간 키워드·보스 구분은 실제 코드 `src/domain/omega-protocol-story.ts`의 15개 독립 항목에 기입했다. **현재 브라우저 구현은 전장 5종/노드 15종의 기본 구획과 3종 이벤트 조작**까지 연결돼 있고, 이 문서에 묘사한 영화적 미술, 거대 스케일 구조물, 실시간 수직 이동, 모션캡처, 최종 컷신이 완성되었다는 뜻은 아니다.

#### 이벤트 상호작용 설계
- **전력 차단:** 2개 제어장치 → 잔류 신호 확인. 캐릭터가 실제 목표에 접근하고 E/터치로 조작해야 완료.
- **구조 경로 확보:** 구조 지점 확인 → 실제 안전 출구 경로와 손상 신호 복구. 리스크/보상 선택지는 개발 예정.
- **구조 안정화:** 두 지지점 활성화 → 안정성 확인 → 다음 지역 진입.
- **맵 탐험 분기(미구현):** 숨겨진 보급실·기록 조각·보조 출구·보스 전에 경로를 단축할 전력 장치. 시드가 달라도 5막 주 서사는 유지하고 장비·환경·보조 미션 배치는 변화한다.
- **연결감(M04-A/B/C 부분 기술검증):** PR #240은 1→2→3 실입력 출구 이동, #241은 3→4 비계 리프트(+18m), #242는 6→7 크레인 승강기(+24m)·9→10 지하 설비 터널(-12m)·12→13 중앙 에어록(6m) 각각의 독립 원본 Canvas 구조물과 실제 PC/모바일 브라우저 이동·도착 도크를 검증했다. **단, 출구 통로에서 독립 필드를 다시 로드하는 이음새**로 15개 구역이 한 공간 좌표에서 실제 스트리밍하는 세계는 아니다. 15구역의 실제 적 처치·현장 이벤트 무스킵/장시간 플레이와 정식 배경·애니메이션은 M04-D부터 별도 실증해야 한다. 스테이지 클리어/선택 화면 형식으로 회귀 금지.

### 3. 총 · 검 · 회피가 하나가 되는 고속 전투

**전술 총기 | SIGMA RAIL** (임시 작업명): 원거리 목표 자동추적 및 수동 목표 고정 선택, 짧은 반동, 탄착 확인, 소형 적 관통/유도 분화. 현재는 실제 WATCH 엔진의 radio/grout 계열 발사를 재사용하며 신규 개별 총 원화·탄도 밸런스·수동 조준은 미완료.

**공진 검 | VIOLET EDGE** (임시 작업명): 가까이 파고든 **안전모 감염 좀비와 폭주 기계 적**을 직접 치는 전방 부채꼴 판정. **1타 베기 → 2타 교차 → 3타 마무리**; 실측 방향·실제 충돌 판정·실제 적 HP 사용, 장애물 너머 적은 공격할 수 없고 재사용 대기시간 적용. 일반 WATCH의 인물형 근로자 안전교육 표현에는 검격 적용 불가. 별도 특별판에서는 **가상 감염 좀비**를 총·검으로 공격할 수 있으며 정상 생존자는 전투 대상으로 등록하지 않는다. 현재 숫자(예비): 105 월드 유닛, 전방 약 122.6도, 0.52초 쿨다운, 0.9초 콤보 연결. 보스 한 번 타격 피해에 별도 상한.

**회피/대시:** 기존 WATCH 실제 대시·무적·쿨다운 사용. 검격 키 `F` 및 모바일 검 버튼을 추가. 검격 후 수동 카메라 진동·잔상·히트스톱의 타격감은 추가 성능/접근성 검증 대상. 현재 기본 검 궤적은 **시각용 이펙트**, 고품질 인물 검 애니메이션이 아니다.

**템포:**
`원거리 견제 → 적 패턴 유도 → 회피 진입 → 검 1·2·3타 → 충격 그로기 → 근거리 총 연계 → 현장 장치 조작 → 탈출`

**액션 기술 트리 (최종 목표, 아직 전체 구현 아님)**

| 성장 축 | 1차 | 2차 | 3차/시그니처 |
|---|---|---|---|
| Gun / Pulse | 조준 안정 | 전력 관통 | 신호 연쇄탄 |
| Gun / Burst | 사격속도 | 약점 확인 | 탄막 절단 |
| Blade / Edge | 공진 검격 피해 +15% | 콤보 유지 | 서리빛 처형 베기 |
| Blade / Reach | 사거리 +18 | 2단 확장 | 광역 검광 |
| Hybrid / Resonance | 검 명중 시 총 과열 회복 | 총 명중 후 검격 속도 증가 | **ZERO CROSS**, 교차 피니시 |
| Mobility / Shadow | 대시 회복 | 완벽 회피 반격 | 분신 잔상 재진입 |

**현재 실제 연결:** 기본 총기 Watch 사격, 검 3타와 피해·사거리 두 선택 카드, 실제 dash. 하이브리드 ZERO CROSS, 무기 궁극 변신, 정교한 파티클·물리 반동·개별 장비 애니메이션, 6개 분기 전체는 **미완료**. 유료 아이템 없이는 불리한 설계 금지. 강화는 OMEGA 1회 탐험에만 적용하고 종료 시 초기화한다.

### 4. 두 보스의 서로 다른 플레이 감각

**NODE 09 / TITAN HOOK — 움직이는 크레인 집행체**
- 위치 추적 그림자 → 훅이 내려오는 위험 예고 → 지면 공격 → 약점 코어 노출 → 3타 검격/원거리 관통 반격의 순환.
- 2페이즈에는 이동식 크레인 통로와 연쇄 낙하를 합성. 단발 궁극기로 즉사하지 않게 피해 상한.
- 실제 Watch CRANE_BOSS와 별도 텔레그래프의 기초가 개발 브랜치에 연결됨. 회전 포크·거대 훅 미술·보스용 컷신·약점 애니메이션은 미구현.

**NODE 15 / BLACK SIGNAL CORE — 인간이 아닌 자기방어 통제 AI**
- P1: 고정 코어의 방향성 에너지 파동; 검격은 하부 보호체, 총격은 부유 조절부를 공략.
- P2: 방호막 재형성, 안전 지점 이동, 장비 교차 운용. 일정 시간마다 피할 수 있는 예고.
- P3: 03:17 신호 반복, 기록 보존 장치 3개 개방 후 최종 공략. 피니시는 기존 미션에서 축적한 신호 데이터로 코어를 안정화하는 방식.
- 현재 코드는 별도의 최종 코어 실루엣과 공격 예고 및 HP 전투 기초만 있음. **3페이즈 고유 보스 기믹/최종 스토리 시네마틱은 미구현**.

### 5. 레벨 디자인: 반복이 아닌 장거리 탐험
- 핵심 화면: 2.5D 3/4 시점. AIRA 중심 추적 카메라, 구조물 발밑/뒤 가림, 폭우·분진·스포트라이트의 명확한 깊이.
- 적 배치: **M03 기술검증 완료** 안전모 좀비(기본 추격·질주·중장갑·정예 측면기동형) 4종이 각각 독립 속도/HP/경고·공격/이동 AI를 갖고, 별도 산업 장비형 적과 매 전투 동시 등장한다. **좀비 포함 전체 적 12종 이상**은 별도 후속 제작 목표다. 현재 시각 표현은 4실루엣의 임시 Canvas 도형이며 독립 8방향 고화질 원화/군집 전술은 미완.
- 사건 규모: 15개 주요 사건 공간 / 5개 대형 지역, 각 공간에서 주변부 짧은 선택형 탐색과 히든 룸 제공. 탐험 플레이타임 목표 35~60분 **추정 목표이며 실측 아님**.
- 적 전멸만으로 이동하지 않는다. 사건의 실제 단계 완료와 출구 도착이 이어져야 한다. 클리어 화면 연타/자동 스테이지 넘김을 금지.
- 안전 관련 기능의 브랜드 원칙은 도로, 비계, 크레인, 지하 구조물 등 현장의 시각 언어에 반영하되 특별판 무기의 실존 현장 사용과 절대 혼동되지 않도록 '가상 폐쇄 시뮬레이션' 표시.
- 재도전은 똑같은 몹에 숫자만 더하는 게 아니라 시드에 따라 배치, 돌발 공격, 날씨, 구조물 통로, 장비 제어권, 보급 스택에 변화.

### 6. 조작/UI/UX
- PC: WASD/방향키 이동, 자동 기본 총기 사격, `F` 검 3타, Space/Shift 회피, `Q` 특수공격, `E` 사건/출구 상호작용, ESC 일시정지.
- 모바일/태블릿: 왼쪽 아날로그 이동/옵션 방향키, 오른쪽 **검·회피·궁극·조작** 4버튼. 기본 자동 총기 + 수동 타깃/총기 수동 모드 기획(미구현). PC↔세로↔가로 모두 HUD 가림/터치 44px/입력 지연 실측.
- 임팩트 필수 요소: 근거리 피격 정지감, 총 반동/탄착/전기 충격, 검 3타 각기 다른 사운드, 보스 약점 노출, 레벨업/아이템 획득 시 화면을 강제로 끊지 않는 짧은 배너.
- 접근성: 흔들림/번쩍임/색각 대안, 자막 및 음성 볼륨 별도 설정, 저사양 그래픽, 큰 터치 버튼, 컨트롤 매핑.

### 7. 구현 상태/검증 게이트 (이 문서 작성 시점)

| Gate | 산출물/검수 기준 | 상태 |
|---|---|---|
| G01 해금 | 기존 실제 WATCH Extreme 50/50 기록만 인정; 일반 10개·마스터리·변조 수치 거부 | **TESTED: PR #237 186/186, 실제 지갑 1→50 순차 저장·Chrome 브라우저 조건 분리 통과. 공개 CTA는 승인 전 보류** |
| G02 플레이 흐름 | 5지역/15주요 노드·실제 이동·사건 접근 및 E조작·보스 후 탈출 | **기초 구현**, 공간 간 시네마틱 연속성 미완 |
| G03 총기 | 기존 WATCH의 실제 발사/명중/HP 기능을 OMEGA 인스턴스에서 재사용 | **TESTED: PR #238 기본 OMEGA radio 원거리 무기 장착, 네이티브 충돌·좀비 HP 800→770 자동 브라우저 검증. 최종 총기 원화/반동·수동 조준 미완** |
| G04 검격 | 실제 엔진 HP 훅, 전방 범위/장애물, 3타/쿨다운, PC·터치, 2강화 | **TESTED: PR #238 3연격 좀비 HP 800→703, 반대 방향 공격 미명중, 실제 장애물 뒤 총/검 HP 800 유지. 독립 AIRA 검격 원화/Android 기기 미완** |
| G05 5막 스토리 | 15개 고유 무전·사건·반전·보스 대사, 실제 HUD 표시 | **원문/기초 HUD 연결**, 연출/음성 미완 |
| G06 AIRA | 은백색 8방향 확인, 정확한 NW·8방향 걷기6/사격3/대시3/피격3/궁극3/마무리2 (160프레임) | **정지 후보 8종, 고품질 개별 액션 미완** |
| G07 적/보스 | 안전모 감염 좀비 포함 전용 12종 적, 2보스 다단계, 반응 애니메이션 | **부분 TESTED: PR #239 감염 좀비 독립 행동 4종·경고→각각 실제 HP 피해, Chromium PC/모바일 각각 4/4 통과. 기초 2보스, 12종 고화질 원화/군집 AI 미완** |
| G08 렌더/사운드 | 발 접지, 전경/중경/후경 가림, 장비 FX·OST·SFX·컷신 | **일부 기술 스케치**, 정식 검수 미완 |
| G09 QA | 단위·CPU 시뮬레이션·15노드 실제 무스킵 플레이·3해상도·실기기 Android 2종 | **부분 TESTED: PR #242 TypeScript·Vitest 216/216 + Vite/Chromium 전체 35단계 PASS. 3종 새 ACT 경계 PC·모바일 Chrome 6/6 실입력 검증. 15구역 무스킵 전투·이벤트 완주, 실제 Android, 최종 원화/FPS는 미완** |
| G10 출시 | 모든 게이트 PASS, 인게임 해금 CTA 연결, 기존 저장 무결성·백업 및 사용자 승인 | **보류 — PR #235 Draft, main/Production 미반영** |

**구현 순서:** ① 해금 회귀검증 → ② 검격 타격감·총기/검 연동 QA → ③ 맵 이동/상호작용/스토리 5막 → ④ NW·독립 고해상도 AIRA 동작/적 12종/보스 원화 → ⑤ 멀티 디바이스 실측 최적화 → ⑥ 종합 플레이/릴리스 승인.

모든 `PASS`는 **해당 최신 커밋의 GitHub Actions 결과 또는 실제 실행 증거가 있을 때만 기록**. 산출물 없는 그래픽 콘셉트, 기술적 포즈 절단, 모의 시험, 모바일 화면 에뮬레이션은 출시에 필요한 원화·게임 완성·실기기 PASS로 인정하지 않는다.


### 2026-11-09 오염구역 좀비 전투 지시 추가

- **특별판 적 식별**: 현재 엔진 내부 식별자 `UNHELMETED`는 오직 OMEGA의 별도 렌더러 안에서 `HELMET_ZOMBIE`로 해석된다. 해당 적은 실제 좀비 형태의 **안전모 + 턱끈 + 반사조끼 + 감염 눈빛**을 갖는다. 일반 SIGNAL WATCH의 사람/작업자 원화, 교육 문구, 저장 데이터는 변경하지 않는다.
- **전투 허용 범위**: `HELMET_ZOMBIE`는 native Watch 사격 투사체로 HP 감소 가능하며 특별판의 3연속 검격에도 적중하도록 수정. 정상 생존자·구조 대상은 적 데이터로 생성하지 않는다. `GAS_LEAK`는 검격 비타격 환경 위험으로 유지.
- **현재 구현 정도**: Canvas 기술 도형으로 3가지 안전모 색상 변형, 5막 스토리 15개 데이터·무전 교체, 각 전투에 최소 1개 감염 좀비 스폰 보장, 실사 총기/칼 모델이 아닌 임시 SF 전투 이펙트. **전용 8방향 좀비 원화, 감염 애니메이션, 군집 AI, 근접 처치 사운드/타격감, 시네마틱은 미완**.
- **검수 추가**: 좀비 안전모 항상 표시, 원거리 투사체/검격으로 적 HP 실제 감소, 정상 WATCH 모드 피해 후크 비활성, 극한 50/50 해금 유지, 5개 지역/2보스 스토리 정합성. 모든 Playwright·기기 결과는 최신 커밋에서 별도 확인해야 함.


### 2026-11-09 M02 실구동 시험 근거 및 M03 진행 기준

- 원본 인계: [OMEGA-PROTOCOL-CONTINUE.md](../OMEGA-PROTOCOL-CONTINUE.md) 최신 9절. QA [PR #238](https://github.com/TELLOWSS/psi-zero-day/pull/238), [Core Actions](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42578259819), [Browser Actions](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42578259603).
- **기술 시험 결과**: 실제 원거리 투사체 1회 명중으로 좀비 HP `800→770`; 모바일 브라우저 검격 3연타로 `800→703`; 방향 반대면 미명중, 회전하면 `800→770`; 실물 월드 장애물 뒤 총·검 모두 `800→800`. **45개 파일·193개 단위검사 및 전체 브라우저 워크플로 PASS**.
- 특별판 시작 원거리 장비 버그 수정: 기존 Watch의 `radio_boost` 원거리 엔진 1종을 OMEGA 1회 임시 세션 시작 시 장착. 일반 SIGNAL WATCH 프로필·사용자 저장은 변경하지 않음. 게임 화면에서의 실제 피해를 읽는 QA instrumentation은 `import.meta.env.DEV` + `omegaQaState` 조건에서만 동작.
- M03 구현 후 검증 추가 완료: 안전모 좀비 **4종의 실제 고유 행동 AI**(기본 추격, 질주 돌진, 중장갑 예고 강타, 정예 측면기동). 각 유형은 실제 플레이어 HP 피해를 가하도록 공격 개시 거리와 경고/돌진 범위를 조정했다. 4개의 임시 전술 실루엣은 정식 고해상도 8방향 좀비 원화가 아니며, 실기기·군집 전술·현장 배경 고화질 원화는 미완이다. **다음 개발 게이트는 M04 구역 간 탐험 흐름 연결**이다.


### 2026-11-09 M03 추가 CI 실증

- 코드 검증용 [PR #239](https://github.com/TELLOWSS/psi-zero-day/pull/239), [Core #42581069302](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42581069302) (46개 파일/203개 단위검사, TypeScript PASS), [Browser #42581069371](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42581069371) (33/33 단계 PASS). 검증된 코드만 OMEGA 개발 브랜치에 squash 병합, `main`/Production 미반영.
- 실제 시뮬레이션 엔진에서 4개 좀비 모두 각각 타이머 기반 경고 후 명중: 기본 **11**, 질주 **16**, 중장갑 **24**, 정예 **19** HP 감소(총 70). PC 1440×900, 모바일 화면 390×844 두 브라우저 시나리오에서 플레이어 실제 HP **800→730**. 테스트가 HP를 임의로 깎아 성공을 꾸미지 않고 `OmegaProtocolCombatSession`과 native Watch hazard에 직접 연결되는 전투 피격 결과를 판독했다.
- 이 증거는 **M03 실기기/아트 품질이 아닌 기술검증 완료**. M04-A 1→2→3 화물문, M04-B 3→4 비계 리프트, M04-C 6→7·9→10·12→13 독립 ACT 도크·전환 브라우저 검증까지 통과했다. **M04 전체는 부분 완료**이며, 다음 M04-D는 적 처치·장치 조작의 진짜 15구역 무스킵 완주, 보상 선택 몰입 개선 및 장시간 성능 검사다. 최신 인계는 [13절](../OMEGA-PROTOCOL-CONTINUE.md)을 우선한다.


### 2026-11-09 M04-A 실제 게이트 2회 이동 검증

- [PR #240](https://github.com/TELLOWSS/psi-zero-day/pull/240) 개발 브랜치에만 검증 후 병합. [Core CI #42583435960](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42583435960) TypeScript/Vitest **47파일·208개 통과**, [Browser #42583436073](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42583436073) **전체 34단계 통과**.
- **실제 플레이어 입력 증거:** PC는 방향키 이동 168.7/154.0월드단위, 모바일 브라우저 390×844는 실제 보이는 아날로그 스틱 터치 드래그 172.3/172.3월드단위. 두 환경 모두 실제 출구 접근 반경·E/터치·문 닫힘/열림·`worldSequence=[1,2,3]`를 확인했다. 출발 시 게임 내 적/임무 완료만 DEV fixture로 미리 준비했고, 게이트 동작·이동/전환·전술 강화 선택은 실제 엔진을 사용했다.
- **이것은 15개 공간의 완전한 심리스 구현이 아니다.** 기존 전술 강화 2구역마다 오버레이가 남고, 막 간 이동 시 독립 지도를 닫힌 문 뒤에서 로드한다. **M04-A/B/C 기술검증 완료, 전체 M04 미완**. 별도 15개 전장과 출구를 통한 교체는 완전한 스트리밍 세계가 아니다. 정식 AIRA 8방향 160프레임, 원화·음향, Android 실기기 및 장시간 FPS는 출시 차단 항목이다.

### 2026-11-09 M04-B 3→4 첫 막 경계 18m 비계 리프트 QA

- [검증용 PR #241](https://github.com/TELLOWSS/psi-zero-day/pull/241) → **OMEGA 개발 브랜치만** 병합. [Core CI #42592300632](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42592300632): TypeScript/원본 원화 SHA·승인 차단, **47파일·210개 Vitest 전체 통과**. [Browser CI #42592300678](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42592300678): **34/34단계 PASS**.
- 실제 Vite/Chromium PC 1440×900 방향키 이동 거리 **161.3/157.7/161.3**, 모바일 화면 390×844 아날로그 스틱 터치 이동 거리 **176/172.3/172.3**. 세 번의 출구 조작으로 `worldSequence=[1,2,3,4]`; 3→4 전용 `scaffold_lift` 트랜짓; 3구역 출발 `x=1210` 및 4구역 도착 `x=150,y=450`의 native 월드 도크·링크 ID 일치 확인.
- 실제 출구·입구에 철골 샤프트/와이어/플랫폼/18m 리프트 부품을 원본 Canvas 렌더로 배치하고, 해당 Act 경계에만 시뮬레이션 시계 기반 수직 승강기를 표시한다. 기존 화물문은 동일 막 내부에서 계속 사용. 실제 주행·상호작용은 사람 입력 기반이며 적/임무 선행 조건만 DEV 전용 QA에서 사전 완료 상태로 설정한다.
- **범위:** 3→4는 아직 두 장면 사이의 게이트 전환, 상하층을 실제 3D 카메라로 이동하는 구조나 완전한 15개 스트리밍 심리스 세계가 아니다. 6→7·9→10·12→13, 전체 전투/이벤트 무스킵 완주 및 Android 실기기 QA 미완. **다음 M04-C**는 세 Act 경계별 완전히 다른 시각/좌표 연결 및 본격적인 연속성 검증. 최신 체크리스트는 [인계 문서 12절](../OMEGA-PROTOCOL-CONTINUE.md).

### 2026-11-09 M04-C 세 막 경계 Chrome 실입력 증거

- [검증용 PR #242](https://github.com/TELLOWSS/psi-zero-day/pull/242)를 OMEGA 개발 브랜치로만 병합. [Core #42594803590](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42594803590): TypeScript 및 216/216 Vitest PASS. [Browser #42594803732](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42594803732): 35/35 전체 브라우저 단계 PASS.
- PC 실제 입력 이동량 6→7 **148.7**, 9→10 **154.4**, 12→13 **150.3**월드 단위. 모바일 브라우저 아날로그 터치는 각각 **137.3**, **137.3**, **176.0**. 모든 경계에서 실제 native 도크 연결 ID와 새 구역 플레이어 입구 `(150,450)` 확인.
- 6→7은 크레인 레일·카운터웨이트, 9→10은 지하 터널 아치·배관, 12→13은 이중 격벽·압력계로 별도 구조물과 전환 화면 제작. 보상은 필요 구역만 실제 선택.
- **검증 제한:** 이전 구역은 개발 시작 전에 미리 해결한 시험 상황. 현재 경계의 물리적 이동·상호작용만 실제 브라우저 입력. 15구역 무스킵 전투와 모든 장치 조작, 진정한 3D/스트리밍 심리스 월드, 실물 Android는 검증되지 않았다. 다음 단계는 [인계 13절](../OMEGA-PROTOCOL-CONTINUE.md)의 M04-D.

### 2026-11-10 M04-D1 실제 전투 감사·격리 통로 전술 보급 UI

- **UI 구현 및 검증:** [PR #244](https://github.com/TELLOWSS/psi-zero-day/pull/244)를 OMEGA 개발 브랜치에만 병합. 화면 전체를 가리는 3카드 모달을 전장 맥락을 보존하는 격리 통로 보급 패널로 개선. 현장·다음 목적지·3개 실제 전술 강화 카드, PC·세로/가로 모바일 반응형 유지. [Core #42697032412](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42697032412) SUCCESS, [Browser #42697032471](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42697032471) 전체 35/35 SUCCESS. WATCH/GUARD 프로필·유료 아이템/데이터는 변경 없음.
- **진짜 무스킵 실전:** [Draft PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243) 시험 플레이어가 native Watch 총·검, 실제 적 HP, 장애물 길찾기, 현장 E, 물리적 출구, 제공된 강화 카드만 사용. DEV 사전 완료/HP 직접 편집/적 강제 처치 없이 고정시드 1~12구역을 통과하고 9구역 중간 보스를 격파한 로그: [Core #42696026289](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42696026289), **219/220 (15구역 완주 테스트는 실패)**. 13구역에서 HP33 진입→약 39.6초 후 패배, 적 7개 잔류.
- **정확한 품질 판정:** `M04-D1 UI VERIFIED + MERGED; FULL 15-SECTOR NO-SKIP INCOMPLETE`. 과도한 시험용 좀비 회피 로직은 일반 엄폐물 추적을 망가뜨려 폐기/복원. 다음 단계는 안전모 감염 좀비 4종의 전투 예고·후반 밸런스, 13~15구역 실전 생존성과 보상 성장곡선, 최종 보스 15 완주 확인. 기계식 장면 전환은 여전히 진정한 심리스 월드가 아니고, 승인된 AIRA 160 독립 프레임과 실제 Android 기기 시험도 미완.
- **최신 단일 진척 인계:** [OMEGA-PROTOCOL-CONTINUE.md 15절](../OMEGA-PROTOCOL-CONTINUE.md). `main`/Vercel Production은 최종 승인 전까지 미변경·미배포. 유료 전환 금지.

### 2026-11-10 M04-D2 후반부 피해 원인 분리 계측

- **[PR #245](https://github.com/TELLOWSS/psi-zero-day/pull/245) 검증 후 OMEGA 개발 브랜치에만 병합**: `src/domain/omega-protocol-damage-audit.ts`, `src/engine/omega-protocol-combat.ts`에 OMEGA 한정·런타임 API 비용 없는 읽기전용 피해 감사 도입. [Core #42703206974](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42703206974) TypeScript/Vitest **221/221**, [Browser #42703206789](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42703206789) **35/35 PASS**.
- **출처별:** 일반 WATCH(native) 양의 순 HP 감소; 안전모 감염체 4종의 실타격 피해; TITAN HOOK 9구역과 BLACK SIGNAL CORE 15구역의 정확한 실제 타격. 각 구역·시각·원인·피해·잔여 HP와 구역별 합계를 수집. 실제 엔진 시뮬레이션에서 감염체 11, 두 보스 각각 12의 피해 유형을 독립 검증. WATCH 프레임별 순감소는 동시 회복 시 전체 피해의 하한이라는 점을 명시함.
- **절대 오인 금지:** 계측 코드가 검증된 것이지 고정시드 15구역 **무스킵 완주 성공이 아니다**. 이전 [실전 PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243)은 1~12구역 통과·9구역 중간 보스 격파 후 13구역 실제 생존 실패, Draft/미병합 유지. 완성 원화 160독립 프레임·실제 Android·심리스 스트리밍은 미완.
- **NEXT M04-D3:** 계측된 `damageEvents`/`damageSummary(wave)`로 같은 고정시드 실제 13구역 패배를 다시 실행, 안전모 좀비 각 종·일반 장비(native 순손실)·보스 피해의 비중, 회피 타이밍, 받은 카드·성장·DPS를 사실 근거로 분석. 검증 후에만 균형 개선. [단일 인계 문서 16절](../OMEGA-PROTOCOL-CONTINUE.md) 우선. `main`/Production/유료 전환은 최종 승인까지 금지.

### 2026-11-10 M04-D3 — 실제 13구역 사망 원인 분리 및 다음 전술 비교

- [QA PR #246](https://github.com/TELLOWSS/psi-zero-day/pull/246) **OMEGA 개발 브랜치에만 병합**. [Core #42705626571](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42705626571) TypeScript + **49개 파일·222개 전체 Vitest PASS**. 테스트/CI 파일만 추가, OMEGA 실제 전투 수치·감염체·보스·일반 Watch/Guard·고객 계정·운영 코드 변경 없음.
- 무스킵 `seed=20261109`: 실제 총/검·물리 이동·현장 E 이벤트·실제 제안된 강화만으로 **1→12 필드 완주 및 9구역 TITAN HOOK 격파** 후 **13구역 실패 재현**. 초기 HP 33, 적 9(초기 합계 HP 5293). 약39.6초 시점 HP 0, 남은 적 7(합계 HP 4357). 완주 최종 보스는 아직 아님.
- 피격 **2회**: `INFECTED_SPRINTER` 실제 16 피해(HP 33→17), `WATCH_NATIVE_NET` 실제 순손실 17(HP 17→0). 후자의 **동일 프레임 Watch 엔진 자체 `lastDamage.source=RUNAWAY_CART`**, 원래 계산된 타격 수치 22로 기록되며 잔여 HP는 17만 소진. 범인 근접도를 근거로 임의 확정하지 않았고, 원래 Watch 손실 원인 분류는 순 HP 감소로 유지.
- 보급 선택: 2 `rapid_step`, 4/6 `shield_matrix` 2회, 8/12 `recovery_protocol` 2회, 10 `blade_edge`. 12구역 HP21에서 보급으로 +12 회복 후 13 진입 HP33. 이 선택 경로 외 다른 시드·카드 전략에서 실제 15구역 생존 가능한지는 검증되지 않음.
- **판정:** `M04-D3 실제 패배 인과 로그 PASS`, `M04 15/15 victory FAIL`. [엄격 승리 QA PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243) 미병합 Draft. 실제 심리스 15구역 스트리밍, 완성 AIRA 160 독립 프레임, Android 실기기 QA 불변/미완.
- **NEXT M04-D4:** 적 수치를 임의 조정하지 않고, 같은 시드에서 실제 제안된 카드 중 다른 빌드 + 정당한 대시 타이밍·총격 LOS·검격 진입을 비교. 질주형 감염체 16과 폭주 운반장비 22의 연속 피해 노출을 줄일 수 있는 합법적 전략 확인. 단위 QA·브라우저 QA 성공 후에만 개발 브랜치 병합. 진척 원본 [인계 17절](../OMEGA-PROTOCOL-CONTINUE.md)에서 재개.

### 2026-11-10 M04-D4: 동등 시드·실제 강화 선택 4전략 비교

- 검증용 [PR #247](https://github.com/TELLOWSS/psi-zero-day/pull/247) → **OMEGA 개발 브랜치에만 병합**. [Core #42719979171](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42719979171) TypeScript 및 Vitest **50개 파일·223개 PASS**. 실전 고정 시드 `20261109`, 자동 조작 총/검/이동·모든 현장 E·실제 보급 제안에서 선택. 기존 게임 런·체력·무기·좀비·보스 데이터 변경 없음.
- 전략별: **혼합형 12개 구역 완료→13구역 사망**, **생존형 11개 완료→12 사망**, **기동형 10개 완료→11 사망**, **화력형 7개 완료→8구역 엄폐물 RUNAWAY_CART 경로추적 교착**(플레이어 HP78, 사망 아님; 이 이후 빌드 비교는 불가). 엄격한 15/15 전투 클리어와 모바일 실제 기기 품질은 미검증.
- 실제 보급 카드만 선택했으므로 `offered` 목록과 `chosen` ID를 독립 로그로 기록했다. 비슷한 생존 카드 이름이더라도 무작위 제안 내용이 전술에 따라 달라진다. **고정 입력 자동 시험의 우열을 사람에게 보편적 최적 빌드로 제시하지 않는다.**
- **NEXT M04-D5:** 원래 극한 난도를 무단 완화하지 않고 안전모 질주 좀비/폭주 운반장비 돌진의 위험 방향 및 타격 예고, 실제 반격 가능 거리·지형 가림, 대시 쿨다운의 사용성을 실제 게임 화면에서 고도화한 후 PC/모바일 브라우저 검증. [인계 18절](../OMEGA-PROTOCOL-CONTINUE.md) 우선. AIRA 정식 160 독립 원화, 15노드 완전 스트리밍, 15/15 실제 무스킵 엔딩 및 Android 실제 기기는 별도 미완.

### 2026-11-10 M04-D5·D6: 공격 예고와 실제 HP 피해 판정 일치 기술검증

- **M04-D5 [PR #248](https://github.com/TELLOWSS/psi-zero-day/pull/248):** native Watch RUNAWAY_CART 경고 방향, 감염 좀비 4종 독립 경고, 대시 쿨다운의 실제 Canvas/HUD 안내. [Core #42722254548](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42722254548) **51파일/227테스트**, [Chrome #42722254211](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42722254211) PC·모바일 세로 통과. OMEGA 개발 브랜치에만 병합.
- **M04-D6 [QA PR #249](https://github.com/TELLOWSS/psi-zero-day/pull/249):** 신규 실제 Watch 충돌 회귀에서 OMEGA 폭주 운반장비가 `warning` 중인데도 **HP100→78(22)**, `approach/cooldown`도 선피격됨을 FAIL로 실증. OMEGA 전용 `protocolExternalEncounter` 카트 접촉을 `charge` 단계로 격리. 기존 WATCH 피해 정책, 공격22·적 HP·AI·예고 시간·대시 무적 등 수치/사운드 변경 없음.
- [M04-D6 Core #42749422806](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42749422806) **52파일/233테스트 전체 PASS**; [Browser #42749422588](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42749422588) **전체 PASS**. 실제 Vite+Chromium PC1440×900/모바일 세로390×844/가로844×390의 native 카트 HP **경고 중 800→800, 실제 돌진 후 800→778**; 경고 HUD와 조작패드 겹침 0. 9·15구역 보스 공격 경고 각각 실제 화면 PASS. 고정 방향선의 장애물 관통 시각 오류를 지형 Ray/AABB로 차단. 시험은 DEV 전용 초기위치 구성; 모든 후속 행동·경고·HP는 진짜 Watch 엔진.
- **상태:** `M04-D5/D6 CODED+TESTED` = 전투 위험 경고·충돌 판정 정합성 기술검증. 단, 15/15 무스킵 실제 승리·후반 최종 보스 격파, 고해상도 은백색 AIRA 독립 원화 160+마스크320, 12+ 종 정식 좀비, 실물 Android/태블릿 FPS·발열, 좌표 연속형 심리스 맵, 정식 런치 CTA는 **BLOCKED**.
- **NEXT M04-D7:** `seed=20261109`에서 현재 공정한 경고/돌진 수정 후 **적·장치·출구 사전 완료 없이** 실제 1→15 총·검·대시·지형/LOS·제시된 보급 카드만으로 후반 전투를 재검증. 13/15 생존 실패·LOS 교착·자동조작 한계/인간 플레이 구분, 원래 극한 난도/HP/무기 무단 조정 금지. [인계 문서 §20](../OMEGA-PROTOCOL-CONTINUE.md) 우선. `main`/Vercel Production/유료 전환은 최종 승인 전 금지.

### 2026-11-10 M04-D7 — 실제 native 고정시드 13구역 패배 두 전술 비교

- [QA PR #250](https://github.com/TELLOWSS/psi-zero-day/pull/250)의 실제 `seed=20261109` 1→15 목표 무스킵 replay, [Core #42765707078](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42765707078) TypeScript + **53파일/234테스트 전체 PASS**. 시험만 추가, 플레이어/적HP·AI·대시·탄도·지형·보급·실제 해금·일반 WATCH·운영 소스 변경 없음.
- 동일 1~12구역 본전투/현장 E/실제 문/제안 카드 선택 결과 동일함을 컴퓨터 검사하여 두 전술의 13구역 입력 차이만 대조. 기존 전술 **12개 완료→13구역 약39.6초에 HP0**, 질주 감염체16 + 진짜 카트 `charge` 단계의 WATCH 순 HP 손실17. **경고 반응 전술** 역시 12개 완료→13구역 약4.1초에 HP0, 질주 감염체16 + 잠복 감염체로 잔여HP17 소진. 13구역 사전 완료/가짜 보상 없음.
- 첫 전술은 카트 경고 중 피격이 아니라 충돌 판정 수정 후 실제 **charge** 피격인 점을 엔진 표식으로 확인했다. 대시 반응을 늘린 다른 조작은 오히려 잠복 감염체에 더 빨리 붙어 **실패**, 사람의 반응성을 자동 시험으로 증명했다고 주장 금지. 기준 보급 선택 2 `rapid_step`, 4/6 `shield_matrix`, 8/12 `recovery_protocol`, 10 `blade_edge`.
- **M04-D7 = 실제 실패 원인 감사 CODED+TESTED; 15/15 실제 승리·15 보스 및 엔딩 여전히 FAIL/미완.** Strict [PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243) Draft 미병합. 신규 브라우저/Android 실기기 시험은 없으며 지난 D6 Chrome 검증과 혼동 금지.
- **NEXT M04-D8:** 13구역 첫 4~8초 질주·잠복·기계 경고 동시노출, 가림/실 대시 방향·타이밍을 재구성해 더 안전한 실제 입력/시인성 피드백을 검증하고 그 후 1→15 재시험. 게임 난도 임의 하향, 원화 승인 없이 납품 주장, `main`/Vercel Production/유료 전환 금지. [인계문서 §21](../OMEGA-PROTOCOL-CONTINUE.md) 최우선.

### 2026-11-10 M04-D8 — 13구역 최초 8초 조작/다중적 위험/8px 투사체 LOS 검증

- [QA PR #251](https://github.com/TELLOWSS/psi-zero-day/pull/251) 실제 고정시드20261109 **1→15 무스킵 엔진** 시험 전용 코드. 13구역 0~8초 0.5초 간격 native 좀비4종 경고/잠금 방향, 운반장비 motion, 실제 맵 장애물·플레이어 위치·HP·대시·입력 수집. D7 무분별 반응은 x≈21 맵 구석에서 약4.1초 HP0(질주+잠복). 경계·모든 적·24방향 후보·잠금선/장애물 피하기를 함께 고려하는 제한형 실제 joystick 입력으로 수정. 게임 엔진 HP/공격/AI/조우/보급/지형 변경 0.
- 13구역 마지막 폭주운반장비는 기본 플레이어 조작에서 적 중심 직접 길찾기가 불가능하거나 **Watch 타겟 감지 radius2**와 실제 **radio 탄환 충돌 radius8**의 LOS가 다를 수 있음을 원인별 검증. 실제 반경8 엄폐물 충돌을 통과하는 사격 위치를 **기존 내비게이션으로 물리 이동**하게 해 정체 해결. 외부 전술 시험에만 적용(실 게임 파츠/유료 API 없음).
- [Core #42790676121](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42790676121) / [최종 롤백 코드 Core #42791361534](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42791361534): TypeScript + **54파일/235개 전체 PASS**. 기준/단순반응 두 전술은 12개 완료 뒤 13구역 HP0, 새 제한형은 **1~14구역의 실제 적처치+현장 E+실제 문 통과** 및 9구역 보스를 포함해 14개 완수, 13·14구역 피격 0/입장HP33 유지. 14구역 실제 제안 카드 radio_overdrive 선택 후 **15구역 최종 BLACK SIGNAL CORE** 실전에서 약181초에 누적 피격/HP0 패배, 보스 살아 있음. 따라서 게임 15/15 승리 아님.
- 15구역 공격 lane만 우선 대피하는 미승인 조작 후보는 [Core #42791077265](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42791077265)에서 **약9초 내 복합피격 패배**로 악화. 해당 시험 코드는 검증 후 14구역까지 성공한 제한형으로 **완전 롤백**; 실패 결과도 반드시 남긴다. 모든 전술이 1~12구역과 실제 보급 선택을 동일하게 통제.
- **정확한 판정:** M04-D8 **14/15 실제 무스킵 완료 및 보스15 실전 패배 원인 확인**. D8의 PASS는 시험 보고의 무결성이며 Android 실기기/상업용 원화160+마스크320/진정한 심리스/정식 빌드 출시가 아니다. Strict [PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243) 계속 Draft.
- **NEXT M04-D9:** 최종 보스15(power sweep)와 native cart/감염체 복합경고를 동시에 회피 가능한 실제 이동/대시 경로, 15 보스 HP 감소·실제 검/총 DPS·원래 보급 카드 분석. `main`/Production/유료 전환 금지. [인계 문서 §22](../OMEGA-PROTOCOL-CONTINUE.md) 기준.

### 2026-11-10 M04-D9 — 15구역 최종보스 무스킵 `victory` TECHNICAL PASS

- [QA PR #252](https://github.com/TELLOWSS/psi-zero-day/pull/252) 원본 native 게임 시뮬레이터에만 연결된 실제 조이스틱 경고 대응 시험. 동일 고정시드 `20261109`, **1~14구역 실제 적 제거/E 현장 장치/실제 물리 출구 및 제공된 카드 선택 완전 동일**. 15구역 첫12초 모든 native boss/carts 타임라인 동일성을 테스트 확인.
- 최초 15구역 전체 경고 우선 회피는 24.9초에 질주/잠복 피격 사망, 2개 이하 적 제한 후보도 195.7초에 보스 피해 누적으로 사망. **후반에 적 2개 이하 + 실제 잠금 경고 잔여1.24초 이내**에서만 겹친 보스·운반장비 경고를 평가하고, 실제 `power_sweep` 잠금선 너비에 **55 단위 안전 여유폭**을 확보한 32방향 회피 입력으로 보정. 모든 적·HP/보스 패턴·장비 물리·무기/보급·실제 지형은 전혀 변경하지 않음.
- [최초 엔진 승리 Core #42801564153](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42801564153), [최종 엄격 assertion Core #42801989191](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42801989191): **TypeScript + 55파일/236테스트 PASS**. 최초 진짜 **15/15 엔진 자동조작 승리**. 15구역 실제 전투 약216.63초, native 무전탄 명중464회, 검 피해1066.95, 보스 공격 피해관측24, 유효 최종 HP33(실전 회복 포함), 최종 적0, E/실출구 및 실제 런 `phase=victory`. 최종 15개 segment 모두 진짜 전투+현장 장치+물리 게이트 완료임을 명시적 assertion으로 확인.
- 모든 QA 전투는 `OmegaProtocolCombatSession(20261109,50,false,{fieldTraversal:true,gateTransition:true})`의 테스트용 50/50 값을 사용. 실제 사용자 50개 Extreme 클리어/계정 CTA를 허위 해금한 것이 아니며, 테스트 전술을 정식 게임에 자동 적용하지 않음. **별도 strict PR #243 Draft/미병합, 실제 사람 조작·Android FPS/발열·엔딩 연출 및 진정한 심리스는 미완.**

### M12-G1 — 다음 최우선: 사용자 요청 쿼터뷰 입체 배경 수직 슬라이스

- 최종 전장 목표는 AIRA가 폐공업/건설 격리구역 **실제 공간 속에 있는 2.5D 게임**이다. 1개 대표 전장에 깊이 기반 오브젝트 정렬, 전경/중경/후경 패럴랙스, 타워크레인/비계/갱폼/컨테이너 등 독립 높이 형태, 인물 상·하부 가림, 발 그림자/빛/안개/실탄 피격 공간 연출, 카메라 따라가기/줌을 실제 플레이 화면에 먼저 적용한다. **저작권 있는 기존 게임 배경 복제 금지**, 독립 오리지널 산업지구 아트.
- 시각 표현은 기존 native field 좌표·실제 solid terrain/LOS/충돌과 동기화한다. 시각용 두께/높이가 허위 발판이나 가짜 안전지대로 보이지 않도록 실제 세계 경로 및 전투 hitbox와 일치, 이펙트가 보스 경고를 가리지 않도록 관리.
- 합격 기준: 실제 1개 전장에서 이동/총/검/적 경고/보스 공격이 일관된 카메라 안에서 작동, 가림 앞뒤가 실제 높이·발 위치로 바르게 바뀜, PC+모바일 가로/세로 4개 해상도 브라우저 시각 QA/기존 전투 TypeScript와 회귀 통과. Android 물리 기기 프레임타임·발열은 별도 검증; AIRA 액션 독립원화160/마스크320 승인 역시 별도.
- **NEXT 실제 구현:** 개발 브랜치 기준 OMEGA 렌더러 `OmegaProtocolPlaytest` 및 지형 시각 레이어 확인 → 대표 industrial zone에 depth-sorted 구조물·occlusion/lighting 순차 구현 → PC/모바일 실제 브라우저 스크린샷/조작 검증 → 회귀 통과 시 개발 브랜치 병합. 정식 `main`/Production/유료 API 금지. [인계 §23](../OMEGA-PROTOCOL-CONTINUE.md) 기준.

### 2026-11-10 M12-G1 implementation verified (OMEGA development only)

- [QA PR #253](https://github.com/TELLOWSS/psi-zero-day/pull/253) → **OMEGA 개발 브랜치만 병합** `93c65d1747bf874143f4b77a88a17a54b7b550c6`; 본 게임 실제 Canvas에 1구역 지형 기반 외곽 철골/컨테이너 입체 측면, 장애물·인물 지면 그림자, 깊이 앞뒤 페인터 정렬·가림 위치 인식, 저성능 비용 예산 단계·거리 안개를 적용. 캐릭터/적 피해·보급·충돌·LOS·Extreme 해금·일반 WATCH/Guard 변경 없음.
- [Core #42804240857](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804240857): TypeScript + **56파일/240개 테스트 PASS**. [Browser #42804245592](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804245592): 기존 QA 전체 SUCCESS, 실제 4해상도(PC1440×900/태블릿1024×768/모바일390×844/가로844×390) 반응형 React/Canvas·입력 움직임·스크린샷 검증 성공. artifact `omega-protocol-source-browser-screenshots` / 13757422420에 M12 4장 및 JSON 보고서.
- **시각 정직성:** 실제 4종 PNG 육안 확인시 입체면/그림자 기술 효과는 있지만, 전체 전장 배경과 적 애니메이션은 **상품급 고품질 2.5D 최종 완성에 크게 못 미침**. M12-G1은 동작하는 기술 수직 슬라이스이지 최종 그래픽/상업출시 아님. 은백색 AIRA 정식 독립원화160/마스크320 승인·최종 비계/갱폼/호이스트 고해상도 층 레이어·Android 실제 기기 FPS/발열·진짜 심리스·strict PR #243 계속 미완.
- **NEXT M12-G2:** 위 실제 스크린샷을 기준으로 상부 산업 구조물/광원과 전경·중경·원경 오리지널 아트를 작업, 캐릭터 부분 가림과 보스 타격 위험 UI의 대비 조율, 모바일 2종과 태블릿 실제 프레임 비용 재검증. 가짜 장애물/유료 API/원화 무단 승인 없음. PR #235 Draft 유지, `main`·Vercel Production/유료 업그레이드 최종 승인 전 보류.


### 2026-11-10 M12-G2 / G3 실제 게임 배경 아트 수직 슬라이스

- **M12-G2 VERIFIED / DEV-MERGED:** [PR #254](https://github.com/TELLOWSS/psi-zero-day/pull/254)→OMEGA 개발 브랜치 squash `ebeaec2bac6cb3f6b8baedd48396abeb0e123bea`. 원본 Canvas에 cargo·scaffold·machine 네이티브 충돌체에만 정렬된 갱폼·호이스트·컨테이너 외장, 타워크레인/원경, 첫 진입 지면 기계그림자/소재를 제작. Core TypeScript·57파일/245테스트 및 전체 Chrome과 4해상도 focused PASS. 실제 스크린샷에서 플레이 초기 대형 구조물이 많이 화면 밖이고 상업급 입체감 부족: **그래픽 승인 보류**.
- **M12-G3 CURRENT [PR #255](https://github.com/TELLOWSS/psi-zero-day/pull/255), OMEGA DEV-ONLY QA:** 실제 native camera offset 기반 3장 상/근경 패럴랙스 비율 0.16/0.48/0.78. 중경 철골 보·원경 공장 격자·좌우 철재 기둥은 전장 상부/가장자리만 사용, 중앙 플레이와 보스 경고는 가리지 않음. 실제 scaffold·machine 동일 객체만 연동한 반투명 철망 가림. 기존 물리·사격LOS·적/보스·계정/무료 플랜 무변경.
- 검증: [Core #42810077573](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077573) **TypeScript·58파일/249테스트 PASS**. [집중 Chrome #42810077739](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077739) **PC/태블릿/모바일 2방향·플레이어 실제 이동·원경/중경/근경 픽셀 변화/철망 망 픽셀 4/4 PASS**. 실제 Chrome software microbenchmark는 실제 Android FPS 측정이 아니며 모바일 발열·조작 미검수. 전체 Chrome workflow #42810077661 결과 확인 후 병합 여부 결정.
- **최종 아트 미달:** 실제 스크린샷에서 주요 플레이 카메라의 낮은 공간 입체감, 비주얼이 통일되지 않은 AIRA/좀비 스프라이트, 낮은 고해상도 질감이 여전. 8×20=160 정식 AIRA 독립 원화·320 마스크 및 상업용 원경 원화 미완. 15구역 플레이어 실제 완주·실계정 50×Extreme·Android 물리 QA·PR243/진정한 심리스 모두 별도 BLOCKED.
- **NEXT M12-G4:** 테스트 픽셀이 아니라 실제 유저가 보는 중심 화면에서 대형 산업구조의 원근·입체 볼륨 + 정식 AIRA 원화/애니메이션 시각 정합성을 최우선. 임시 삽화·형상화 시안/실제 게임 구현·검증·상업적 승인 상태는 항상 구분. `main`/Vercel Production/유료 전환 금지.


### 2026-11-10 M12-G4 실제 AIRA 원본 게임 검수와 전장 질감 [QA PR #256](https://github.com/TELLOWSS/psi-zero-day/pull/256)

- 기존 저장소의 SHA-256 고정 은백색 AIRA `384×512` 실원화 8방향은 이미 GitHub에 존재한다. 일반 게임 화면이나 승인 완료로 잘못 사용하지 말고, 개발실 전용 `/?omegaLab=1&omegaM12G4=1`에서만 **실제 OMEGA React/Canvas의 player sprite로 표시**한다. 전 방향 해시+디코드 확인, 누락/무결성 오류 시 원본 fallback. 현재 `OMEGA_PROTOCOL_APPROVED_ART=null`, `BINARY_AUDIT_PASSED=false` 유지.
- 첫 실제 4화면 캡처 검수에서 원본 AIRA가 8방향 완성으로 정상 로딩됐지만 기존 감염체 대비 크기가 과도했다. 이번 단계에서 **G4 개발전용 원본 표시 배율 0.78**을 적용하여 세계 축척을 맞추고 실제 네 해상도 재캡처 완료. 구현 코드는 `src/ui/omega-protocol-m12-combat-fidelity.ts`, `src/ui/omega-aira-v2-candidate.ts`, `src/ui/OmegaProtocolPlaytest.tsx`. 원본 감염체/기계 피해·맵/LOS/움직임 등 Watch 물리는 변경되지 않는다.
- 1구역 중앙 철판 격자/리벳/중간 레인 반사·은백색 AIRA/4종 헬멧 감염체/보스 발 접촉 조명을 추가, 전투·경고/장치 전경 아래에만 배치. 모바일 저비용 예산 적용. 상업급 최종 배경/인물 미완.
- [Core #42812536124](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42812536124) **TypeScript + 59파일/253 Vitest PASS**. [M12-G4 4크기 실제 원본 Chrome #42812535977](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42812535977) **전부 PASS**, 실원본 8장 SHA-256·실제 방향키 이동·지면/반사 픽셀·원본 지형 그대로·승인패킹 잠금 검증, 4개 PNG와 `m12g4-silver-identity-and-material-report.json` 보고서 실패 0. 전체 일반 Watch/Guard/AIRA 보스·미션 Chrome #42812535831는 종료 결과 별도로 확인한다.
- 육안 결과: 은백색 AIRA 실제 얼굴/헤어/총기 콘셉트는 게임 안에서 명확히 표시되었으나, **원본 8장이 여전히 동작 없는 중립 스틸**이다. 좀비는 낮은 화질의 개발용 벡터 실루엣으로 외형 정합성이 부족하다. 현재 160개 독립원화/320마스크·5막 15개 고품질 지구·실기기 Android FPS/발열·전체 50 Extreme 실계정·PR #243 strict·상업/운영 승인은 BLOCKED. **NEXT M12-G5는 원본 정식 8방향 개별 액션 프레임 제작과 감염체 스프라이트 품질 검증**이며 단순 색·상단 구조물 추가로 해결했다고 하지 않는다.
- PR #235 Draft 및 `main`·Vercel 운영 미병합, 유료 전환 금지. 회귀 전체 green 및 인계 업데이트 후에만 QA PR #256을 개발 브랜치에 병합.


### 2026-11-10 M12-G5 첫 독립 원화 6개 제작·실게임 화면 비교 → **시각 품질 REJECTED**

- [QA PR #257](https://github.com/TELLOWSS/psi-zero-day/pull/257)에서 은백색 AIRA 동쪽(E) 네 접지·통과·진행·착지 자세 `silver-east-walk-0..3.svg` 및 착용한 안전모·고시인성 조끼 감염체 drifter 2개 독립 `drifter-step-0..1.svg` **원본 SVG 6개** 제작. 384×512 개별 소스/동작별 팔·다리·머리 독립 path; 리소스 본문이 다른 6개 벡터는 *상업용/페인터리 AIRA 원화가 아닌 초기 기술용 원본 키포즈*. 도식 차이만 있는 기술 자산으로 160개의 검수 완료 프레임 수에 반영하지 않는다.
- `OmegaGroundedGait`의 실제 월드 이동·거리 기반 E gait phase가 네 이미지로 바뀌며, 적은 진짜 native world XY로 두 원본 자세를 선택, 일반 Watch·Guard·HP/AI/보스 경고/충돌/LOS/극한 해금/사용자 저장은 변경하지 않는다.
- 실제 게임 브라우저 [1차 Focus #42815341004](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42815341004) 4/4 통과, E keyframes 0/1/2/3 모두 실제 이동 프레임에 표시, 감염체 drifter 렌더/픽셀 변경 검증. **하지만 확대된 실게임 화면의 새 벡터 원화는 기존 사용자 선택 고품질 AIRA 페인터리 소스와 전혀 동등하지 않은 평면 캐릭터가 됨**. 그래서 **실전 그림 품질 불합격** 판정. 기술 회귀가 녹색이어도 출시/비주얼 승인으로 취급하면 안 됨.
- 품질 게이트 구현: `?omegaLab=1&omegaM12G5=1` **8방향 SHA 원본 페인터리 은백색 AIRA 그대로 유지**. 추가 `&omegaG5VectorStudy=1`가 포함된 별도 개발실 실험 모드에서만 6개 비승인 SVG를 실제 게임에서 보여준다. 누락 시 원본 정적 원화와 옛 감염체로 fallback, 운영 일반 화면과 다른 모드에는 영향 없음. 집중 [최종 Focus #42816204667](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42816204667) **원본 4장 + 비교용 4장** 실제 Chrome screenshot 8장 모두 검증, 원본 모드에서는 새 벡터 렌더 호출 0, 미승인 비교 모드에서는 AIRA 4개 프레임 모두 렌더 및 drifter 2모션 소스 픽셀 다른 것 확인. [Core #42816204639](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42816204639) **60파일/258개 테스트·TypeScript PASS**. 전체 Guard/Watch/AIRA Chrome [#42816204570](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42816204570) 검증 완료 확인 후 QA 병합 여부 결정.
- **화면 QA 발견:** 모바일 세로(390×844)에서는 시각 검수 패널과 경기장 배치에 상부 빈 공간이 너무 크고 실게임 영역이 작게 표시되는 기존 반응형 UI 문제 확인. 다음 화면 구성 개선이 별도 필요함. 본 M12-G5 독립 원화 기술 프로토타입을 Android 물리 FPS/터치 품질로 볼 수 없음.
- **NEXT 최우선:** 진짜 원본 AIRA와 동일한 헤어/얼굴/의상·총기 페인터리 품질의 독립 E 방향 움직임 4장부터 제작해 사람이 실제 게임 4사이즈로 **시각 승인**한 후에만 해당 방향 원본 사용. 한방향 출발점 확인 후 6동작×8방향의 160개 개별 프레임, 320 마스크 및 4종 고퀄 감염체 스프라이트 점진적 제작. 단순 2D 벡터/복제/미러링/색변화로 독립 160장 승인 주장 불가. 15구역 세계·Android FPS·실 50 Extreme·strict PR243/본 PR235·상업출시 계속 보류.


**M12-G5 최종 개발 병합·검증 확정:** [QA PR #257](https://github.com/TELLOWSS/psi-zero-day/pull/257) OMEGA 개발 브랜치만 squash `c11313cfdcfdd39abaa981dfd933542b8c176cf5`; [Core #42816204639](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42816204639) **TypeScript + 60파일/258테스트 PASS**, [전체 브라우저 #42816204570](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42816204570) **SUCCESS**, [4해상도×기존원본·격리SVG=8장 #42816204667](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42816204667) **SUCCESS**. 새 벡터 AIRA는 사용자 원본보다 실제 화면상 품질이 떨어지는 **시각 미승인 QA 자산**이므로 160 중 6장 진척도로 계상 금지; 기존 원본을 기본 유지하고 2중 개발 URL 플래그에서만 6소스 비교. 모바일 세로의 과도한 상부 공백 별도 수정 필요. **NEXT M12-G5b 원본과 같은 수준의 페인터리 실키포즈 1방향부터 직접 실화면 승인**, `main`/Production/유료 전환 없음.


### 2026-11-11 M12-G5b — 4행 UI 레이아웃 복구와 독립 페인터리 원화 수용 조건 [QA PR #258](https://github.com/TELLOWSS/psi-zero-day/pull/258)

- **실제 390×844 캡처 오류 수정**: `OmegaProtocolPlaytest.tsx` 검수 UI는 헤더·원화 안내·전투 스테이지·툴바 **4개** 직접 그리드 자식인데, CSS `grid-template-rows:auto minmax(0,1fr) auto`의 **3행 설정**으로 원화 안내가 화면 중앙 전체 `1fr`을 점유하여 모바일 세로 절반 이상이 보라색 빈 영역. `data-omega-review-layout=true`일 때만 `auto auto minmax(0,1fr) auto` 4행 적용. 작은 세로/가로 화면에서 안내바만 축소, 경기장/터치 버튼을 보존. 일반 비검수 OMEGA 3행 변경 없음.
- 집중 실게임 [4해상도 브라우저 #42882860694](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42882860694) 4/4 PASS에서 390×844 canvas 높이 **704.75px (83.5%)** 회복, 모바일 가로286.86px/390 (73.6%), tablet573.58px/768 (74.7%), desktop694.27px/900 (77.1%), 실제 player 키보드 이동 84~95 단위. 실원본 8장 SHA-256 READ Y, reviewer 4grid/일반3grid, 수평 오버플로우 0 검증. 원본 사진에서 550px 아래에만 게임이 있던 현상을 해결. 전체 일반 Watch/Guard/browser 회귀는 최종 확인 후 아래 기록.
- **작화 상태 허위 상향 금지**: 기존 선택된 은백색 AIRA 8방향 실제 페인터리 WebP만 정상 표시. G5의 저화질 6 SVG 원본은 별도 거부된 비교 플래그에 격리. M12-G5b의 새로운 독립 고품질 페인터리 E 4 WebP 파일은 **아직 존재·검증·승인하지 않았음**. 별도 `omega-protocol-m12g5b-art-gate.ts`는 미래 4개 독립 작화가 제출되면 384×512 형상/서로 다른 고정 SHA/원본핀/실제 사람이 서명한 4화면 QA 조건을 통해 `REVIEWABLE_NOT_APPROVED` *계약*만 판단; 현재 candidate=null, `BLOCKED_NO_PAINTERLY_SOURCES`. 이 규칙만으로 실제 바이너리 무결성이나 시각적 완성을 검증하지 못하며, 정식 160/320 게이트는 독립적으로 잠금.
- [Core #42883095422](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42883095422) **61파일/263 Vitest·TypeScript PASS**. 실제 캡처 M12-G5b fast [#42883095270](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42883095270) 4/4 SUCCESS. 기존 Guard/Watch/AIRA 전체 브라우저 [#42883095387](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42883095387) 최종 성공 여부 검토 후 병합 여부 결정.
- **다음 우선순위 M12-G5c:** 원본 사용자가 채택한 은백색 페인터리 AIRA와 외모·조명·비례가 실제 4 크기 게임 캔버스에서 일치하는 E 4 walk **독립 작화 원본**을 제작하고 시각 검수 승인해야 함. 단순 움직임 벡터/중복/미러링은 승인 수량 0. 이후 E FIRE/DASH/HIT/ULTIMATE/FINISH, 나머지 7방향, 오클루전 320마스크 및 감염체 4종 원본 고화질 그래픽을 독립 제작. 상업급 화면/Android 물리 FPS·발열/실 사용자 50 Extreme/15구역/strict #243 모두 BLOCKED, `main`/Production/유료 전환 안함.


**M12-G5b 검증·개발 브랜치 병합 확정:** [QA PR #258](https://github.com/TELLOWSS/psi-zero-day/pull/258), OMEGA 개발 브랜치 squash `b8f913dc3b8173a2879e9ac3a17d6e36732f0689`. [Core #42883095422](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42883095422) TypeScript/61파일·263테스트 PASS, [집중 4해상도 #42883095270](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42883095270) 실제 AIRA 원본8장/4행·3행 viewport/직접 player 이동 전부 PASS, [전체 게임 브라우저 #42883095387](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42883095387) Guard/Watch/AIRA/미션/보스 SUCCESS. 검증 이후 변경은 로드맵 Markdown 1개임을 GitHub compare로 확인. **새로운 E 페인터리 4 프레임은 생성·승인되지 않았으며 지금은 STATUS BLOCKED**. 기존 8방향 원본은 변경하지 않음. **NEXT M12-G5c는 원화 자체 확보와 실게임 4해상도 동일 퀄리티 아트 승인**, `main`/Production/유료 기능 승인 전 보류.


### 2026-11-11 M12-G5c — 네이티브 E 4장 원본 검수·임시 재생/원본 복귀 도구 [QA PR #259](https://github.com/TELLOWSS/psi-zero-day/pull/259)

- **실제 독립 E 고화질 4장 원화는 아직 미제작·미승인**. 원화 생성 시도에서 원본을 대체할 수 없는 허위 테스트/병합 대시보드 이미지가 다시 생성되어 폐기했다. 이것을 완료된 게임 캡처/원화/테스트 증빙으로 사용하지 않음. M12-G5 기술용 SVG 6장은 여전히 시각 품질 미달로 별도 격리. 정식 160/320 승인 0.
- `src/ui/omega-protocol-m12g5c-local-art-review.ts`와 OMEGA 실제 전투 화면에 **DEV `?omegaLab=1&omegaM12G5c=1` 로컬 원화 검수 패널** 구현: 4 파일 선택 (`aira-east-walk-0.webp`..3), SHA-256(원본 E 핀·중복 검사), 실제 384×512 WebP 투명 이미지 디코드, 캐릭터 알파 범위·발밑 접지, 서로 다른 4프레임 렌더 픽셀 차이 검증. 이 검사는 **기술 규격 검사**이지 미적 스타일·실제 독립 페인터리 원화 수동 승인 아님.
- 통과 후보에 대해서도 자동으로 주인공을 바꾸지 않음. 사용자가 **'실전 걷기 비교' 버튼**을 눌렀을 때만 실제 OMEGA 카메라/Watch 물리의 플레이어가 **동쪽 E 방향으로 이동할 때** 4장 소스가 실제 native gait.phase에 따라 표시; idle/사격/대시/피격/다른 방향/원본 복귀는 기존 SHA-256 고정 AIRA 원화. 원본 8방향·HP/적AI/구역/Extreme/Guard/Watch/정식 art-slot 불변.
- **통신/과금 없음**: 업로드된 개인 원화는 서버/스토리지/IndexedDB/외부 API로 보내지 않고 브라우저 메모리 Blob URL만, 변경/종료 시 revoke. 사용자는 코드 편집 없이 4장만 선택하면 실제 전투 화면에서 비교할 수 있음. 모바일 세로/가로 원화 안내와 로딩·검증 실패 메시지 표시.
- `tests/omega-protocol-m12g5c-local-art-review.test.ts` 신규: DEV 모드, SHA 원본과 중복 차단, 파일명·MIME·용량, 알파·발, 진짜 E gait/정지·액션 분기, 세션 메모리 정리. 실게임 Chrome 4해상도 `scripts/qa-omega-m12g5c-local-source-browser.mjs`: 원본 SHA WebP READY → 불완전 파일 거부 → **브라우저 내부에서 만든 테스트용 사각형 WebP 4개**로만 엔진 업로드·이동·4프레임 렌더링·원본 복귀 검사. 테스트용 사각형은 정식 AIRA 원화가 **절대 아님**, screenshot 이름 `SYNTHETIC-QA-NOT-ART`로 구별.
- 첫 집중 Chrome에서 PC/태블릿/390×844 3/4 통과. 844×390은 업로드 실패 시 안내 span을 CSS가 `display:none` 처리하여 Playwright가 보이는 안내를 찾지 못함. **CSS 가로 상태에서도 오류 안내 한 줄 표시로 수정 후 재시험**; 최종 결과는 후속 확정 기록. TypeScript/62파일·268 Vitest 첫 run 통과. 전체 Watch/Guard/보스 브라우저 결과와 최종 병합 전 반드시 재확인.
- **NEXT** 실제 고해상도 페인터리 원화 4장을 독립 작화로 생성·출처/저작권·투명도·음영·발 접지·무기/얼굴을 원본과 육안 비교 → 로컬 개발실 검수 후 GitHub 아트 검토용 별도 PR → 정식 160/320 및 strict PR243 **계속 잠금**. 4종 감염체 고퀄 그래픽, 15전장, Android 실기기 FPS/터치 및 실제 50 Extreme은 차후. `main`/Production/유료 전환은 최종 사용자 승인 전 금지.


**M12-G5c 최종 QA 개발 병합 기록:** [QA PR #259](https://github.com/TELLOWSS/psi-zero-day/pull/259)을 OMEGA 개발 브랜치에만 squash `bd6ec0712ae6bf0472de287c4fc4ea80deb473dd` 병합. [Core #42889122038](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42889122038) **TS+62파일/268 Vitest PASS**, [집중 PC/태블릿/모바일 4해상도 #42889121858](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42889121858) **SUCCESS**, [기존 전체 Watch·Guard·AIRA·미션·보스 Chrome #42889121825](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42889121825) **SUCCESS**. 자동 승인 그림 없음: CI에서 테스트용으로 생성한 단색 도형 4개는 실제 독립 페인터리 AIRA 원화가 아닌 검수 도구 점검자료이고, 허위 대시보드 이미지도 정식 게임 아트/스크린샷/검증 증빙에서 모두 제외. 실제 원화 새로 완성한 수량 **0**, 정식 원화 160·마스크 320 승인 수량 **0**. 다음 M12-G5d 원화 실제 제작·동일 줌 인게임 검수 후 다음 동작 확장. `main`/Production/유료 요금 전환 금지, PR235 Draft.


### 2026-11-11 M12-G5d 독립 E 걷기 AI 원화 4자세 실생성 (개발 바이너리 미업로드)

- **이제 진짜 캐릭터 아트 산출물 4개가 존재**: 투명한 2×2 생성 원본에서 AIRA E 걷기 Contact/Lift/Stride/Recovery 4개 개별 384×512 RGBA WebP를 분리해 `aira_m12g5d_four_independent_webp.zip`로 사용자 대화에 전달. 각 프레임의 SHA-256 및 알파·발 접촉 측정치와 원본 시트·루프 GIF를 패키지에 포함. 사용자에게 잘못 출력됐던 작업완료 대시보드는 다시 생성하지 않았고 아트로 사용하지 않음. 해시 0 `2dfb4825f403cbe0915764234be4b2697d445bfa3fb55bcb1955afc362fa3a04`; 1 `2c65fdcc5acb98f77e20d38f1945e1355c9f759463395b42e35c482426a8c13b`; 2 `79ff9f7bf76342d298144d28f8dec5b128063206258fec8c9dc4fb23400795c4`; 3 `7fe9a9b91b60f40c25abd286906db2b014c51f0de91d72fffa72af08e7eda759`.
- **단계 구분**: 4개 별도 AI-그림 후보 파일 생성/메모리 파일 감사 **완료**. 원본 AIRA 사용자 디렉터 승인·실제 게임 엔진에 이 4파일로 구동 테스트·GitHub 바이너리 업로드 및 CI 인게임 캡처는 **미완료**. 기존 M12-G5c에서 독립 WebP 4장 세션 임포트 기능은 이미 개발됨; 이번 4개 실제 후보로 다시 테스트해야 함. GitHub 문서 SHA 기록은 바이너리 푸시의 증거가 아님. 상품급 160 독립 작화·320 마스크 승인 0 유지, PR235 Draft/main/운영 배포·유료 전환 금지.
- **NEXT M12-G5d-2**: 이번 실제 4개 WebP 파일을 GitHub 별도 QA 브랜치에 바이너리로 업로드하고 해시를 검증, 실제 React/Canvas 네이티브 E gait/모바일 4화면으로 확인 후 원본 대비 외모·음영·발 접지 육안 검수. 적합하지 않으면 원본 8방향 유지. 다음엔 E fire/dash/hit·4종 감염체·타 7방향 원본 생산을 이어간다.


### 2026-11-11 M12-G5d-2 — 원본 바이너리 네 장 GitHub 원형 그대로 등록

- [QA PR #260](https://github.com/TELLOWSS/psi-zero-day/pull/260) 작업 출발 `3ca3053d3ed20185feefacebcd9b61f1908c5f99`, Base는 `feat/omega-protocol-roguelite-core-20261108`(주 PR #235 Draft, main 미병합). 이번에는 전 단계에서 실제 만든 AIRA 투명 384×512 WebP **4개 원본 바이너리 그대로**를 GitHub 원본 Git blob SHA로 넣음. [원본 바이너리 등록 커밋 `498311ad`](https://github.com/TELLOWSS/psi-zero-day/commit/498311adf4c85878351f03758beb55805dd10ddf). GitHub 응답 SHA·파일크기 4/4 모두 ZIP 원본과 대조, 각각 Sha256 `2dfb4825f403...`,`2c65fdcc5acb...`,`79ff9f7bf763...`,`7fe9a9b91b60...` 정확히 보존. 단순 README/확장자 사기·기존 원화 WebP 복제/미러링 아님. 네 독립 파일은 **하나의 AI 생성 시트를 4개 서로 다른 걷기 자세로 분리한 원화 후보**이며, 사람이 별도 4프레임을 손으로 작화했다는 의미가 아님.
- `src/ui/omega-protocol-m12g5d-actual-source.ts`: 개발 전용 `?omegaLab=1&omegaM12G5d=1`에서 네 GitHub 실원화를 사용자 요구 없이 자동 적용하지 않고 **'저장소 실제 원화 4장 검사' 클릭 → 실제 URI/RIFF/바이트 수/SHA256/384×512/투명도/원본 바닥 좌표/프레임 차이 검사 → '실전 걷기 비교' 재클릭**으로만 원본 Watch 플레이어 E 방향 보행에 4개 걸음 자세 적용. 타 7방향·정지·피격·사격·대시·필살기 및 기본 게임은 사용자 선택 원본 은백색 AIRA 유지, 기본 미승인 원화/보안 플래그·산재훈련/안전모드와 게임 엔진 충돌/HP/LOS/AI/실계정/해금 불변.
- `omega-protocol-m12g5c-local-art-review.ts`는 실제 투명 WebP의 픽셀 y485~487 근처 부츠와 게임 바닥 (0,0) 발 접촉점 결합, 구형 WebP 투명 하단 여백에 따른 발 뜸 버그 수정. **실제 게임 캡처 4개**: PC 1440×900, 태블릿1024×768, 모바일세로390×844, 가로844×390. [집중 Chrome #42904793248](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42904793248) 4/4 Pass, [최종 4-size 집중 #42905589446](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42905589446) 4/4 PASS. 원본→실제 파일 4장 native gait 0/1/2/3→원본 복귀 모두 성공, 새 후보 화면의 HP/적/도구 UI 조작 정상. 390×844 원화 버튼 2개가 한 열로 겹치고 일부 잘리는 추가 UX 문제 발견 → 2열로 고쳐 각 버튼의 가시 좌표를 실제 브라우저에서 검사, **가로/세로 4해상도 버튼 잘림·겹침 0**.
- 실제 WebP 원본 소스 SHA + GitBlob SHA를 파일마다 직접 검사하는 `tests/omega-protocol-m12g5d-actual-art.test.ts` 5개 신규. [Core #42905589207](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42905589207) **63파일/273 테스트·TypeScript PASS**. 전체 Watch·Guard·AIRA·미션·보스 브라우저 첫 [#42905589317](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42905589317)는 기존 G5 기술 SVG 시범 테스트에서 slow CI 690ms 고정 타이머 동안 서로 다른 보행 포즈 2개를 관측하지 못해 1건 실패(개별 G5 집중 #42905589496은 성공). 그 기존 테스트가 프레임 개수가 너무 적은 CI에서 오탐하지 않게 **실제 Native gait 2개 관측까지 adaptive wait, 3s timeout** 수정 후 전체 재검증 중. 테스트 데이터 상태/적/플레이어 좌표 인위 조작 없음. 최종 CI 상태 확정 후 개발 병합.
- **아직 아트 출시 승인 아님**: 네 이미지가 AI에서 생성돼 1원본 시트에서 나온 고해상도 *후보 원화*는 게임 시각 비교까지 완료했으나 사용자/디렉터 정식 승인 0. 160개 독립 아트·320 마스크 전체 완성/승인, 4종 고퀄 감염체, 5막 15맵 고품질 배경, 실 Android 장치 발열/FPS/터치, Strict PR243, 실제 사용자 50 Extreme, 상업 출시·Vercel Production은 BLOCKED. `main`/유료 API 자동 전환 없음.
- **NEXT M12-G5e:** 이번 E 보행 4프레임 시각 검수 기준을 고정하고 동일 원본 캐릭터로 실제 E FIRING/RELOAD, DASH, HIT 피격 4포즈씩 제작(기존 BLACK/ROSE 기술도안 섞지 않음), 발/총구/피격점 근거 검증 후 나머지 7방향 확장. 미승인 원화 자동 출시 불가.


**M12-G5d-2 실제 원화 4개·개발 병합 최종 확정 (2026-11-11):** [QA PR #260](https://github.com/TELLOWSS/psi-zero-day/pull/260) OMEGA 개발 브랜치 전용 squash `39670a034753c8d0c5cce8eef6f38e7d8906ffc9`. 생성한 진짜 384×512 E walk WebP 4개를 **변환/재압축 없이 GitHub git blob으로 실제 등록**, 원본 ZIP SHA256/Blob SHA1/길이 4/4 일치. 기존 8방향 AIRA 원본을 일반 게임 기본으로 유지하고 검수 모드에서 파일 무결성 확인 → 명시적 사용자 클릭 → 실제 native Watch 동쪽 이동 프레임 0·1·2·3 → 원본 복귀/발 접지·PC/모바일 가시성 검증. [Core #42908004325](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42908004325) TypeScript+63파일·273테스트 PASS, [실제 네 WebP 4크기 #42908004128](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42908004128) SUCCESS, [전체 Watch/Guard/AIRA/보스·미션 Chrome #42908004219](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42908004219) SUCCESS, [구형 저품질 G5 SVG 별도 기술검수 #42908004237](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42908004237) SUCCESS. 이전 폐기한 6개 벡터 G5 실험의 간헐적 전체 직렬 브라우저 카운터 오류는 독립 focused 4화면 QA를 유지하면서 **중복 full step만 제외**; 실제 신규 원본·모든 게임 회귀는 full에 유지했다. **4장 이미지 바이너리 파일 존재/DEV 4방향 시연은 완료**. 하지만 *동일 AI 원본 시트 4개 자세로부터 분리한 작화 후보*이므로 정식 160/320 미승인, 모바일 실제 Android FPS/발열·실유저50 Extreme·strict PR243·상업출시는 차단. 다음 **M12-G5e**는 동일 캐릭터 품질의 실제 FIRE/DASH/HIT 자산 제작·바이트 고정·실전 동일줌 시각 검토, 감염체 고화질로 추가 진행. PR235 계속 Draft, main/Production/유료 전환 없음.


### 2026-11-11 M12-G5e 실제 E 사격·대시·피격 native 원본 연출 단계 [QA PR #261](https://github.com/TELLOWSS/psi-zero-day/pull/261)

- 인계서 §32의 M12-G5d-2는 이미 [PR #260](https://github.com/TELLOWSS/psi-zero-day/pull/260)으로 **4개 E WALK 원본 WebP 바이너리 SHA-256/실게임 4화면 검증 및 OMEGA 개발 브랜치 병합 완료**, 이 단계는 다시 반복하지 않음.
- 이번에도 원화 생성 도구가 요구한 투명 동작 원화 대신 **허위 PR·테스트 PASS 대시보드**를 두 번 반환. 해당 이미지는 게임 원화·완성 스크린샷·테스트 근거에서 **전부 배제**. E FIRE/DASH/HIT 독립 고해상도 페인터리 원화 실제 새 제작 수 **0**, 승인 **0**. 생성 불능을 숨기고 160프레임 완성이라고 표시하는 일 절대 금지.
- **실제 기능 구현** `src/ui/omega-protocol-m12g5e-silver-action-fx.ts` + `omega-aira-v2-candidate.ts` + `OmegaProtocolPlaytest.tsx`: `/?omegaLab=1&omegaM12G5e=1` Vite DEV 내부 전투 전용. 기존 검증된 은백색 AIRA 8방향 원본 WebP를 그대로 사용하면서 `view.shooting`의 발사 age .15초 미만에만 **총구 빛/짧은 반동**, `view.dashing` 실제 native Shift 대시 .32초 미만에만 **원본 페인터리 이미지 감쇠 잔상/속도 광선**, `view.hurt` 진짜 피해 반응 .26초 미만에만 **균열 링/짧은 틸트**. 방향 E에서만 동작, HIT>DASH>FIRE 우선순위. 움직임/피해·상처/AI/투사체/총구 타격/물리 판정/업그레이드/해금/사용자 데이터 절대 불변. **독립 페인터리 원화가 아닌 렌더링 효과**임을 UI·코드 모두 명시.
- G5d 기존 4개 E 걷기 WebP는 해당 실험실 화면에서도 동일 SHA-256으로 검사한 뒤 사용자 버튼으로만 로드하고 원본 복귀. 사용자 선택 기존 은백색 AIRA 8방향과 기본 일반 Watch/Guard/Omega는 변경 없음. 정식 160개 원화/320 마스크/strict PR243 승인 0.
- `tests/omega-protocol-m12g5e-silver-action-fx.test.ts`: 5개 단위 검증, 실험실 경로 격리·원화 승인0, 무행동·시간 만료·E 외 7방향·Victory/ULTIMATE에서 효과0, native hit>dash>fire 우선순위, 기존 고품질 image 소스 실제 `ctx.drawImage` 보존·FX Canvas save/restore 및 Watch 원본 4 물리 장애물 무변경.
- `scripts/qa-omega-m12g5e-real-native-action-browser.mjs`: PC1440×900/Tablet1024×768/모바일세로390×844/가로844×390 **진짜 React/Canvas 게임 4크기**에서 SHA source READY, 개발 사격 표적은 native OMEGA 게임 시작 초기에만 배치하는 기존 `omegaQaState=combatGun` 개발 모드로 실제 자동발사·표적 HP 감소·실제 E body turn(키보드 `ArrowRight`)·native shift DASH·4 E WALK WebP 해시/발 접지/0·1·2·3 프레임/즉시 원본 복귀를 검증. 처음 async `waitForFunction`이 Promise를 truthy로 판단해 false를 수집하는 테스트 버그를 발견, 동기 단일 모듈 참조로 수정. 그 후에도 원래 초기 몸체 방향이 E가 아니어서 실제 E 효과가 0임을 확인, **실제 사용자 ArrowRight 동작으로 E 방향을 먼저 만들고 표적이 여전히 오른쪽에 있도록** 스크립트 수정. 개발 테스트를 통과시키려고 직접 `view.shooting=true`, `session.facing` 또는 피해 수치를 강제로 주입하지 않음.
- [Core #42970094115](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42970094115) **TypeScript + 64파일 Vitest PASS**. [최종 G5e focused #42970093960](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42970093960) **4/4 SUCCESS**, 각 원본 사용자 이동/실제 피해 횟수와 소스 WebP 4개 frame 0,1,2,3 기록:
  - PC: 실제 사격 FX1/명중5/대시 FX2/player X이동223.7
  - Tablet: FIRE1/명중5/DASH2/X이동220
  - Portrait: FIRE1/명중2/DASH2/X이동159.5
  - Landscape: FIRE1/명중2/DASH2/X이동122.8
- 전체 Watch/Guard/AIRA·미션/보스 브라우저 [#42970094056](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42970094056)은 최종 결과·QA 코드 SHA 비교 후 개발 병합 판단. Focused CI 실제 4게임 캡처와 JSON `m12g5e-real-native-silver-event-action-report.json` (artifact `omega-m12g5e-focused-chrome` id `13833595362`)를 생성. 실제 이미지에서 감염체는 저화질 벡터이고 바닥은 아직 기술적 형태라 **전체 상용 수준은 불합격/미완**.
- **NEXT**: 눈에 보이는 고품질 **독립 E FIRE/DASH/HIT 실제 384×512 WebP 원화와 4종 감염체**를 생산 → 이전 검수 모듈 SHA/프레임 독립성/사람 육안 QA → Dev에서만 선택 적용 → 8방향 전개/160 소스/320마스크. Vercel 운영 및 main 병합·과금 전환 사용자 승인 전 차단.
