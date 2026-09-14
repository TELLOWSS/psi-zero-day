# TASK-009C — 현장 대상 선택 → 가능한 행동 표시

## 목표

TASK-009B의 `행동 → 대상 강조` 구조를 뒤집어, 플레이어가 먼저 현장을 읽고 **사람·위험신호·작업구역을 선택한 뒤 그 대상에 가능한 행동만 보게 한다.**

## 구현

- 인물 선택: 강태식, 윤성호, 이재훈, 임준호, 최민석, 감리/원도급 인물 등 현재 맵 배치 인물.
- 위험신호 선택: 진입통로, TBM-실작업 괴리, 재개 미확인 등 현재 활성 signal.
- 작업구역 선택: 진입부, 경사로, 자재 야적장, 현장 게이트.
- 현장 전체 선택: 기록/타임라인 확인처럼 site 전체를 대상으로 하는 행동.
- 선택된 target과 정확히 일치하는 `StrategyAction`만 행동 트레이에 표시.
- 행동 실행은 기존 `choose_event(instance_id, node_id, choice_id)` 그대로 사용.
- 텍스트 선택지는 접근성/fallback으로 유지.

## 코드

- `src/app/strategy-actions.ts`
  - `strategyActionTargetKey()`
  - `strategyActionsForTarget()`
- `src/ui/StrategyMapShell.tsx`
  - target-first 선택상태
  - actionable target 표시
  - zone hotspot
  - 선택 대상별 행동 필터
- `src/ui/strategy-actions.css`
  - actionable target 강조
  - 작업구역 hotspot
  - 빈 행동상태

## 원칙

맵은 새 게임규칙을 계산하지 않는다. 현재 SHOW_CHOICE를 읽어 대상별로 정리할 뿐이며, 선택 결과·효과·관계 변화는 계속 CoreEngine이 결정한다.

## 시각자산 상태

현재 저장소의 `public/assets/episode01/{backgrounds,cg,characters,ui}` 폴더는 준비돼 있지만 실제 이미지 파일은 아직 들어 있지 않다.
`content/episode01/visuals.json`의 character/background URI도 null이다.
현재 화면의 건설현장 맵, 작업자 미니 캐릭터, 위험핀, HUD는 CSS/React 기반 프로토타입 비주얼이다.
