# TASK-002 — Core Rule Engine

작업 브랜치: `astra/task-002-core-engine`. Foundation 구조와 기존 테스트를 유지하고 순수 TypeScript 엔진만 추가했다. UI/Phaser/본편 콘텐츠/Android는 변경하지 않는다.

## 진입점과 상태 소유

`ContentRegistry.getValidatedContent()` → `createRun(content, options, bounds)` → `new CoreEngine(state, content, bounds)` 순서다. Registry가 만든 검증 타입을 통해 콘텐츠 입력 경계를 표시한다. engine은 Zod/React/DOM/저장소를 import하지 않는다.

초기화는 run_id, seed, rules_version, playthrough, clock, 플레이어 기본 수치, NPC morale/fatigue/availability/공개 정보, 공정 초기값·범위, audio 설정을 명시적으로 받는다. 정의에서 stats/experience/traits/weaknesses와 초기 관계를 복사한다. seed로 능력치 보정이나 게임 공식을 만들지 않는다. 같은 콘텐츠·설정·seed에서 같은 결과를 반환한다.

선택한 플레이어 정의의 stats는 PlayerState만 소유하고 characters에는 NPC만 담는다. 기존 `stat` 연산이 플레이어 ID를 가리키면 PlayerState.stats를 사용하여 중복 상태를 만들지 않는다. NPC 정보 해금은 revealed_fields에 저장한다. Career/Dark Path/PSI는 계산하지 않는다.

`CoreEngine.getState()`는 깊게 동결된 스냅샷이다. `dispatch`는 advance_slot / apply_effects / followup_status / draw_random만 처리한다. 성공 후 한 번 상태를 교체하며 실패하면 이전 스냅샷을 유지한다. RNG는 seed/state만 저장하고 객체·함수는 GameState에 넣지 않는다.

## 규칙 primitive

- Clock: PRE_WORK → MORNING → AFTERNOON → EVENING → 다음 DAY PRE_WORK. day는 기존 스키마와 같은 1 이상 정수이고 안전한 정수 범위를 검사한다. display_time은 계산하지 않는다. 주/월 없음.
- Condition: 기존 all/any/not/flag/stat/event_completed를 유지하고 player_stat/relation/construction_stage/construction_progress/choice_selected/compare/flag_compare를 추가했다. eq/ne는 타입이 같은 숫자·문자열·불리언, 순서 비교는 유한 숫자에 적용한다. 누락·타입 불일치는 false. 빈 all=true, any=false. 조건은 상태를 수정하지 않는다.
- History: 기존 occurrence_history를 event_completed의 기록 원천으로 사용한다. choice_selected는 occurrence_history의 event_id와 choice_history의 instance_id를 연결한다. 동일 인스턴스 중복 기록은 한 번만 센다. 이 TASK는 이력 작성이나 실제 이벤트 완료 처리를 하지 않는다.
- Effects: player_stat/stat/relation/flag/flag_change/reveal/construction_progress와 기존 EffectBundle.followup_events를 실행한다. flag_change는 기존 숫자 플래그의 delta 변경이다. 없는 stat/관계/숫자 플래그에 임의 기준값을 생성하지 않는다.
- 관계: from_id→to_id 정확한 한 레코드만 변경한다. trust/respect/reporting 이외 공식·자동 역방향 변화는 없다.
- 공정: bounds의 min/max를 호출자가 제공해야 한다. 범위 초과·비유한 결과는 실패하며 자동 clamp·단계 전환을 하지 않는다. 테스트의 0~100은 fixture 전용이다.

## 원자성과 재입력

효과 묶음을 복사한 상태에서 처리한다. 순서는 immediate → hidden → relationship → stat → flags → ending_flags → followup이다. 배열 내부는 데이터 순서다. 숫자 delta는 순서대로 적용하며 실패하면 앞선 변경도 모두 폐기한다. RNG·예약·idempotency ledger도 원본에 남지 않는다.

ledger 키는 `[run_id, event_id, event_instance_id, namespace, local_id]`의 JSON 문자열이다. 동일 이벤트 인스턴스의 effect_id는 묶음 이름을 바꿔도 다시 적용되지 않는다. 별도 bundle 완료 마커로 전체 재입력을 차단한다. 서로 다른 이벤트 인스턴스에서는 같은 정의의 효과를 다시 사용할 수 있다. 호출자는 재시도에 동일한 event_instance_id/bundle_id를 사용해야 한다. 묶음 안의 중복 effect/followup ID는 오류다.

내용 검증과 TypeScript 계약을 통과한 데이터를 사용한다. CoreEngine 생성은 콘텐츠 버전·시계·RNG 및 JSON 보존 가능 데이터를 확인하지만, 외부 세이브 파일용 전체 GameState 스키마/마이그레이션을 대신하지 않는다.

## 예약 구조와 호환성

기존 FollowUpEvent.created_at/due_at/participant_bindings/status를 유지한다. `followUpTiming()`으로 created_day/due_day/due_slot(optional)을 조회하므로 같은 날짜 필드를 중복 저장하지 않는다. 명시 slot이 없으면 해당 DAY의 첫 slot부터 due다. 0 DAY 예약도 가능하고 지난 slot을 다음 DAY로 임의 보정하지 않는다.

dueFollowUps는 기한이 도래한 pending 항목을 시간·인스턴스 키 순으로 조회한다. 조건·availability·unmet_policy는 예약에 보존만 하고 평가/자동 실행하지 않는다. status는 명시 명령으로 pending→running/cancelled/expired, running→completed/cancelled로 바꾸며 완료·취소·만료를 재개하지 않는다. 동일 status 명령은 no-op이다.

TASK-002의 대문자 공정 ID는 CORE_STAGES로 추가했다. TASK-001의 Foundation/Basement/Low Rise/Typical Floor/High Rise/Roof/Completion 명칭과 저장 필드는 유지하며 canonicalStage가 대응시킨다. 한 공정을 옛/새 키로 중복 입력하면 실패한다. 기존 공정 상태를 자동 변환하거나 저장 버전을 임의로 바꾸지 않는다.

이벤트 자체의 효과도 예약할 수 있도록 source_choice_id를 선택값으로 확장했다. 기존 선택지 기반 예약은 동일하게 유지한다.

## Director 확인 / 다음 범위

본편 초기값, 공정 수치 단위·범위, 정보 field_id 사전, 관계 누락 시 기준값, 예약 미충족 정책의 실제 처리, 이벤트 완료 기록 시점은 여전히 미확정이다. 현재 엔진은 명시 입력과 기존 필드 호환으로 처리한다. 성장/엔딩 공식·자동 공정 전환은 구현하지 않는다. TASK-003을 시작하지 않는다.

## 검증

- npm install: PASS. 기존 의존성 유지.
- npm test: PASS, 총 66개(기존 TASK-001 33개 + Core 33개).
- npm run typecheck: PASS, 전체 프로젝트 + ES2022만 사용하는 엔진 전용 검사.
- npm run build: PASS.
- npm run dev: PASS, 127.0.0.1:5173 기동.
- agent-browser: 기존 한국어 부팅 화면 표시, page/console 오류 없음. 게임 UI는 변경하지 않음.
- 기존 정상 fixture/잘못된 참조 검증, JSON/RNG 복원, 명령 스냅샷 불변성, 실패 시 같은 스냅샷 유지, 반복 예약·효과 차단을 검증했다.
