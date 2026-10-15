# 첫 구역 게임성 고도화 QA — 2026-10-15

- `npm test`: 2,113 PASS / 1 SKIP, 365 파일 PASS / 1 SKIP. [회귀 요약](test-summary.txt).
- `npm run build`: 두 TypeScript 프로젝트 검사 및 Vite 빌드 성공. [빌드 요약](build-summary.txt).
- `tests/guard-gameplay-depth.test.ts`: 준비 대기의 시간/쿨다운 불변, 기존 모드 자동 시작 유지, 실제 8대상 판정 합계, 과거 활성 작전 경계, 정산 중복·손상 방어, 5시험×4계열, 진입표, 발사점/세로 pan, 1/2배속·저장 복원 동일성, 정상 명령 36조합.
- [엔진 결과](engine-simulation.json): 실제 작전/추천/동료/시간/최대 동시 신호/최종 배치와 계열별·파별 합계.
- [일반 UI 9회](campaign-browser.json): PC 1440×900, 세로390×844, 가로844×390. 작전별 균형→군집→정밀 방향, 강태식→윤성호→이재훈. 자원/클리어 주입 없음. 11초 가속 대기에도 파 사이 tick 불변, 결과의 해소+누출=실제 전체 신호 수, 파별 기록·작전실 재열기, 패드 정렬과 결과 버튼 가시성 검사.
- [5화면 기능](features-browser.json): 위3개와320×568/568×320. 이전 버전 일반 완주 기록을 복원한 호환 프로필에서 4인 이미지·5종 시험 A/B 표·직접 시연·본게임 저장 불변·정지 저장/이어하기·기존 저장 키·복귀 후 음원 중단을 확인.

재현: `PSI_PLAYWRIGHT_MODULE`, `CHROME_BIN`, `PSI_QA_OUTPUT`, 필요하면 `PSI_PREVIEW_URL`을 지정한 뒤 `scripts/play-guard-campaign.cjs`, `scripts/check-guard-features.cjs`를 실행한다. 일반 완주에는 `PSI_GUARD_ADVICE_STYLES=BALANCED,AREA_CONTROL,PRECISION`을 사용했다. `PSI_QA_PROFILES=pc`로 공개 주소의 PC 3작전만 선택할 수 있다. 엔진 원시 결과를 재작성하려면 `PSI_GUARD_SIMULATION_OUTPUT` 경로를 설정하고 해당 vitest 파일을 실행한다.

일반 완주는 튜토리얼 확인 여부만 설정하고 실제 구매/진화/지원 버튼을 쓴다. Playwright clock은 엔진 대기만 가속한다. 36개 엔진 조합과 9개 브라우저 실행은 서로 다른 증거다. `*-branch-comparison.png`는 비교 표, `*-result.png`는 기본 결과, `*-tactical-report.png`는 펼친 기록이다. 전투 전장을 확대하는 기본 상태와 시연/기록을 열어 보는 상태를 혼동하지 않는다.

일반 테스트의 jsdom 미디어 API 경고와 기존 대형 청크 경고는 남아 있다. 실제 Chrome 검사를 별도로 수행했다. 저사양/중급 Android 실기 20분, 사람 초보자, 최종 아트·청취·권리 증빙은 미검증이다.
