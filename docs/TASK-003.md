# TASK-003 — Event Runtime Engine

브랜치: astra/task-003-event-runtime. main 수정/merge 및 TASK-004 진행 없음.

## 실행 데이터와 진입점

- 기존 EventDefinition의 dialogue/choices/participants 필드를 확장했다. 별도 그래프 복제나 새 프레임워크는 없다. `runtime` 정책이 없는 기존 데이터는 콘텐츠 검증·조회에 사용할 수 있지만 이벤트 후보에는 포함하지 않는다.
- 실행할 데이터에는 runtime.chapter_id/trigger/repeat_policy/required_flags/selection_policy/missing_participant_policy와 모든 노드의 type을 명시한다. createRun의 선택적 chapter_id로 회차의 현재 챕터를 설정하며, 챕터 미지정 회차에서는 이벤트를 시작하지 않는다. 챕터 진행 공식은 구현하지 않았다.
- EventInstance는 active_instance로 보관한다. 종료 시 finished_instances에 보존하고 active_instance와 presentation_resume을 정리한다. 시작은 ACTIVE, 정상 END는 COMPLETED, 실패는 FAILED, 취소는 CANCELLED다. PENDING은 타입에 예약했으며 별도 대기 인스턴스 시스템은 만들지 않았다.
- CoreEngine.dispatch의 start_event / advance_event / choose_event / cancel_event만 추가했다. advance/choose에는 instance_id와 요청 당시 node_id가 필수다. 재전송·과거 노드 요청은 오류이며 상태는 유지된다. 종료한 instance_id도 재사용할 수 없다.

## 후보와 참가자

eventCandidates(state, content, chapter_id)는 현재 회차 챕터, 조건, 필수 플래그, 발생 이력 기반 반복 제한, 참가자 availability와 예약 여부를 검사한다. selectEventCandidate는 명시된 priority 내림차순, event_id와 source_followup_id의 안정적인 오름차순으로 정렬된 첫 후보를 반환한다. 확률·가중치·RNG 소비는 없다. 동일 입력과 seed는 동일 결과다.

참가자는 character_id 또는 selector 중 하나로 정의한다. selector의 role_text_id/trade_text_id/nationality_text_id는 기존 정의의 ID와 비교한다. stats와 incoming/outgoing 관계 조건을 함께 검사한다. TASK-003A부터 구조적으로 가능한 directed relation 후보가 하나도 없으면 콘텐츠 검증에서 거부한다. 서로 다른 역할은 기본적으로 다른 캐릭터를 사용하며 runtime.allow_reuse=true인 경우에만 재사용한다. pinned 역할, 고정 character_id, 동적 selector 순으로 배정하고 각 그룹은 선언 순서를 유지한다. 동적 후보는 ID순으로 선택한다.

시작 시 바인딩을 고정한다. 진행 중 availability가 달라져도 자동 대체하지 않는다. 시작 시 참가자가 없으면 명시된 exclude는 시작 거부, fail은 FAILED 기록을 남긴다. 시작하지 못한 경우 occurrence/completion은 남기지 않는다. NPC 생성이나 기본 수치를 추가하지 않는다.

## 그래프와 효과

- DIALOGUE: text_id/speaker_role_id/next_node_id. advance_event로 다음 노드 이동.
- CHOICE: choice_ids로 기존 choices 목록을 참조. 각 선택의 requirements를 다시 검사한 뒤 효과·선택 기록·다음 노드를 한 트랜잭션으로 처리.
- RESULT: text_id, 선택적 effects/presentation_cues, next_node_id. 진입 시 효과를 적용하고 표시 상태에서 멈춘다.
- END: 명시된 completed/failed 결과와 선택적 final effects. 진입한 명령 안에서 원자적으로 종료한다.

그래프의 참조·도달 가능성·노드 구조·효과 ID 유일성·순환을 콘텐츠 로딩 시 검사한다. 같은 choice_id는 한 노드에만 연결한다. 런타임에서도 방문 노드 재진입과 정의 노드 수 초과를 차단한다. 순환형 대화를 암묵적으로 허용하지 않는다.

각 전이는 기존 applyEffectBundle을 사용한다. choice effects와 선택 이력을 적용한 직후 failure_conditions를 검사하여 실패하면 target RESULT/END에 진입하지 않는다. 실패가 아니면 노드 효과를 적용하고 다시 실패 조건을 검사한다. failure_conditions는 비어 있으면 비활성, 비어 있지 않으면 모두 만족할 때 실패다. 효과·예약·실패 처리 중 오류가 발생하면 해당 명령의 모든 이력·상태·ledger를 되돌린다.

instance.applied_effect_ids는 전이에서 추가된 기존 전역 ledger 키를 보존한다. 효과/예약 ID는 정의 안에서 유일해야 한다. TASK-003A에서 context_stat/context_relation/context_reveal과 player/character/participant 참조를 추가했다. 고정 Character ID primitive도 유지한다. 선택 요구사항·failure_conditions는 현재 인스턴스, follow-up 조건은 저장된 source 바인딩으로 평가한다. Event top-level 조건은 participant 참조를 허용하지 않는다.

## 이력·후속 예약·복원

시작 성공 시 occurrence_history 1회, 선택 성공 시 choice_history, 정상 END 시 completion_history 1회를 기록한다. FAILED/CANCELLED는 정상 completion으로 기록하지 않는다.

due 후보는 source_followup_id로 일반 후보와 구분한다. 시작 시 다시 due/조건/반복/챕터/참가자를 검사하며 pending→running으로 전환한다. 완료는 completed, 실패/취소는 기존 Scheduler의 cancelled로 종결하고 상세 결과는 EventInstance에 보존한다.

예약의 같은 역할 바인딩을 우선 고정한다. 기존 역할에 고정된 NPC가 불가용하면 다른 NPC로 바꾸지 않는다. 원본 전체 바인딩은 source_participant_bindings, 현재 이벤트 역할은 participant_bindings에 둔다. source_instance_id/source_choice_id/due_at도 복사한다. 새 역할은 해당 정의에 따라 바인딩한다.

due 예약 시작 요청이 미충족이면 defer는 pending과 기한을 그대로 유지, cancel은 cancelled, fail은 cancelled와 FAILED 인스턴스를 남긴다. TASK-003A부터 미충족 cancel/fail 예약도 eventCandidates에 resolution 필드와 source_followup_id로 노출된다. 호출자는 후보 정보를 기존 start_event에 전달하여 처리하며 내부 예약 배열을 해석할 필요가 없다. defer는 실행 후보에서 제외한다. 후보 조회는 읽기 전용이고 재예약 간격·횟수·우선권은 만들지 않는다.

active/finished instance, 현재/방문 노드, 선택, ledger, 예약 연결은 JSON 데이터뿐이다. 직렬화된 GameState로 CoreEngine을 다시 만들면 같은 노드에서 이어진다. eventPresentation은 읽기 전용이며 효과를 재적용하지 않는다. 과거 스냅샷에는 새 EventInstance 구조와 finished_instances/chapter_id가 필요하다. 외부 SaveEnvelope 마이그레이션은 이번 범위 밖이다.

## Presentation 경계

명령 결과의 presentation과 eventPresentation은 SHOW_DIALOGUE/SHOW_CHOICE/SHOW_RESULT 및 SCENE_CHANGE/CHARACTER_ENTER/CHARACTER_EXIT/CG_CHANGE/AUDIO_CUE 순수 데이터를 반환한다. CHOICE는 현재 요구사항에 따른 enabled를 포함한다. 실제 UI/Phaser/오디오 객체는 생성하지 않는다. 복원 시 일회성 cue의 실제 재생 여부는 이후 Presentation 계층에서 결정한다.

## 검증 / Director Review

- TASK-003 시점: 기존 75개 + 신규 22개 = 97개 테스트 PASS. TASK-003A의 최신 결과는 [보강 기록](TASK-003A.md)에 기재한다.
- npm run typecheck PASS: 전체 + React/DOM 없는 엔진 전용 검사.
- npm run build PASS.
- 다단계 판단, 재입력 차단, 원자적 완료, source 바인딩 보존, JSON resume, 잘못된 참조·순환 차단 검증.
- 본편 chapter/반복/priority/참가자 정책은 콘텐츠별 명시 입력으로 남긴다. 이번 synthetic fixture 값은 본편 기획이 아니다. 실제 콘텐츠·UI·확률 공식·TASK-004는 추가하지 않았다.
