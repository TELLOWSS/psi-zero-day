# OMEGA PROTOCOL — 새 채팅 / 새 개발 세션 인계 문서
**관리일:** 2026-11-10 (KST) · M04-D9 BLACK SIGNAL CORE 15구역 **진짜 무스킵 자동조작 15/15 엔진 victory 최초 증명**, TypeScript·55파일/236테스트 PASS. 실제 1→15 적HP 전량 제거/E 장치/실출구, HP33 완주·최종보스 격파. QA PR #252 검증 후 **OMEGA 개발 브랜치에만 squash 병합 `b1f5daec9277a67625055a9a559ef62058874c83`**; 정식 캐릭터 원화/배경 입체화·Android/실유저 해금/독립 PR243/Production 미완.
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
| M04 | 5막/15지점 이동 탐험, 실제 전투·장치·실출구·보급/후반 생존성 | M04-A~C/D1~D9. D9 최종보스 `BLACK_SIGNAL_CORE` 예고/운반장비 실제 경고 복합 대응, 고정 시드 20261109 시험 조작만 보정 | **엔진 자동 재생 TECHNICAL PASS: PR #252 Core 55파일/236 PASS, 15/15 실제 전투·E·출구·최종보스 격파·run.phase=victory**. 인접 node의 진정한 무중단 스트리밍/실기기/상업 아트는 미완 |
| M05 | 중간 보스 TITAN HOOK/최종 BLACK SIGNAL CORE의 차별화 3페이즈 | 기존 실제 보스/예고/HP 스케치 | **최종 기믹·완성 아트 미완** |
| M06 | 은백색 AIRA 8방향 정지 원화 기준 및 **정확한 NW 후면 좌측** | GitHub 은백색 8방향 연구본, NW 후보는 대화에서만 생성 | **원화 최종 승인/리포지토리 정식 적용 미완** |
| M07 | 은백색 AIRA **독립 160액션 프레임 + 마스크 320**, 장비 정렬, 발 접지 | Watch 8방향 원화 선택/실제 idle/walk/fire/dash/hit 상태 판별, GUARD 원화 관찰용 연결 | **은백색 승인 독립 프레임 0/160, 마스크 미완** |
| M08 | 고해상도 좀비 12종 이상 변형, 애니메이션, 총기·검격 SFX/FX | 기술용 적 도형+임시 검 궤적 | **원화/사운드/전투 연출 미완** |
| M09 | 전투·장치·출구 15구역 무스킵 승리 및 실제 모바일 FPS/메모리 | M04-D9 [QA PR #252] 엔진 실조작 시험에서 실제 제시된 카드만 선택하고 1~15 직접 적 처치·E·물리 출구 이후 진짜 `victory` 기록 | **고정시드 내부 시뮬레이션 TECHNICAL PASS, 제품/실기기 승인 NOT YET**. 별도 엄격 [PR #243] Draft/미병합, Android 물리 FPS·발열/터치·다른 시드/실유저 50기록 검증 미완 |
| M10 | PC/태블릿/안드로이드 실기기, 가로/세로 UI/발열/FPS/터치 | 반응형 CSS·브라우저 캡처 스크립트 작성 | **실기기 실행 미검증** |
| M11 | 릴리스 게이트, 저장 호환, 위험성 없음, 사용자 승인 | PR #235 Draft | **main/Production 병합 및 공개 금지** |
| M12-G1 | 쿼터뷰 산업단지 **3차원 공간감 2.5D 수직 슬라이스**: 깊이·가림·접지·빛/그림자·카메라·최종 아트/성능 기준 | 1개 대표 구역, 전경/중경/후경 오브젝트 레이어·입체 구조물·실제 오클루전/전투·카메라·라이팅 설계 예정 | **NOT STARTED / 최우선 그래픽 다음 단계**: PC/세로/가로 브라우저 시각 회귀와 저사양 모드 성능 QA 통과 전 적용/완료 주장 금지 |

**다음 실행 작업(하나씩 처리): M12-G1 — OMEGA 단일 대표 전장의 2.5D 입체 배경 수직 슬라이스를 실제 게임 화면에 제작·실검증.** M04-D9는 내부 고정 시드 `20261109` 동일 1~14 전투·보급·E·실문을 통과하고, 15구역에서 `BLACK_SIGNAL_CORE` 실제 공격 예고/운반장비를 고려한 테스트 조작으로 **15/15 진짜 엔진 victory**까지 검증하였다 ([Core #42801989191](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42801989191), 55파일/236테스트). 단 **테스트 파일의 자동 사용자 입력**일 뿐 운영 게임 AI에 적용하지 않았고, 엔진 테스트의 고정 50/50 fixture가 실제 계정 해금 증거는 아니다. 별도 엄격 PR #243, AIRA 0/160 액션 프레임·320 마스크, Android 실물, 5막 연결 구역의 진정한 심리스, Production 배포 모두 BLOCKED. 디렉터가 배경의 입체화를 최우선 강조했으므로 다음 QA 브랜치는 실제 게임 렌더러에서 **전경/중경/후경, 높이감 있는 비계/크레인/철골/기계 설비, 장애물 전후 인물 가림(occlusion), 발 접지/그림자, 공간조명, 카메라 쿼터뷰/줌, 실전 총검·감염체가 동일 공간에 있다는 증거**부터 하나의 대표 구역에 구현. 정적 예시 이미지나 단순 계획서로 완료 선언 금지. 4해상도 Chromium/스크린샷+타입/핵심 CI 및 모바일 경량 모드 확인; 원화 사용자 최종 승인과 물리 모바일 FPS는 후속 독립 게이트로 유지. `main`·Vercel Production·유료 API/플랜 전환 금지.

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

**여전히 미완:** 공개 Extreme 50/50 실제 해금 CTA, 승인된 AIRA 독립 고해상도 160프레임(현재 0/160), 12종 이상 정식 8방향 적 원화·군집 전술, **15구역 완전 심리스 스트리밍/전투·장치 무스킵 완주**, Android/태블릿 실기기·보스 다단계·최종 미술/음향. PR #237(M01), #238(M02), #239(M03), #240(M04-A), #241(M04-B), #242(M04-C) 기술검증 PASS. 운영/출시 승인 미완.

**다음 시작 커밋:** PR #235 HEAD 재조회하고 인계 **18절 M04-D4 카드 선택 비교 결과**부터 확인. **PR #247 분석 TESTED**: 12(혼합/13사망), 11(생존/12사망), 10(기동/11사망), 7(화력/8 자동조작 교착). PR #243의 엄격 15/15 성공은 여전히 FAIL/Draft. 다음 **M04-D5**는 새 강화 카드 발명보다 폭주 운반장비+감염체 예고, 실제 공격 LOS, 검·총 반격과 대시 정보 표시를 *게임 내 시각과 실제 조작 시험*으로 검증하는 것이 우선. 운영 금지.

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

**당시 NEXT M04-C (현재 기술검증 완료):** 6→7 크레인 승강기, 9→10 지하 설비 터널, 12→13 중앙 에어록의 실제 월드 도크/별도 전환 화면 및 PC/모바일 브라우저 이동은 PR #242에서 검증 완료. 이후 M04-D 실제 15구역 무스킵 전투·장치 조작, 보상 흐름, 실기기 FPS 검증 필요. main/Production은 최종 승인까지 보류.

## 13. M04-C 세 ACT 경계 실입력 기술검증 PASS (2026-11-09)

**검증 및 병합:** [QA PR #242](https://github.com/TELLOWSS/psi-zero-day/pull/242) HEAD `e0b16b5e748dff1709251030222cd0546cd70ed5`. 검증 후 OMEGA 개발 브랜치에만 squash 병합 `265ec29a1d43286d11e2e27908d6adde2afe10f1`. `main`과 Vercel Production은 미변경.

- [핵심 Actions #42594803590](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42594803590): **PASS**, TypeScript·원본 원화 SHA-256 및 미승인 아트 차단, Vitest **47파일·216테스트 모두 통과**.
- [전체 브라우저 Actions #42594803732](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42594803732): **PASS, 전체 35/35 워크플로 단계**. 추가 M04-C 실제 Vite/React/Canvas 검증 3개 경계 × PC(1440×900)·모바일 Chrome 에뮬레이션(390×844) 총 6개 시나리오 통과.

| 실제 ACT 경계 | 이동 연출 · 환경 | PC 이동 거리 | 모바일 아날로그 터치 이동 | 도착·보상 |
|---|---|---:|---:|---|
| 6→7 | `crane_elevator`, 크레인 케이지/카운터웨이트, 24m | 148.7 | 137.3 | 실제 `(150,450)` 입장, 보상 선택 |
| 9→10 | `service_tunnel`, 지하 아치/배관, -12m | 154.4 | 137.3 | 실제 `(150,450)` 입장, 보상 없음 |
| 12→13 | `control_airlock`, 압력계/이중 격벽, 6m | 150.3 | 176.0 | 실제 `(150,450)` 입장, 보상 선택 |

**핵심 코드:** `src/ui/omega-protocol-act-lift.ts`는 세 구역의 서로 다른 도크 구조물을 실제 게임 월드 출입구에 Canvas로 그린다. `src/ui/OmegaProtocolPlaytest.tsx` 및 `src/ui/omega-protocol-playtest.css`는 게임의 transit phase/elapsed에 동기화된 크레인 이동, 터널 원근, 에어록 폐쇄 연출을 구현했다. `src/engine/omega-protocol-combat.ts`는 개발 전용 네 ACT 입구의 실좌표를 QA에서 보존하고, `tests/omega-protocol-field-transit.test.ts`와 `scripts/qa-omega-three-act-boundaries-browser.mjs`가 연결 링크·실제 E/터치·이동·도착을 검사한다.

**엄격한 완료 범위:** M04-C는 개발용 초기 상황 `?omegaQaState=actBoundary6|actBoundary9|actBoundary12`에서 **앞선 전투/목표를 브라우저 진입 전에 완료 처리**한 뒤, 해당 경계의 실입력 이동·E/터치·전환·정확한 도착 좌표를 시험한 것이다. 이것은 1~15 전 지역의 실제 적 처치와 장치 조작이 모두 끝난 무스킵 게임 플레이 인증이 아니다. 구역은 여전히 문 뒤에서 별도 필드로 교체된다. 완전 심리스 스트리밍, 고품질 AIRA 정식 원화, Android 실기기 테스트, 최종 출시 승인은 **미완료**.

**NEXT M04-D:** DEV 사전 완료 없이 전체 15구역 실제 플레이·상호작용·장시간 안정성과 탐험 연속성, 보상 카드 화면의 몰입 방해 제거를 검증한다. 별도 QA PR로 검증 성공 후에만 OMEGA 개발 브랜치에 반영. main/Production 병합·유료 업그레이드 금지.

## 14. M04-D1 무스킵 실전 감사 진행 기록 (2026-11-09, 완료 아님)

**QA PR:** [#243](https://github.com/TELLOWSS/psi-zero-day/pull/243), 브랜치 `qa/omega-m04d-no-skip-expedition-audit-20261109` → **OMEGA 개발 브랜치 대상 Draft, 현재 미병합**. 인계 시 반드시 PR #243 최신 HEAD와 Actions/체크 결과를 먼저 조회할 것.

- **검증된 기준:** [Core #42596736369](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42596736369): 최초 **M04-D 첫 구역** 실제 native Watch 적 5개 처치, 총격 피격 기록 5회/검격 230 피해, 현장 E 장치 3단계, 실제 출구, 플레이어 HP 100→62, 13.6초 게임 시뮬레이션. TypeScript/Vitest **48파일·217테스트 전체 통과**.
- **다음 확장:** [Core #42596936770](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42596936770): **M04-D 첫 2개 구역 무스킵** 적 각 5개 실제 전투로 제거, 각 현장 E 장치 3단계, 두 출구, 첫 13.6초 + 둘째 10.9초 게임 시뮬레이션. HP **100→62→16**, 타입 검사 및 **48파일·218테스트 PASS**. 이 로그는 실제 2구역 연속 진행이 가능하나 순진한 근접 자동조작으로 체력이 크게 소진됨을 동시에 보여준다.
- **발견된 실패:** [Core #42597833167](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42597833167): 실제 보급 선택 후 3구역 확장 시험은 **FAIL**. 초기 두 구역에 남은 HP가 적고 3구역 현장 장치까지 도달하지 못함. 허위로 완료 처리하지 않는다.
- **회피 전략으로 전환한 후:** [Core #42598396594](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42598396594): 1구역 실제 전투/장치 모두 완료, **HP 100 유지**, 총격 13회·검격 35 피해. **2구역 마지막 적이 엄폐물 뒤**에 있어 자동 조작이 총격 사선을 회복하지 못하고 HP 진행 15초 교착으로 FAIL. 이에 적이 가려진 경우 기존 장애물 길찾기로 실제 접근하는 시험 코드 수정. 새로운 커밋은 아직 **최종 CI PASS 미확인**. 시험 조작의 실패와 게임 전체 진행 불능을 혼동하지 말 것.
- **보급 UI 개선 후보:** `src/ui/OmegaProtocolPlaytest.tsx`, `src/ui/omega-protocol-playtest.css`의 기존 짙은 전체 화면 강화 모달을 **전장과 다음 목적지 맥락이 보이는 지역 보급 패널**로 재설계. 기존 전술 강화 3개 선택과 런 전용 효과 유지. `scripts/qa-omega-connected-gates-browser.mjs`에 실제 패널 표시·이동 재개 검사, `scripts/qa-omega-protocol-browser.mjs`의 오래된 제목 검사 교체. [Browser #42597833206](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42597833206) 전체 35단계 PASS(당시 수정본), **최신 변경 커밋의 재검증은 별도 필요**.

**정확한 상태:** `M04-D1 = FIRST 2 NODE PASS ON ORIGINAL MELEE PILOT; ENHANCED KITE BOT + REWARD UI QA IN PROGRESS`. `M04 전체 = INCOMPLETE`. 현재도 15개 전장/출구가 각각 별도 필드로 교체되는 방식이며, 실제 적/장치 15구역 무스킵 완주, Android 하드웨어, 승인된 AIRA V2 독립 원화 160프레임, 완전 스트리밍 심리스 맵은 미완이다. **검증 실패하거나 미확인인 QA 브랜치의 코드를 개발 브랜치나 운영에 자동 병합 금지**.

**NEXT:** [PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243)의 최신 코어 및 브라우저 Actions를 확인→실제 3구역까지 정상 전투·임무·출구가 연결되는지 확인→미완이면 실제 원인 파악 및 수정→성공한 단계만 QA 증거를 동반해 개발 브랜치로 병합→인계 14절과 마스터 기획서 갱신. 이후 실제 15구역 무스킵 완주와 장시간 기기 테스트를 순차 확대한다. `main`/Vercel Production은 최종 사용자 승인까지 보류.

## 15. M04-D1 보급 패널 반영 및 15구역 무스킵 실패 원인 인계 (2026-11-10)

### 검증 완료하여 OMEGA 개발 브랜치에 병합한 내용

- **[UI PR #244](https://github.com/TELLOWSS/psi-zero-day/pull/244) → OMEGA 개발 브랜치에만 squash 병합** `1eef0f6edf8d69f3ea8448781f73aa4cece3ce8e`. 새 기능: 기존 전장 전체 암전식 강화 선택 대신 현장을 볼 수 있는 **격리 통로 안 전술 보급 패널**. 현재 구역·다음 목적지·일시정지 상태 표시, 세 가지 실제 런 전용 강화 선택과 즉시 탐험 재개. PC·모바일 세로/가로 패널 크기·가독성 개선. 일반 Watch/Guard 계정·유료 기능 변경 없음.
- **[Core #42697032412](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42697032412) SUCCESS**, **[Browser #42697032471](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42697032471) SUCCESS 35/35**. 새 컨텍스트 보급판 실제 레이아웃·이동/선택 및 이전 AIRA·WATCH·GUARD 회귀 포함. 순수 UI 변경 4파일(컴포넌트/CSS/브라우저 QA 2개)만 병합. 이 결과는 15구역 전투 완주를 의미하지 않음.

### 별도 진행 중인 15구역 진짜 실전 감사 — 아직 실패

- **[실전 QA PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243) Draft/미병합.** 실제 `OmegaProtocolCombatSession`에서 DEV 적/임무 사전 완료 옵션 없이 정상 원거리 총탄·검격·실제 적 HP 처리·현장 E 조작·출구 이동·실제 제시된 강화 카드만 사용. 테스트 조작은 코드로 제어하는 전술형 시뮬레이션 플레이어이며 **사람이 직접 15구역을 클리어한 실기기 검증이 아님**.
- **[Core #42599297453](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42599297453) SUCCESS 219/219**: 실제 1~3구역 연속 좀비/장비 처치 및 임무/게이트 조작, 플레이어 체력 100 보존, 실제 제시된 Rapid Step 선택 후 다음 구역 진입.
- **[Core #42696026289](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42696026289): 219/220, 실패 1**. 실제 1~12구역 적 HP 소진·임무 E 단계·물리적 게이트 전환 완료, **9구역 TITAN HOOK 보스 격파**(중간 보스 포함). 그러나 **13구역에 HP33으로 진입→약 39.6초 뒤 패배, 적 7개체 잔류**. 이는 게임의 후기 생존성/전투 강화 적절성에 대한 검토 필요 신호이지, 15구역 완료가 아님.
- **거절한 수정:** 강한 범위의 좀비 경고 회피 보정은 기존에 진행되던 RUNAWAY_CART 엄폐물 접근을 방해, 첫 구역에서도 HP 진행 교착을 유발함. Core #42696528277, #42696862387, #42697161293 실패. 시험 코드가 게임 밸런스/적 HP를 임의 변경한 것은 아니며, 해당 과잉 회피는 다시 **원래 1~12 통과했던 기본 코드로 복원**. PR #243 최신 HEAD를 다시 조회하여 재검증한 뒤 합격한 내용만 별도 반영.

### 명확한 다음 작업 M04-D2

1. 동일 고정시드에서 13→15구역 **피격 원인(감염 좀비·장비 충돌·보스 예고), 전투 시간, 플레이어 체력·강화 선택·무기 DPS, 시야/엄폐 LOS** 계측을 도입한다.
2. 단순히 테스트 캐릭터를 무적화하거나 적 HP를 삭제하지 않고, **위험 예고 읽기·대시 타이밍·거리 유지·정당한 회복/보호막 선택**으로 실제 전투가 학습 가능하고 극한의 도전으로 작동하는지 판단한다.
3. 15구역 **무스킵 전투/장치/게이트/보상** 합격, 보스 9·15 동작, 장시간 PC·모바일 브라우저와 별도 Android 실제 하드웨어를 검증하기 전엔 M04 전체 완료 금지. 독립 1400×900 지도를 잇는 장면형 연결을 진정한 심리스 스트리밍 월드라고 부르지 않는다.
4. 기존 AIRA 고해상도 독립 8방향×20모션 총 160프레임 중 **최종 원화 승인·전체 별도 애니메이션 완성 미해결**, 이것은 그래픽 출시 차단 게이트다.

**최종 제한:** PR #235 Draft·main 미병합·Production 미배포, 유료 Vercel 전환 금지. 출시와 병합은 사용자의 최종 승인 필요.

## 16. M04-D2 전투 피해 원인 계측 기술검증 PASS (2026-11-10)

**개발 반영:** [QA PR #245](https://github.com/TELLOWSS/psi-zero-day/pull/245) HEAD `97521991971d6b2b6deca227664bdbbfc1da72df`를 **OMEGA 개발 브랜치에만 squash 병합** `cb381ad8a653105062b4574f9f63c86edcbff0a8`. PR #235 Draft/미병합, `main`/Production 미배포.

- [Core #42703206974](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42703206974) **SUCCESS: TypeScript 및 Vitest 48파일·221개 전체 통과**. OMEGA 감염체 실제 경고 후 타격(피해 11), 9구역 크레인 보스 실제 낙하 피해(12), 15구역 제어 코어의 공격 피해(12)를 **실제 엔진 루프에서** 개별 계측. 피해 원인 합산/경계값/유효하지 않은 수치 차단 단위 테스트 포함.
- [Browser #42703206789](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42703206789) **SUCCESS: 전체 워크플로 35/35 단계**. 기존 실제 WATCH·GUARD·AIRA, 전장 게이트 1→4 및 6→7·9→10·12→13, PC·모바일 Chrome 회귀 검증 통과. Android 물리 단말 테스트를 의미하지 않음.
- `src/domain/omega-protocol-damage-audit.ts` **신규**: OMEGA 전용 피해원인 타입, 유효 수치 검사, 이벤트 시각/구역/받은 피해/잔여 HP 기록, 구역별 원인별 합계·첫/마지막 피격 시점. 이벤트 로그는 최대 768건으로 제한해 긴 플레이에서 무한 메모리 증가를 막음.
- `src/engine/omega-protocol-combat.ts`: 실제 상태 변경이 발생하는 위치에서 `damageEvents`·`damageSummary(wave)` 읽기 전용 접근 제공. 원인: `INFECTED_DRIFTER`, `INFECTED_SPRINTER`, `INFECTED_ARMORED`, `INFECTED_STALKER`, `TITAN_HOOK`, `BLACK_SIGNAL_CORE`; 일반 WATCH는 `WATCH_NATIVE_NET`으로 기록.
- **정확성 주의:** `WATCH_NATIVE_NET`은 각 native WATCH update 전후의 **양(+)의 순 HP 감소**다. 같은 프레임에 회복이 섞이면 정확한 총피해보다 낮을 수 있으며, 특정 장비형 적을 근거 없이 원인으로 지정하지 않는다. 반면 OMEGA가 적용한 좀비·보스 타격은 실제 적용 금액을 기록한다. 피해 계측은 공격력·적 HP·쿨다운·어그로·승리 상태·보상·계정/스토리지에 영향을 미치지 않는다.
- **중요 미완:** 진단 API의 실제 엔진 단위검증은 통과했지만, 고정시드 **13→15구역 전체 실전 로그를 이 API로 다시 수집·원인별 판정하는 시험은 미실행**. 15구역 무스킵 진도는 마지막으로 1~12 성공, 13에서 실제 사망이다. PR #243의 15구역 실패 테스트는 계속 Draft/미병합. AIRA 최종 160 별도 원화, 15개 구역 실제 심리스 스트리밍, 물리 Android QA 미완.

**NEXT M04-D3:** PR #243의 인증된 1~12 고정시드 시험 플레이어를 최신 검증 브랜치에서 사용하되, 새로운 읽기전용 `damageEvents`/`damageSummary`로 **13구역 패배의 피해 원인·피격 시각·강화 선택·입장/퇴장 HP·적 잔여 HP**를 기록한다. 그 근거를 바탕으로 13~15구역의 플레이어에게 실제로 회피 가능한 타이밍, 정상 회복·보호막 카드 선택, 총·검 딜링 경로를 개선할지 판단. 실제 15구역 무스킵·두 보스 실전 격파·모바일 FPS/Android 실기기 검증을 마치지 않고 완성 주장 금지. `main` 병합/운영 배포·유료 전환 금지.

## 17. M04-D3 13구역 패배 실제 무스킵 원인규명 PASS (2026-11-10)

**검증/병합:** [QA PR #246](https://github.com/TELLOWSS/psi-zero-day/pull/246) HEAD `b9011b2e1abf99afa7437346ad1464fddc5526b7`, **OMEGA 개발 브랜치에만 squash 병합** `cef7547f3474b143f807c54ea159a6db38712d65`. [Core CI #42705626571](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42705626571) TypeScript + **49파일/222 Vitest 전체 통과**. 변경은 `tests/omega-protocol-noskip-loss-audit.test.ts` 신규와 CI 등록만(2파일). 게임 캐릭터 속도/HP·좀비 공격·보스 타이머·사운드·화면에 변경 없음. 브라우저/물리 Android 하드웨어 검증을 수행한 것은 아님.

### 실제 전투·장치 완주 시드 및 13구역 패배 (적/목표 사전완료 X)

- 고정 시드 `20261109`, 원래 OMEGA 총·검·경로조작·E 현장 장치·필드 게이트·실제 제안된 런 전용 강화만 사용. **1~12구역 모든 실제 적 처치/임무 E 조작/실출구 통과 및 9구역 TITAN HOOK 보스 실제 격파**. 13구역에서 실제 패배. 이 테스트의 PASS는 **사실에 맞는 실패 원인 재현 통과**, 15/15 게임 엔딩 클리어 아님.
- 13구역 **진입 HP33**, 적 **9개체, 총HP 5,293**. 약 39.6초 전투한 뒤 7개체(총HP 4,357) 남은 상태에서 **HP0**. 실제 투사체 명중 36건, 검격 누적 피해 28.75가 기존 전술형 시험 로그에 기록됨.
- **최초 피해:** `INFECTED_SPRINTER` 안전모 질주형 감염체 실제 타격 **16**, HP33→17. **최종 피해:** 기본 WATCH `WATCH_NATIVE_NET` 실 HP 순손실 **17**, HP17→0. 같은 업데이트 프레임의 네이티브 엔진 `lastDamage.source`는 **`RUNAWAY_CART`**, 공격의 표시 원 피해 **22**. 현재 남은 HP17 때문에 소진된 HP는 17이며, 원인 힌트의 기계 명칭을 분리된 NET 피해 감사 이벤트에 근거 없이 강제 덮어쓰지 않음.
- 시간 증거: 첫 타격 게임 시각 약 729.03초, 최종 약 748.22초. 13구역의 피격 사건은 총 **2회**, 분류 피해량 합계 **33**. 보스 피해 0. 마지막 사고 근처 다른 기계는 58월드 단위의 RUNAWAY_CART 등으로 관찰되나, **근접도만으로 원인 확정하지 않음**. 확정에 가까운 원인은 네이티브 엔진 자체의 동일 프레임 LAST DAMAGE 표식.
- 보상 선택 기록(실제 제공된 선택지에서만 선택): 2구역 `rapid_step`, 4·6구역 `shield_matrix` 2회, 8·12구역 `recovery_protocol` 2회, 10구역 `blade_edge`. 12구역 종료 HP21→회복 보급 후 13구역 진입 HP33. 선호 카드가 실제 제공되지 않았으면 억지 부여하지 않음.
- 전투 장기화 경향: 13구역 총HP 5293을 상대하며 약39.6초 내 2개체만 제거한 상태에서 패배. 이는 **안전모 질주형 감염체(16) + 폭주 운반장비의 높은 원 피해(22)** 조합과 늦은 구역의 화력·방어/회복 카드 선택 효율, 위험 노출 시간을 함께 평가해야 함을 보여준다. 단일 자동 시험 조작의 패배가 모든 사람의 실전 난도 불가능을 의미하지는 않음.

### 엄격한 상태 및 다음 개발 절차

- `M04-D3 SOURCE ATTRIBUTION = CODED+TESTED` / `M04 전체 15/15 무스킵 승리 = FAIL/INCOMPLETE`. **[엄격 완주 PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243)은 Draft/미병합 유지**. Android/태블릿 실제 하드웨어, 실제 15구역 심리스 스트리밍, 승인된 은백색 AIRA 160 독립 원화 및 320 마스크 미완.
- **NEXT M04-D4:** 개발 브랜치에서 새 검증 브랜치를 만든 뒤 ① 현재 난도·같은 시드에서 *실제로 제공된* 카드의 다른 생존/화력 빌드, ② 정당한 dash·LOS/장애물 위치·경고 반응, ③ 감염체 질주+운반장비 연쇄피격 회피 가능성을 정량 비교. 정상 native HP/적HP/방어/쿨다운을 직접 변경하지 않은 데이터로 극한 난도 유지 및 실제 완주 가능성을 판단. TypeScript/테스트 및 PC·모바일 Chrome 브라우저를 별도로 확인하고, **품질검증된 변경만 OMEGA 개발 브랜치 병합**. `main`/Production/유료 API 호출 및 Vercel 유료 전환 금지.

## 18. M04-D4 실제 카드 4빌드 고정 시드 비교 — 223개 테스트 PASS (2026-11-10)

**개발 브랜치만 반영:** [검증용 PR #247](https://github.com/TELLOWSS/psi-zero-day/pull/247) HEAD `cc3e4284ab524ce6c56b824df1266bef437d2f24` → OMEGA 개발 브랜치로만 squash 병합 `feb11fe86fa1c89abec2ce367f98b2c6cf81c3e9`. [Core CI #42719979171](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42719979171): TypeScript, **50개 Vitest 파일·223개 테스트 전체 PASS**. 변경 파일은 `tests/omega-protocol-legit-build-matrix.test.ts` 신규 + 코어 CI 등록 **2개뿐**; 게임 엔진/진행·미술·전투 밸런스 값은 수정되지 않았다. 이번 브라우저/Android 실기기 검증은 수행하지 않았다.

| 강화 전략 | 실제 통과 구역 | 중단 구역 | 반드시 구분할 판정 |
|---|---:|---:|---|
| 기존 혼합형 | **12** | 13 | **실제 HP0 사망**, 감염 질주 피해16 + WATCH 순HP손실17 (폭주 운반장비의 동일 프레임 원 타격22) |
| 생존 우선형 | 11 | 12 | **실제 HP0 사망**. 10구역 카드 `control_field`를 선택해 기존 혼합형의 `blade_edge`와 차이를 만들었으나 화력·노출 시간이 달라져 더 일찍 사망 |
| 기동 우선형 | 10 | 11 | **실제 HP0 사망**. 위상 부츠/대시 반응을 우선했지만 이 자동조작의 근접 위험을 충분히 상쇄하지 못함 |
| 화력 우선형 | 7 | 8 | **사망이 아니라 테스트 플레이어의 엄폐물 추적/LOS 교착**. HP78에서 특정 RUNAWAY_CART 뒤 진행 정지. 이 빌드가 반드시 8구역에서 인간 플레이어에게 패배한다는 뜻이 아니며, 13/15 비교가 불가능한 우측 검열 데이터 |

시험 시드 `20261109`, native WATCH 자동 총격 + OMEGA 실제 검격·지형 장애물·이동 E·실제 보급 카드 셋 선택 및 액트 이동. 네 빌드 모두 같은 원래 전술형 자동 입력을 사용했고, **카드를 임의 생성/지급하거나 HP·적HP·AI/쿨다운 직접 수정하지 않았다**. 카드가 이전 선택에 따라 다르게 제시될 수 있으므로 각 경로의 `offered`/`chosen`과 구역별 HP·실제 피해 출처를 CI 로그에 보존한다. **분석용 223개 PASS는 15구역 성공을 뜻하지 않는다.**

**관찰:** 최초 진입 체력 자체만큼 중요한 것은 13구역 적 총HP 5,293에 대한 실제 화력/가림, 질주형 감염체 피해 16와 폭주 운반장비 원 타격22의 연속 피격, 위험을 예고하는 게임 화면의 판독성과 순간 무적 대시 피드백이다. **한 번의 고정 시드/자동 입력 실험으로 최적 빌드의 일반 순위를 단정하지 말 것.**

**NEXT M04-D5:** `src/ui/OmegaProtocolPlaytest.tsx`의 Canvas 렌더러·기존 감염체/운반장비 예고 표시를 조사하고, 실제 위험 위치·진행 방향·대시 가능 여부가 PC/모바일에서 이해되는 **플레이어 관점의 반격 가능 경고·강조·맞춤 레이아웃**을 QA 독립 브랜치로 구현/검증. 가시성 자체를 실제 게임의 공격 사거리·LOS/장애물과 일치시키고, 원래 극한 난도·적 공격을 낮추거나 판정시간을 조작하지 않는다. PR #243 15구역 승리 미완, AIRA 정식 8방향 개별 아트/Android 물리 실기기/진정한 심리스 스트리밍 미완. `main`/Production/유료 전환 최종 승인 전 금지.

## 19. M04-D5 실제 안전모 감염체/운반장비 경고 시인성 — 자동 QA PASS (2026-11-10)

**QA 브랜치/PR:** [#248](https://github.com/TELLOWSS/psi-zero-day/pull/248), qa/omega-m04d5-counterplay-visibility-20261110 → OMEGA 개발 브랜치만 대상. 기준 SHA 4817c042478626ccdd690d42483f0df81e92adf4. 운영 main/Production 금지.

- [Core Actions #42722254548](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42722254548) **SUCCESS:** TypeScript typecheck, Vitest **51파일/227개 전체 PASS**. 기존 고정시드 4빌드의 사망/엄폐 교착 결과를 성공으로 둔갑시키지 않음.
- [Browser Actions #42722254211](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42722254211) **SUCCESS:** 실제 Vite/React/Canvas OMEGA의 좀비 4종 경고/공격/HP 피해와 새로운 live warning 표시, 실제 native 대시 쿨다운 DOM 검증을 PC 1440×900 및 모바일 세로 390×844 Chrome 에뮬레이션에서 통과. 이미지 m04d5-live-infected-counterplay-{desktop,mobile-portrait}.png는 Actions 화면 캡처 산출물. 기존 M02/M04/Watch/AIRA/Guard 브라우저 회귀도 통과. 물리 Android 미검증.
- **코드:** src/ui/omega-protocol-counterplay.ts 신규 (native RUNAWAY_CART motion direction, OMEGA ZombieBrain warning/charge, player dashCooldown 읽기 전용); tests/omega-protocol-counterplay.test.ts 신규 4개; OmegaProtocolPlaytest.tsx 실제 Canvas 경고 화살표, 반응형 경고 HUD, 대시 버튼; CSS, Chromium QA 스크립트, core workflow. 레이저형 방향선은 고정된 공격 **방향 안내**이지 엄폐물을 관통하는 확정 피격 구역이 아님.
- **비변경:** 공격/적HP/체력/AI/회피 시간/충돌 판정/일반 WATCH 저장·해금·지갑·보상·과금·정식 미술. 일반 인간 구조대상은 공격 대상이 아니며 OMEGA 감염 좀비·가상 무인 기계만 경고 대상.

**판정:** M04-D5 CODED + TESTED (Core 227 & Chromium PC/모바일 세로). 전체 15/15 무스킵 승리, Android 실기기, 모바일 가로 가림/경고 타이밍, 보스 9/15 경고, 독립 AIRA 160프레임/320 마스크 승인, 완전 스트리밍 지도는 미완.

**개발 브랜치 반영 확인:** [PR #248](https://github.com/TELLOWSS/psi-zero-day/pull/248) 성공적으로 OMEGA 개발 브랜치에만 squash 병합되었음. 해당 병합 SHA `f66d08a94fe241159bd9f34879961b1f21f1730f`; 작업용 PR #235는 계속 Draft 및 미병합이며 `main`과 Production에는 반영하지 않음. 실제 Actions 증거는 병합 이전 코드 동일한 검증 PR SHA `56e2812f8f0db07c3376fb3db363fd4b0881e243` 기준이며, 후속 인계 문서 단독 편집은 실행 코드 테스트를 대체하지 않음.

**NEXT M04-D6:** RUNAWAY_CART warning 단계에서도 native 접촉 피해가 들어가는지 실제 엔진 테스트, 감염체/카트/보스 경고와 충돌 판정 타이밍 일치 여부, LOS 및 지형/회피 경로, 모바일 가로 844×390 QA. 원래 난도 무단 하향/HP 손대기 금지. main/Production/유료 업그레이드 금지.

## 20. M04-D6 RUNAWAY_CART 예고 중 선피격 및 장애물/모바일 전투 경고 검증 (2026-11-10)

**검증 PR:** [#249](https://github.com/TELLOWSS/psi-zero-day/pull/249), QA 브랜치 `qa/omega-m04d6-native-cart-warning-fairness-20261110` → **OMEGA 개발 브랜치 대상만**. 출발 OMEGA HEAD `242f9b4c9eda067fa57f22c3fa836bd2e44afb28`. 개발 브랜치 병합/최종 SHA는 병합 후 아래에 별도 갱신한다.

### 실제 결함 재현 (의도적으로 실패한 첫 실행)

- [첫 Core #42748658589](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42748658589)에서 신규 native Watch 실제 엔진 테스트 **2 FAIL / 230 PASS**, TypeScript 통과. OMEGA `RUNAWAY_CART.motion.phase=warning`이고 운반장비·플레이어가 겹쳤을 때 **HP 100→78(실제 22 손실)**. `approach`/`cooldown`도 실제 22 손실 재현. 경고 UI와 실제 접촉 판정이 어긋나는 것이 확인되어 단순 추정이 아님.
- 원인: native `checkCollisions()`는 기본 `isHazardContactActive(RUNAWAY_CART)` 결과를 그대로 받아 OMEGA 격리 운반장비의 `warning`·`approach`·`cooldown` 중에도 접촉 피해와 0.6초 무적을 발생시켰다. 감염 좀비는 이미 별도 무예고 충돌 차단, 보스는 자체 패턴과 별도 판정을 사용한다.

### 격리 수정 및 실제 검증 PASS

- `src/engine/patrol-survivors-engine.ts`의 **`this.protocolExternalEncounter && h.type === 'RUNAWAY_CART'`에서 `motion.phase==='charge'`일 때만 기존 접촉 판정을 허용**. 기존 카트 속도/적 HP/22 공격력/예고 타이머/대시 0.28초 무적/기존 일반 Watch 정책은 그대로. 일반 WATCH가 경고 중 접촉을 일으킬 수 있다는 이전 정책은 명시적으로 회귀 검사로 보존했다.
- `tests/omega-protocol-cart-counterplay-fairness.test.ts` 신규: 실제 OMEGA/Watch 엔진에서 warning·approach·cooldown 무선피격, charge 22 정피격, native dash 회피, 기존 Watch 원상 보존 5개 확인. `src/ui/omega-protocol-counterplay.ts`는 실제 현장 장애물을 h.radius 만큼 반영한 Ray/AABB로 고정 방향선의 장애물 관통 표현을 제거하고 테스트 1개 추가. 공격 판정과 물체 충돌 로직은 바꾸지 않음.
- [최종 Core #42749422806](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42749422806) **SUCCESS: TypeScript + Vitest 52파일/233개 전부 PASS.** 기존 동일 시드 4전술 시험은 혼합형12→13 HP0, 생존11→12, 기동10→11, 화력7→8 LOS 교착으로 여전히 15/15 무스킵 승리 아님.
- [전체 Browser #42749422588](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42749422588) **SUCCESS**. DEV-only `cartWarning` 시작 위치를 배치하지만 실제 warning/charge 타이머·실 HP 손실·브라우저 입력은 Watch 엔진 그대로. PC1440×900, 모바일 세로390×844, 모바일 가로844×390 모두 **warning 동안 HP800 유지 → 실제 돌진 후 HP778**, 조작 버튼 겹침 **0px²**. 9구역 크레인/15구역 제어코어 경고도 가로844×390에서 각기 **공격예고1.6초**와 실제 보스 구역 식별 PASS. M02/03, 구역 경계 1→4·6→7·9→10·12→13, WATCH/GUARD/AIRA 기존 브라우저 회귀 PASS.
- 신규 브라우저 시험 `scripts/qa-omega-m04d6-counterplay-browser.mjs` 및 CI 등록, 반응형 경고 HUD 세로 배치 보완. 출력 사진 `m04d6-cart-warning-{desktop,mobile-portrait,mobile-landscape}.png` 등은 GitHub Actions artifact 안에 있음. **Chrome 모바일 에뮬레이션이지 실물 Android/태블릿이 아님**.

**정확한 완료:** `M04-D6 = CODED + TESTED (Core+Chromium PC/모바일 세로·가로)`. 사람의 15/15 무스킵 클리어, 후반 보스 실제 전투·엔딩, 60분 장시간 테스트, 물리 Android FPS/발열, 진정한 심리스 맵, 은백색 AIRA 승인 독립 160액션/320마스크 및 정식 적 원화는 **미완**.

**실제 병합 확인:** [PR #249](https://github.com/TELLOWSS/psi-zero-day/pull/249)는 검증 성공 후 OMEGA 개발 브랜치에만 squash 병합 `65658b67b6778f384a5dbf1bab7ef781c257d673`. PR #235는 여전히 Draft/미병합, `main`/Vercel Production 변경 작업 없음. 테스트 증거 [Core #42749422806](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42749422806) 및 [Browser #42749422588](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42749422588)은 검증 코드 HEAD `840c5ce0db4a6a3e38d9840ca34ef5885ab3741d` 대상; 이후 두 QA 커밋은 문서만 수정했고, squash 뒤 인계 수정은 실행 코드 검증을 대체하지 않음.

**NEXT M04-D7:** 최신 규칙에서 고정시드 1→15 무스킵 실제 전투/장치/문/보급을 재실행하고 13~15 피해·LOS·자동조작 교착을 분리; 이후 실제 사용자 조작 시 위험 인지/반격 가능한지 검증한다. 난도·HP/적HP·카드 임의 변경 금지. OMEGA QA 독립 PR로 완전 통과 증거 후에만 개발 브랜치 반영. main/Production·유료 전환 금지.

## 21. M04-D7 공정한 native 충돌 규칙 아래 실제 무스킵 후반 전투 재검증 (2026-11-10)

**QA 소스:** [PR #250](https://github.com/TELLOWSS/psi-zero-day/pull/250), `qa/omega-m04d7-noskip-replay-20261110` → OMEGA 개발 브랜치만. 시작 HEAD `37dc3bb2d37541ecfc259d86374fe1090e7e787b`. **테스트/코어 CI 등록만 변경**하며 게임 엔진·캐릭터·총/검·전투 체력·적 AI·맵/지도·계정/보급·운영 배포 코드 변경은 없음.

### 진짜 1→15 시도 결과 (실제 사망 시 종료, 임의 스킵 없음)

- [최종 GitHub Core #42765707078](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42765707078): **SUCCESS, TypeScript + 53파일/234개 Vitest PASS**. PASS는 '실패를 거짓 승리로 표시하지 않고 재현/분류한 검증'이며 15/15 게임 승리 PASS가 아니다. 최초 광역 대응 조작은 더 이르게 **5구역 완료→6구역 패배** (16 질주+WATCH 순손실40+중장갑24 관측)로 악화됨을 발견했다. 따라서 최종 테스트는 **13구역에서만 조작 변경**하고 1~12는 기존과 입력·제공 보급 선택·실제 E/출구 결과가 완전히 일치하도록 검증한다.
- **기준/기존 전술:** `seed=20261109`, 실제 1~12구역 모든 적 처치·E 현장장치·실출구 이동·9구역 보스 완료. 13구역 **진입 HP33**에서 약39.6초 후 **HP0/적 7개체 남음**, 실제 질주형 감염체 **16**, 마지막 `WATCH_NATIVE_NET` **순손실17**. 마지막 프레임 native `lastDamage.source=RUNAWAY_CART`, `motion.phase=charge`: **M04-D6 수정 후에도 진짜 돌진 타격은 유효**하며 선경고 피해가 아니다. 원래 카트 피해22 중 남은 체력17만 소진. 13구역 남은 적7, 스킵/가짜 격파 없음.
- **13구역만 경고 대응·대시·엄폐 길찾기 입력을 변경한 반응 전술:** **1~12구역 결과·강화 카드 선택이 기준과 정확히 일치함을 Vitest 검증**. 동일 **13 진입 HP33**, 약 **4.1초** 후 실제 HP0/적 **9개체 전부 남음**. 관측 피해는 `INFECTED_SPRINTER` **16** (HP33→17) + `INFECTED_STALKER` **남은 HP 17 손실** (HP17→0). 해당 체력 소진은 stalker 원시 공격력19와 구별할 것. 새 조작은 경고 회피 시도 **22회**, 실제 native 대시 총 **5회(1~12구역 4회+13구역 1회)**였으나 후반 생존 개선 실패.
- **공통 실제 카드 선택:** 2구역 `rapid_step`, 4·6 `shield_matrix`, 8·12 `recovery_protocol`, 10 `blade_edge`. 매번 실제 3개 제시 선택지에서만 선택. 모든 강화/체력/보스 AI/미션 상태 조작 없음. `fieldTraversal=true`,`gateTransition=true`, 사전완료 `qaGateTravel` 사용하지 않음.
- **실패 원인 구분:** 13구역 기준전술 = 실제 **운반장비 charge/질주 피격**과 장시간 낮은 화력·노출, 반응전술 = **초기 위험지대에 잘못 들어간 실제 조작 입력으로 질주+잠복 감염체 연속 피격**. 피해 감사의 `WATCH_NATIVE_NET`은 실제 HP 감소 하한이며 특정 기계 라벨은 같은 프레임 native 힌트로만 표기. 과거 화력 우선 8구역 LOS 길찾기 정체는 자동조작 한계이며 사망도 15구역 성공도 아니다.
- **가드레일:** 게임 자체 수정은 없으므로 이번의 브라우저/실기기 새 검증 주장을 하지 않는다. 직전 M04-D6 [Chrome #42749422588](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42749422588)의 위험 경고 PC/모바일 가로·세로 QA는 별개. 본 D7은 실제 엔진+자동 조작/보급/미션 검증. AIRA 독립 원화160/마스크320, Android 물리 QA, 완전 심리스, 15/15 완주 **미완**.

**정확한 상태:** M04-D7 forensic replay **CODED+TESTED**, 13·14·15구역 무스킵 엔딩 **FAIL/INCOMPLETE**. 사용자 승인 전 PR #235 Draft/미병합·운영/과금 금지.

**병합 확인:** [QA PR #250](https://github.com/TELLOWSS/psi-zero-day/pull/250)은 검증 후 **OMEGA 개발 브랜치에만** squash 병합 `b5c431dfa88bdd2cc5bcd9e91b05169a4a69226e`. 작업 PR #235는 계속 **Draft·미병합**. Core [#42765707078](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42765707078) 53파일/234 PASS 증거는 게임/QA 코드 HEAD `624778b2ea2fc018908248d4f2e10c55dd0cba17`에 해당하며 그 뒤 GitHub 변경은 이 인계·마스터 기획서 문서 갱신뿐이다. `main`, Vercel Production 또는 유료 변경 없음.

**NEXT M04-D8:** 실제 13구역 초기 4~8초 적 위치/경고/대시 재현 데이터를 사용해 즉시 회피가 *어떤 방향에서* 불리해지는지와 적 중첩 위험/LOS를 분석, 입력 정책 또는 예고 인지성의 검증된 개선만 별도 QA PR로 시도. 고정시드 결과가 승리 조건을 충족하지 못할 시 실패로 계속 표시한다. main/Production 금지.

## 22. M04-D8 13구역 실전 초반 8초·복합 위험 경계·마지막 운반장비 LOS 진단 (2026-11-10)

**QA:** [PR #251](https://github.com/TELLOWSS/psi-zero-day/pull/251), `qa/omega-m04d8-wave13-counterplay-20261110` → **OMEGA 개발 브랜치만**. 출발 PR #235 HEAD `e9658a532c3b81df316b023f9126526fdb7c9c41`. 이번 제출물은 `tests/omega-protocol-m04d8-wave13-first8.test.ts` 신규 + CI 등록 + 인계/기획서 문서이며, **실제 게임 엔진·적/플레이어 HP·AI·공격력·스폰·맵/보급/해금/업적·본 UI 변경 없음**.

### 실제 첫 8초를 원본 엔진에서 계측

- `OmegaProtocolCombatSession(20261109,50,false,{fieldTraversal:true,gateTransition:true})`에서 1~12구역을 실제 사전 승리 없이 적 처치·E현장장치·문·실제 선택 카드만 이용해 통과. 13구역 초기 9개체 위치, ZombieBrain warning/charge/recovery·잠금 방향, native cart motion, player 좌표·HP·native dash 남은 시간, 현재 조작, 실제 경고를 **0.5초 간격**으로 수집하고 체력피해/충돌 원인과 결합. 세 전술의 1~12구역 segment·보급 선택이 동등한 통제 시험으로 보장됨.
- D7 단순 반응형 실패: 약1초에 **좌측 실측 경계 x≈21**, 이 시점부터 3초 가까이 실제 이동이 멈추며 주변 질주/잠복·cart 접근. 약3.5초에 질주 피격, 4.1초에 잠복형 추가 피격으로 HP0. 경고 한 개체만 보고 1방향 회피하면 다중 적/벽에 의해 오히려 위험해짐.
- D8 제한형 테스트 조작: 실제 9개체+경고 위치·잠금 방향과 실제 4개 현장 장애물, 맵 가장자리 접근을 함께 계산해 **24개 가능한 joystick 방향** 중 위험이 객관적으로 낮은 방향에서만 회피; 그렇지 않으면 기존 입력 유지. 원래 native `dash()`/쿨다운/무전·검격/피격 무적 사용. HP/적HP 직접 설정 없음.
- 후반 마지막 `RUNAWAY_CART`가 실제 장애물 바로 왼쪽 가장자리에 붙은 상태에서 기존 내비게이션의 원점 직접 이동이 불가능하거나 사격이 엄폐물에 막혀 자동 조작이 정체됨. 실제 native Watch 자동 표적은 `terrainHit` radius=2로 유효해도 실제 무전탄은 최대 radius=8로 cover에 막힐 수 있음을 **소스 일치**로 파악. 시험 조작만 실제 field route를 따라 다가갈 수 있고 반경8 장애물 LOS가 확보되는 **합법적 사격 위치**를 찾아 이동하도록 개선. 물체 관통, 적 체력 직접 감소, 공격력 증가 없음.

### 검증된 무스킵 실전 결과 (PASS 의미 주의)

- [Core Actions #42790676121](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42790676121): **SUCCESS**, TypeScript 및 **54파일/235개 Vitest 전체 PASS**. 이는 문서 이전의 **승인 가능한 최선 게임/테스트 소스**와 동일한 것으로, 곧바로 15/15 승리를 뜻하지 않음.
- 기준: 12개 완료→13구역 HP0 약39.6초, 질주16 + native cart **실제 charge** WATCH 순손실17. 무분별 반응: 동일 12개 완료→13구역 HP0 약4.1초, 질주16+잠복17.
- **제한형: 실제 13구역 완전 완료**(약170.8초, **HP33 유지·피격0**, 실제 적 처치+E+실출구), **14구역 완전 완료**(약212.7초, **HP33 유지·피격0**, 실제 적 처치+E+실출구), 14구역 실제 제공 보급 `phase_boots`/`blade_reach`/`radio_overdrive` 중 `radio_overdrive` 선택. **15구역 진입** 후 실제 최종 `BLACK_SIGNAL_CORE` 공격 관측 손실 총 약57(중간 실전 회복 포함), **약181초 시점 플레이어 HP0, 보스 잔존 1개체**. 따라서 **14/15 실제 완료, 15/15 실패**. 기존 1~12 카드: 2 rapid_step, 4/6 shield_matrix, 8/12 recovery_protocol, 10 blade_edge.
- 15구역 lane-only 대피 입력 후보를 별도 시험([Core #42791077265](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42791077265), TypeScript/235 PASS)했으나 **15구역 약9초 HP0**(보스12 + WATCH cart 순손실21)로 악화돼 즉시 **완전히 롤백**. 최종 소스 테스트 블롭은 성공적으로 14구역을 완료한 위 Core #42790676121 버전과 정확히 동일; 실패한 대피 후보는 채택되지 않음. 단계별 시도 결과와 FAIL 분류는 Actions 증거에 보존됨.
- **검증한 것:** TypeScript + 실제 native Watch/Omega 엔진 고정시드, 실제 E/필드 게이트/선택 카드/총검·장애물/피해 감사. **이번 단계에서 새 실제 PC·모바일 Chrome 플레이나 Android 물리 FPS QA를 수행한 것은 아님**. 직전 D6 브라우저 시험은 별도.

**상태:** M04-D8 **TESTED 부분 성공: 1~14구역 무스킵 실제 클리어, 15구역 실제 보스전 패배**. 15/15 완주, 진정한 연속 지도 스트리밍, 최종 AIRA 독립 아트160/마스크320, 실제 Android/태블릿 성능, 프로덕션 출시 **미완/금지**.

**병합 검증:** [QA PR #251](https://github.com/TELLOWSS/psi-zero-day/pull/251)은 테스트 검증 후 OMEGA 개발 브랜치에만 squash 병합 **`3171d8099469c62fa0e084ff9ba7bcce09be7958`**. 게임/시험 검증 재현 [Core #42791361534](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42791361534): TypeScript·54파일/235개 전체 PASS; PR #251의 최종 실행 코드는 이전 14/15 성공 증거 [Core #42790676121](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42790676121)과 **파일 SHA 동일**. 그 뒤 소스 변경은 인계·마스터 기획서 문서뿐이며 runtime QA를 가장하지 않음. 주 PR #235는 Draft·미병합, `main`/Vercel Production/유료 전환 없음.

**NEXT M04-D9:** 15구역 power_sweep/운반장비 복합 경고 실제 프레임 분석 후 다중 위험을 동시에 피하는 마지막 보스 전술; 1~14 검증 경로와 같은 실제 제공 카드 유지. 단계별 HP·적HP·native lastDamage, 대시 쿨다운/충돌 물리와 15 boss HP를 기록하고 **진짜 15/15 실전 엔딩을 검증**하되, 실패하면 실패 표시. `main`/Production·유료 전환 금지.

## 23. M04-D9 최종 BLACK SIGNAL CORE 무스킵 자동조작 승리·보스 복합 경고 실증 (2026-11-10)

**QA:** [PR #252](https://github.com/TELLOWSS/psi-zero-day/pull/252), `qa/omega-m04d9-boss15-cross-threat-20261110` → OMEGA 개발 브랜치만. 출발 PR #235 HEAD `24e755e5b4a9c2822a6f11381bd71d3058dcaf14`. 신설 `tests/omega-protocol-m04d9-boss15-cross-threat.test.ts` + GitHub Core workflow 검증 등록 + 인계/마스터 문서. **게임 본 코드(HP/총·검 공격력/적 AI/장비 이동/보스 패턴/지도/성장/실계정/앱 UI)는 수정하지 않았다.**

### 실제 재현/전술 선택

- 동일 고정 seed `20261109`, `OmegaProtocolCombatSession(20261109,50,false,{fieldTraversal:true,gateTransition:true})`에서 1~15를 실제 native 발사체/검 3연타/대시/좀비4종/운반장비/보스의 원본 HP·원본 초단위 물리로 **단 한 구역도 스킵 없이** 재생한다. `qaGateTravel` 사용 금지, HP/적HP/우연시드/게임 상태 강제 변경 없음. 단 50/50 Extreme은 테스트 생성자의 QA 값이며 실제 사용자 계정 실해금 증거가 아니므로 혼동 금지.
- **비교 동등성:** 기존 `bounded`와 `bossSafe` 전술은 1~14구역 실제 적 제거·장치 E·실제 출구 이동·모두 같은 진입HP/결과 및 실제 제공 카드의 선택을 동일하게 Vitest에서 비교; 15구역 첫 12초 native 보스/장비 프레임도 완전히 같게 검증. 14구역 카드 제공 `phase_boots`/`blade_reach`/`radio_overdrive` 중 실제 제공된 `radio_overdrive` 선택.
- 15구역 플레이어/최종 보스 HP/원본 bossTelegraph `power_sweep` horizontal/vertical 잠금선/잔여 경고시간·운반장비 native `warning`/`charge`/`cooldown`·이동 입력·장애물 LOS/실제 타격 프레임 감사를 추가. 처음 전체 경고 우선 회피는 **감염체 쏠림으로 24.9초 사망(16+17)**, 적 2개체 이하로 제한한 후보는 **195.7초 사망(보스12+12+18+15)**; 매번 정직하게 FAIL 기록. 개선 후보는 최종 2개체 이하+경고 **1.24초 이내**에만 적용, 이미 위험선 밖으로 나왔더라도 실격 구간 근처에 재진입하지 않도록 **잠금선에서 실제 폭+55 거리의 안전 여유폭** 유지. 다중 운반장비 실제 궤적/맵 경계/고정 지형을 함께 평가한 32방향 합법적 조이스틱 입력. 보스 경고, 체력, 보스 기동 패턴 자체 수정 0.

### 엄격한 실제 엔진 15/15 승리 증거

- [GitHub Core #42801564153](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42801564153)로 최초 **15/15 전투·장치·출구 이후 `victory`** 기록. [최종 강화 테스트 Core #42801989191](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42801989191): TypeScript + **55파일/236개 전체 PASS**, 별도의 강제 조건 `segments.map(wave)=[1..15]`, 각 구역 `realCombatAndEFinished=true`, 최종 보스 적 0, HP>0, `runPhase='victory'`, 실제 명중/검 피해>0 모두 검증.
- **최종 15구역:** 실제 native 총기 명중 **464회**, 검 실제 피해 **1,066.95**, 보스전 실제 경과 약 **216.63초**, 관측된 보스 피해 **24(12+12)**, 시작·종료 HP **33**(원본 재생 중 회복 포함), 최종 보스 HP0·실제 E 장치·실제 출구를 통해 게임 런 `victory`. 1~14구역 공통 강화/사망 원인은 인계 §22와 동일.
- **대조 실패군:** 기존 제한형은 15구역 약181.25초에 `BLACK_SIGNAL_CORE` 피해 총57(12+12+18+잔여15)로 HP0, 마지막 보스 1개체 잔존. 최종 정책으로 동일 앞14개 구역/카드/보스 첫12초를 유지하면서 후반부 18+15 종료 피해를 피했음. '236 테스트 PASS'와 '15/15 실제 런 victory'를 구분하기 위해 별도 게임 승리 assertion 신설.

### 사용자 눈에 보이는 완성도 / 출시 제한

- **이것은 실 게임으로 동작 가능한 네이티브 메커니즘을 자동 조이스틱으로 검증한 성공**이지, 테스트 전술을 운영 플레이어 자동 조작으로 통합했다는 뜻이나 실제 유저가 실기기에서 완주했다는 증거가 아니다. 비디오/브라우저 15→엔딩 시네마틱, Android 실제 단말 FPS·발열·제어, 실 50개 Extreme 해금·권한, 독립 strict [PR #243](https://github.com/TELLOWSS/psi-zero-day/pull/243) 품질 게이트는 추가 검증 필요.
- 실제 15구역 공간은 2.5D 입체 배경·높이감·가림 관계·빛·그림자·카메라 연출과 정식 AIRA 160원화/320마스크가 아직 미완. 이미 구현된 기술적 전투 승리를 **상품성/영상 품질 승인**으로 둔갑시키지 않는다.

**병합 확인:** [QA PR #252](https://github.com/TELLOWSS/psi-zero-day/pull/252)은 **OMEGA 개발 브랜치에만** squash 병합 `b1f5daec9277a67625055a9a559ef62058874c83`. 실제 최종 TypeScript·55파일/236개 전부 PASS [Core #42801989191](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42801989191) 테스트/CI HEAD `ef135fd019273f983fe502289068a72457856382` 이후는 인계·마스터 문서 변경뿐이며 실행 소스 블롭 동일성 확인 완료. 사용자가 승인하기 전까지 주 PR #235는 Draft·`main` 미병합, Vercel Production/유료 전환 금지.

**NEXT M12-G1:** 디렉터 지정 **배경 입체화 수직 슬라이스** 1개를 원본 OMEGA 실제 플레이 렌더러에 구축. 우선 기존 쿼터뷰 좌표/충돌/실탄 LOS를 변경하지 않고 시각용 z/depth와 layer ordering, 비계·갱폼·호이스트·산업 폐허 구조물, 전경 진입 시 AIRA/감염체 **동적 오클루전(가림)**, 발 접지/블롭 그림자, 조명·안개, 카메라 팬/줌, 모바일 전용 저비용 표현으로 완성. 실제 4개 해상도 브라우저 캡처/조작 및 기능 CI 검증으로 **이미지 단독 시안과 실제 구현을 분리**. 정식 캐릭터 원화 승인(0/160), 심리스/PR243/Android 실물은 독립 BLOCKED 게이트. main/Production/유료 전환 절대 금지.


## 24. M12-G1 첫 전장 2.5D 구조 입체화 수직 슬라이스 — 자동검증 PASS 및 개발병합 (2026-11-10)

**검증 분기:** [QA PR #253](https://github.com/TELLOWSS/psi-zero-day/pull/253), `qa/omega-m12g1-industrial-depth-20261110` → OMEGA **개발 브랜치에만** 병합 가능. 주 PR #235 Draft, `main`/Vercel Production/일반 Watch·Guard/유료 서비스 변경 없음.

### 실제 구현 범위 (CODED)
- 기존 React/Canvas `src/ui/OmegaProtocolPlaytest.tsx`의 첫 구역 native Watch 실플레이 렌더러에 `src/ui/omega-protocol-m12-depth.ts` 신규 연결. 별도 시안 이미지가 아닌 게임 루프에서 직접 그려지는 광학 레이어.
- 기존 월드 충돌 사각형 네 개에서만 생성하는 지면 그림자, 비계·컨테이너·기계·안전시설용 수직 면/철골 프레임, 이동하는 인물·좀비의 접지 그림자, 배경 거리 안개, **실제 앞뒤 깊이 정렬로 가려진 AIRA를 안내하는 바닥 표시**.
- 기존 `omegaFieldDepthOrder`의 실제 발 위치(world Y) 정렬은 유지하며, 비시각 게임 좌표/Watch 총알 LOS/엄폐/충돌/플레이어 HP/좀비 HP/공격 및 난이도/카드/유저 계정·해금 상태를 변경하지 않음. 시각 장식에서 거짓 통로/엄폐 물체를 추가하지 않음.
- 화면 면적 기준 저비용 시각 예산: 390×844·844×390 = 그림자 광택 최소/안개 1띠; 1024×768 = 중간; 1440×900 = 최대. 전체 원화 또는 실루엣 분할 애니메이션을 승인 완료로 표시하지 않음.
- `tests/omega-protocol-m12-depth.test.ts` 실제 지형/가림 판단·저사양 예산·후속 구역 영향 없음·실제 입력 객체 무변경 검사 신규.
- `scripts/qa-omega-m12g1-industrial-depth-browser.mjs`는 Vite 개발전용 실제 React+Canvas 4해상도를 열어 **실제 방향키로 플레이어 X 이동** 및 렌더된 canvas 픽셀 분포/화면 넘침을 점검하고 각 크기별 스크린샷과 JSON 결과를 Actions artifact에 저장함. 자동 유닛 통과와 육안 그래픽 승인은 별도.

### 검증 근거 (TESTED는 해당 범위로만)
- [Core GitHub Actions #42804240857](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804240857) **SUCCESS**: TypeScript typecheck 및 신규 M12-G1 포함 OMEGA Vitest/자산 정책 게이트.
- [Browser GitHub Actions #42804245592](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804245592): **SUCCESS, 전체 워크플로 모든 단계 PASS**. 실제 OMEGA 게임 실행/기존 WATCH·GUARD·AIRA·보스 및 게이트 회귀, 네 화면(1440×900 / 1024×768 / 390×844 / 844×390) 실제 Canvas 픽셀 내용·방향키 움직임·가로 넘침 없음 확인. 캡처 artifact `omega-protocol-source-browser-screenshots` ID `13757422420` (보고서 `m12g1-industrial-depth-report.json`, M12 4장). 브라우저 결과는 기기 에뮬레이션이며 Android 실제 폰을 뜻하지 않는다.
- 이번 기록은 모바일 Chromium 에뮬레이션이며 실제 Android/태블릿 발열/FPS QA가 아니다. 실제 상업용 퀄리티, 160개의 최종 승인 AIRA 프레임/320 오클루전 마스크, 진정한 심리스, 실유저 50×Extreme 계정 검증 및 PR #243은 **BLOCKED 별도**.

**실제 화면 육안검수 결론:** 4크기의 PNG가 동일한 native 게임 캔버스와 패널을 표시하고, 1구역 지면·컨테이너/비계 구조물 바닥 음영 및 인물 깊이 관계가 존재함. 그러나 현재 전장에는 **대형 비계 프레임·갱폼·호이스트 상부 독립 아트와 배경의 압도적 입체 구조가 여전히 부족**하며, 사용자가 요구한 상품급 액션 RPG 그래픽으로 승인 불가. 진짜 3D/고해상도 최종 배경·AIRA 원화 및 모바일 물리 성능도 미검수. 테스트의 녹색 성공은 **기술 슬라이스**까지만 의미한다.

**M12-G1 개발 브랜치 병합 완료:** [QA PR #253](https://github.com/TELLOWSS/psi-zero-day/pull/253)을 **OMEGA 개발 브랜치에만 squash 병합**하여 SHA `93c65d1747bf874143f4b77a88a17a54b7b550c6` 반영. 병합 전 소스 SHA `673e7d0d12da69279a70e1bc898fdfdb3a281f9a`의 Core [#42804240857](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804240857) **56파일/240 Vitest PASS** 및 Browser [#42804245592](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804245592) **전체 PASS**. 그 뒤 HEAD `4bf0bd9c8f7dfdf96b71c8882717319b2d54d69e`의 변경은 이 인계 문서뿐이라, 상품급 아트 완성·Android 실기기 검증으로 해석하지 말 것. **NEXT M12-G2:** 플레이할 때 보이는 첫 전장 고품질 본작업(비계 높이·갱폼·호이스트 실질 레이어, 건물 실루엣과 전경 분할, 시야 가림 경계, 적 종류별 깊이·타격 피드백, PC/모바일 FPS 비용)을 이어가되 제작한 시안과 실제 게임 렌더링을 구분. 인물 확정 원화는 승인받기 전까지 편집/출시 완료로 표시 금지. `main`/Production 병합 및 유료 전환 금지.


**M12-G1 최종 개발 병합 확인:** [QA PR #253](https://github.com/TELLOWSS/psi-zero-day/pull/253) 전체 검증 후 **OMEGA 개발 브랜치에만** squash 병합 `93c65d1747bf874143f4b77a88a17a54b7b550c6`. 실제 실행 코드의 GitHub Core [#42804240857](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804240857) **56파일/240테스트 및 TypeScript PASS**, Browser [#42804245592](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42804245592) **전체 워크플로 SUCCESS**와 M12 4크기 브라우저 캡처 확인. 검증 코드 SHA `673e7d0d12da69279a70e1bc898fdfdb3a281f9a` 이후 QA에 추가된 커밋은 인계문서 내용만 변경했으며 코드 동등성 유지. 메인 PR #235 계속 Draft, `main` 병합/운영 Vercel 배포/유료 전환하지 않았다. 육안검수 결과 추가 산업 구조물 원화, 긴 전경/후경 레이어와 최종 AIRA·적 캐릭터 원화가 충분하지 않으므로 **상품급 그래픽 합격 판정 금지**.

**다음 실제 구현 M12-G2:** 첫 전장에서 '비계/갱폼/호이스트 높이 + 타워크레인 원근 실루엣 + 고해상도 독립 전경/중경/후경 + 실재 구조물과 가려지는 인물 + 모바일 낙하/충돌 프레임 가독성'을 기존 브라우저 캡처를 기준선으로 개선. 원본 지형과의 충돌/LOS 싱크, 세로/가로 UI, Vercel 무료 한도 유지. 새 QA 브랜치와 별도 Core+Browser 검증 전 개발완료 주장 금지.


## 25. M12-G2 첫 전장 원본 산업구조물 2.5D 레이어 (2026-11-10)

**QA [PR #254](https://github.com/TELLOWSS/psi-zero-day/pull/254)** — `qa/omega-m12g2-authored-industrial-layers-20261110` → **OMEGA 개발 브랜치만**. 출발 PR #235 HEAD `3197659e1ac00a6c4a333e0a0e5b02ba48954622` 및 M12-G1 §24 기준. **`main` 병합 및 Vercel Production 배포·유료 업그레이드 절대 금지**.

### CODED: 단순 시안 이미지가 아닌 실제 엔진 Canvas
- `src/ui/omega-protocol-m12-authored-industrial.ts` **신규**: 현장 1구역에 산업시설 원경 파사드/타워크레인 독립 실루엣, **기존 지형 `cargo` / `scaffold` / `machine` 객체에만** 짙은 컨테이너 외장, 3층 갱폼/비계 프레임, 승강기 레일/카/케이블, 네이티브 경계에만 낮은 프레임 레일을 시각적으로 묘사. 오리지널 자체 Canvas 벡터이며 제3자 저작권 이미지·AI 네트워크 호출/비용·CDN 없음.
- `src/ui/OmegaProtocolPlaytest.tsx` 실제 원본 React/Canvas `drawLab`에 **후경 패스 → 원본 고정 장애물/캐릭터 Y 순서 내 갱폼/호이스트/컨테이너 소재 패스 → 경계 전경 패스**를 실제 연결. 기존 쿼터뷰 카메라를 그대로 쓴다.
- 무형체/허위 방어 불가: 기능물은 기존 원본 `omegaFieldPlan` 객체와 **동일 참조**일 때만 렌더되며 Watch 무전탄 LOS·몸체 충돌·거리/미션·카트/보스 경고·실제 HP/방어력·적 AI·시드/카드 선택·원본 저장/해금을 변경하지 않았다. 후경 공장/타워크레인과 지도 경계는 비충돌 장식이고 새로운 이동 가능한 발판으로 간주하지 않는다.
- 성능 예산: 390×844·844×390 모바일은 적은 창문/트러스·광원 제거; 1024×768 태블릿 중간; 1440×900 PC 상세. 반복 무작위 생성, 유료 API/3D 엔진 도입 없음.

### 검증 증거 및 합격 게이트
- `tests/omega-protocol-m12-authored-industrial.test.ts` 신규(도메인 지형 무변경·세 구조물 진짜 기하 앵커·후속 구역 영향 없음·경량 프레임 예산·잘못된 입력 무시).
- `scripts/qa-omega-m12g2-industrial-browser.mjs` 신규. Vite 개발전용 **실제 React/Canvas 화면 4크기** 캡처 및 실제 키보드 이동 검증 + 같은 Vite 원본 G2 모듈로 아웃오브밴드 Canvas를 따로 생성하여 **원경·갱폼·호이스트·컨테이너·경계 5구역 실제 픽셀을 개별 검사**. 이는 단순 화면 색상변화 감상이 아닌 실 아트 패스 존재 검증. 별도 `.github/workflows/verify-omega-protocol.yml`, `qa-omega-protocol-browser.yml` 검증 등록.
- **엄격한 합격**: 본 QA PR의 최신 실행 코드 TypeScript/전체 Vitest SUCCESS + 실제 Chrome 4크기 및 기존 WATCH/GUARD/AIRA/Boss 회귀 SUCCESS + 최종 사진 육안 검토 통과한 뒤에만 개발 브랜치 squash 병합한다. 현재 검증 결과는 Actions에서 확인 후 아래에 갱신할 것.
- 출시와 품질 구분: M12-G2는 **차세대 게임 배경의 원본 구조 렌더링 기술 단계**이지 최종 판매용 고해상도 배경 일러스트가 아니다. 은백색 AIRA 정식 160 독립 프레임/320 마스크, AIRA 외형 일치·정식 적 12종+ 아트/애니메이션, 심리스 세계, Android/태블릿 실제 FPS·발열/조작, 독립 strict PR #243/실계정 50 Extreme/상업 출시 승인 **모두 미완**.

**NEXT M12-G3:** 갱폼·비계·호이스트/붕괴된 시설의 고해상도 원본 정밀 아트와 카메라 움직임에 의한 전경/중경/후경의 진짜 깊이 변화 및 모바일 프레임타임 측정. 15구역 전체 전장과 은백색 AIRA 정식 원화는 분리 추적. `main` / Production / Vercel 유료 전환 금지.


### M12-G2 개발 검증 및 실제 캡처 재검수 메모 (2026-11-10)
- 첫 시도 [Core #42806512440](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42806512440) TypeScript 실패는 테스트 spy 문법 `(name:string)=()=>` 오타 1개로 확인하고 `(name:string)=>()=>`으로 수정. 엔진 원인 아님. 수정 후 [Core #42806630973](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42806630973): TypeScript/57파일/245테스트 전부 PASS.
- 초기 원경/갱폼/호이스트는 [Chrome #42806511714](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42806511714) 전체 워크플로 SUCCESS. **M12-G2 4사이즈 브라우저 보고서 실제 픽셀**: 데스크톱/태블릿/모바일 세로·가로 모두 5개 산업구조 영역 별도 렌더링 PASS, 실제 조이스틱 아닌 키보드 방향 입력 X 이동 PASS. 다만 실제 화면 캡처를 육안 확인하니 **시작 카메라가 입체 구조물 대다수를 화면 밖에 둬 체감 품질 개선 미흡**.
- 위 육안 결과를 반영해 `drawOmegaG2EntrySurface()` 신규: 첫 플레이어 시점(월드 150,450)에서 보이는 기존 통로 지면에 낮은 강철 판넬 마감·오버헤드 구조 그림자·표면 반사·원본 가이드 도색을 추가. 이는 **시각적 아스팔트 표면 질감**이며 충돌체/새로운 플랫폼·장비물체 아님. 실제 게임 drawLab 바닥 패스에 연결, 별도 Vitest 후속 구역 무영향·브라우저 독립 `entry` 픽셀 필수 추가.
- **최종 변경 본** [Core #42807583775](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42807583775) TypeScript + 57개 파일/245개 테스트 **전부 PASS**. 최종 브라우저 QA [#42807583400](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42807583400) 종료 확인 및 최종 4장 스크린샷 육안 확인 **아직 완료하지 않았다**. 이전 전체 Chrome PASS는 초기 G2 소스에 대한 것으로 최종 바닥 보강을 승인하는 증거로 사용 금지.
- 따라서 현시점 전체 M12-G2 = **CODED + CORE TESTED + 이전 Chrome 범위 PASS; 최종 Chrome/캡처 검수 필요**. PR #254는 Draft/미병합, 개발 브랜치 외부 확산/Production 금지. 최종 검증 성공 뒤에만 개발 브랜치에 squash 병합하고 검증 SHA·병합 SHA를 반드시 이 문서에 기입한다.


**M12-G2 개발 브랜치 병합 최종 확인:** [QA PR #254](https://github.com/TELLOWSS/psi-zero-day/pull/254) 병합 **ONLY OMEGA 개발 브랜치** squash SHA `ebeaec2bac6cb3f6b8baedd48396abeb0e123bea`. 실제 최종 소스/테스트 HEAD `4184d067e1f813eaec3722470cbd6f6bf9b0b732`의 [Core #42807583775](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42807583775) **TypeScript·57파일/245 Vitest PASS**와 [전체 Chrome #42807583400](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42807583400) **모든 브라우저/Watch·Guard·AIRA 회귀 단계 SUCCESS**. 마지막 QA HEAD `42499323d22687baa9d9c7e50e58ebdf217fd09b`과 실행 소스 HEAD의 diff는 **이 인계문서 및 포커스 Chrome workflow 추가 2파일뿐**임을 GitHub compare로 검증. 별도 [집중 4해상도 실제 Canvas #42808138608](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42808138608) **SUCCESS**, m12g2-authored-industrial-report.json 실패 0, PC1440×900 / 태블릿1024×768 / 모바일 세로390×844 / 가로844×390 모두 native 입력 이동과 **입구 지면+원경+갱폼+호이스트+컨테이너+경계** 픽셀 검증 PASS. 집중 스크린샷 GitHub artifact `omega-m12g2-focused-chrome` ID `13761535536`. 실제 캡처 육안검수: 출발 시점 바닥판·기계 그림자/질감이 보강됐으나 **대형 배경 구조물을 첫 화면 카메라가 충분히 드러내지 못하고 전장 전체는 평면적으로 보인다**. 따라서 `M12-G2 TECHNICAL CODED+TESTED`이지 **상품급 그래픽 승인 절대 아님**. `main`, Vercel Production, 유료 기능/한도 전환, 원본 Watch/Guard는 변경하지 않음.

**확정된 NEXT M12-G3:** (1) 실제 플레이 구도에서 크게 보이는 높이 있는 다층 고해상도 원화/전경·중경·원경, (2) 카메라 이동·줌에 따른 시차와 진짜 가림 경계(시야/피격 표시 우선), (3) AIRA V2 최종 은백색 외형을 실제 주인공에 일치시키는 독립 8방향 액션·마스크 생산/검수, (4) 가로390높이+세로844 모바일 FPS·프레임타임/터치·발열, (5) strict PR #243/실계정 Extreme50/심리스·시네마틱 출시 게이트 독립 처리. **실제 Android 기기·상업용 최종 원화/마스크 아직 미검수**. PR #235 계속 Draft/미병합; `main`/Production 최종 승인 전 금지.


## 26. M12-G3 실제 전장 카메라 3중 시차·원본 철망 오클루전 (2026-11-10)

**QA:** [PR #255](https://github.com/TELLOWSS/psi-zero-day/pull/255) `qa/omega-m12g3-parallax-occlusion-20261110` → **OMEGA 개발 브랜치만**. 시작 PR #235 개발 HEAD `7dcdbe446493bcc791a385becb810b0fc4223ed5` (M12-G2 §25 완료). 사용자 승인 전 `main`/Vercel Production/유료 업그레이드 금지.

### CODED (실제 게임 Canvas)
- `src/ui/omega-protocol-m12-parallax.ts` 신규: 원본 네이티브 쿼터뷰 `omegaQuarterViewCamera`의 실제 player-following offset을 읽어 **원경(0.16)/중경(0.48)/근경(0.78) 3장 원본 산업 철골 시차**를 독립적으로 계산. 카메라 장거리 이동에서도 비율이 같은 값으로 포화되지 않도록 원본 공통 카메라 이동부터 clamp 후 레이어별 scale한다. `setTransform`/Canvas `save/restore`로 조작/히트박스 변형 없이 시각 패스만 적용.
- 경기장 바닥 이후/캐릭터·감염체·위험경고보다 아래에 3장 반투명 레이어를 배치한다. 멀리 있는 크레인·공장 구조물 원경, 중간 강철 통로 빔과 조명 색대, 화면 양쪽 근접 기둥/철재 그림자. 과도한 시야 차폐를 방지하려 상부 27~29% 및 좌우 12.5% 영역에 clip, 중앙 살아있는 인물 전투공간 차단 금지. 새 fake 엄폐/충돌/등반/플랫폼 생성 없음.
- 실물 collision과 같은 원본 `scaffold`·`machine` **객체 동일 참조**를 가진 경우에만 비계 안전망·호이스트 격자형 철망 가림 패스를 그린다. 기존 `omegaFieldDepthOrder`와 같은 사물·인물 painter Y sort를 유지. 작업구역 2~5 영향없음.
- 390×844·844×390 모바일은 원경 트러스 5개/망 간격26, 1024×768 중간은 9/18, 1440×900 상세는 14/12·미세 발광. 외부 모델·CDN·유료 API/계정 저장·해금/카트·적 AI·피격/공격력 변경 없음.

### 검증 · 범위
- `tests/omega-protocol-m12-parallax.test.ts` **4개 신규**: 실제 원본 카메라 전후 far/mid/near 서로 다른 이동량·첫 진입 이동량0, 원본 물리 지형 완전 무변경, native 동일 객체 외 가림 금지, sector2~5 무영향, 모바일 detail budget.
- `scripts/qa-omega-m12g3-parallax-browser.mjs` 실제 React/Canvas 4해상도 스크린샷·키보드 player 이동 및 동일 Vite 서비스의 **실제 G3 소스 모듈**을 열어 카메라 이동 전후 화면 픽셀 차이·3개 시차 수치·비계 망 그려진 픽셀과 소프트웨어 Chrome CPU 시간 계측. 프로그램/폰 실기기 FPS 또는 GPU 부하는 전혀 아님.
- [Core #42810077573](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077573) **SUCCESS: TypeScript + Vitest 58파일/249개 PASS**. [집중 Chromium #42810077739](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077739) **SUCCESS: 4해상도 실제 플레이+시차 픽셀·움직임**. 별도 [기존 G2 집중 회귀 #42810077579](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077579) SUCCESS. 전체 Guard/Watch/AIRA·미션·보스 브라우저 [#42810077661](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077661)은 종료 성공 여부를 확인 후 후속 기록한다.
- 집중 브라우저 실제 기록: 데스크톱/태블릿/모바일 세로/가로 모두 **파랄랙스 변동 픽셀 63,920 / 42,064 / 17,605 / 20,322**, 실제 native X 이동 110 / 110 / 106.3 / 102.7; 3장 이동거리 **22.64 / 67.92 / 110.38** (브라우저 계산 화면픽셀 기준) 서로 명확히 달라짐. 전용 CI 기록 `m12g3-parallax-browser-report.json` 실패0. 소프트웨어 Chrome medianMs 측정값은 타이머 분해능 한계 때문에 `0`으로 표기됨. **실제 Android/실폰 FPS 측정값 아님**; 수치로 최적화 완료 주장 금지.
- 첫 1440×900 실제 게임 화면 육안: 상단 트러스와 화면 양측의 큰 구조선이 이전보다 표시되지만 지면·캐릭터 그래픽은 여전히 평면적이며 QA 전투 영웅 대역이 색상/비례 측면에서 최종 은백색 AIRA와 차이가 매우 큼. 160 정식 AIRA 프레임/320 오클루전 마스크 제작/승인 완료로 취급 금지.

**계속 BLOCKED:** 실제 Android/태블릿 성능·터치·발열, 최종 원본 인물 움직임, 장면 5막/15구역 전체 원본 고해상도 건축 그래픽, 완전한 심리스, real 50×Extreme 계정, PR #243 strict, 유저 실제 15/15 완주·상업 승인. M12-G3는 전경·중경·원경 카메라 시차의 **기술 수직 슬라이스**이며 상품급 일러스트 완성이 아님.

**NEXT M12-G4:** 보이는 중심 전장을 평면풍 기술그림에서 벗어나도록 원본 고해상도 세트와 입체 소재를 직접 1구역에 제작/적용, 캐릭터 실제 은백색 외형과 대응하는 8방향 원화/실전 검증을 최우선. 카메라 안정성/화면가림·상단 UI 겹침/모바일 가로·세로부터 측정. 검증 통과 후에만 OMEGA 개발 브랜치 병합 가능, `main`/Production 승인 전 금지.


**M12-G3 전체 검증 및 OMEGA 개발 병합 최종 확정:** [QA PR #255](https://github.com/TELLOWSS/psi-zero-day/pull/255) **OMEGA 개발 브랜치에만 squash 병합** `ea0fe66708b6402dfea3d1e56bec5a5eaf5ee54e`. 실제 실행 소스 SHA `248f4c3f48761ad821c88d9913dee48d5f3e40f4` 검증: [Core #42810077573](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077573) **58파일/249 Vitest·TypeScript PASS**; [전체 브라우저 #42810077661](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077661) **AIRA/Watch/Guard/미션/실전 이동 포함 워크플로 전체 SUCCESS**; [4화면 G3 집중 QA #42810077739](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42810077739) **실제 화면 + far/mid/near 시차 픽셀·native 망 전부 PASS**. PR 최종 QA HEAD `c12eaab8c1d9465573b55db23b4b2180629e9bd0`은 위 검증 실행 SHA 이후 **오직 인계문서·마스터계획서 2파일**만 변경했음을 GitHub compare로 확인. 실제 4장 스크린샷 검수: 경사 프레임·투명 철골은 생겼으나 캐릭터·적의 질감과 인물 중심 구도가 게임 상품급 요구에 크게 미달. 따라서 **M12-G3 CODED/CI+CHROME TESTED, COMMERCIAL ART NOT APPROVED**. 160개 승인 AIRA 프레임/320마스크, 실제 Android FPS·발열, 전체 15개 고품질 월드·strict #243/실사용 50 Extreme은 계속 BLOCKED. 주 [PR #235](https://github.com/TELLOWSS/psi-zero-day/pull/235)는 Draft·main 미병합; Vercel Production·유료 전환 0.

**NEXT M12-G4(중요):** 새 스틸 트러스만 계속 더하기보다, **실제 게임 중앙에 보이는 AIRA와 적 스프라이트 정합성** + 2.5D 산업현장 원본 고해상도 대형 구조물/소재를 함께 맞추는 완성도 중심 작업. 정상 PC/모바일(가로390 높이 포함)에서 캐릭터 정체성·크기 비례·적 탄막/낙하·보스 경고와 실 시야를 실영상/실제 픽셀로 검수. 다음 QA 브랜치 생성→소스 적용→Core+4-size Chrome→개발병합만; `main`/Production 최종 사용자 승인 전 금지.


## 27. M12-G4 실제 은백색 AIRA 원본 8방향 + 전투 중심 질감·접지 레이어 (2026-11-10)

**QA** [PR #256](https://github.com/TELLOWSS/psi-zero-day/pull/256), `qa/omega-m12g4-silver-combat-fidelity-20261110` → **OMEGA 개발 브랜치만**. 이전 개발 HEAD `02513e4a44ba7e218485582fab8b4916501c251c`, §26 M12-G3 기술 수직 슬라이스 검증 다음. 최종 승인 전 `main` 병합·Vercel Production 배포·유료 전환 금지.

### CODED: 실제 원본 게임 주인공 표현의 불일치를 해결하는 검수 모드
- `src/ui/omega-protocol-m12-combat-fidelity.ts` 신규: 1구역 중앙 원본 실제 필드 2.5D 광원·강판 도장·소재 패널·가이드 선·리벳(실제 통로 바닥 페인트, 새 플랫폼/통행 가능 고지대 아님). 기존 Watch 플레이어·적 `x/y` 위치에만 은백색 AIRA/4종 헬멧 감염체/보스별 일관된 반사 조명·발 접촉 표시. 실제 위험 경고·적·무기 렌더링 **이전 배경 패스**에서 처리하여 위험 경고를 가리지 않음. 390×844/844×390/1024×768/1440×900에 차등 드로콜 예산.
- 기존 `src/ui/OmegaProtocolPlaytest.tsx` 수정: 기존 월드 카메라/비계·갱폼·호이스트·AIRA/적 페인터 및 정식 엄격 아트 게이트를 보존하고 실제 기본 전장에 재질·캐릭터 접지 팔레트를 연결. 물리적 4개 원본 장애물의 충돌/LOS/경로, 모든 감염체 AI/HP/보스 경고·사격·대시·모든 구역 해금·실계정 접근은 변경하지 않음.
- 현장에 기존 저장소가 보유한 **은백색 AIRA 원본 8방향 GitHub WebP(384×512)**를 다시 재업로드하게 하지 않고 **`/?omegaLab=1&omegaM12G4=1` 개발전용 검수 주소에서만** 실제 OMEGA 게임 캐릭터로 사용. 원본 `omegaLoadSilverRepoReview()` 필수 SHA-256 검증·전체 방향 8장 이미지 디코드·로스터 `production_approved:false`·실제 WebP 크기를 그대로 보존한다. 검사 실패하면 기존 기술 대역 캐릭터가 나타나도록 실패 폐쇄, 웹상 일반 WATCH/Guard나 `main`과 일반 운영 화면/기본 OMEGA 화면 변경 금지. `omegaM12G4`/ `omegaSilverPreview` 쿼리 충돌 시 소스 우선 순위 강제 없음.
- **본 기술 검수에서 나타나는 은백색 원본 8장은 정적 중립 방향 일러스트이지, 8×20=160개 정식 독립 전투 애니메이션이 아님**. 이 8장 시험 렌더링을 정식 160 장 완료, 320 마스크 승인, 상업출시 승인으로 표기하면 안 됨.

### 검증 및 릴리스 제한
- `tests/omega-protocol-m12-combat-fidelity.test.ts` 신규: 개발실 소스 모드의 opt-in과 타 모드 차단, 세 종류 지면색 구별/PC·모바일 예산, 충돌 원본 무변경 및 후속 구역 0 영향.
- `scripts/qa-omega-m12g4-silver-identity-browser.mjs` 신규: **실제 React/Canvas 4 해상도**에서 `?omegaLab=1&omegaM12G4=1` 로딩 → 원본 8개 SHA/디코드 READY 확인, 엄격 160/320 아트 승인 플래그 여전히 false, 실제 World Canvas 재질색·원본 XY 근처 반사 픽셀, 실제 방향키 이동/가로 스크롤 없음과 4장의 실제 게임 스크린샷. 테스트가 원본 캐릭터 이미지를 가짜로 그리거나 상태/HP를 수정하지 않음.
- Core CI 전수 TypeScript/Vitest, 기존 Watch·Guard·AIRA/보스·미션 회귀 Chrome, M12-G4 focus 4해상도, 실화면 육안 검토 통과한 뒤에만 **개발 브랜치 전용 병합**. CI 정확한 결과·스크린샷 파일 위치·병합 SHA는 아래 후속 기록.
- 실제 Android/태블릿 발열/FPS/실터치, 정식 160개 AIRA 미러링 없는 스프라이트와 320 마스크, 감염체 상업급 개별 고해상도 원화, 5막 15전장 다층 배경, PR #243 strict 검수, 실제 계정 50 Extreme/엔딩 영상·상업출시는 여전히 **BLOCKED**.

**NEXT M12-G5:** 원본 은백색 AIRA 8장과 동일 실루엣으로 **진짜 독립 8방향 walk·fire·dash·hit 각 프레임 원화 제작·마스크 검증(총160/320 최종 체계)** 및 감염체별 고품질 원본 스프라이트로 단계적으로 교체. 그래픽 양보다 실제 게임 캐릭터 퀄리티·발/무기 위치·가림·실기기 프레임 안정성을 우선. 승인 전 `main`/Production/유료 기능 금지.


### M12-G4 QA 실제 화면 균형 및 회귀 검증
- 1차 실제 원본 은백색 AIRA 4화면 캡처 확인 시 캐릭터가 기존 4종 감염체·카트 대비 과하게 크게 나타남. 160 독립 원화 검수 없이 기존 이미지 파일을 임의 잘라내지 않고 **기존 8개 정적 원본 384×512 전체 화폭을 유지**하면서 오직 `?omegaLab=1&omegaM12G4=1` 개발전용 화면에서 전장 표시 배율 `OMEGA_G4_SILVER_SCALE=0.78`로 낮춤. `src/ui/omega-aira-v2-candidate.ts`는 실제 native gait·대시·피격·발사 시 정적 원화를 발 피벗 기준 **작은 2D 자세 회전만** 부여한다. 명시: 팔·다리 프레임 각각 새로운 원화가 생긴 것이 아니다.
- 최종 소스 및 신규 4개 단위 테스트 [Core #42812536124](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42812536124) TypeScript/59개 파일·253개 PASS. 실원본 8장 SHA-256 READY+미승인 아트 게이트 그대로 + 4해상도 실제 Chrome 캡처+실제 이동 [focused #42812535977](https://github.com/TELLOWSS/psi-zero-day/actions/runs/42812535977) 4/4 PASS, report `m12g4-silver-identity-and-material-report.json` failures 0, artifact `omega-m12g4-focused-chrome` id `13763980803`. 4해상도: 1440×900,1024×768,390×844,844×390, 가로 넘침 없음. 변경하지 않은 일반 Watch/Guard/AIRA·보스/미션 전체 브라우저 #42812535831은 완료 여부를 확인해 아래 최종 기재한다.
- 최종 사용자 경험 검수: PC 캡처의 주인공은 은백색 원화와 원본 총기/얼굴이 실제로 나오며 감염체 크기 불일치가 이전보다 개선됨. 그러나 **헬멧 감염체는 2D 간단 벡터이고 AIRA는 고품질 정적 원화이므로 스타일 격차가 매우 큼**. 상품급 액션 RPG 합격이 아니며 사용자가 원하는 동작 8방향 개별 애니메이션이 있는 것처럼 쓰지 않는다. NEXT M12-G5 독립 액션 원화·좀비 원본 텍스처/리깅.
