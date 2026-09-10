# TASK-002A — Core Engine Hardening

브랜치: astra/task-002-core-engine. main merge 및 TASK-003 진행 없음.

## 변경 계약

- ContentBundle.relations는 RelationDefinition[]이다. 각 정의의 initial_state에 relationship_values/trust/respect/reporting/flags를 명시한다. history는 정의에서 허용하지 않고 createRun이 회차마다 새 빈 배열을 생성한다. Runtime 수치·객체는 복사되며 역방향 관계는 독립적이다.
- CharacterDefinition.initial_state의 morale/fatigue/availability/revealed_fields는 필수다. story_flags는 선택값이며 생략은 초기 플래그 없음({})을 의미한다. 숫자 기본값은 없다. createRun의 character_runtime 옵션을 제거했고 NPC 추가는 JSON 정의만으로 반영된다. 선택된 플레이어의 기존 초기화 계약은 유지한다.
- occurrence_history는 발생/시작, completion_history는 정상 완료, choice_history는 선택 기록이다. completion 레코드는 instance_id/event_id/completed_at을 가진다. event_completed는 completion_history만 읽고 같은 인스턴스를 중복 계산하지 않는다. 실제 기록 작성기는 추가하지 않았다.
- 관계 조건/효과의 참조 검사에서 캐릭터 ID뿐 아니라 정확한 from_id→to_id RelationDefinition을 확인한다. 역방향만 있는 경우 실패한다. 중첩 조건·후속 조건·숨김/실패 효과도 기존 순회 경로를 통해 동일하게 검사한다.

## 호환성 / 남은 범위

기존 테스트는 제거하지 않고 승인된 데이터 계약에 맞춰 fixture와 assertion을 갱신했다. RNG 알고리즘·seed 소비·효과 엔진은 변경하지 않았다. 본편 수치나 콘텐츠는 추가하지 않았다.

이전 형식의 관계 JSON과 initial_state 없는 Character JSON은 이제 검증에서 거부된다. 기존 Runtime 스냅샷에는 completion_history 필드가 필요하며, occurrence를 완료로 자동 승격하지 않는다. 실제 세이브 마이그레이션은 이번 범위 밖이다. 완료 기록 작성 시점은 TASK-003에서 구현할 사항이다.

## 검증

- npm test: PASS, 5개 파일 / 75개 테스트(기존 66개 유지 + 신규 9개).
- npm run typecheck: PASS, 전체 프로젝트 및 React/DOM 없는 엔진 전용 검사.
- npm run build: PASS.
- 100 NPC 데이터 초기화, 정의/회차 참조 분리, 정방향·역방향 검증, 발생/완료 분리, JSON round trip과 기존 RNG 기준 시퀀스 통과.
