# TASK-009A — Episode 01 플레이 구조 압축·재배치

## 목표

TASK-008A~008H에서 만든 현실성 사건을 삭제하지 않고, 한 플레이에 전부 강제하지 않도록 재구성한다.

- 콘텐츠 라이브러리는 26개 이벤트 유지.
- 1회 플레이는 선택에 따라 약 11~16개 이벤트.
- CoreEngine 변경 없음.
- 기존 조건 primitive(`choice_selected`, `flag`, `event_completed`, `any/all/not`)만 사용.
- 후속사건은 원인이 실제로 발생한 경우에만 열린다.

## 메인 루트

- `follow_junho` → 보고문화 중심, 약 11개.
- `delegate_kang` → 감리/재지적 중심, 약 13개.
- `negotiate_yoon` → 책임공방/보고 중심, 약 12개.
- `coordinate_schedule` → TBM/변경작업/재개 중심, 약 12~14개.

## 조건부 심화

- 일방/방어 보고 → RECORD_PRESSURE/RETURN 추가 → 약 14개.
- 변경작업 재통제 → RESTART_PRESSURE/RETURN 추가.
- 조기 구두재개 → STOPWORK_AFTERSHOCK/RETURN 추가 → 최대 약 16개.
- 재개 지시조건 왜곡 → INSTRUCTION_CASCADE/RETURN 추가 → 최대 약 16개.

정상적으로 닫힌 사건 뒤에는 관련 없는 현실성 챕터를 추가하지 않는다.

## 구현

- `src/content/episode01-play-structure.ts`: 이벤트 조건 라우팅과 EVENING 진입 조건.
- `src/content/episode01-consequences.ts`: 순수 라이브러리 조립만 담당.
- `src/app/episode01-run-progress.ts`: 선택된 run의 예상 이벤트 수 계산.
- `src/app/episode-session.ts`: 26개 library count 대신 run-facing progress 사용.

## 테스트

- `tests/episode01-routing.test.ts`: 실제 이벤트 수와 분기별 포함/제외 검증.
- 45개 기존 안전판단 매트릭스 유지.
- TASK-008 전용 테스트는 각 사건을 실제로 여는 선행 선택으로 수정.
- 완료된 세션은 `completed === total`이어야 하고 `total < 26`이어야 한다.

## Director Review

이번 단계는 새 위험공식, PSI 공식, 사고확률, 경제공식을 추가하지 않는다. 기존 승인 콘텐츠의 **플레이 순서와 노출 조건만 재구성**한다.
