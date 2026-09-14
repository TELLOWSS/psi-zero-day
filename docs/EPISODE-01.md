# EPISODE 01 — 첫 타설

상태: **Vertical Slice + Casual Strategy/Field Realism integration in progress**. 현재 작업 브랜치 `astra/task-007-casual-strategy-foundation`.

## 핵심 출연진
PLAYER(현장 안전관리자), 강태식(형틀반장·52), 윤성호(철근반장·48), 이재훈(공사대리·33), 임준호(신입근로자·23), 최민석(크레인 신호수·39), 서정민(건축감리·46), 오승재(원도급 공사과장·41). 모든 인물과 현장은 가상 복합 설정이다.

## 이벤트 흐름
ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL(조건부) → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → **REPORTING_RETURN → INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION → RESPONSIBILITY_CLASH → REPORT_RETURN → TBM_FIELD_GAP → TBM_RETURN → RESTART_PRESSURE → RESTART_RETURN → STOPWORK_AFTERSHOCK → STOPWORK_RETURN → INSTRUCTION_CASCADE → INSTRUCTION_RETURN** → EVENING → NEXT_DAY_TEASE.

현재 manifest 기준 총 **24개 이벤트**다. TASK-008A~008G 현실성 체인은 기존 CoreEngine primitive만 사용하며 `src/engine/*` 규칙을 변경하지 않는다.

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

- `restart_follow_verbal` → 미복구 상태 재개 → `premature_restart_second_stop`.
- `restart_trace_instruction` → 조건이 전달 중 빠진 사실 확인 → `conditional_instruction_distorted`.
- `restart_verify_controls` → 실제 복구·통제조건 확인 후 재개 → `controlled_restart`.

## TASK-008F — 작업중지 문화의 후폭풍
`STOPWORK_AFTERSHOCK → STOPWORK_RETURN`. 작업은 안전하게 재개됐어도 신고자에게 “저 사람 때문에 일이 밀렸다”는 비공식 압박이 생길 수 있다.

- `stopwork_ignore_social` → 다음 보고 위축 → `reporting_silenced`.
- `stopwork_public_boundary` → 공식 보호, 비공식 냉기 → `formal_protection_private_friction`.
- `stopwork_protect_process` → 위험보고와 배치사유를 분리해 보호절차 정리 → `reporting_route_preserved`.

## TASK-008G — 지시 전달 왜곡
`INSTRUCTION_CASCADE → INSTRUCTION_RETURN`. 공사팀의 원지시는 “안전대 설치 후 작업”이지만 일정 압박과 위계 전달을 거치며 마지막 작업자에게는 “빨리 마감하라”는 말만 남는다.

- `instruction_accept_top`: 원지시가 안전했다는 사실만 확인하고 작업반 전달 문제로 닫음 → `condition_loss_unresolved`.
- `instruction_blame_worker`: 마지막 작업자 미준수로 정리 → `worker_blame_hides_chain`. 이후 모호한 지시를 다시 묻는 행동이 줄어든다.
- `instruction_reconstruct_chain`: 공사팀 → 반장 → 작업조 → 근로자 단계별 실제 전달 문구와 시각을 대조 → `conditional_phrase_restored`.

정상 기본경로에서는 **“안전대 설치 후”라는 조건은 반장 단계까지 있었지만 작업조 전달에서 빠졌고, 일정압박 문구만 남았다**는 사실을 재구성한다. 핵심은 원지시 문서가 맞았는지가 아니라 최종 작업자가 실제 무엇을 들었는지 확인하는 것이다.

## 콘텐츠 조립
- 기본: `content/episode01/events.json`
- 보고 후폭풍: `consequence-events.json`
- 감리: `inspection-events.json`
- 책임공방: `responsibility-clash-event.json`, `report-return-event.json`
- TBM 괴리: `tbm-gap-events.json`
- 재개조건: `restart-events.json`
- 작업중지 문화: `stopwork-aftershock-events.json`
- 지시 전달 왜곡: `instruction-chain-events.json`
- `src/content/episode01-consequences.ts`가 REACTIONS 뒤에 현실성 체인을 순서대로 삽입하고 EVENING을 INSTRUCTION_RETURN 뒤로 게이트한다.

## 주요 flag
- `reporting_return_state`: `reinforced | suppressed | missed`
- `inspection_result`: `accepted | rework_after_reinspection | accepted_after_sequence`
- `report_result`: `correction_required | evidence_requested | timeline_confirmed`
- `tbm_gap_result`: `paper_field_gap_remains | reporting_chilled | changed_work_rebriefed`
- `restart_result`: `premature_restart_second_stop | conditional_instruction_distorted | controlled_restart`
- `stopwork_culture_result`: `reporting_silenced | formal_protection_private_friction | reporting_route_preserved`
- `instruction_chain_result`: `condition_loss_unresolved | worker_blame_hides_chain | conditional_phrase_restored`

## 테스트 구조
- `tests/episode01.test.ts`: 24개 이벤트 통합 흐름.
- `tests/episode01-safety-matrix.test.ts`: 기존 45개 안전 판단 조합 + 전체 현실성 체인 완료.
- `tests/episode01-consequence.test.ts`: 보고 후폭풍.
- `tests/episode01-inspection.test.ts`: 감리 3분기.
- `tests/episode01-responsibility.test.ts`: 책임공방 3분기.
- `tests/episode01-tbm-gap.test.ts`: TBM/실작업 괴리 3분기.
- `tests/episode01-restart.test.ts`: 재개 승인/조건 3분기.
- `tests/episode01-stopwork.test.ts`: 작업중지 문화 3분기.
- `tests/episode01-instruction.test.ts`: 지시 전달 왜곡 3분기.
- Strategy friction/signal 테스트는 현장 압박과 지도 표현을 검증한다.

## 전략 화면 연결
StrategyView는 엔진 상태를 읽기 전용으로 투영한다. INSTRUCTION_CASCADE에서는 **일정 압박이 지시를 덮음 / 지시 조건 누락 / 위계 전달 왜곡**이 동시에 표시되고, INSTRUCTION_RETURN에서는 다음 질문·보고 위축 여부를 보여준다.

현장 현실성 기준은 `docs/FIELD-REALISM.md`를 따른다.

## 검증 상태
TASK-004 시점 기록은 `npm test` 197 PASS, `npm run typecheck` PASS, `npm run build` PASS였다. TASK-007~008G 이후 최신 브랜치는 자동 CI가 연결돼 있지 않아 최신 `npm test`, `npm run typecheck`, `npm run build` 실행 결과를 확보하지 못했다. 최신 PASS 수는 임의로 기재하지 않는다.
