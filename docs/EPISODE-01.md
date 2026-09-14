# EPISODE 01 — 첫 타설

상태: **Vertical Slice + Casual Strategy/Field Realism integration in progress**. 현재 작업 브랜치 `astra/task-007-casual-strategy-foundation`.

## 핵심 출연진

PLAYER(현장 안전관리자), 강태식(형틀반장·52), 윤성호(철근반장·48), 이재훈(공사대리·33), 임준호(신입근로자·23), 최민석(크레인 신호수·39), 서정민(건축감리·46). 모든 인물과 현장은 가상 복합 설정이며 실존 회사·현장·인물을 직접 사용하지 않는다.

## 이벤트 흐름

ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL(임준호를 따라간 경우) → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → **REPORTING_RETURN** → **INSPECTION_FIND → SITE_PUSHBACK → REINSPECTION** → EVENING → NEXT_DAY_TEASE.

현재 manifest 기준 총 14개 이벤트다. REPORTING_RETURN과 감리 3단계 체인은 기존 CoreEngine primitive만 사용하며 `src/engine/*` 규칙을 변경하지 않는다.

## TASK-008A — 지연 관계 체인

`REPORTING_RETURN(e01_08a_reporting_return)`은 앞선 선택을 condition/flag/relationship으로 판정해 활성 선택지 하나만 남긴 뒤 결과 장면만 보여준다.

- `follow_junho → listen_more`: 보고 관계 36 → **40**, `reporting_return_state=reinforced`.
- `follow_junho → dismiss`: REACTIONS 시점 reporting 28 이후 **22**로 하락, `reporting_return_state=suppressed`.
- 임준호를 따라가지 않음: 기존 20 유지, `reporting_return_state=missed`.

핵심은 “안전 정답을 맞혔다”가 아니라 **앞선 대응이 다음 보고 행동을 바꾼다**는 점이다.

## TASK-008B — 감리 지적/조치/반발/재지적 체인

### 1. INSPECTION_FIND — e01_08b_inspection_find
가상 건축감리 서정민이 통로 정리와 차량/작업자 동선 분리를 지적하고 조치사진을 요구한다. 동시에 이재훈 공사대리는 남은 철근차가 같은 동선을 사용해야 한다고 압박한다.

플레이어 선택:
- `inspection_full_stop`: 차량·작업을 잠시 멈추고 완전 조치. 감리 존중은 오르지만 공사대리 협조는 떨어진다.
- `inspection_quick_photo`: 보이는 부분을 먼저 정리해 사진부터 제출. 당장은 공정팀과 마찰이 적지만 실제 현장 상태가 남는다.
- `inspection_sequence_agreement`: 감리와 순서를 합의해 차량을 먼저 빼고 즉시 정리. 협의 능력과 양쪽 관계를 일부 확보한다.

### 2. SITE_PUSHBACK — e01_08c_site_pushback
앞선 선택에 따라 자동 결과가 돌아온다.

- 전면중지: “조치는 맞지만 지연은 누가 설명하느냐”는 공정 반발.
- 사진 먼저: “사진 보냈으니 일단 넘어가자”는 현장 압력.
- 순서협의: 차량과 정리 인원을 다시 배치하는 조정.

### 3. REINSPECTION — e01_08d_reinspection
감리가 조치사진이 아니라 실제 통로를 다시 확인한다.

- 전면중지: 실제 조치 인정. `inspection_result=accepted`.
- 사진 먼저: 사진 밖 자재가 남아 **재지적·재작업**. `inspection_result=rework_after_reinspection`이며 감리 trust/respect와 공사대리 respect가 함께 하락한다.
- 순서협의: 합의한 순서대로 실제 조치 인정. `inspection_result=accepted_after_sequence`.

이 체인은 감리를 단순 악역으로 다루지 않는다. 감리 지적 자체는 타당할 수 있고, 동시에 공정팀의 일정 압박도 실제 문제로 남는다. 플레이어는 “누가 맞나”보다 **현장을 어떻게 끝까지 닫을 것인가**를 판단한다.

## 콘텐츠 조립

- 기본 이벤트: `content/episode01/events.json`
- 보고 후폭풍: `content/episode01/consequence-events.json`
- 감리 체인: `content/episode01/inspection-events.json`
- 감리 캐릭터/관계: `inspection-characters.json`, `inspection-relations.json`
- 감리 대사: `inspection-ko.json`
- `src/content/episode01-consequences.ts`가 REACTIONS 뒤에 후속 이벤트를 삽입하고 `e01_09_evening`을 REINSPECTION 완료 뒤로 게이트한다.

## 기존 주요 흐름

JUNHO_SIGNAL은 `followed_junho`일 때만 진입한다. COMMAND는 경사로 대응과 진입 통제를 서로 다른 CHOICE 노드에서 처리한다. PUMP_ARRIVAL은 RELATION_CONFLICT → BEST_CONTROL → NEAR_MISS → CONTROLLED_DELAY 우선순위로 배타 분기한다. FIRST_POUR 완료 시 FOUNDATION progress만 +4.

## 주요 flag

- `delegated_cleanup_kang`, `negotiated_rebar`, `schedule_first`, `followed_junho`: PLAN_BREAKS.
- `junho_opened_up`, `ramp_signal_known`: 임준호 신호 대응.
- `ramp_verified`, `direct_ramp_check`, `minseok_checked_ramp`, `ramp_unverified`: 경사로 판단.
- `entrance_controlled`, `pump_delayed`, `relation_conflict`: 진입 통제.
- `reporting_return_state`: `reinforced | suppressed | missed`.
- `inspection_action`: `full_stop | quick_photo | sequence`.
- `inspection_pushback`: `schedule_blame | move_on | coordinated`.
- `inspection_result`: `accepted | rework_after_reinspection | accepted_after_sequence`.
- `inspection_closed`: 재확인 체인 종료 여부.
- `pump_result`, `first_pour_completed`, `episode01_completed`: 결과·타설·완료.
- `evening_rest`, `evening_family`, `evening_study`, `evening_field_note`: 저녁 선택.
- `psi_seed_day01`: FIELD_NOTE에서만 true.

## 대표 headless 기본값

기존 4개 대표 경로와 45개 낮 판단 조합에서는 감리 선택 기본값을 `inspection_sequence_agreement`로 둔다. 감리 3개 분기는 `tests/episode01-inspection.test.ts`에서 별도로 검증한다.

기본 감리 경로에서는 `inspection_sequence_agreement → pushback_sequence → reinspection_accept_sequence`가 이어진다. 이전 안전 판단 결과와 보고 후폭풍은 그대로 유지된다.

## 캐주얼 전략/현장 현실감 연결

StrategyView는 엔진 상태를 읽기 전용으로 투영한다. INSPECTION_FIND에서는 통로 조치 지적 신호와 감리·검측 압박, 공정 압박, 책임 공방이 동시에 표시된다. REINSPECTION에서는 같은 통로를 다시 확인하는 신호가 나타난다. 서정민은 진입 작업자 토큰과 겹치지 않도록 별도 맵 위치에 표시되지만, 통로 위험신호와는 연동된다.

현장 현실성 기준은 `docs/FIELD-REALISM.md`를 따른다.

## 검증 상태

TASK-004 시점 기록은 `npm test` 197 PASS, `npm run typecheck` PASS, `npm run build` PASS였다.

TASK-007~008B에서 StrategyView/UI/현실성/후속 결과/감리 체인 테스트를 추가했다. 현재 연결된 GitHub 저장소에는 자동 CI 체크가 없어 이 브랜치의 최신 `npm test`, `npm run typecheck`, `npm run build` 실행 결과는 아직 확보하지 못했다. 따라서 최신 PASS 수는 임의로 기재하지 않는다.
