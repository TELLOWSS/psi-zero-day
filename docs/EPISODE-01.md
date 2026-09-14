# EPISODE 01 — 첫 타설

상태: **Vertical Slice + Casual Strategy/Field Realism integration in progress**. 현재 작업 브랜치 `astra/task-007-casual-strategy-foundation`.

## 핵심 출연진

PLAYER(현장 안전관리자), 강태식(형틀반장·52), 윤성호(철근반장·48), 이재훈(공사대리·33), 임준호(신입근로자·23), 최민석(크레인 신호수·39), 서정민(건축감리·46), 오승재(원도급 공사과장·41). 모든 인물과 현장은 가상 복합 설정이며 실존 회사·현장·인물을 직접 사용하지 않는다.

## 이벤트 흐름

ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL(임준호를 따라간 경우) → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → **REPORTING_RETURN** → **INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION** → **RESPONSIBILITY_CLASH → REPORT_RETURN** → EVENING → NEXT_DAY_TEASE.

현재 manifest 기준 총 **16개 이벤트**다. TASK-008A~008C의 현실성 체인은 기존 CoreEngine primitive만 사용하며 `src/engine/*` 규칙을 변경하지 않는다.

## TASK-008A — 지연 관계 체인

`REPORTING_RETURN(e01_08a_reporting_return)`은 앞선 선택을 condition/flag/relationship으로 판정해 활성 선택지 하나만 남긴 뒤 결과 장면만 보여준다.

- `follow_junho → listen_more`: 보고 관계 36 → **40**, `reporting_return_state=reinforced`.
- `follow_junho → dismiss`: REACTIONS 시점 reporting 28 이후 **22**로 하락, `reporting_return_state=suppressed`.
- 임준호를 따라가지 않음: 기존 20 유지, `reporting_return_state=missed`.

핵심은 “안전 정답을 맞혔다”가 아니라 **앞선 대응이 다음 보고 행동을 바꾼다**는 점이다.

## TASK-008B — 감리 지적/조치/반발/재지적 체인

### INSPECTION_FIND — e01_08b_inspection_find
가상 건축감리 서정민이 통로 정리와 차량/작업자 동선 분리를 지적하고 조치사진을 요구한다. 동시에 이재훈 공사대리는 남은 작업과 일정 압박을 전달한다.

플레이어 선택:
- `inspection_full_stop`: 차량·작업을 잠시 멈추고 완전 조치.
- `inspection_quick_photo`: 보이는 부분을 먼저 정리해 사진부터 제출.
- `inspection_sequence_agreement`: 감리와 순서를 합의해 차량을 먼저 빼고 즉시 정리.

### SITE_PUSHBACK — e01_08c_site_pushback
전면중지는 공정 반발, 사진 우선은 “사진 보냈으니 넘어가자”는 압력, 순서협의는 재배치와 조정으로 돌아온다.

### REINSPECTION — e01_08d_reinspection
감리가 조치사진이 아니라 실제 통로를 다시 확인한다.

- 전면중지: `inspection_result=accepted`.
- 사진 먼저: 사진 밖 미조치가 확인돼 **재지적·재작업**, `inspection_result=rework_after_reinspection`.
- 순서협의: 실제 조치 인정, `inspection_result=accepted_after_sequence`.

감리를 단순 악역으로 다루지 않는다. 지적 자체는 타당할 수 있고 동시에 공정 압박도 실제 문제로 남는다.

## TASK-008C — 책임 떠넘김/말 바뀜/보고 압박 체인

### RESPONSIBILITY_CLASH — e01_08e_responsibility_clash
감리 재확인 뒤, 원도급 공사과장 오승재가 “협력사 관리 문제”라고 말한다. 이재훈은 “아침 지시와 중간 변경지시가 달랐다”고 반박하고, 강태식은 “변경 지시는 나중에 들었다”고 말한다.

플레이어는 안전팀에 바로 요구된 사실확인·조치사진·보고에 대응해야 한다.

- `report_one_sided`: 원도급 요구대로 협력사 관리 미흡으로 우선 보고.
- `report_defensive`: 공정팀 변경지시가 원인이라고 협력사 입장 중심으로 보고.
- `report_verify_timeline`: 조회내용, 통화시각, 지시 전달, 조치사진 시각을 먼저 대조.

### REPORT_RETURN — e01_08f_report_return
앞선 보고 방식이 자동 결과로 돌아온다.

- 한쪽 귀책으로 급히 보고: 이후 아침 조회와 변경지시 자료가 함께 확인돼 **수정보고 요청**, `report_result=correction_required`.
- 협력사 방어 중심 보고: 원도급에서 통화기록·전달시각·조치 전후 사진을 요구해 **근거자료 제출 상태**, `report_result=evidence_requested`.
- 시간대조: 아침 조회와 이후 변경지시가 달랐고, 변경내용이 반장에게 제때 전달된 기록도 없음을 확인. **변경지시 전달 누락 + 현장통제 미흡의 복합 원인**으로 정리, `report_result=timeline_confirmed`.

이 체인은 어느 조직의 말이 자동으로 정답이 되지 않게 한다. 플레이어가 해야 할 일은 **누가 큰소리치는지 고르는 것이 아니라, 누가 언제 무엇을 알고 어떤 지시가 실제 현장에 전달됐는지를 재구성하는 것**이다.

## 콘텐츠 조립

- 기본 이벤트: `content/episode01/events.json`
- 보고 후폭풍: `content/episode01/consequence-events.json`
- 감리 체인: `content/episode01/inspection-events.json`
- 책임공방: `responsibility-clash-event.json`, `report-return-event.json`
- 추가 캐릭터/관계: `inspection-*`, `responsibility-*`
- `src/content/episode01-consequences.ts`가 REACTIONS 뒤에 후속 이벤트를 순서대로 삽입하고 `e01_09_evening`을 REPORT_RETURN 완료 뒤로 게이트한다.

## 주요 flag

- `reporting_return_state`: `reinforced | suppressed | missed`.
- `inspection_action`: `full_stop | quick_photo | sequence`.
- `inspection_pushback`: `schedule_blame | move_on | coordinated`.
- `inspection_result`: `accepted | rework_after_reinspection | accepted_after_sequence`.
- `inspection_closed`: 재확인 체인 종료 여부.
- `report_basis`: `one_sided | defensive | timeline`.
- `report_result`: `correction_required | evidence_requested | timeline_confirmed`.
- 기존 공정/진입/PSI seed/저녁 flag는 유지한다.

## 대표 headless 기본값

기존 4개 대표 경로와 45개 낮 판단 조합은 감리 선택 `inspection_sequence_agreement`, 책임공방 선택 `report_verify_timeline`을 기본값으로 사용한다. 감리 3개 분기는 `tests/episode01-inspection.test.ts`, 책임공방 3개 분기는 `tests/episode01-responsibility.test.ts`에서 별도로 검증한다.

## 캐주얼 전략/현장 현실감 연결

StrategyView는 엔진 상태를 읽기 전용으로 투영한다. 감리 장면에서는 감리·검측 압박/공정 압박/책임 공방을, 책임공방 장면에서는 **원도급·협력사 주장 충돌 / 지시 변경 추적 / 서류-현장 괴리**를 동시에 표시한다. 오승재는 기존 현장 작업자와 겹치지 않는 별도 위치에 표시된다.

현장 현실성 기준은 `docs/FIELD-REALISM.md`를 따른다.

## 검증 상태

TASK-004 시점 기록은 `npm test` 197 PASS, `npm run typecheck` PASS, `npm run build` PASS였다.

TASK-007~008C에서 StrategyView/UI/현실성/후속 결과/감리/책임공방 테스트를 추가·갱신했다. 현재 연결된 GitHub 저장소에는 자동 CI 체크가 없어 이 브랜치의 최신 `npm test`, `npm run typecheck`, `npm run build` 실행 결과는 아직 확보하지 못했다. 따라서 최신 PASS 수는 임의로 기재하지 않는다.
