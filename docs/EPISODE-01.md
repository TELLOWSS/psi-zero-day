# EPISODE 01 — 첫 타설

상태: **Vertical Slice + Casual Strategy/Field Realism integration in progress**. 현재 작업 브랜치 `astra/task-007-casual-strategy-foundation`.

## 핵심 출연진

PLAYER(현장 안전관리자), 강태식(형틀반장·52), 윤성호(철근반장·48), 이재훈(공사대리·33), 임준호(신입근로자·23), 최민석(크레인 신호수·39). 실존 회사·현장·인물을 직접 사용하지 않는다.

## 이벤트 흐름

ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL(임준호를 따라간 경우) → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → **REPORTING_RETURN** → EVENING → NEXT_DAY_TEASE.

`REPORTING_RETURN(e01_08a_reporting_return)`은 TASK-008A에서 추가된 지연 결과 장면이다. 플레이어에게 새 정답 문제를 제시하지 않는다. 앞선 선택을 기존 condition/flag/relationship 규칙으로 판정해 활성 선택지 하나만 남기고, headless driver와 EpisodeSession이 그 선택을 자동 처리한 뒤 결과 장면만 보여준다.

`content/episode01/consequence-events.json`에 후속 사건을 별도 보관하며 `src/content/episode01-consequences.ts`가 기존 이벤트를 보존한 채 REACTIONS 뒤에 삽입한다. 기존 `e01_09_evening`은 REPORTING_RETURN 완료 이후에만 진입하도록 조립 단계에서 게이트된다. CoreEngine 규칙은 변경하지 않는다.

## 첫 번째 지연 관계 체인

임준호의 초기 신호에 대한 대응이 작업이 끝난 뒤 다시 관계 결과로 돌아온다.

- `follow_junho → listen_more`: 보고 관계가 기존 36에서 **40**으로 추가 강화되고 `reporting_return_state=reinforced`.
- `follow_junho → dismiss`: REACTIONS 시점에는 reporting 28이어서 긍정 반응이 가능하지만, 이후 결과 장면에서 **22**로 하락하고 `reporting_return_state=suppressed`.
- 임준호를 따라가지 않음: 관계값을 억지로 감점하지 않고 기존 20을 유지하되 `reporting_return_state=missed`로 기록.

이 구조의 목적은 ‘올바른 안전 선택 = 즉시 점수 획득’이 아니라 **사람이 다음에 위험을 말할지 말지에 앞선 대응이 영향을 준다**는 현장 관계를 게임 상태로 남기는 것이다. 향후 에피소드에서는 이 flag/관계 상태를 조건으로 재보고, 재지적, 작업중지 협조, 책임 공방 같은 후속 사건을 연결할 수 있다.

## 기존 주요 흐름

JUNHO_SIGNAL은 `followed_junho`일 때만 진입하며 이 경우 COMMAND는 신호 이벤트 완료를 기다린다. COMMAND는 경사로 대응과 진입 통제를 서로 다른 CHOICE 노드에서 처리한다. 네 NPC를 selector로 바인딩하고 context_relation으로 NPC → PLAYER 관계를 변경한다.

PUMP_ARRIVAL은 RELATION_CONFLICT → BEST_CONTROL → NEAR_MISS → CONTROLLED_DELAY 우선순위로 배타 분기한다. FIRST_POUR 완료 시 FOUNDATION progress만 +4. REACTIONS는 강태식 trust 38, 윤성호 respect 33, 임준호 reporting 28을 경계로 다른 text_id를 출력한다.

## 주요 flag

- `delegated_cleanup_kang`, `negotiated_rebar`, `schedule_first`, `followed_junho`: PLAN_BREAKS 선택.
- `junho_opened_up`, `ramp_signal_known`: 임준호의 이야기를 충분히 들은 경우.
- `ramp_verified`, `direct_ramp_check`, `minseok_checked_ramp`, `ramp_unverified`: 경사로 판단.
- `entrance_controlled`, `pump_delayed`, `relation_conflict`: 진입 통제 판단.
- `pump_result`, `first_pour_completed`, `episode01_completed`: 결과·타설·에피소드 완료.
- `reporting_return_state`: `reinforced | suppressed | missed`. TASK-008A의 지연 관계 결과.
- `evening_rest`, `evening_family`, `evening_study`, `evening_field_note`: 저녁 선택.
- `psi_seed_day01`: FIELD_NOTE를 선택한 경우에만 true.

## 대표 4개 headless 경로

- A: follow_junho → listen_more → ask_minseok → assign_crew → BEST_CONTROL → **REPORTING_RETURN reinforced** → field_note.
- B: negotiate_yoon → check_self → request_delay → CONTROLLED_DELAY → **REPORTING_RETURN missed** → study.
- C: coordinate_schedule → keep_schedule → assign_crew → NEAR_MISS → **REPORTING_RETURN missed** → family. 인명사고 없음.
- D: delegate_kang → check_self → force_clear → RELATION_CONFLICT → **REPORTING_RETURN missed** → rest.

`tests/helpers/episode01-playthrough.ts`는 실제 Registry 데이터와 CoreEngine 명령만 사용한다. TASK-008A 이후 `tests/episode01-consequence.test.ts`가 reinforced/suppressed/missed 세 갈래와 최종 reporting 값을 별도로 검증하며, `tests/episode01.test.ts`의 대표 경로 및 45개 도달 가능한 낮 판단 조합에도 새 자동 결과 선택을 포함했다.

## 캐주얼 전략/현장 현실감 연결

StrategyView는 기존 엔진 상태를 읽기 전용으로 투영한다. 위험신호, 캐릭터 위치, 현장 압박을 UI에서 보여주지만 결과 계산은 하지 않는다. REPORTING_RETURN 장면에서는 `지난 판단의 여파`가 현장 압박 카드에 나타나며, “위험은 지나가도 사람은 기억한다”는 관계 후폭풍을 표현한다.

현장 현실성 기준은 `docs/FIELD-REALISM.md`를 따른다. 이후 감리 지적·재지적, 임시조치 불인정, 공정팀 반발, 협력업체/원도급 책임공방, TBM과 실제 작업의 괴리, 근로자 보고 위축 등을 같은 방식의 후속 결과 체인으로 확장한다.

## 검증 상태

TASK-004 시점 기준 기록은 `npm test` 197 PASS, `npm run typecheck` PASS, `npm run build` PASS였다.

TASK-007~008A에서는 신규 StrategyView/UI/현실성/후속 결과 테스트를 추가했다. 현재 연결된 GitHub 저장소에는 자동 CI 체크가 없어 이 브랜치의 최신 `npm test`, `npm run typecheck`, `npm run build` 실행 결과는 아직 확보하지 못했다. 따라서 최신 PASS 수를 문서에 임의로 기재하지 않는다.
