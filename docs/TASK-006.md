# TASK-006 — NPC Relationship & Dialogue Runtime

## 관계 모델

회차의 `GameState.relations`가 유일한 원본이다. NPC → player 관계를 TRUST / RESPECT / REPORT / COMPLIANCE로 조회하며 기존 필드 trust / respect / reporting에 compliance를 추가했다. player → NPC와 다른 방향 관계는 독립적으로 유지한다. UI는 값을 별도로 저장하거나 변경하지 않는다.

Episode manifest의 `relationship_policy`에 범위 0..100, 초기 COMPLIANCE 50을 명시했다. 이는 이번 구현의 조정 가능한 초기 설정이며 Director가 확정한 밸런스 공식이 아니다. 기존 세 관계 초기값과 Episode 효과·조건은 유지했다. 정책이 없는 기존 fixture는 세 필드의 기존 동작을 유지한다.

`getNpcRelationship`, `relationshipValues`, `applyNpcRelationshipDelta`, `clampRelationship`, `inspectRelationshipDeltas`를 제공한다. 기존 atomic effect bundle과 중복 적용 ledger를 사용하며 RNG를 소비하지 않는다. 변경 이력은 요청량·실제 적용량·전후 값과 event/instance/choice/effect ID, day/slot을 기록한다. 범위에 도달한 변경도 실제 적용량 0으로 설명할 수 있다.

## Dialogue runtime

`getDialogueView`는 기존 EventInstance / EventDefinition의 읽기 전용 projection이다. speaker, text_id, portrait asset 또는 character silhouette 참조, 응답 조건·활성 여부·효과·다음 node, 이벤트/실패 조건을 제공한다. 실행은 기존 start_event / advance_event / choose_event 및 Event Runtime이 담당한다. Session은 기존 후보 조회로 다음 이벤트를 선택한다. 별도 대화 상태 시스템이나 React 내부 그래프를 만들지 않았다.

선택 노드의 speaker_role_id도 사용하여 응답 버튼과 NPC 이름·역할·인물 카드를 함께 표시한다. Session이 새 관계 delta를 snapshot의 일시적 피드백으로 제공하고 다음 명령에서 갱신한다. 정상 화면에는 변경량만 표시하며 전체 값은 개발용 읽기 전용 Debug panel에서 확인한다. Debug에는 관계 이력, 대화 조건·효과, 현재 세션 정보도 포함한다. 화면 문자열은 playable-ko localization key를 사용한다.

## Episode 01 연결

- 첫 상호작용과 기존 임준호의 두 응답을 연결했다. 경청과 일단 작업부터 보자는 선택은 기존 보고 관계에 서로 다른 결과를 남긴다.
- 강태식에게 위임하거나 윤성호와 협의한 이전 선택은 기존 강태식의 후반 반응 분기를 유지한다.
- 관계 피드백은 에피소드 완료 전에 표시된다. 강제 진입로 정리의 두 음수 변화도 표시한다.
- events.json 변경은 계획 선택의 이재훈, 임준호 응답 선택의 speaker_role_id 두 개뿐이다. 기존 대사·효과·임계값·경로는 변경하지 않았다. 콘텐츠 버전은 ep01.relationship.v1이다.

## 저장 경계와 검증

관계와 대화 실행 상태는 JSON 데이터다. `serializeRelationships` / `restoreRelationships`는 관계 목록을 검증하고 동결된 복사본을 반환한다. 복원 시 방향별 정의의 누락·중복, 정책 범위, NPC 및 이벤트/선택 참조, 중복 effect source, 이력의 전후 값·clamp 계산·최종 값 일치를 검사한다. 기존 세 필드 관계도 정책 없는 콘텐츠에서 왕복 가능하다.

콘텐츠 로딩은 잘못된 NPC/노드/portrait 참조, 범위를 벗어난 초기 관계, 정책 없는 COMPLIANCE 사용을 거부한다. 관계 codec은 전체 SaveEnvelope의 인증·마이그레이션이나 전체 GameState 검증을 대체하지 않는다.

## 변경 파일

- `src/domain/{relationships,common,content,index}.ts`: 관계 정책·delta·canonical 타입.
- `src/engine/{relations,npc-relationships,dialogue,effects,initialize,index}.ts`: 조회·변경·이력·대화 projection과 기존 효과 연결.
- `src/content/{schemas,validate-references}.ts`, `src/persistence/relationships.ts`: 입력·참조·복원 검증.
- `src/app/episode-session.ts`, `src/ui/{PlayableEpisode,DebugPanel,VisualSlot}.tsx`, `src/ui/playable.css`: snapshot, NPC 응답 표시, 관계 피드백, Debug.
- `content/episode01/{manifest,events}.json`, `content/localization/playable-ko.json`: 명시적 정책·speaker·표시 문자열.
- `tests/npc-relationship.test.ts`, `tests/npc-dialogue-ui.test.tsx`: 신규 회귀 검증. README와 본 문서에 상태 기록.

## 테스트 결과

- `npm test`: **12개 파일, 248개 PASS**. 기존 TASK-001~005의 214개 테스트를 수정·삭제하지 않고 runtime 27개와 UI 7개를 추가했다.
- `npm run typecheck`: PASS. 별도 engine 검사도 React/DOM 없이 통과했다.
- `npm run build`: PASS.
- Runtime: 초기값, 네 지표 양수/음수 clamp, 방향성, 중복 차단·atomic rollback, 조건·응답 결과, 이후 반응, 동일 입력 replay/RNG 유지, JSON 왕복/재개, 잘못된 참조와 복원 데이터 검증.
- UI: NPC 응답 카드, 일시적 양수/음수 피드백, 이전 선택별 후반 반응, Debug 읽기 전용, 재시작 검증.
- 실제 dev 브라우저: 1280×720·854×393에서 임준호 응답 카드 및 보고 +8 피드백을 확인했다. 다음 진행 시 이전 피드백이 해제되며 페이지 오류는 없었다.

## 한계와 후속 범위

COMPLIANCE primitive와 조건·이력은 지원하지만 Episode 01에 새 COMPLIANCE 효과나 임계값은 만들지 않았다. 범위와 초기값은 Director 밸런스 검토 대상이다. 실제 초상화가 없으면 기존 silhouette을 사용한다. 전체 저장/로드 제품, 저장 버전 마이그레이션, 브라우저 저장, Phaser, 추가 DAY, TBM/Near Miss 및 새 게임 공식은 구현하지 않았다. main merge 및 다음 TASK는 수행하지 않았다.
