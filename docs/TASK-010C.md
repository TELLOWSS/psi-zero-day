# TASK-010C — 성장·장비 기반 현장 행동 해금

## 목표

TASK-010A/010B에서 만든 성장과 장비를 실제 플레이 선택지 차이로 연결한다.

- 성장했다고 자동으로 모든 스킬이 열리지 않는다.
- 장비 스킬은 해당 장비를 **실제로 장착**했을 때만 활성화한다.
- 기존 `Condition.flag`와 이벤트 choice requirement만 사용한다.
- 실행은 기존 `choose_event` 명령을 그대로 사용한다.
- CoreEngine 수정 없음.

## 첫 구현 스킬

### Player — 현장 카메라 비교 확인

선행:
- `growth.player = focused`
- `equipment.player.secondary_tool = item.inspection_camera`

해금 행동:
- `next_day_camera_compare`
- 전일 사진과 현재 상태 비교.
- 결과 플래그: `next_day.evidence_ready = true`.

카메라를 획득했더라도 `training_keep_loadout`을 골라 장착하지 않았다면 이 행동은 비활성이다.

### 임준호 — 무전 보고 채널 확인

선행:
- `growth.lim_junho = focused`
- `equipment.lim_junho.communication = item.site_radio`

해금 행동:
- `next_day_radio_checkin`
- 작업 전 무전 채널 확인.
- 결과 플래그: `next_day.report_channel_ready = true`.

## UI

`e01_10_next_day_tease`를 다음 날 작업 전 행동 선택으로 전환했다.

- 일반 현장 확인은 항상 가능.
- 장비 스킬은 requirement 충족 시 활성.
- StrategyMap action tray에서 장비 스킬은 `장비 스킬` 배지로 구분.
- 카메라 스킬 대상은 현장 전체.
- 무전 스킬 대상은 임준호.

## 검증

`tests/equipment-skill-unlock.test.ts`에서 다음을 검증한다.

- Episode registry가 progression text_id를 포함해 정상 구성되는지.
- 카메라 장착 시에만 사진 비교 행동이 활성화되는지.
- 카메라 보유만 하고 미장착 시 행동이 잠기는지.
- 임준호 무전기 장착 후 무전 행동이 열리는지.
- 두 장비가 모두 준비되면 두 장비 스킬 + 일반 행동이 함께 제공되는지.
- StrategyAction projection이 장비 스킬 배지와 올바른 맵 대상을 유지하는지.

## 비범위

- 자동 XP 레벨업 공식.
- PSI 점수 임계치 기반 스킬 해금.
- 랜덤 장비 드롭.
- 장비 성능 수치/경제 밸런스.
- 새 엔진 명령.
