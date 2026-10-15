# Guard P0/P1 검증 — 2026-10-15

빌드된 Vite preview `http://127.0.0.1:4176/` + 설치된 실제 Chrome headless를 사용했다. 엔진 테스트와 브라우저 검사를 구분한다.

| 검사 | 결과/증거 |
|---|---|
| 전체 회귀 | npm test: 2,104 PASS / 1 SKIP; [로그](test-summary.txt) |
| 타입·빌드 | npm run build: 두 TypeScript 프로젝트와 Vite 성공; [로그](build-summary.txt) |
| 콘텐츠/능력/저장 | guard-campaign / guard-support-storage / guard-asset-integrity / defense-combat-mixer 테스트 |
| 정상 첫 플레이 | scripts/play-guard-campaign.cjs → [9회 완주](campaign-browser.json) |
| 기능·작은 화면 | scripts/check-guard-features.cjs → [5개 화면](features-browser.json) |
| MP3 32개 | scripts/analyze-guard-audio.cjs → [실제 디코딩/RMS/피크](supplied-audio-analysis.json) |

실행 환경 변수: `PSI_PLAYWRIGHT_MODULE`은 Playwright 모듈 경로, `CHROME_BIN`은 Chrome 실행 파일, `PSI_PREVIEW_URL`은 검증할 origin, `PSI_QA_OUTPUT`은 증거 출력 폴더다. 기능 검사는 일반 완주 JSON의 실제 완료 저장을 사용하므로 먼저 완주 검사를 실행한다. 한 origin에 별도 격리 프로필을 사용하며 공개 이용자의 저장을 변경하지 않는다.

최초 플레이는 튜토리얼 확인 여부만 설정하고 정상 버튼을 사용한다. Playwright clock은 실제 엔진 tick을 실행해 대기 시간만 줄인다. 추천 구매·합법 진화·지원 사용 후 결과와 해금·보상을 확인한다. 5음악 phase를 관찰했다. 모든 사운드를 사람이 청취했다는 뜻은 아니다.

`pc/portrait/landscape-*-combat.png`는 전장, `*-crew.png`와 `*-four-crew.png`는 동일 인물 자산, `*-branch-lab.png`는 시연 상태다. 시연 패널을 연 캡처는 전투 화면 전체판의 기본 크기를 나타내지 않는다.

전체 테스트의 jsdom `HTMLMediaElement.play` / `scrollTo` 미구현 출력은 이 환경의 한계이며 실제 브라우저 검사도 별도로 수행했다. Android 실기·사람 초보자·최종 청취·상업 권리 증빙은 미검증이다.
