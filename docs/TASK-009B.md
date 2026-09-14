# TASK-009B — 현장맵 행동 중심 플레이

## 목표

Episode 01의 선택을 하단 대화 패널에서만 누르는 구조에서 벗어나, 현장맵의 인물·위험신호·작업위치와 연결된 **현장 행동**으로 실행한다.

## 원칙

- 새 EngineCommand를 만들지 않는다.
- 기존 `SHOW_CHOICE`를 read-only `StrategyAction`으로 투영한다.
- 맵 행동 클릭도 기존 `choose_event(instance_id, node_id, choice_id)`를 그대로 보낸다.
- CoreEngine의 효과·관계·flag·결과 판정은 변경하지 않는다.
- 기존 1~4 키보드 선택은 유지한다.
- 텍스트 선택지는 삭제하지 않고 접힌 fallback으로 유지한다.

## UI 흐름

`현장 상황/대화 → 맵의 사람·위험핀 확인 → 현장 행동 버튼 hover/focus → 관련 대상 강조 → 행동 클릭 → 기존 CoreEngine 결과 → 관계/압박/맵 갱신`

## 행동 대상 예

- `delegate_kang` → 강태식.
- `follow_junho`, `listen_more` → 임준호.
- `request_delay` → 이재훈.
- `inspection_sequence_agreement` → 서정민 감리.
- `restart_verify_controls` → 재개 전 안전조치 미확인 신호.
- `record_preserve_timeline` → 현장 전체 기록.

## 구현

- `src/app/strategy-actions.ts`: 기존 choice를 intent + map target으로 투영.
- `src/ui/StrategyMapShell.tsx`: 현장 행동 tray, hover/focus target 강조, 기존 focus와 공존.
- `src/ui/PlayableEpisode.tsx`: StrategyAction을 기존 `choose_event`에 연결.
- `src/ui/PresentationView.tsx`: 맵 행동이 있는 장면은 기존 text choices를 접힌 fallback으로 표시.
- `src/ui/strategy-actions.css`: map-first choice layout.
- `content/localization/playable-ko.json`: 현장 행동 UI 문구.

## 검증

- `tests/strategy-actions.test.ts`: choice → 인물/신호/위치 매핑과 command identity 검증.
- `tests/strategy-map-shell.test.tsx`: 현장 행동 tray와 target 데이터 렌더링.
- `tests/strategy-session-ui.test.tsx`: 실제 EpisodeSession의 첫 다중 선택이 맵 행동 UI로 나타나는지 검증.

## Director Review

TASK-009B는 UI/상호작용 계층 변경이다. PSI 공식, 위험확률, 경제수치, 사고판정 공식은 추가하지 않는다.
