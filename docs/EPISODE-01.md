# EPISODE 01 — 첫 타설

상태: **Vertical Slice Content v1 implemented**. 작업 브랜치 `astra/task-004-episode01-content`. 목표 플레이타임은 약 15분이며 실제 플레이 시간은 UI 없이 측정하지 않았다.

## 핵심 출연진

PLAYER(현장 안전관리자), 강태식(형틀반장·52), 윤성호(철근반장·48), 이재훈(공사대리·33), 임준호(신입근로자·23), 최민석(크레인 신호수·39). 추가 출연진 없음.

## 이벤트 흐름

ARRIVAL → MEET_KANG → PLAN_BREAKS → JUNHO_SIGNAL(임준호를 따라간 경우) → COMMAND → PUMP_ARRIVAL → FIRST_POUR → REACTIONS → EVENING → NEXT_DAY_TEASE.

`content/episode01/manifest.json`의 bundle 정보와 characters/relations/events/ko JSON을 `src/content/episode01.ts`의 `createEpisode01Registry()`가 실제 ContentBundle로 조합·검증한다. 기존 manifest와 ko 데이터를 확장했으며 대문자 원본 식별자를 보존하고 실제 ID는 소문자로 대응한다.

10개 이벤트를 이전 completion과 flag로 연결한다. JUNHO_SIGNAL은 followed_junho일 때만 진입하며 이 경우 COMMAND는 신호 이벤트 완료를 기다린다. COMMAND는 경사로 대응과 진입 통제를 서로 다른 CHOICE 노드에서 처리한다. 네 NPC를 기존 selector로 바인딩하고 context_relation으로 NPC → PLAYER 관계를 변경한다.

PUMP_ARRIVAL은 RELATION_CONFLICT → BEST_CONTROL → NEAR_MISS → CONTROLLED_DELAY 순서로 상위 조건을 제외한다. 기존 CHOICE requirements를 배타적인 분기 게이트로 사용한다. Headless 드라이버는 유일하게 활성화된 선택을 제출하며 결과를 계산하거나 상태를 직접 수정하지 않는다. 결과 분기와 반응 분기의 선택도 기존 choice_history에 남는다. 새 자동 분기 primitive나 UI 동작은 추가하지 않았다.

FIRST_POUR 완료 시 FOUNDATION progress만 +4. REACTIONS는 강태식 trust 38, 윤성호 respect 33, 임준호 reporting 28을 경계로 다른 text_id를 출력한다. OPENNESS는 승인된 reporting으로 표현한다. 일정 우선 선택은 negotiation +2와 이재훈 respect +4이며 회사평가 전용 필드를 변경하지 않는다.

NPC experience/morale/fatigue와 양방향 초기 관계는 승인값이다. 필요 없는 NPC stat·성격·약점은 추가하지 않았다. 미정 국적·PLAYER 나이는 미정으로 표기한다. CharacterDefinition의 PLAYER experience/morale/fatigue는 createRun이 사용하지 않는 필수 스키마 자리값 0이며 게임 능력 기본값이 아니다. Run의 나머지 플레이어 수치·공정 시작값 10·검증 범위 0~100은 테스트 helper의 명시 입력으로만 둔다. 공정 전환 임계값을 정의하지 않는다.

## 주요 flag

- `delegated_cleanup_kang`, `negotiated_rebar`, `schedule_first`, `followed_junho`: PLAN_BREAKS 선택.
- `junho_opened_up`, `ramp_signal_known`: 임준호의 이야기를 충분히 들은 경우.
- `ramp_verified`, `direct_ramp_check`, `minseok_checked_ramp`, `ramp_unverified`: 경사로 판단.
- `entrance_controlled`, `pump_delayed`, `relation_conflict`: 진입 통제 판단.
- `pump_result`, `first_pour_completed`, `episode01_completed`: 결과·타설·에피소드 완료.
- `evening_rest`, `evening_family`, `evening_study`, `evening_field_note`: 저녁 선택.
- `psi_seed_day01`: FIELD_NOTE를 선택한 경우에만 true.

## 4개 headless 경로

- A: follow_junho → listen_more → ask_minseok → assign_crew → BEST_CONTROL → field_note.
- B: negotiate_yoon → check_self → request_delay → CONTROLLED_DELAY → study.
- C: coordinate_schedule → keep_schedule → assign_crew → NEAR_MISS → family. 인명사고 없음.
- D: delegate_kang → check_self → force_clear → RELATION_CONFLICT → rest.

`tests/helpers/episode01-playthrough.ts`가 실제 Registry 데이터와 CoreEngine 명령만 사용한다. 네 경로의 전체 발생·완료·선택 이력, 관계 수치와 방향, 전체 flag, 공정 +4, 반응 text_id를 검사한다. 동일 seed 재실행 및 매 명령 후 JSON 저장/복원 결과가 동일하며 effect 중복이 없다. 총 45개 도달 가능한 낮 판단 조합을 끝까지 실행하여 결과 공백·중복과 우선순위를 검사한다.

Headless 시간 입력은 E03 오전, E07 오후, E09 저녁, E10 DAY 02 PRE_WORK로 명시하여 advance_slot 명령으로 진행한다. 콘텐츠의 실행 자격은 요청대로 completion/flag 기반이며 별도 시각 조건은 도입하지 않는다. E10은 다음 날 암시 문장과 완료 flag만 실행한다.

## PSI seed 처리

FIELD_NOTE의 기록 문장은 ko locale의 `ep01.evening.field_note.record`에 원문 그대로 보존했다. 숨은 psi_seed_day01=true와 analysis +1만 반영한다. 다른 저녁 선택은 seed를 설정하지 않는다. STUDY는 learning +1. 모든 경로에서 PSI/Ending Runtime은 초기 상태를 유지하며 표시 텍스트에 PSI 기능·점수·명칭이나 GOOD/BAD 결과 표기를 넣지 않는다.

## 테스트 결과

- `npm test`: 8개 파일, **197개 PASS**(기존 128개 + Episode 01 신규 69개).
- `npm run typecheck`: PASS. 기존 React/DOM 없는 엔진 검사도 유지.
- `npm run build`: PASS.
- 실제 콘텐츠의 character/relation/event/node/choice/text/participant/effect 참조를 고의로 훼손하는 9개 검증 실패 테스트 포함. 기존 테스트와 domain/engine 구현은 수정하지 않았다.
