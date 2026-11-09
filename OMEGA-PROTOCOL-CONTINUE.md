# OMEGA PROTOCOL — 새 채팅 / 새 개발 세션 인계 문서
**관리일:** 2026-11-09 (KST) · M01/M01-QA 실검증 완료  
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
| M02 | 실제 원거리 총 + 검 3타 명중, HP 감소, 거리/장애물/보스 상한, PC/모바일 조작 | 기존 Watch 투사체+OMEGA 검격 3연격, F키·검 버튼·검 강화 2종 | **기본 코드 작성, 자동+실플레이 테스트 미통과** |
| M03 | 안전모 좀비 기본/질주/방호/정예 + 감염 군집/실제 AI 차이 | `UNHELMETED`를 OMEGA에서 `HELMET_ZOMBIE`로 별도 표시, 색 3변형 기술용 임시 그림, 매 전투 첫 적 강제 좀비 | **고품질 독립 적 아트·차별화 AI 미구현. 총·검 테스트 추가만 함** |
| M04 | 5막 15지점 이벤트, 물리적 길 찾기, 연속 연결 카메라 | 기본 FieldTraversal/3종 이벤트/출구, 오염 스토리 15개 라디오 표시 | **심리스 전환·환경 미술·연출 미완** |
| M05 | 중간 보스 TITAN HOOK/최종 BLACK SIGNAL CORE의 차별화 3페이즈 | 기존 실제 보스/예고/HP 스케치 | **최종 기믹·완성 아트 미완** |
| M06 | 은백색 AIRA 8방향 정지 원화 기준 및 **정확한 NW 후면 좌측** | GitHub 은백색 8방향 연구본, NW 후보는 대화에서만 생성 | **원화 최종 승인/리포지토리 정식 적용 미완** |
| M07 | 은백색 AIRA **독립 160액션 프레임 + 마스크 320**, 장비 정렬, 발 접지 | Watch 8방향 원화 선택/실제 idle/walk/fire/dash/hit 상태 판별, GUARD 원화 관찰용 연결 | **은백색 승인 독립 프레임 0/160, 마스크 미완** |
| M08 | 고해상도 좀비 12종 이상 변형, 애니메이션, 총기·검격 SFX/FX | 기술용 적 도형+임시 검 궤적 | **원화/사운드/전투 연출 미완** |
| M09 | 전체 실제 탐험을 처음부터 엔딩까지 무스킵, GPU/CPU/저사양 QA | 단위테스트·Playwright 브라우저 스크립트 존재 | **최신 커밋 실행 PASS 미확인** |
| M10 | PC/태블릿/안드로이드 실기기, 가로/세로 UI/발열/FPS/터치 | 반응형 CSS·브라우저 캡처 스크립트 작성 | **실기기 실행 미검증** |
| M11 | 릴리스 게이트, 저장 호환, 위험성 없음, 사용자 승인 | PR #235 Draft | **main/Production 병합 및 공개 금지** |

**다음 실행 작업(하나씩 처리):** **M02 실제 총·검 전투 통합 증거 확보**: 실제 OMEGA 개발 브라우저에서 좀비 총격·3연격의 적 HP 변화, 조준 방향과 검 충돌 및 장애물 차단, 보스 피해 상한, 키보드/터치 입력 타이밍을 검증. 먼저 `src/engine/omega-protocol-combat.ts`, `src/ui/OmegaProtocolPlaytest.tsx`, `scripts/qa-omega-protocol-browser.mjs`, `tests/omega-protocol-blade.test.ts`, `tests/omega-protocol-infected-zombie.test.ts` 확인. 현재 M02는 코드/단위계약 일부 확인 단계이며 실제 연속 플레이와 하드웨어 검증이 없어 **전체 TESTED/완료로 올리지 않는다**. 후속 M03에서는 안전모 좀비 4개 독립 행동/AI와 고품질 원화를 다룬다.

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

**여전히 미완:** 실제 유저 해금 CTA, 원본 AIRA 액션 160프레임, 좀비 정식 8방향 아트/차별화 AI, 연결맵 시네마틱, Android 실제 기기 검증. M02는 테스트 통과에 일부 포함되었더라도 **완성 아님**.

**다음 시작 커밋:** 개발 PR #235 **최신 HEAD를 조회한 뒤** 위 M02 관련 5개 파일을 확인하고 *기존 자동 공격/검 3타가 실제 좀비를 적중시키는 브라우저 E2E*를 먼저 구현·검증한다. 테스트 완료 후에만 M02 체크리스트를 갱신한다.
