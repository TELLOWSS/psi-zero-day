# PSI : ZERO DAY — 개발 기본 규칙

- Lead Software Engineer는 Director의 명세를 구현한다. 세계관·게임성·캐릭터·스토리·아트·교육철학은 Director 소유다.
- 최상위 제품 방향은 `docs/MASTER-DESIGN-PRINCIPLES.md`, `content/design/master-design-principles-v1.json`, `src/app/master-design-principles.ts`의 **Master Design Principles v1.0**을 따른다. 신규 에피소드·시스템·아트·사운드는 이 기준과 `GAMEPLAY_DOCTRINE.md`를 동시에 만족해야 한다.
- 현재 제작 순서는 **Phase C 통합 기준선 유지 → Episode 01 최종 플레이/회귀 → Phase D Final Art·Sound·연출 Lock → Episode 01 cinematic vertical slice Lock → 공정·계절·공법·현장종류 확장**이다. Episode 01이 닫히기 전에 대규모 신규 캠페인으로 분산하지 않는다.
- Phase D는 **FINAL_CANDIDATES_ONLY**다. 새 placeholder·mockup·fallback 시각물을 추가하지 않고, 기존 Production slot을 실제 최종 자산으로 교체하는 작업만 허용한다. legacy binary 이름 변경이나 CSS/fallback을 final로 계산하지 않는다.
- 모호하거나 충돌하는 기획은 추측하지 말고 TODO/Director 확인사항으로 남긴다. 다음 TASK를 임의로 시작하지 않는다.
- TypeScript + Vite + React. Phaser는 presentation 전용이다. Game Logic과 GameState 변경은 순수 TypeScript domain/engine만 소유한다.
- UI/Phaser에 규칙·본편 콘텐츠·GameState 변경을 넣지 않는다. domain/engine은 React, Phaser, Zod, 브라우저, 저장소 API에 의존하지 않는다.
- 텍스트는 localization의 text_id를 참조한다. 기본 화면은 16:9 Landscape. 시간 기준은 day + PRE_WORK/MORNING/AFTERNOON/EVENING이며 display_time은 표시용이다.
- Offline-first, 향후 Capacitor Android. ECS·event sourcing·plugin framework·backend·cloud save는 도입하지 않는다.
- Career/Dark Path/PSI의 공식·임계치는 확정 전 구현하지 않는다. LIFE ARCHIVE 1차 범위는 엔딩/CG/주요 기록 해금이다.
- TASK-001 당시 본편 콘텐츠 금지는 역사적 범위 제한이다. 이후 Director가 명시적으로 승인한 TASK에서는 해당 범위의 실제 캐릭터·이벤트·콘텐츠 구현을 허용한다. 임의 콘텐츠 추가·확장은 여전히 금지한다. 합성 fixture는 tests 안의 최소 데이터로 제한하며 승인된 본편 콘텐츠와 구분한다.
- UI·Phaser·Android·PSI·Dark Path·Ending은 각각 별도 Director 승인이 있을 때만 구현한다.
- 검증: npm test, npm run typecheck. 실행 기반 변경은 npm run build와 개발 서버 로딩도 확인한다.
- 완료보고는 IMPLEMENTED / FILES / TEST / TODO / DIRECTOR REVIEW 다섯 항목만 짧게 작성한다.
