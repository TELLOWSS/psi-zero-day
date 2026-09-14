# EPISODE 01 — 첫 타설

상태: **Vertical Slice + Casual Strategy/Field Realism integration in progress**. 현재 작업 브랜치 `astra/task-007-casual-strategy-foundation`.

## 핵심 출연진

PLAYER(현장 안전관리자), 강태식(형틀반장·52), 윤성호(철근반장·48), 이재훈(공사대리·33), 임준호(신입근로자·23), 최민석(크레인 신호수·39), 서정민(건축감리·46), 오승재(원도급 공사과장·41). 모든 인물과 현장은 가상 복합 설정이다.

## 이벤트 흐름

ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL(조건부) → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → **REPORTING_RETURN → INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION → RESPONSIBILITY_CLASH → REPORT_RETURN → TBM_FIELD_GAP → TBM_RETURN → RESTART_PRESSURE → RESTART_RETURN → STOPWORK_AFTERSHOCK → STOPWORK_RETURN** → EVENING → NEXT_DAY_TEASE.

현재 manifest 기준 총 **22개 이벤트**다. TASK-008A~008F 현실성 체인은 기존 CoreEngine primitive만 사용하며 `src/engine/*` 규칙을 변경하지 않는다.

## TASK-008A — 지연 관계
앞서 임준호의 신호를 들었는지·묵살했는지가 나중 보고행동으로 돌아온다. `reporting_return_state=reinforced | suppressed | missed`.

## TASK-008B — 감리 지적/재지적
`INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION`. 완전조치, 사진우선, 순서협의에 따라 감리 신뢰·공정팀 관계·재작업 여부가 달라진다. 사진은 증거이지 실제 조치완료 자체가 아니다.

## TASK-008C — 책임공방/사실확인
`RESPONSIBILITY_CLASH → REPORT_RETURN`. 원도급·공사대리·반장의 설명이 다르고, 플레이어는 한쪽 주장대로 보고하거나 방어하거나 시간대·기록을 대조할 수 있다. 일방보고는 수정보고, 방어보고는 근거요구, 시간대조는 복합원인 확인으로 돌아온다.

## TASK-008D — TBM과 실제 작업의 괴리
`TBM_FIELD_GAP → TBM_RETURN`. 아침 TBM 이후 작업방법이 바뀌면서 실제 현장이 교육내용과 달라진다.

- `tbm_form_first`: 서명자료와 원상복구에 의존 → `paper_field_gap_remains`.
- `tbm_worker_blame`: 개인 작업자 복구·재교육 → `reporting_chilled`.
- `tbm_change_control`: 작업중지·복구·변경작업 재협의 → `changed_work_rebriefed`.

TBM 서명은 당시 교육이 있었다는 증거이지 이후 변경작업까지 통제됐다는 증거는 아니다.

## TASK-008E — 작업중지 후 재개조건
`RESTART_PRESSURE → RESTART_RETURN`. “다시 하라고 했다”는 말과 실제 재개조건을 분리한다.

- `restart_follow_verbal`: 구두 재개를 그대로 수용 → 미복구 확인 → `premature_restart_second_stop`.
- `restart_trace_instruction`: 지시 전달경로 추적 → “안전조치 확인 후 재개”에서 조건이 빠진 사실 확인 → `conditional_instruction_distorted`.
- `restart_verify_controls`: 복구상태와 통제조건을 확인한 뒤 재개 → `controlled_restart`.

재개 판단은 누가 말했는지만이 아니라 **지시 조건 + 실제 복구상태 + 통제 책임자**를 함께 확인한다.

## TASK-008F — 작업중지 문화의 후폭풍
`STOPWORK_AFTERSHOCK → STOPWORK_RETURN`. 작업은 안전하게 재개됐어도 “저 사람 때문에 오늘 일이 밀렸다”는 비공식 압박이 보고자를 향할 수 있다.

- `stopwork_ignore_social`: 현장 분위기에 개입하지 않음 → 임준호가 다음 위험을 바로 보고하지 않음 → `reporting_silenced`.
- `stopwork_public_boundary`: 공개적으로 불이익 금지선을 분명히 함 → 공식 보호는 생기지만 현장 냉기가 남음 → `formal_protection_private_friction`.
- `stopwork_protect_process`: 위험보고와 인력배치 사유를 분리해 확인하고 기준을 정리 → 다음 보고 통로 유지 → `reporting_route_preserved`.

보호절차는 모든 인간관계를 즉시 좋게 만드는 정답이 아니다. 보고자를 보호하면서도 반장·공사팀과의 실무관계는 별도로 관리해야 한다.

## 콘텐츠 조립

- 기본: `content/episode01/events.json`
- 보고 후폭풍: `consequence-events.json`
- 감리: `inspection-events.json`
- 책임공방: `responsibility-clash-event.json`, `report-return-event.json`
- TBM 괴리: `tbm-gap-events.json`
- 재개조건: `restart-events.json`
- 작업중지 문화: `stopwork-aftershock-events.json`
- `src/content/episode01-consequences.ts`가 REACTIONS 뒤에 후속 현실성 체인을 순서대로 삽입하고 EVENING을 STOPWORK_RETURN 뒤로 게이트한다.

## 주요 flag

- `reporting_return_state`: `reinforced | suppressed | missed`
- `inspection_result`: `accepted | rework_after_reinspection | accepted_after_sequence`
- `report_result`: `correction_required | evidence_requested | timeline_confirmed`
- `tbm_gap_result`: `paper_field_gap_remains | reporting_chilled | changed_work_rebriefed`
- `restart_result`: `premature_restart_second_stop | conditional_instruction_distorted | controlled_restart`
- `stopwork_culture_result`: `reporting_silenced | formal_protection_private_friction | reporting_route_preserved`

## 테스트 구조

- `tests/episode01.test.ts`: 22개 이벤트 통합 흐름.
- `tests/episode01-safety-matrix.test.ts`: 기존 45개 안전 판단 조합 + 전체 현실성 체인 완료.
- `tests/episode01-consequence.test.ts`: 보고 후폭풍.
- `tests/episode01-inspection.test.ts`: 감리 3분기.
- `tests/episode01-responsibility.test.ts`: 책임공방 3분기.
- `tests/episode01-tbm-gap.test.ts`: TBM/실작업 괴리 3분기.
- `tests/episode01-restart.test.ts`: 재개 승인/조건 3분기.
- `tests/episode01-stopwork.test.ts`: 작업중지 문화 3분기.
- Strategy friction/signal 테스트는 현장 압박과 지도 표현을 검증한다.

## 전략 화면 연결

StrategyView는 엔진 상태를 읽기 전용으로 투영한다. 작업중지 후폭풍 장면에서는 **작업중지 책임 전가 / 현장 눈치·배치 압박 / 다음 보고 위축**이 동시에 표시된다. 임준호·강태식·이재훈이 현재 장면 참여자로 강조돼 사회적 갈등도 현장 맵에서 읽을 수 있다.

현장 현실성 기준은 `docs/FIELD-REALISM.md`를 따른다.

## 검증 상태

TASK-004 시점 기록은 `npm test` 197 PASS, `npm run typecheck` PASS, `npm run build` PASS였다. TASK-007~008F 이후 최신 브랜치는 자동 CI가 연결돼 있지 않아 최신 `npm test`, `npm run typecheck`, `npm run build` 실행 결과를 확보하지 못했다. 최신 PASS 수는 임의로 기재하지 않는다.
