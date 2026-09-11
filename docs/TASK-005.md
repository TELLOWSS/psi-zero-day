# TASK-005 — Playable Episode 01 UI

## UI 구조

`PlayableEpisode`는 시작 / 플레이 / 완료 화면을 제공한다. 상단 DAY·SLOT·Chapter, CSS 현장 배경, 인물 카드, 하단 대화·선택, 에피소드 진행 표시로 구성한다. 1280×720 및 작은 Landscape를 지원한다. 게임 화면의 문장은 localization key로 읽는다.

`PresentationView`는 SHOW_DIALOGUE / SHOW_CHOICE / SHOW_RESULT를 렌더링하고 다른 cue에는 안전한 placeholder를 둔다. E05 두 판단은 서로 다른 presentation으로 표시된다. 내부 결과 ID·관계 수치·평가 라벨은 플레이 화면에 표시하지 않는다. FIELD_NOTE는 노트 형태, DAY 02 예고 이후에는 완료 화면을 보여준다.

## Engine 연결 방식

`EpisodeSession`이 Registry·createRun·CoreEngine을 소유하고 `useSyncExternalStore`에 불변 snapshot을 제공한다. Session은 컴포넌트 밖에서 한 번 생성한다. React는 presentation의 instance/node/choice ID로 EngineCommand만 제출하며 그래프를 탐색하지 않는다.

Session의 다음 이벤트는 기존 eventCandidates 결과를 사용한다. 승인된 Headless와 동일하게 유일 활성 분기 게이트를 엔진 명령으로 통과시킨다. 결과 계산·조건 평가·직접 상태 수정은 없다. `session.json`은 기존 Headless 초기 입력과 clock_before를 옮긴 명시적 실행 설정이며 새로운 능력치 기본값이나 시간 자격 규칙을 만들지 않는다. 기존 engine/domain 및 Episode 이벤트·캐릭터·관계 데이터는 변경하지 않았다.

snapshot revision과 처리 중 guard로 오래된 입력을 거부한다. 클릭 detail의 중복, 키보드 repeat를 차단하고 Enter/Space의 native 중복 동작을 막는다. 1~4는 현재 presentation의 활성 선택에만 대응한다. disabled 버튼은 입력을 제출하지 않는다. 새로고침 저장은 미구현이며 Session 경계에서 향후 StoragePort를 연결할 수 있다.

## Asset slot

`public/assets/episode01/{characters,backgrounds,cg,ui}/`를 예약했다. `content/episode01/visuals.json`의 character/background URI를 변경하면 React 변경 없이 이미지를 교체한다. 현재 6명 모두 이름·역할·색상이 구분되는 placeholder card다. URI가 없거나 로딩 실패하면 img를 제거하고 CSS 대체 표현을 유지한다. 기존 엔진 asset cue는 ContentRegistry의 AssetManifest URI를 조회한다.

## Debug mode

`import.meta.env.DEV`에서만 버튼과 lazy DebugPanel이 제공된다. event/node, flags, relations, 공정, 선택·완료 이력을 읽기 전용으로 표시한다. Inspector를 열거나 닫아도 Session snapshot이 바뀌지 않는다. production 빌드 화면에는 버튼과 패널이 없다.

## 테스트 결과

- `npm test`: 10개 파일, **214개 PASS**(기존 197개 유지 + 신규 Session/component 17개). jsdom만 테스트 의존성으로 추가했으며 E2E framework는 설치하지 않았다. 로컬 worker 메모리 부족을 방지하도록 동시 worker를 2개로 제한했다.
- `npm run typecheck`: PASS. `npm run build`: PASS.
- 네 대표 경로의 Session 최종 GameState와 React 클릭 플레이 최종 GameState가 기존 Headless 결과와 완전히 동일하다. 재시작·StrictMode 재렌더·disabled 선택·키보드/중복 입력·Asset 실패 대체·개발 Inspector의 읽기 전용 동작도 검증했다.

- 실제 브라우저: 1280×720·854×393 확인. 작은 화면의 4개 선택은 최소 48px 높이이고 화면 안에 표시된다. 긴 선택문 번호의 줄바꿈을 수정했다.
- npm run dev에서 마우스로 임준호 신호 → 최민석 확인 → 역할 위임 → FIELD_NOTE → DAY 02 예고 → 완료 → 재시작을 확인했다. 페이지 오류·콘솔 오류 없음.
- production preview에서 Debug 비노출 확인. 최초 dev 확인 중 로컬 메모리 부족으로 Vite가 종료되어 worker 수를 제한한 프로세스로 재시작했다. 검증 프로세스 정리 후 마지막에는 별도 환경변수 제한 없이 `npm run dev -- --host 127.0.0.1`로도 브라우저 로딩과 오류 없음을 확인했다. 프로젝트 스크립트나 시스템 설정은 변경하지 않았다.

## 미구현 연출

Phaser, 최종 인물·배경·CG 이미지, 오디오 재생, 전환 연출, 새로고침 persistence, Android 패키징은 구현하지 않았다. 새 Episode·PSI LAB·Dark Path·Ending·Backend·Cloud는 추가하지 않았다.
