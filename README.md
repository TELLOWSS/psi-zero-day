# PSI : ZERO DAY — TASK-001 Foundation

본편 콘텐츠 없는 실행 기반. React는 정적인 부팅 화면만 표시하고 Phaser는 의존성만 준비되어 있다.

## 실행

Node.js 22.12 이상 권장(검증 환경: 24.16.0). 이 디렉터리에서 실행한다.

```sh
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

재현 설치는 `npm ci`. 의존성은 정확한 버전과 package-lock.json으로 고정한다.

## 구조

| 경로 | 역할 |
|---|---|
| src/domain | 플랫폼에 의존하지 않는 readonly 핵심 타입 |
| src/engine | seed 기반 RNG; 게임 규칙 엔진은 미구현 |
| src/content | Zod 스키마, 참조 검사, 불변 ContentRegistry |
| src/localization | 로컬 사전과 기본 언어 fallback |
| src/app · src/ui | 데이터 검증 후 16:9 부팅 화면 표시 |
| src/presentation | Phaser 전용 경계 예약; 장면 구현 없음 |
| src/platform | StoragePort와 web/android 어댑터 위치 |
| src/persistence | 향후 저장 검증·마이그레이션 위치 |
| content | 빈 본편 목록 + 화면용 localization |
| public/assets | 향후 로컬 패키징 자산 위치 |
| tests/fixtures | 테스트 전용: NPC 2, 이벤트 2, 엔딩 1, 자산 메타데이터 1 |

데이터 흐름: JSON → Zod → ID/참조 검증 → ContentRegistry → 조회. 실패하면 Registry를 생성하지 않는다.
ID는 컬렉션별로 유일하며 소문자 영문으로 시작하고 숫자·점·밑줄·하이픈을 사용한다. 대화·선택·역할·효과·후속 예약 ID는 이벤트 안에서 유일하다.
기본 언어의 모든 text_id 참조를 검사한다. 번역 누락은 기본 언어로 fallback한다. 개발자용 오류 메시지는 localization 대상 게임 텍스트에 포함하지 않는다.

시간은 정수 day와 승인된 네 개 slot으로 표현한다. display_time은 선택적인 표시 메타데이터다. 시간 진행은 구현하지 않았다.
RNG 알고리즘 ID는 `mulberry32-v1`. seed는 uint32(0 포함)이며 snapshot은 다음 추출 직전 상태를 저장한다. 암호학적 용도가 아니다.

## 범위와 남은 사항

- 13개 핵심 타입과 관련 구조를 정의했다. Zod는 **콘텐츠 입력과 GameTime**을 검증한다. GameState/SaveEnvelope 전체 런타임 검증·checksum·마이그레이션·실제 저장 어댑터는 이번 범위에 포함하지 않는다.
- 정의된 콘텐츠 ID 참조는 검사한다. flag_id, field_id, group_id 등 독립 상태/분류 키는 형식만 검사한다. 별도 규칙 사전과 해금 필드 목록은 Bible 수령 후 정의한다.
- 스키마는 조건·효과·엔딩 조건의 데이터 형태만 표현한다. 조건 평가, 효과 적용, 이벤트 선택/실행/예약, 엔딩 판정은 구현하지 않았다.
- fixture의 수치·75 DAY 지연은 테스트 입력이며 본편 규칙이 아니다. fixture 자산은 메타데이터만 존재한다. 파일 존재·용량·해시 검증은 자산 파이프라인 구축 시 추가한다.
- 런타임 네트워크 요청·외부 폰트·CDN은 사용하지 않는다. 브라우저 최초 설치/오프라인 재실행을 위한 service worker와 Android 패키징은 아직 없다.
- Android는 방향만 유지한다. 네이티브 android/ 프로젝트, Capacitor 플러그인, 장면 연출을 생성하지 않았다.
- readonly 상태 계약과 UI에 GameState를 넘기지 않는 경계를 마련했다. 실제 상태 소유 엔진은 다음 명세에 따라 구현한다.

Director 확인사항: Bible, 플레이어 유형과 stat/flag/정보해금 사전, 관계 초기값, 이벤트 충돌·실패·연기 정책, 저장 시점, 성장·엔딩 판정 규칙. TASK-001 완료를 막는 추가 결정은 없다.

기술 문서: [Vite](https://vite.dev/guide/), [Zod](https://zod.dev/api), [Vitest](https://vitest.dev/guide/), [Phaser](https://docs.phaser.io/), [Capacitor](https://capacitorjs.com/docs).
