# Episode 01 — Final Playthrough / Regression Gate

**Status: ACTIVE REGRESSION GATE**  
**Effective: 2026-09-21**

Phase C의 개별 장면 제작은 끝났다. 이 게이트는 새 장면을 추가하는 단계가 아니라, 실제 플레이어가 사용하는 `EpisodeSession.directed()`를 처음부터 끝까지 관통하여 Episode 01의 통합 품질과 회귀를 닫는 단계다.

## 검수 대상

Player-facing runtime은 **26-event directed spine**이다.

ARRIVAL → TBM → STRATEGY → FIELD SIGNAL → STRATEGY/PUMP → FIRST POUR → AFTERSHOCK → STOP WORK → OFFICE → TBM → RESTART/HUMAN AFTERSHOCK → INSTRUCTION/RECORD TRACE → DAY RESULT → DAY 02 SIGNAL.

Phase C의 여섯 Production Scene family는 모두 이 플레이 안에서 확인한다.

- STOP_WORK
- FIELD
- TBM
- STRATEGY
- OFFICE
- DAY_RESULT

DAY 02 teaser는 별도 일곱 번째 family가 아니라 FIELD family의 `NEXT_DAY_TEASER` presentation이다.

## 8대 Master Design Principles 판정

Episode 01 Production Lock에서 지금 막아야 하는 항목과 장기 확장 항목을 구분한다.

| Principle | Episode 01 gate | 의미 |
|---|---|---|
| play_not_lecture | PASS_NOW | 실제 관찰·대화·판단·증거 선택을 유지 |
| cognitive_rhythm | PASS_NOW | slow/medium/fast pacing과 장면 family 전환 유지 |
| living_construction_world | SEED_LOCKED | FOUNDATION vertical slice를 기준점으로 고정; 다단계 공정 성장은 후속 확장 |
| season_changes_play | SEED_LOCKED | DAY 02 비/조건변화 신호까지 고정; 계절 시스템화는 후속 확장 |
| method_changes_rules | FUTURE_EXPANSION | 순타·역타·리모델링 캠페인 규칙은 Episode 01 이후 |
| project_type_expansion | FUTURE_EXPANSION | 아파트·물류센터 등 프로젝트 확장은 Episode 01 이후 |
| real_records_become_clues | PASS_NOW | TBM·지시·타임라인·기록이 추리/판단 정보로 기능 |
| cinematic_episode_memory | PASS_NOW | DAY RESULT가 점수판이 아니라 기억·사람·기록을 DAY 02로 전달 |

`SEED_LOCKED`와 `FUTURE_EXPANSION`은 미달이 아니라 **이번 Episode 01 범위에서 의도적으로 확장하지 않는 항목**이다. 이를 완료로 과장하지 않는다.

## Phase D 진입 조건

다음이 현재 main에서 검증되면 Phase D로 이동한다.

1. directed EpisodeSession이 26개 이벤트를 오류 없이 완주한다.
2. manifest event order와 실제 방문 순서가 일치한다.
3. 여섯 Production Scene family가 모두 실제 런에 등장한다.
4. 의미 있는 authored decision이 계속 살아 있고 continue-only 재생으로 퇴행하지 않는다.
5. STOP WORK / FIELD / TBM / STRATEGY / OFFICE / DAY RESULT 대표 checkpoint가 올바른 scene family로 resolve된다.
6. DAY RESULT 뒤 DAY 02 rain/changed-condition signal이 연결되고 detached score screen이 생기지 않는다.
7. Master Design Principles의 PASS_NOW 항목을 만족한다.

자동 회귀 테스트: `tests/episode01-final-playthrough-regression.test.ts`  
코드 기준: `src/app/episode01-final-playthrough-gate.ts`  
데이터 기준: `content/episode01/final-playthrough-gate-v1.json`

Phase D에서는 이 topology를 다시 설계하지 않고 **Final Art · Sound · character performance · transition/camera direction**을 Production Lock한다.
