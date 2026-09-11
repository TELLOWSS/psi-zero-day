# TASK-003A — Event Context & Binding Hardening

작업 브랜치: astra/task-003-event-runtime. main merge/TASK-004 없음.

- **Contextual reference:** CharacterReference는 player, character(character_id), participant(role_id)를 표현한다. 기존 고정 ID 연산은 유지한다. 없는 컨텍스트·role·실제 캐릭터는 명확한 오류다. 조건의 단락 평가로 오류가 숨지 않도록 사전 검사한다.
- **조건/효과:** context_stat/context_relation 조건과 context_stat/context_relation/context_reveal 효과를 추가했다. 선택 요구사항·실패 조건은 현재 인스턴스, 후속 조건은 source participant_bindings를 사용한다. 효과는 immediate_effects/hidden_effects에 작성하며 적용 직전에 기존 Core 연산의 Character ID로 resolve한다. 기존 전용 stat_effects/relationship_effects 배열 계약은 유지한다. resolve 실패는 묶음 전체 롤백이며 기존 instance/effect ledger 키를 변경하지 않는다.
- **Unique binding:** 기본은 역할별 서로 다른 캐릭터다. runtime.allow_reuse=true만 명시적 재사용을 허용한다. pinned→고정 ID→selector 순으로 예약하고 그룹 안에서는 선언 순서, 동적 후보는 ID순을 사용한다. 복잡한 매칭·확률·자동 대체 없음.
- **Unmet resolution:** due+defer 미충족은 pending 유지 및 실행 후보 제외. cancel/fail 미충족도 eventCandidates에 resolution과 source_followup_id로 노출한다. 기존 start_event가 다시 검사하여 cancel은 cancelled, fail은 cancelled+FAILED 인스턴스로 종결한다. 후보 조회는 읽기 전용이다.
- **Failure ordering:** choice requirements→choice effects→choice history→failure 검사→성공할 때만 target 진입→RESULT/END effects→failure 재검사. 선택으로 실패했다면 target reward를 실행하지 않는다. RESULT가 실패 원인이면 해당 RESULT 효과는 반영한다. 처리 중 오류는 command 전체 롤백이다.
- **Validation:** participant 참조는 선택 요구사항·실패 조건·효과·source follow-up 조건에서만 허용하고 role 선언을 검사한다. top-level/캐릭터 등장·퇴장/인생 엔딩 조건에는 허용하지 않는다. 실행 가능한 follow-up target의 normal-only trigger는 거부하고 legacy/tooling 대상은 유지한다. selector의 정적 분류·stat 키와 모든 directed relation을 동시에 만족할 수 있는 정의가 없으면 로딩 단계에서 실패한다. 초기 수치·availability로 미래 후보를 임의 제거하지 않는다.

기존 97개 테스트를 제거하지 않았다. 기존 우선순위 테스트의 normal-only 대상 예약을 제거하여 순위 비교 fixture를 유효하게 유지했다. 기존 반대 방향 selector 테스트에는 로딩 실패 assertion을 추가하고 원래 런타임 null 검사도 유지했다. 테스트 기대를 완화하지 않았다.

## 검증 결과

- `npm test`: 7개 파일, 총 128개 통과(기존 97개 + 신규 31개).
- `npm run typecheck`: 통과. React/DOM 없이 검사하는 engine 전용 TypeScript 설정도 통과.
- `npm run build`: 통과.
