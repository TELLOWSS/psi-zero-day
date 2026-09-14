# TASK-008F — 작업중지 문화의 후폭풍

## 목표
작업중지·위험보고 제도가 존재하는 것과 실제 현장에서 보고자가 심리적으로 보호받는 것은 다르다는 점을 게임으로 표현한다.

## 연속 사건
`STOPWORK_AFTERSHOCK(e01_08k) → STOPWORK_RETURN(e01_08l)`

재개 이후 작업자들은 일정 지연 원인을 보고자에게 돌리기 시작하고, 반장은 작업배치 변경을 고민한다. 공사대리는 공식적으로 불이익 금지 원칙에는 동의하지만 실제 인력배치까지 안전팀이 모두 결정할 수는 없다고 말한다.

## 플레이어 대응
- `stopwork_ignore_social`: 현장 분위기에는 개입하지 않음. 당장 마찰은 적지만 다음 보고가 사라진다.
- `stopwork_public_boundary`: 공개적으로 불이익 금지선을 분명히 함. 공식 보호는 강하지만 반장과의 비공식 마찰이 남는다.
- `stopwork_protect_process`: 위험보고와 인력배치 사유를 분리해 확인하고 배치기준·보호기준을 함께 정리한다. 다음 보고 통로를 가장 안정적으로 보존한다.

## 설계 원칙
1. 작업중지권을 행사했다고 자동 보상을 주지 않는다.
2. 공식 규정 준수와 실제 현장 분위기를 분리해 표현한다.
3. 배치 변경 자체를 무조건 보복으로 단정하지 않는다. 배치 이유와 위험보고 사이의 연결을 확인한다.
4. 보고자를 보호하더라도 반장·공사팀과의 실무관계는 별도로 관리한다.
5. 이전에 위축된 보고관계도 이후 좋은 대응으로 회복될 수 있다.
6. PSI 공식이나 임계값은 아직 만들지 않는다. 현재는 관계·flag·현장압박 표현만 사용한다.

## 구현
- 콘텐츠: `content/episode01/stopwork-aftershock-events.json`
- 대사: `content/episode01/stopwork-ko.json`
- 전략 UI 문구: `content/localization/stopwork-ui-ko.json`
- 콘텐츠 번들: `src/content/episode01-stopwork.ts`
- 전략 압박: `src/app/strategy-frictions.ts`
- 분기 테스트: `tests/episode01-stopwork.test.ts`

CoreEngine 변경 없음.
