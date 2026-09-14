# EPISODE 01 — 첫 타설

상태: **Vertical Slice + Casual Strategy/Field Realism integration in progress**. 현재 작업 브랜치 `astra/task-007-casual-strategy-foundation`.

## 핵심 출연진

PLAYER(현장 안전관리자), 강태식(형틀반장·52), 윤성호(철근반장·48), 이재훈(공사대리·33), 임준호(신입근로자·23), 최민석(크레인 신호수·39), 서정민(건축감리·46), 오승재(원도급 공사과장·41). 모든 인물과 현장은 가상 복합 설정이며 실존 회사·현장·인물을 직접 사용하지 않는다.

## 이벤트 흐름

ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL(임준호를 따라간 경우) → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → **REPORTING_RETURN** → **INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION** → **RESPONSIBILITY_CLASH → REPORT_RETURN** → **TBM_FIELD_GAP → TBM_RETURN** → EVENING → NEXT_DAY_TEASE.

현재 manifest 기준 총 **18개 이벤트**다. TASK-008A~008D의 현실성 체인은 기존 CoreEngine primitive만 사용하며 `src/engine/*` 규칙을 변경하지 않는다.

## TASK-008A — 지연 관계 체인

`REPORTING_RETURN(e01_08a_reporting_return)`은 앞선 선택이 나중 보고행동으로 되돌아오는 장면이다.

- 충분히 들음: 보고 관계 강화, `reporting_return_state=reinforced`.
- 따라갔지만 묵살: 보고 위축, `reporting_return_state=suppressed`.
- 아예 따라가지 않음: 보고 기회 상실, `reporting_return_state=missed`.

핵심은 “안전 정답을 맞혔다”가 아니라 **앞선 대응이 다음 보고 행동을 바꾼다**는 점이다.

## TASK-008B — 감리 지적/조치/반발/재지적 체인

`INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION`으로 이어진다.

플레이어 선택:
- `inspection_full_stop`: 작업을 멈추고 완전 조치.
- `inspection_quick_photo`: 보이는 부분을 먼저 정리해 사진부터 제출.
- `inspection_sequence_agreement`: 감리와 작업순서를 협의해 실제 조치까지 닫는다.

사진 우선은 재확인에서 미조치가 드러나 재지적·재작업으로 돌아온다. 감리를 단순 악역으로 다루지 않고, 지적 타당성과 공정 압박이 동시에 존재하도록 설계한다.

## TASK-008C — 책임 떠넘김/말 바뀜/보고 압박 체인

`RESPONSIBILITY_CLASH → REPORT_RETURN`으로 이어진다.

원도급은 협력사 관리 문제를 주장하고, 공사대리는 중간 변경지시를 말하며, 반장은 변경지시가 늦게 전달됐다고 말한다.

플레이어 선택:
- `report_one_sided`: 한쪽 주장대로 급히 보고.
- `report_defensive`: 협력사 방어 중심 보고.
- `report_verify_timeline`: 조회·통화·지시·사진 시각을 대조.

한쪽 귀책 보고는 수정보고로, 방어보고는 근거자료 요구로 되돌아온다. 시간대조는 **변경지시 전달 누락 + 현장통제 미흡**이라는 복합 원인을 재구성한다.

## TASK-008D — TBM과 실제 작업의 괴리

### TBM_FIELD_GAP — e01_08g_tbm_field_gap

아침 TBM에서는 안전시설 임의해체 금지와 작업변경 시 재확인을 전달했다. 그러나 오후에 작업순서가 바뀌면서 실제 현장 상태가 아침 교육 내용과 달라진다.

- 이재훈: “TBM도 했고 서명도 있는데 왜 또 이런 일이 생겼냐.”
- 강태식: “아침 작업과 지금 작업이 달라졌다.”
- 임준호: “오후에 작업이 바뀐 뒤 어떻게 해야 하는지는 다시 못 들었다.”

플레이어 선택:
- `tbm_form_first`: TBM 서명자료를 근거로 원상복구만 지시하고 작업을 계속한다.
- `tbm_worker_blame`: 해체한 작업자를 특정해 복구·재교육하고 작업을 계속한다.
- `tbm_change_control`: 작업을 멈추고 복구한 뒤, 변경된 작업방법과 안전조치를 다시 협의·전달하고 재개한다.

### TBM_RETURN — e01_08h_tbm_return

앞선 대응이 다음 작업변경 상황에 자동 결과로 돌아온다.

- 서류 우선: `tbm_gap_result=paper_field_gap_remains`. 서명은 남지만 실제 변경작업 기준이 정리되지 않아 같은 문제가 반복될 수 있다.
- 작업자 개인 탓: `tbm_gap_result=reporting_chilled`. 복구는 되지만 “괜히 말하면 내가 잘못한 사람이 된다”는 분위기가 생긴다.
- 변경작업 재통제: `tbm_gap_result=changed_work_rebriefed`. 작업방법과 통제기준을 다시 공유한 뒤 재개한다.

이 체인의 핵심은 **TBM 실시·서명이 변경된 작업까지 자동으로 통제했다는 증거는 아니라는 것**이다. 또한 앞서 보고가 위축된 근로자도 이후 좋은 변경관리 대응을 경험하면 보고 관계가 일부 회복될 수 있도록 했다.

## 콘텐츠 조립

- 기본 이벤트: `content/episode01/events.json`
- 보고 후폭풍: `content/episode01/consequence-events.json`
- 감리 체인: `content/episode01/inspection-events.json`
- 책임공방: `responsibility-clash-event.json`, `report-return-event.json`
- TBM 괴리: `tbm-gap-events.json`, `tbm-gap-ko.json`
- 추가 캐릭터/관계: `inspection-*`, `responsibility-*`
- `src/content/episode01-consequences.ts`가 REACTIONS 뒤에 후속 이벤트를 순서대로 삽입하고 `e01_09_evening`을 TBM_RETURN 완료 뒤로 게이트한다.

## 주요 flag

- `reporting_return_state`: `reinforced | suppressed | missed`.
- `inspection_action`: `full_stop | quick_photo | sequence`.
- `inspection_result`: `accepted | rework_after_reinspection | accepted_after_sequence`.
- `report_basis`: `one_sided | defensive | timeline`.
- `report_result`: `correction_required | evidence_requested | timeline_confirmed`.
- `tbm_gap_action`: `form_first | worker_blame | change_control`.
- `tbm_gap_result`: `paper_field_gap_remains | reporting_chilled | changed_work_rebriefed`.
- 기존 공정/진입/PSI seed/저녁 flag는 유지한다.

## 테스트 구조

- `tests/episode01.test.ts`: 18개 이벤트 통합 흐름 스모크 테스트.
- `tests/episode01-safety-matrix.test.ts`: 기존 45개 도달 가능한 안전 판단 조합 보존.
- `tests/episode01-consequence.test.ts`: 보고 후폭풍.
- `tests/episode01-inspection.test.ts`: 감리 3개 분기.
- `tests/episode01-responsibility.test.ts`: 책임공방 3개 분기.
- `tests/episode01-tbm-gap.test.ts`: TBM/실작업 괴리 3개 분기.
- Strategy friction/signal 테스트에 TBM 현장압박과 안전시설 상태 마커를 추가했다.

## 캐주얼 전략/현장 현실감 연결

StrategyView는 엔진 상태를 읽기 전용으로 투영한다. TBM_FIELD_GAP에서는 **TBM-실작업 괴리 / 작업변경 미전파**가 현장 압박으로 표시되고, 맵에는 `안전시설 상태 변경` 신호가 나타난다. 강태식은 해당 작업영역과 가까운 인물로 표시되어 작업변경 맥락을 시각적으로 읽을 수 있다.

현장 현실성 기준은 `docs/FIELD-REALISM.md`를 따른다.

## 검증 상태

TASK-004 시점 기록은 `npm test` 197 PASS, `npm run typecheck` PASS, `npm run build` PASS였다.

TASK-007~008D에서 StrategyView/UI/현실성/후속 결과/감리/책임공방/TBM 괴리 테스트를 추가·갱신했다. 현재 연결된 GitHub 저장소에는 자동 CI 체크가 없어 이 브랜치의 최신 `npm test`, `npm run typecheck`, `npm run build` 실행 결과는 아직 확보하지 못했다. 따라서 최신 PASS 수는 임의로 기재하지 않는다.
