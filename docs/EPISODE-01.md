# EPISODE 01 — 첫 타설

상태: **Phase C Integrated Quality Lock + Directed 26-Event Player-Facing Vertical Slice**.

## 2026-09-21 Runtime Source of Truth

현재 실제 앱은 `EpisodeSession.directed()`를 사용하며 **26개의 authored event 전체를 하나의 영화적 Day 01 → Day 02 spine으로 플레이**한다. `ep01.director.v5`가 player-facing content version이다.

- 실제 앱 플레이: **26-event directed spine**.
- 목표 러닝타임: manifest 기준 약 **26분**.
- Phase C Production Scene: STOP_WORK / FIELD / TBM / STRATEGY / OFFICE / DAY_RESULT.
- DAY RESULT 뒤 `e01_10_next_day_tease`가 DAY 02 changed-condition signal을 연다.
- 과거 11~16 event conditional route는 삭제하지 않고 **legacy/headless regression harness**로 유지한다. 현재 live app topology로 설명하지 않는다.
- Master Design Principles 기준 final playthrough gate는 `docs/EPISODE01-FINAL-PLAYTHROUGH-GATE.md`를 따른다.

## 기본 원칙

Episode 01은 26개 사건을 단순히 길게 이어붙이는 구조가 아니다. 한 장면에 하나의 핵심 판단을 두고, FIELD/TBM/STRATEGY/STOP_WORK/OFFICE/DAY_RESULT의 서로 다른 플레이 문법과 속도 변화를 통해 하루 전체를 관통한다.

- 설명보다 현장 변화, 사람의 반응, 증거와 결과로 PSI를 이해시킨다.
- 단순 계속 클릭을 줄이고 관찰·소통·판단·행동을 반복한다.
- 실제 위험성평가·TBM·증언·기록은 퀴즈 정답지가 아니라 사건의 단서와 후속행동 근거로 사용한다.
- 결과는 점수보다 사람·기록·보고문화와 다음 날 조건에 남긴다.

## Directed 공통 메인라인

ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → REPORTING_RETURN → INSPECTION/STOP WORK → RESPONSIBILITY/OFFICE → TBM → RESTART/AFTERSHOCK → INSTRUCTION/RECORD TRACE → EVENING → NEXT_DAY_TEASE.

`REPORTING_RETURN`은 짧은 공통 후속이다. 초반에 임준호의 신호를 들었는지·묵살했는지·놓쳤는지가 나중 보고행동으로 돌아온다.

## TASK-009A — 역사적 Legacy 플레이 구조 압축/재배치

### 1. `follow_junho` — 보고문화 루트

JUNHO_SIGNAL → REPORTING_RETURN 이후 바로 저녁으로 넘어간다.

- 대표 플레이 길이: **11개 이벤트**.
- 다른 감리/책임/TBM 사건을 억지로 끼워 넣지 않는다.
- 사람의 약한 신호를 듣는 행위 자체가 이 플레이의 핵심 경험이다.

### 2. `delegate_kang` — 감리/재지적 루트

REPORTING_RETURN → INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION → EVENING.

- 대표 플레이 길이: **13개 이벤트**.
- 완전조치 / 사진우선 / 순서협의에 따라 `inspection_result`가 달라진다.
- 책임공방·TBM·기록압박은 이 플레이에서는 등장하지 않는다.

### 3. `negotiate_yoon` — 책임공방/보고 루트

REPORTING_RETURN → RESPONSIBILITY_CLASH → REPORT_RETURN.

- 시간대·증거를 확인해 `timeline_confirmed`면 여기서 저녁으로 종료: **12개 이벤트**.
- 일방보고 또는 방어보고로 `correction_required | evidence_requested`가 되면
  RECORD_PRESSURE → RECORD_RETURN이 추가된다: **14개 이벤트**.
- 즉 기록압박은 모든 플레이에 나오지 않고, 불완전한 보고가 실제로 발생했을 때만 열린다.

### 4. `coordinate_schedule` — 변경작업/TBM/재개 루트

REPORTING_RETURN → TBM_FIELD_GAP → TBM_RETURN.

- 서류우선 또는 작업자책임이면 TBM_RETURN 뒤 저녁으로 종료: **12개 이벤트**.
- 변경작업 재통제를 선택하면 RESTART_PRESSURE → RESTART_RETURN 추가: **14개 이벤트**.
- 재개조건을 실제로 확인해 `controlled_restart`면 여기서 종료한다.
- 구두 재개로 두 번째 작업중지가 생기면 STOPWORK_AFTERSHOCK → STOPWORK_RETURN 추가: **16개 이벤트**.
- 재개 지시에서 조건이 왜곡됐다면 INSTRUCTION_CASCADE → INSTRUCTION_RETURN 추가: **16개 이벤트**.

따라서 작업중지 문화나 지시 전달 왜곡은 단순 교육 챕터가 아니라 **플레이어가 만든 문제의 후속 결과**로 나타난다.

## 기존 현실성 모듈

- TASK-008A: 보고 후폭풍 — `reinforced | suppressed | missed`.
- TASK-008B: 감리 지적/재지적 — `accepted | rework_after_reinspection | accepted_after_sequence`.
- TASK-008C: 책임공방/사실확인 — `correction_required | evidence_requested | timeline_confirmed`.
- TASK-008D: TBM-실작업 괴리 — `paper_field_gap_remains | reporting_chilled | changed_work_rebriefed`.
- TASK-008E: 재개조건 — `premature_restart_second_stop | conditional_instruction_distorted | controlled_restart`.
- TASK-008F: 작업중지 문화 — `reporting_silenced | formal_protection_private_friction | reporting_route_preserved`.
- TASK-008G: 지시 전달 왜곡 — `condition_loss_unresolved | worker_blame_hides_chain | conditional_phrase_restored`.
- TASK-008H: 사후 기록 압박 — `evidence_forces_correction | retroactive_record_conflict | factual_record_preserved`.

이 모듈들은 모두 콘텐츠 라이브러리에 남아 있지만 TASK-009A부터는 조건이 맞을 때만 실제 플레이에 투입된다.

## 구현 구조

- `src/content/episode01-consequences.ts`: 후속 이벤트들을 라이브러리에 조립한다. 플레이 라우팅은 하지 않는다.
- `src/content/episode01-play-structure.ts`: `choice_selected`, `flag`, `event_completed`, `any/all` 조건만 사용해 실제 플레이 루트를 결정한다.
- `src/app/episode01-run-progress.ts`: 전체 26개가 아니라 선택된 현재 플레이의 예상 길이를 진행률에 제공한다.
- `src/engine/*`: 변경하지 않는다.

라우팅 기준:

- `follow_junho` → 보고문화 중심.
- `delegate_kang` → 감리/재지적 중심.
- `negotiate_yoon` → 책임공방/보고 중심.
- `coordinate_schedule` → 변경작업/TBM/재개 중심.

후속 확장 기준:

- `correction_required | evidence_requested` → 기록압박.
- `premature_restart_second_stop` → 작업중지 문화 후폭풍.
- `conditional_instruction_distorted` → 지시 전달 왜곡.
- 정상적으로 닫힌 사건에는 후속 고구마 사건을 억지로 추가하지 않는다.

## 테스트 구조

- `tests/episode01-routing.test.ts`: 11/12/13/14/16개 실제 플레이 루트와 후속사건 조건 검증.
- `tests/episode01.test.ts`: 26개 콘텐츠 라이브러리 보존 + 단일 선택루트 완주.
- `tests/episode01-safety-matrix.test.ts`: 기존 45개 펌프카 안전판단 조합 보존 + 선택한 현실성 루트만 검증.
- 각 TASK-008 전용 테스트는 해당 사건이 실제로 열리는 선행 선택을 사용한다.
- `tests/episode-session.test.ts`: 완료 시 `completed === total`, 그리고 `total < 26`인 run-facing progress 검증.

## 전략 화면

StrategyView와 현장맵은 현재 활성된 사건만 표현한다. 선택되지 않은 현실성 루트의 압박 카드·인물·신호는 한 플레이에 동시에 쌓이지 않는다. 이 때문에 플레이어가 현재 문제를 읽기 쉬워지고, 다른 선택으로 재플레이할 이유가 생긴다.

## 검증 상태

TASK-004 시점 기록은 `npm test` 197 PASS, `npm run typecheck` PASS, `npm run build` PASS였다.
TASK-007~009A 최신 브랜치는 GitHub 자동 CI가 연결돼 있지 않아 최신 `npm test`, `npm run typecheck`, `npm run build` 실행 결과를 확보하지 못했다. 최신 PASS 수는 임의로 기재하지 않는다.
