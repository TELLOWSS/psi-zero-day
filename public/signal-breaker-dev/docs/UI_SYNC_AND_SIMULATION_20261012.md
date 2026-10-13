# 시그널 브레이커 배포 동기화 · UI · 시뮬레이션 보완

## 확인한 범위

사용자가 본 `http://127.0.0.1:5201/`의 게임은 시그널 브레이커다. 사용자 PC의 loopback 서버에는 이 실행 환경에서 직접 접근할 수 없다. 작업 공간의 기존 main `7114372`와 Vercel 운영 사이트를 비교했으며 주요 63개 파일의 SHA-256이 모두 일치했다. 메인 화면의 진입 링크와 CH-01~05 작전 화면도 일치했다. 추가 이력 검사에서 미병합 PR #188의 CH-04 4단계 하중 시험이 운영에 반영되지 않은 것을 확인했다. 당시 브라우저 CI 실패와 Vercel build-rate-limit 실패가 기록되어 있다. 해당 기능을 최신 코드에 복구하되 사용자 PC의 실제 버전과 같다고 추정하지 않는다. 따라서 그 배포본의 파일 누락은 재현하지 못했고, 확인하지 못한 사용자 로컬 파일을 동기화했다고 주장하지 않는다.

현재 작업 공간에서도 Vite 5201을 실행해 메인 → 브레이커 → 수동 발사 → 메인 복귀를 PC/휴대폰에서 검증했다. 실제 운영 진입 주소는 `/signal-breaker-dev/index.html?entry=play`다.

## 적용 사항

- 온라인 이미지가 예전 Service Worker 캐시에 고정될 수 있던 경로를 network-first 재검증으로 변경했다. 오프라인에서는 완전한 캐시 파일로 복구하며 Range 요청은 기존처럼 직접 처리한다. 캐시 버전을 `0.44.0-ui-sync`로 올리고 worker 등록의 HTTP 캐시 사용을 제한했다.
- 캐릭터가 사용하는 공유 렌더러를 dev/build 시작 시 다시 생성한다. `release.json`과 `scripts/check-signal-breaker-release.mjs`가 코드·스타일·공유 렌더러·이미지 등 78개 주요 자산의 해시를 기록하고 빌드 시 검사한다.
- image_gen으로 기존 6종 장비를 같은 3×2 순서의 투명 UI 아틀라스로 제작했다. 선택 UI·장비 미리보기·캐릭터의 손 장비에 실제 새 이미지를 연결했다. 이미지 원본은 `/workspace/generated_images/exec-323fef5e-d9cb-4bde-b909-91a8ac4139b8.png`, 배포본은 `art/breaker-six-tools-ui-v4.webp`다. 해상도와 알파를 유지한 WebP94 인코딩으로 1.15 MB의 lossless 후보를 421 KB로 줄였다. 최종 visual lock으로 표시하지 않는다.
- 장비 아이콘 크기와 선택 대비, 발사 버튼 대비를 보완했다. 휴대폰 세로 화면에서 발사 버튼이 오른쪽 이동 버튼을 덮던 위치와 눌림 시 이동 변환을 수정했다. 조이스틱/좌/우/발사/조준 영역이 겹치지 않는다.
- 사선이 막히거나 진행이 멈추면 이동 방향 안내와 해당 이동 버튼 강조를 계속 표시한다. 게임을 일시정지하면 안내도 숨긴다. 실제 이동·발사·보스 판정·보상·저장 규칙은 자동으로 바꾸지 않는다.
- 캐릭터의 방향·행동 이미지가 첫 방문에서 worker 활성화 전에 로딩되어 offline cold start에 빠지는 문제를 재현했다. 실제 로딩한 공개 이미지/폰트도 worker에 저장하고, 캐릭터·엔딩 기본 자산을 포함했다. 온라인 새 이미지와 오프라인 동일 이미지, 오프라인 완전 재접속 후 작전 시작을 검증한다.

## 시뮬레이션

UI/안내만 바꾼 시점에는 기존 일반 입력 80회, 위험 연쇄 입력 80회, 작전 45회의 결과가 기준 보고서와 동일했다. 이어서 CH-04 복구 후 작전 45회를 다시 실행해 45/45 완료를 확인했다. CH-04 9개 결과만 바뀌고 다른 36개 결과는 동일하다. CH-04 작전 전체 평균 시간은 38.78초에서 74.03초로 늘어 4단계 검증과 재균형을 거친다. 별도로 화면 안내가 있을 때만 표시 방향으로 이동하는 일반 입력 40회를 실행했다. 강제 회수·체력 보충·보스 완료는 하지 않는다. 기준선 205회 + 안내 입력 40회 + 복구 작전 45회, 합계 290회이며 인간의 승률 또는 실기기 FPS 측정이 아니다.

| 작전 | 고정 위치 입력의 정체 최댓값 | 안내를 따르는 입력의 정체 최댓값 | 안내 입력 완료 |
|---|---:|---:|---:|
| CH-01 | 3.88초 | 3.88초 | 8/8 |
| CH-02 | 3.44초 | 3.44초 | 8/8 |
| CH-03 | 16.02초 | 8.87초 | 8/8 |
| CH-04 | 140.48초 | 8.93초 | 8/8 |
| CH-05 | 151.94초 | 7.54초 | 8/8 |

원본 비교는 `flow-simulation-after-20261011.json`, `burst-simulation-after-20261011.json`, `operation-simulation-20261011.json`; 안내 입력 결과는 `assist-guidance-simulation-20261012.json`이다. 브라우저의 보스 노드 설정은 안내 UI를 재현하기 위한 명시적 presentation fixture이며 위 일반 입력 완료 결과와 구분한다.

## 미반영 CH-04 복구

미병합 #188에서 엔진의 4단계 하중 시험, 단계별 순서 릴레이, 3.4초 재균형, 실제 앵커 충돌에 따른 1회 가속, 확대되는 와이어 경고 범위를 복구했다. 최신 원화 보스의 누적 손상·기계 관절 연출은 유지하고 4단계 진행을 반영했다. 옛 procedural 보스 그림으로 되돌리지 않았다.

브라우저와 엔딩 테스트의 terminal fixture는 최종 하중 단계로 갱신했다. 현재 게임은 4번째 단계까지 완료해야 CH-04 엔딩 기록을 만들며 기존 저장된 아카이브는 유지된다. 4개 viewport에서 단계 2/4 표시, 물리 앵커 충돌과 재균형 가속, 단계 4 완료를 확인한다. 이 presentation fixture와 일반 입력 45회 결과를 구분한다.

## 재현 명령

```bash
node scripts/check-signal-breaker-release.mjs
node public/signal-breaker-dev/scripts/simulate-assist-guidance.cjs /tmp/psi-assist.json
node --test public/signal-breaker-dev/tests/*.cjs
npm test
npm run build
```

실제 배포 비교(HTTP 응답의 78개 파일도 각각 해시 대조):

```bash
node scripts/check-signal-breaker-release.mjs --remote https://psi-zero-day.vercel.app/signal-breaker-dev/
```

로컬 소스가 바뀐 경우에는 `node scripts/check-signal-breaker-release.mjs --write`로 명세를 갱신하고 함께 커밋한다. 공개 `/signal-breaker-dev/release.json`의 fingerprint로 별도 로컬 서버와 운영 버전도 구분할 수 있다. 개발 서버의 HTML 삽입/라이브 리로드는 운영 byte 비교와 구분한다.

브라우저 검증은 `scripts/verify-ui-release.cjs`(4 화면 크기, 실제 발사 입력, 지속 안내, pause, 온라인 stale 이미지 교체, 오프라인 이미지 및 cold start)와 `scripts/verify-hub-entry.cjs`(메인 진입/발사/복귀)다. Playwright 경로와 Chrome 실행 경로를 기존 `SIGNAL_BREAKER_PLAYWRIGHT_ROOT`, `SIGNAL_BREAKER_CHROME`으로 지정할 수 있다.
