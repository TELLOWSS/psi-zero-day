# OMEGA PROTOCOL — 새 채팅 / 새 개발 세션 인계 문서
**관리일:** 2026-11-09 (KST) · M01~M03 기술검증 완료, M04-A 및 M04-B 첫 막 경계 리프트 기술검증 완료  
**저장소:** [TELLOWSS/psi-zero-day](https://github.com/TELLOWSS/psi-zero-day)  
**작업 PR:** [#235 — Draft: Extreme-50 Quarantine Zombie Gun×Blade Expedition](https://github.com/TELLOWSS/psi-zero-day/pull/235)  
**작업 브랜치:** `feat/omega-protocol-roguelite-core-20261108`  
**기준 브랜치:** `main` (**병합 금지**: 테스트/승인 전)  
**운영 Vercel:** Production 미반영·유료 플랜 전환 금지.

> **새 채팅에서 이 문서를 제일 먼저 읽고 PR #235의 최신 HEAD를 조회하라.** 이 문서는 날짜별 메시지를 대체하는 실행 기준이며 실제 최신 커밋·CI/테스트 결과가 달라졌으면 GitHub 기준으로 갱신한다. 사용자에게 같은 질문을 다시 하지 않는다.

## 1. 변하지 않는 디렉터 요구사항

1. **독점 해금:** SIGNAL WATCH **극한(Extreme) 난이도 1~50 스테이지 각각 최소 1회 클리어** `difficultyClearRecords[stage_01..50].extreme >= 1`일 때만 OMEGA 특별판 이용 가능. 10개 일반 클리어, 일반 50개, 마스터리 ★★★, 다른 난이도는 대체 불가. 기존 WATCH 기록/지갑/기존 유저 보상 보호.
2. **게임 방식:** 별도 '15스테이지 선택'이 **아님**. 5막 대형 연결 산업단지를 AIRA가 직접 조작하여 이동하고, 이벤트/장치/탐색/보스/진입로를 해결해 이동하는 2.5D 3/4 시점 **액션 로그라이트**. 내부 전투/이벤트 노드 15개는 엔진 스케줄 변수일 뿐 별도 클리어 단계가 아님. 적만 처치한다고 자동 진행 금지.
3. **특별판 세계관:** 가상 오염 산업단지 Q-17, 가상의 NEXUS 오염, 안전모·반사조끼를 착용한 **감염 작업자 좀비**, 폭주 크레인/기계체, BLACK SIGNAL 격리 통제 AI. 일반 WATCH의 '안전한 산업현장 근로자' 표현과 구별. **감염된 좀비에게는 총과 검 둘 다 허용**; 감염되지 않은 생존자는 구조 대상. 실제 인물 모델/사진 사용이나 현실적인 가해 방법을 전달하는 게임이 아님.
4. **AIRA V2:** 은백색/라벤더 머리 고품질 여성 주인공, 두 주 무기는 SF 총/검. **8방향 자체 원화**와 별도 8방향 걷기·사격·검격·대시·피격·궁극기·피니시 액션 프레임이 필요. 현재 은백색 정지 원화 8장 연구본, NW 후면 좌측 정확한 후보는 대화 산출물일 뿐 GitHub 원본 교체 미완. 구형 E-방향 연구용 색상/동작 프레임을 은백색 최종으로 오인 금지.
5. **연출 품질:** 기존 게임 완주자를 위한 확연히 다른 전투 쾌감: 총격→접근 회피→검 3연격→보스 약점→이벤트→맵 탐험, 다양한 적/보스, 입체 구조물·전경 가림·광원·사운드·성장 테크트리. 1시간가량의 몰입이 목표이지 실측 완료시간 아님.
6. **출시:** 품질 게이트 및 사용자 최종 승인 전에는 **PR Draft 유지, main 미병합, Vercel Production 미배포**. 무료 한도 소진/빌드 제한을 유료 구독으로 해결하지 않음.

## 2. 단일 출처 / 진실 판정

- [5막 전체 세계관·전투·로드맵 원문](docs/OMEGA-PROTOCOL-EXTREME-50-GUN-BLADE-MASTERPLAN-20261109.md)
- [AIRA 은백색 160 액션 원화 납품 계약](docs/OMEGA-AIRA-SILVER-ACTION-DELIVERY-CONTRACT-20261109.md)
- [기존 OMEGA 기획서](docs/OMEGA-PROTOCOL-SPECIAL-EDITION.md) — 새 오염 좀비 설정이 우선.
- **GitHub PR #235 HEAD**는 매번 다시 조회. 예전 채팅의 커밋을 최신으로 가정하지 않는다.
- 완료 보고는 **CODED / REVIEWED / TESTED / SHIPPED**를 구분. 기획서, 개념 이미지, 임시 Canvas 도형, 테스트 코드 추가, 브라우저 시뮬레이션은 실기기 완료/정식 아트 완료가 아니다.

## 3. 마일스톤 체크리스트 — 최신 HEAD에서 반드시 재검증

| ID | 필수 범위 / 합격 기준 | 개발 코드 상태 | 검증 / 출시 판정 |
|---|---|---|---|
| M00 | 기획 정합: 극한 50/50 해금, 연결 탐험, 오염 좀비 총·검 | 문서·15사건 스토리 작성 | **기획 기록 완료, 최종 시네마틱 미제작** |
| M01 | 극한 50개 실제 클리어 기록을 읽어 엄격 해금; 보존 | `omegaProtocolAccessFromRecords`, `readOmegaProtocolAccess`, 실제 `persistStoreWallet`를 통한 1→50 순차 저장 통합 테스트 | **TESTED: PR #237 핵심 CI PASS, 44파일/186테스트, `tsc --noEmit` + 엔진 타입체크. 공개 CTA는 출시 승인 전까지 미연동** |
| M01-QA | 개발 시험용 50/50과 이용자 실제 저장 기록 분리 표시 | `OmegaProtocolPlaytest`에 실제 진도 표시 및 DOM 증거; Vite·Chromium 9개 체크포인트 브라우저 검사 | **TESTED: PR #237 브라우저 전체 workflow PASS, 실제 React/Canvas 및 `data-omega-real-extreme-clears` QA 검사 통과. 실기기 Android/운영 CTA 아님** |
| M02 | OMEGA 원거리 무기 + 검 3타, HP 감소, 방향·엄폐·보스 피해 상한, PC/모바일 입력 | OMEGA 전용 시작 원거리 총기 `radio_boost=1`, 검 3연격, 실제 native 투사체/HP·거리·장애물·F키/모바일 터치 검격, 2개 검 강화 | **TESTED 기술검증: PR #238 CI 45파일/193테스트 + DEV 실제 React/Canvas 브라우저 E2E 4/4 통과. 고품질 독립 총/검 원화, 실기기 Android, 상업 출시 품질은 미완** |
| M03 | 안전모 좀비 기본·질주·장갑·정예 4종의 차별화 추격·예고·실제 HP 피해 | 기존 Watch 네이티브 감염체 위에 OMEGA 전용 4개 독립 AI, 각 1종 필수 배치+산업 장비형 적 1종, HP·속도·돌진·측면기동·공격 예고·충돌 처리·임시 차별 실루엣 | **TESTED 기술검증: PR #239 Core 46파일/203테스트 + Vite/Chromium 데스크톱·모바일 AI 4종 모두 예고 후 실제 HP 피해. 정식 8방향 고품질 좀비 원화·군집 전술·Android 실기기 미완** |
| M04 | 5막 15지점 이벤트, 물리적 길 찾기, 연속 연결 카메라 | **M04-A+B 구현:** 실제 E/터치 출구 1→2→3→4 연속 이동, 3→4 일치하는 비계 리프트 상·하부 도크, 월드 좌표 일치 검증, 18m 승강 연출, 현재 5막 내부 지점/이벤트/라디오 유지 | **PARTIALLY TESTED:** PR #240(A)·#241(B) PC 방향키/모바일 아날로그 터치 3회 이동 및 첫 막 경계 PASS. **5막 15지점 완전 심리스 공간, 6→7 등 나머지 막 경계 고유 연출, 실제 15구역 무스킵 완주, 실기기/정식 배경 미완** |
| M05 | 중간 보스 TITAN HOOK/최종 BLACK SIGNAL CORE의 차별화 3페이즈 | 기존 실제 보스/예고/HP 스케치 | **최종 기믹·완성 아트 미완** |
| M06 | 은백색 AIRA 8방향 정지 원화 기준 및 **정확한 NW 후면 좌측** | GitHub 은백색 8방향 연구본, NW 후보는 대화에서만 생성 | **원화 최종 승인/리포지토리 정식 적용 미완** |
| M07 | 은백색 AIRA **독립 160액션 프레임 + 마스크 320**, 장비 정렬, 발 접지 | Watch 8방향 원화 선택/실제 idle/walk/fire/dash/hit 상태 판별, GUARD 원화 관찰용 연결 | **은백색 승인 독립 프레임 0/160, 마스크 미완** |
| M08 | 고해상도 좀비 12종 이상 변형, 애니메이션, 총기·검격 SFX/FX | 기술용 적 도형+임시 검 궤적 | **원화/사운드/전투 연출 미완** |
| M09 | 전체 실제 탐험을 처음부터 엔딩까지 무스킵, GPU/CPU/저사양 QA | 단위테스트·Playwright 브라우저 스크립트 존재 | **최신 커밋 실행 PASS 미확인** |
| M10 | PC/태블릿/안드로이드 실기기, 가로/세로 UI/발열/FPS/터치 | 반응형 CSS·브라우저 캡처 스크립트 작성 | **실기기 실행 미검증** |
| M11 | 릴리스 게이트, 저장 호환, 위험성 없음, 사용자 승인 | PR #235 Draft | **main/Production 병합 및 공개 금지** |

**다음 실행 작업(하나씩 처리): M04-C — 6→7 크레인 승강기·9→10 지하 설비 연결터널·12→13 중앙 에어록의 개별 지형·연출 구분 및 5막 경계 전부 브라우저 실제 이동 검증.** M04-A(1→2→3)와 M04-B(3→4 첫 막 리프트)는 PR #240/#241에서 실제 브라우저 PASS. 현재 15개 각 구역은 여전히 별도의 1400×900 전장 지도를 닫힌 문 뒤에서 로드한다. **완전한 스트리밍 심리스 월드·15개 노드 전투/이벤트 무스킵 완주로 착각하지 말 것.** 기존 `src/domain/omega-protocol-field-transit.ts`, `src/ui/omega-protocol-act-lift.ts`, `src/engine/omega-protocol-combat.ts`, `src/ui/OmegaProtocolPlaytest.tsx`, `scripts/qa-omega-connected-gates-browser.mjs`를 확인하고 3개 막 경계가 서로 다른 실제 월드 앵커/입장/시각 연출을 가지는지 Chrome PC·모바일 입력 검증을 추가할 것. 다음 M04-D는 보상 선택 오버레이 몰입 저해 개선과 15구역 전체 무스킵 플레이. `main`/Production 병합 금지.

## 4. 코드별 찾아가기

**해금 / 진도**
- `src/domain/omega-protocol-run.ts`: 50개 Extreme 엄격 계산, OMEGA 런/이벤트/성장 테이블, 감염 좀비 이벤트 풀
- `src/app/omega-protocol-access.ts`: 실제 `psi.survivors.store_wallet` 읽기만 하는 해금 판별
- `src/domain/survivors-difficulty-records.ts`: Watch per-stage extreme 성과 원본 규칙
- `src/ui/OmegaProtocolPlaytest.tsx`: **개발용 50/50 fixture**로만 실행; 실제 기록 `data-omega-real-extreme-clears`, `data-omega-real-unlock-eligible`로 별도 표기
- `src/ui/GameHub.tsx`: `?omegaLab=1`와 개발 환경에서만 OMEGA QA; 정식 메뉴 해금 CTA 아직 없음

**전투 / 좀비**
- `src/engine/omega-protocol-combat.ts`: 독립 OMEGA 세션, `blade()` + 공격 판정, 회피, 이벤트/보스/맵
- `src/domain/omega-protocol-blade.ts`: 검 3타, 부채꼴, 쿨다운
- `src/engine/patrol-survivors-engine.ts`: `protocolExternalEncounter` guard, `damageProtocolConstruct`, 기존 총기 투사체 HP 판정
- `src/ui/omega-protocol-enemy-render.ts`: OMEGA 한정 안전모 감염 좀비 렌더러/3가지 색
- `src/domain/omega-protocol-story.ts`: 오염 산업단지 5막·15 사건

**원화 / QA**
- `public/assets/omega/canonical-review/aira-v2/`: 은백색 8방향 정지 검수
- `src/ui/omega-silver-action-parity.ts`: **0/160** 승인 액션 원화
- `src/ui/OmegaSilverGuardReview.tsx`: GUARD SVG 관찰자 시각 검수, 전투 캐릭터 아님
- `tests/omega-protocol-extreme-unlock.test.ts` (기존 WATCH `persistStoreWallet` 통합 1~50 검증), `tests/omega-protocol-infected-zombie.test.ts`, `tests/omega-protocol-blade.test.ts`, `tests/omega-protocol-story.test.ts`: 유닛 회귀
- `scripts/qa-omega-protocol-browser.mjs`: 실제 화면 PC/세로/가로, F/모바일 검격과 실진도/QA fixture 구분 검증
- `.github/workflows/verify-omega-protocol.yml`, `.github/workflows/qa-omega-protocol-browser.yml`: 검증 워크플로

## 5. 새 채팅에서 사용할 정확한 요청 예시

> `TELLOWSS/psi-zero-day` GitHub PR #235의 최신 HEAD와 개발 브랜치 `feat/omega-protocol-roguelite-core-20261108`를 직접 확인해줘. 먼저 브랜치의 루트 `OMEGA-PROTOCOL-CONTINUE.md`와 `docs/OMEGA-PROTOCOL-EXTREME-50-GUN-BLADE-MASTERPLAN-20261109.md`를 읽고, 체크리스트에서 **TESTED 증거 없는 항목부터** 실제 코드·테스트를 진행해줘. 완료/미완료를 구분해서 최신 커밋과 다음 작업을 인계 파일에 갱신해줘. PR은 Draft, main/Production 미반영 유지. 종합 방향은 **극한 50/50 해금 · 안전모 감염 좀비 · 총검 · 5막 연결형 탐험**.`

## 6. 세션 종료/보고 규칙

1. 매번 PR 최신 HEAD SHA, 새로운 커밋 및 변경 파일, 테스트 **실제 실행 근거**, 잔여 BLOCKER 확인.
2. 이 파일의 체크리스트와 최종 검증상태 갱신; 다음 세션의 **첫번째 실행 파일/테스트**를 명시.
3. PR 설명/상단 댓글에 이 파일 링크 기록.
4. 정식 원화·모바일 실기기·완전한 게임화면 완료 주장은 실제 빌드/시각 증거가 있을 때만 함.
5. GitHub 최신 HEAD보다 오래된 이 파일의 시점표기는 스냅샷이며 HEAD를 우선.

## 7. 마지막 관측한 GitHub 릴리스/검증 장벽

- **관측 시점:** 2026-11-09 KST, 핸드오프 최초 생성 HEAD `92f286386ed18448c31107c873de7041b0b8629f`.
- 해당 HEAD의 GitHub Actions workflow runs **0건**, check-runs **0건**. 즉 최신 변경에 대한 typecheck/Vitest/브라우저 QA 실제 통과 **근거 없음**.
- 해당 HEAD의 Vercel commit status **failure**, 링크에서 `upgradeToPro=build-rate-limit` 확인. **유료 전환하지 않음**. 이는 JS 실행/성능 테스트 증거가 아님.
- `main` 최신 조회 커밋 `28dc1e1bfad5f67f9c77970521706ee2a37e4dc1`; PR 메타의 오래된 merge base `dae18d1...`과 달라져 **main 진도가 앞섬**. PR 응답상 `mergeable=false`. **자동 merge / main 갱신 금지**, 필요 시 충돌/베이스 차이 별도 검토.
- **2026-11-09 후속 갱신:** 위의 초기 CI 미실행 문제는 PR #235의 `main`과 충돌 때문에 발생했음. 별도 검증 PR #237 → OMEGA 개발 브랜치 방향에서 전체 테스트가 실행되어 **M01/M01-QA PASS 확인**. 본문의 과거 0건 관측은 아카이브이며 **최신 결과는 아래 8절**을 우선한다. 앞으로 M02의 실제 전투 타격증거는 별도로 확보해야 한다.

## 8. 2026-11-09 실제 테스트 완료 및 다음 인계 (최신 기록)

**검증 출처 및 SHA:** 별도 검증 PR [#237](https://github.com/TELLOWSS/psi-zero-day/pull/237)의 head `7ae30d0e6393a40ed77ec26a744769c506ad6a38` — 실검증 이후 OMEGA 개발 브랜치에 **squash 병합** commit `4866d824bddd04dacbb218705005a9d665bbe7a2`. `main`은 불변.

| 검증 | 실제 GitHub Actions run | 판정 |
| --- | --- | --- |
| OMEGA Core TypeScript + SHA-256 binary + 안전한 아트 승인 차단 | [42575436435](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42575436435) | **PASS** — Typecheck + 원화 검사 |
| Vitest OMEGA/Watch/Guard 회귀 | [Core CI](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42575436435) | **PASS 44 files / 186 tests** |
| Vite + Chromium 반응형 전장/원화/입력/극한 해금 진도 분리 | [42575436509](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42575436509) | **PASS 전체 31/31 workflow steps**. 일부 단계는 소스아트 QA 스크린샷이며 실기기 아님 |
| 검증용 버전의 QA 코드 정리 | [#237](https://github.com/TELLOWSS/psi-zero-day/pull/237) | **QA 브랜치에서 검증 후 개발 브랜치로 병합** |
| 사용자 공개 해금/정식 8방향 은백색 액션/Android 실기기 | 개발 PR #235 | **BLOCKED / 미출시** |

**이번 세션에서 실제 수정·반영된 파일 9개:** `tests/omega-protocol-extreme-unlock.test.ts` 실제 지갑 저장 연동, `src/ui/PatrolSurvivorsGame.tsx` optional dash bool 정규화, `tests/omega-protocol-blade.test.ts`, `tests/omega-protocol-infected-zombie.test.ts` readonly Hazard 타입 준수, `tests/omega-silver-watch-native.test.ts` 8방향 typed map, `tests/omega-protocol-actor-render.test.ts`, `tests/omega-protocol-dash-visuals.test.ts`, `tests/omega-protocol-grounded-gait.test.ts` 이전 10/50 시험 fixture 업데이트, `scripts/qa-omega-silver-preview-browser.mjs` ZIP 비동기 불러오기 대기.

**CI가 없었던 근본 이유:** PR #235는 `main`과 충돌(`mergeable=false / dirty`)이어서 `pull_request` Actions 트리거가 실행되지 않았다. 정식 출시 전까지 별도 QA PR을 **개발 브랜치만 대상으로** 개설하여 테스트하고 그곳으로 병합하는 방식을 유지한다. PR #235와 `main`의 충돌 해결은 최종 품질게이트 이후 별도 검토, 운영 배포 금지.

**여전히 미완:** 실제 유저 해금 CTA, 승인된 AIRA 독립 160프레임(현재 0/160), 12종 이상 정식 8방향 좀비/적 원화·군집 전술, **진정한 5막/15지점 심리스 세계 연결·다른 3개 막 경계·완전 전환 시네마틱**(M04-A/B는 구역 1→2→3→4 실제 게이트 이동까지만), Android/태블릿 실기기 실측, 보스 다단계. **PR #237(M01), #238(M02), #239(M03), #240(M04-A), #241(M04-B) 기술검증 PASS**, 운영·최종 아트/음향 품질 승인 미완.

**다음 시작 커밋:** PR #235 최신 HEAD를 다시 조회하고 **인계 12절 M04-B 검증 범위**부터 읽어라. 중복된 1→2→3→4 검증을 다시 하는 대신 **M04-C의 나머지 3개 Act 경계 6→7·9→10·12→13의 독립 디자인과 실제 조작 검증**을 진행할 것. QA 브랜치→Vite/Chromium 검증→OMEGA 개발 브랜치 반영 후 인계 갱신.

## 9. M02 총·검 실전투 기술검증 — 2026-11-09 최신 결과

**검증 및 반영:** 별도 검증용 [PR #238](https://github.com/TELLOWSS/psi-zero-day/pull/238)의 HEAD `f0ebf0731b919e2b3481d339c94eee825c8b5302`를 검사한 뒤 OMEGA 개발 브랜치에만 squash 병합 `44150e209b00395dfc18e24859ce03370bb58ed0`. **PR #235는 Draft·`main` 미병합; Vercel Production 미배포.**

- [Core Actions #42578259819](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42578259819) **PASS**: `npm run typecheck`, SHA-256 원본 파일 무결성·미승인 원화 차단, Vitest **45개 파일 / 193개 테스트 전체 통과**.
- [Browser Actions #42578259603](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42578259603) **PASS**: 전체 **32/32 workflow steps**. Playwright는 Vite DEV에서 *실제 OMEGA React/Canvas 화면과 Watch 원본 전투 엔진*을 구동; 원거리 무기 발사 및 근접 공격 키/터치를 브라우저 입력으로 실행했다.

| M02 실제 기기 아닌 Chromium 플레이 증거 | 실제 native 전투 로그 | 판정 |
| --- | --- | --- |
| `combatGun` 원거리 기본 총기 | 안전모 감염 좀비 HP **800→770**, 실제 `radio` 충돌 피드백 **1회**, 피해량 **30** | **PASS** |
| `combatBlade` 세로 모바일 터치 검 3연격 | 좀비 HP **800→703**, 실제 검격 1·2·3 연계, 3타 피해량 **42**, 원거리 투사체 0(독립 검증용) | **PASS** |
| `combatRear` 방향 뒤집기 | 초기 반대 방향 검격 **빗나감**, 오른쪽 방향 전환 후 근접 HP **800→770**, 피해 **30** | **PASS** |
| `combatCover` 산업현장 장애물 | 실제 지형 뒤 좀비 HP **800→800**, 원거리 명중 0·검격 명중 0, 물리적 우회 경로 존재 | **PASS** |

**실제 코드 변경 7개:** `src/engine/omega-protocol-combat.ts`에서 OMEGA 시작 원거리 장비를 원본 Watch radio 투사체 1종으로 명시적 지정(일반 Watch는 변경 없음); `src/ui/omega-combat-browser-probe.ts`에 개발환경 전용 초기 배치 4종; `src/ui/OmegaProtocolPlaytest.tsx`에 읽기 전용 실제 HP·공격·방향·게임 시간 증거; `scripts/qa-omega-gun-blade-browser.mjs`에 블랙박스 자동 조작/검증, `tests/omega-combat-browser-probe.test.ts` 및 두 Actions 워크플로. 검증용 사건 배치는 **DEV에서만**, 실제 공격·엔진 판정·적 HP는 실제 소스 사용. 전용 시험이 아닌 일반 OMEGA 전투에서 원거리 기본 무기가 장착되도록 수정한 것은 실제 게임 기능 개선.

**판정 범위:** `M02 — CODED + TESTED (자동/실제 브라우저 기술 검증)`. 정식 원거리 총기 모델·검 타격 모션·8방향 AIRA 승인 원화 0/160·원작 WATCH 검격 분리의 실기기 검증·사운드/품질 고도화는 **BLOCKED**이며 출시 통과 아님. 세로 390×844 테스트는 **Chromium 모바일 에뮬레이션**, 실제 Android 또는 태블릿 실측이 아니다.

**당시 다음 작업 M03(이력, 현재 완료):** 안전모 감염 좀비 4개 행동형 AI를 WATCH 일반 작업자와 격리해 구현하는 목표였다. **M03은 현재 인계 10절의 PR #239 실제 기술검증까지 완료됐으며, 다음 시작 작업은 M04 구역 연결 탐험이다.** 정식 8방향 고화질 원화 및 12종 적 제작은 여전히 별도 미완.

## 10. M03 좀비 4종 실제 AI · 공격 예고 · 실피해 TECHNICAL PASS (2026-11-09)

**검증 출처:** [QA PR #239](https://github.com/TELLOWSS/psi-zero-day/pull/239) HEAD `8529383f0557246e9072141216fbda3d294648d8`; 검증 후 **OMEGA 개발 브랜치에만 squash 병합** `4b6cc96c960f120a7c88cc20183ad9f79f6ba0df`. PR #235 Draft/미병합·Vercel Production 미반영, 무료 빌드 제한 우회 유료 전환 없음.

- [Core Actions #42581069302](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42581069302) **PASS**: TypeScript, 원본 AIRA 해시/불승인 차단, Vitest **46파일·203테스트 전체 통과**. 4개 이동형별 HP·속도·공격 예고·돌진·측면 회피·콘테이너 충돌·실제 Watch 플레이어 HP·일반 WATCH 분리 확인.
- [Browser Actions #42581069371](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42581069371) **PASS 전체 33/33 GitHub workflow 단계**, 실제 Vite/Chromium React/Canvas 전장, 데스크톱 1440×900 및 모바일 크기 390×844(브라우저 에뮬레이션).
- **강화된 검증:** 4개 감염체 **각각** 최소 1회 전투 동작·attack telegraph·native Watch 플레이어 HP 피해가 있어야 통과. 스킨만 4색이거나 공격 경고만 있고 HP 감소가 없는 구현은 거부함.

| 실제 Chromium 4종 좀비 개별 공격 | 전투 로그 · 데스크톱 | 전투 로그 · 세로 모바일 에뮬레이션 |
|---|---|---|
| 기본 추격형 `drifter` | 경고 2회/공격 2회/명중 1회, **11 HP 피해** | 경고·공격·명중 성공, **11 HP 피해** |
| 질주형 `sprinter` | 경고 2회/공격 2회/명중 1회, **16 HP 피해** | 경고·공격·명중 성공, **16 HP 피해** |
| 장갑형 `armored` | 경고 1회/공격 1회/명중 1회, **24 HP 피해** | 경고·공격·명중 성공, **24 HP 피해** |
| 정예 잠복형 `stalker` | 경고 2회/공격 2회/명중 1회, **19 HP 피해** | 경고·공격·명중 성공, **19 HP 피해** |
| 실제 플레이어 HP | **800→730** | **800→730** |

**코드 파일:** `src/domain/omega-protocol-zombie-ai.ts` (4타입 독립 컨트롤러·유효한 경고 타이머·장애물 경로), `src/engine/omega-protocol-combat.ts` (첫 4개 원본 WATCH 감염 Hazard로 개별 AI 생성, 추가 산업장비 1종 보장, 실제 예고 후 피해만 OMEGA에서 허용), `src/engine/patrol-survivors-engine.ts` (OMEGA 격리 조건으로 일반 작업자 구조 애니메이션 및 '0피해 무예고 접촉 무적' 제거, 정상 WATCH 무변경), `src/ui/omega-protocol-enemy-render.ts` (안전모 필수·4가지 임시 실루엣·경고 링), `src/ui/OmegaProtocolPlaytest.tsx` (실제 AI 렌더 연결·DEV only 입장 초기 위치·읽기 전용 QA 지표), `tests/omega-protocol-zombie-ai.test.ts`, `scripts/qa-omega-zombie-ai-browser.mjs`, 두 워크플로.

**정확한 완료 판정:** `M03 = CODED + TESTED(자동/실제 Chromium 게임 브라우저 기술검증)`. 이 결과는 실물 Android 폰, 게임 상용 출시 또는 승인된 고해상도 좀비 원화·12종 적/보스·오디오 품질을 인증하지 않는다. 일부 장면에서는 AI 시야/군집 전술을 이후 M08로 보강해야 한다.

**당시 M04 시작 요청(이력):** 1→2→3 두 번의 실제 입력 기반 게이트 이동은 PR #240에서 기술검증 완료. 그러나 **M04 전체=미완**이며, 후속 M04-B는 3→4 지역 경계와 5막의 체감 연결성 검증이다. M05 보스·M06/M07 AIRA 원화는 이후 진행한다.

## 11. M04-A 연결형 게이트 1→2→3 실제 화면 입력 기술검증 (2026-11-09)

**검증 출처:** [QA PR #240](https://github.com/TELLOWSS/psi-zero-day/pull/240) HEAD `ed244f012da27d3673cea58c0b5fabf82dda4a78`를 전수 검증 후 **OMEGA 개발 브랜치에만 squash 병합** `caed677df1748f861dbadc454695d53f85b036c5`. PR #235 Draft/미병합·`main` 불변·Production 미배포.

- [Core Actions #42583435960](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42583435960) **PASS**: TypeScript, 아트 SHA-256/승인 차단, Vitest **47개 파일·208개 테스트**. 내부 출구 반경/이웃 구역 링크·구역 경계 통로 이름·구역 교체 타이밍·전술 강화 선택·일반 모드 이벤트 차단 회귀검사 포함.
- [Browser Actions #42583436073](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42583436073) **PASS 전체 34/34 workflow 단계**. 실제 Vite/Chromium React/Canvas에서 PC 방향키, 모바일 화면 390×844의 **가시적 아날로그 스틱을 CDP touchStart→touchMove→touchEnd로 직접 누르는 시험**. 화면 좌표 임의 텔레포트, 게임 엔진 함수 직접 호출, 성공 결과 주입 **없음**.
- [M04 실제 화면 QA 로그](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42583436073): `QA_PASS M04 PC-keyboard` 실제 이동 거리 **168.7 / 154.0**, `worldSequence [1,2,3]`, 두 번째 출구 후 **run-only reward** 선택; `QA_PASS M04 mobile-touch` 실제 이동 거리 **172.3 / 172.3**, `worldSequence [1,2,3]`, 같은 보상 처리.
- 일반 OMEGA 게임: **적 제압→여러 현장 장치 실제 조작→출구 접근**이 완료돼야 게이트를 열 수 있다. 거리 밖 E는 실패하며, 구역 연결 전 출구를 열었다고 적 처치/이벤트를 자동 완료하지 않는다.
- 검증 화면의 `?omegaQaState=gateTravel`은 **Vite DEV 한정 출발 고정 상황**으로 매 구역의 전투/장치 절차를 **사전에 해결한 상태**만 만든다. 그 이후 출구까지 가는 이동·실제 조작 버튼·이전 지도를 문 닫힘까지 보존·다음 지도를 문 뒤에서 로드·문 열림/강화 선택은 전부 일반 엔진. 이는 **전투·이벤트 실제 15개 무스킵 플레이 검증이 아니다**.
- 추가 코드: `src/domain/omega-protocol-field-transit.ts` (cargo/lift/service-tunnel/airlock 연속 링크 정의, 0.75초 출발→0.7초 도착), `src/engine/omega-protocol-combat.ts` (원본 맵을 문 닫힘까지 유지, 닫힌 상태에서 다음 구역 초기화, 필요 시 안전 구역 카드 보상 유지), `src/ui/OmegaProtocolPlaytest.tsx` 및 CSS (반응형 두 문짝·행선지 라벨/실제 구역 UI), `tests/omega-protocol-field-transit.test.ts`, `scripts/qa-omega-connected-gates-browser.mjs`, CI 두 파일.

**정확한 판정: `M04-A = CODED + TESTED (2개 실제 게이트 이동, PC/모바일 브라우저)` · `M04 전체 = INCOMPLETE`.** 현재 연출은 닫힌 문 뒤에서 1400×900 지도를 새로 로드하는 **격리 통로형 장면 이음새**다. 15개 지점을 하나의 스트리밍 월드 좌표로 이어 붙인 **완전한 심리스 공간은 아니며**, 구역별 내부 `wave`는 엔진에 여전히 존재한다. 2회 출구 방문 후 기존 게임의 전술 강화 선택 오버레이도 아직 나타나므로 몰입형 연속성은 후속 M04-B에서 보완할 것. 이것을 5막 완성 또는 15개 무스킵 탐험 완료로 주장하지 마라.

**당시 NEXT M04-B(완료 기록):** 첫 막 경계 3→4 리프트 도크와 실제 게임 입력 기반 이동은 PR #241에서 PC·모바일 브라우저 기술검증 완료. 이후 6→7·9→10·12→13 막 경계 시각/물리 연결, 15개 구역 무스킵 탐험, Android 실기기 검증은 아직 미완. **현재 다음 단계는 M04-C**. `main`/Production 미반영 유지.

## 12. M04-B 첫 번째 ACT 경계 3→4 '18m 비계 리프트' 기술검증 PASS (2026-11-09)

**검증:** [QA PR #241](https://github.com/TELLOWSS/psi-zero-day/pull/241) HEAD `192c23e4cc9da4f737ed17d5bb49e45d2634ab34`, 통과 후 **OMEGA 개발 브랜치에만 squash 병합** `d691366c3a010a458e0ecf7ee2e6c7db0886f27d`. PR #235는 Draft/미병합, 운영 Production/Vercel 무료 한도 정책 불변.

- [Core Actions #42592300632](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42592300632) **PASS**: TypeScript, 승인 원화/해시 검사 및 Vitest **47파일·210테스트 전체 통과**. `omegaActBoundaryDock()`의 3→4 동형 도크 앵커, 동일 link ID, 3구역 출구와 4구역 엔트리 일치, 일반 OMEGA 임무/적 소탕 조건 유지 확인.
- [Browser Actions #42592300678](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42592300678) **SUCCESS 34/34 workflow steps**. 실제 Vite+React+Canvas 브라우저(PC 1440×900와 모바일 크기 390×844)에서 기존 1→2→3 경로를 지나 세 번째 실입력 출구 3→4까지 **1→2→3→4 진행**.
- Playwright 로그 실제 PC `QA_PASS M04 PC-keyboard`: 이동 **161.3 / 157.7 / 161.3** 월드 단위, `worldSequence=[1,2,3,4]`. 실제 Chromium 모바일 아날로그 스틱 `QA_PASS M04 mobile-touch`: **176.0 / 172.3 / 172.3**, `worldSequence=[1,2,3,4]`. 3구역 도크 역할 `departure`, 4구역 `arrival`, 양쪽 동일 `OMEGA-LINK-03-04` 및 native 월드 좌표 출발 `x=1210`·도착 `x=150, y=450` 증명.
- 실제 3구역의 출구에 `src/ui/omega-protocol-act-lift.ts`가 원본 Canvas 비계 승강기(철골 샤프트·플랫폼·상하 로프·승강장 표지)를 실제 `plan.exit`에 그림. 4구역은 같은 링크의 `plan.entry`에 도착 플랫폼을 그림. `src/ui/OmegaProtocolPlaytest.tsx`는 `data-omega-transit-kind=scaffold_lift`에서만 기존 화물 문 대신 **18m 수직 이동 승강기 크로스섹션**을 게임시계에 따라 표시. 보통 1→2, 2→3은 기존 화물문.
- `src/domain/omega-protocol-field-transit.ts`는 실제 두 필드의 `departure`/`arrival` 좌표와 `linkId`를 불변 링크로 묶음. 6→7·9→10·12→13의 도크 링크 ID 타입 계약도 단위 검증하나, **해당 3개 연출의 독립 완성은 아님**.
- 검증용 `?omegaQaState=gateTravel`: DEV 전용으로 적/임무를 **미리 완료**한 상태를 제공하지만, 화면에 접속한 뒤 이동·E/터치·문/승강기 시퀀스·엔진 진도 변경은 실제 사용자 입력으로 수행. 4구역 도착에서만 DEV fixture가 입구 좌표를 보존하여 계측하며, 일반 OMEGA에서도 적/이벤트 조건 미해결 시 출구가 잠김. **전투·임무 4구역 무스킵 완주를 증명하지 않는다**.

**정확한 완료:** `M04-B CODED+TESTED` = 실제 출구 3→4, 두 도크/앵커, 게임시계 승강 연출 및 Chrome PC·모바일 검증. **M04 전체/진정한 심리스 월드 = INCOMPLETE.** 서로 맞닿아 스트리밍되는 하나의 연속 좌표공간이 아니라, 이동할 때 닫힌 문 뒤에서 독립 1400×900 지도를 새로 로드하는 '승강기형 장면 이음새'다. 실기기 Android·정식 배경 미술/음향, 나머지 3개 ACT 경계, 15구역 무스킵 완주 미완.

**NEXT M04-C:** 6→7 크레인 승강기, 9→10 지하 설비 통로, 12→13 중앙 에어록을 **서로 구별되는 도크·스크린·카메라·위험 이벤트**로 디자인. 동일한 좌표 앵커 계약과 2개 해상도의 Chrome 실입력 QA를 추가해야 하며, 품질게이트 통과 후에만 OMEGA 개발 브랜치로 병합. 이후 M04-D에서 각 막 통과의 15구역 장시간 실제 전투·장치 조작 무스킵, 보상 끊김 및 실기기 FPS를 검증한다.
