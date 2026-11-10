# OMEGA PROTOCOL — 새 채팅 / 새 개발 세션 인계 문서
**관리일:** 2026-11-10 (KST) · M04-D7 실제 무스킵 고정시드 재검증: Core 53파일/234개 PASS, 동일 1~12구역 후 기존/13구역 반응 전술 둘 다 13구역 HP0 실제 패배. PR #250 OMEGA 개발 브랜치만 squash 병합 `b5c431dfa88bdd2cc5bcd9e91b05169a4a69226e`; 원래 난도·전투·계정·main/운영 변경 없음, 15/15 승리/Android/원화 미완
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
| M04 | 5막/15지점 이동 탐험, 전투·장치·실제 보급·후반 생존성 | M04-A~C, D1 보급 UI, D2/3 피해 감사, D4 4빌드, D5 경고 UI, D6 운반장비 선피격 수정, **D7 실제 무스킵 두 전술 재실험/패배 분석** | **부분 TESTED: PR #250 Core 53파일/234개 PASS; 동일 1→12 구역과 카드 선택 실제 일치. 두 전술 13구역 HP0 패배, 15/15 미통과.** PC/모바일 브라우저의 최종 전투/Android 실물·정식 아트 **미완** |
| M05 | 중간 보스 TITAN HOOK/최종 BLACK SIGNAL CORE의 차별화 3페이즈 | 기존 실제 보스/예고/HP 스케치 | **최종 기믹·완성 아트 미완** |
| M06 | 은백색 AIRA 8방향 정지 원화 기준 및 **정확한 NW 후면 좌측** | GitHub 은백색 8방향 연구본, NW 후보는 대화에서만 생성 | **원화 최종 승인/리포지토리 정식 적용 미완** |
| M07 | 은백색 AIRA **독립 160액션 프레임 + 마스크 320**, 장비 정렬, 발 접지 | Watch 8방향 원화 선택/실제 idle/walk/fire/dash/hit 상태 판별, GUARD 원화 관찰용 연결 | **은백색 승인 독립 프레임 0/160, 마스크 미완** |
| M08 | 고해상도 좀비 12종 이상 변형, 애니메이션, 총기·검격 SFX/FX | 기술용 적 도형+임시 검 궤적 | **원화/사운드/전투 연출 미완** |
| M09 | 전투·장치·출구 15구역 무스킵 승리 및 실제 모바일 FPS/메모리 | M04-D4 [PR #247] 같은 고정 시드에서 원래 런 전용 강화 후보 3개 중 실제 제시된 카드만 골라 4빌드 비교, 피해유형 기록 및 자동 테스트의 길찾기 교착 별도 표시 | **분석 TESTED, 승리 FAIL/INCOMPLETE:** 223/223 테스트 PASS는 전략별 정직한 패배·교착 결과 인증이며 15/15 달성을 뜻하지 않음. PR #243 엄격 승리 게이트 Draft·미병합 |
| M10 | PC/태블릿/안드로이드 실기기, 가로/세로 UI/발열/FPS/터치 | 반응형 CSS·브라우저 캡처 스크립트 작성 | **실기기 실행 미검증** |
| M11 | 릴리스 게이트, 저장 호환, 위험성 없음, 사용자 승인 | PR #235 Draft | **main/Production 병합 및 공개 금지** |

**다음 실행 작업(하나씩 처리): M04-D8 — 13구역 입장 직후 안전 접근/경고 대응의 실제 플레이어 입력 설계와 재시뮬레이션.** PR #250에서 최신 M04-D6 native 충돌 규칙의 실제 원본 OMEGA 전투를 1~13구역까지 고정시드 `20261109`로 새로 재실행, 53파일/234테스트 PASS. 동일 1~12구역 전투·E장치·문·실제 제공 카드 선택 후 진입 HP33: 기존 조작은 13구역 약39.6초에 질주 감염체16+실 WATCH 순손실17(같은 프레임 native cart `charge`)/HP0, 13구역부터 회피 반응을 바꾼 조작은 약4.1초에 질주16+잠복 감염체에 의해 관측17/HP0. 경고 반응을 무조건 늘리는 조작은 더 위험하므로 디렉터 승인 없는 적 HP·플레이어 HP·공격력·보스 난도 하향 금지. 다음 ① 13구역 입장 첫 8초 적/기계 위치와 현재 경고·잠금 방향·대시 경로를 시간선으로 진단, ② 방어 가능한 대시 방향/이동 거리·실제 가림 LOS/근접 위협 우선순위를 일반 플레이어 조작 관점에서 설계/검증, ③ 실제 제공 카드만 선택하는 1→15 무스킵 실전 재도전. 실제 전체 15/15 실전/보스 15/장치·게이트 성공 증거 없이 성공 선언 금지. Android 실물, 160 독립 원화/320 마스크, 심리스 월드/운영/유료 전환 BLOCKED. `main`/Production 절대 금지.

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
