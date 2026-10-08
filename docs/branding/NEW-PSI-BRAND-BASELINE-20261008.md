# NEW PSI B0 기능·표현 기준선

검사일: 2026-10-08. 범위: 로컬 소스와 집중 자동 테스트. 운영 화면 및 자연 플레이 검증과 구분한다.

이 문서는 첫 감사 당시의 스냅샷이다. 아래 미완료·옛 화면 명칭을 현재 운영 상태로 읽지 않는다. 수정 후 정산/자연 UI 봇 승리·패배/다음 준비·복구 및 PR148까지의 적용 상태는 `NEW-PSI-BRAND-PROGRESS-20261008.md`, 자산 출처/사용권은 `NEW-PSI-BRAND-ASSET-RIGHTS-20261008.md`, 실제 B2 슬롯은 `NEW-PSI-BRAND-PRODUCTION-SLOTS-20261008.md`를 따른다.

## 기능과 표시 매핑

| 접점 | 현재 근거 | 판정 / 다음 작업 |
|---|---|---|
| 타이틀 | GameHub.tsx의 NEW PSI, PSI : ZERO DAY, FIELD DEFENSE | 상위 브랜드와 모드 설명 혼재. B1에서 승인된 계층으로 정리 |
| 현재 플레이 모드 | GameHub.tsx의 시그널 워치 (SURVIVORS), gamehub-mode-lock.test.ts | 출시 가능 상태 검사 통과. 본편/방어 준비 중 상태 유지 |
| 장비실 | survivors-store-ko.json의 PSI 프리미엄 장비실 / PSI 상점 | 동일 화면 명칭 혼재. B1에서 PSI 장비실 중심으로 통일 검토 |
| 잔액·거래 | survivors-store-wallet.ts, survivors-store-wallet.test.ts | 집중 회귀 통과. 화면 잔액 및 실패 안내는 브라우저 검증 필요 |
| 파손·수리 | domain/survivors-store.ts, survivors-store-durability.test.ts | 사용 장비 마모, 0에서 효과/장착 해제, 소유권 유지, 수리 복구 검사 통과 |
| 수리 후 장착 | survivors-store-ko.json repaired / wearRule, durability 테스트 | 파손 장비 수리 후 자동 장착하지 않는 규칙과 안내 일치 |
| 실제 피해 | survivors-equipment-damage-audit.test.ts | 기본·진화 장비 판정 집중 회귀 통과. 이번 작업에서 수치 변경 없음 |
| 음성 | survivors-player-voice.test.ts | 기존 음성 로직 회귀 통과. 청취·선택 저장 및 제작 메타데이터 별도 점검 |
| 다음 준비 구역 | survivors-save.ts의 resumePatrolStage / nextPreparedPatrolStage | 클리어 저장에서 다음 구역 복귀, 미완료 구역 유지, 마지막 구역 유지 테스트 통과 |
| 실제 클리어→정비→다음 준비 | PatrolSurvivorsGame.tsx 결과 저장/다음 구역 경로 | 코드 존재는 실제 완주 증거가 아님. 자연 입력 플레이 검증 미완료 |

## 이번 검사

- 집중 Vitest 9개 파일, 137건 통과.
- 6개 파일: store, wallet, durability, equipment-damage-audit, player-voice, gamehub-mode-lock. 81건 통과.
- 3개 파일: resume-stage, stage50, stage20. 56건 통과.
- npm test 전체, 타입 검사, 빌드, 운영 브라우저 검수는 이번 문서 작업에서 실행하지 않음.
- 저장소의 기존 사용자 변경을 보존했으며 런타임·규칙·원화·음원은 변경하지 않음.

## B0 종료 전 남은 증거

1. 동일 버전의 PC·폰 세로·폰 가로·태블릿 기준 화면.
2. 실제 입력으로 클리어 후 보상 1회 지급·마모·정비·다음 준비·새로고침 유지 검증.
3. 실패·마지막 구역·수리 포인트 부족·음성 변경 경로 확인.
4. 자산 및 음성 출처/승인 상태 목록. 새 제작물에 기존 사용권을 자동 적용하지 않음.

B0는 부분 진행 상태다. 이 기록이나 자동 테스트만으로 프리미엄 완성·시각 최종 승인·실기기 성능을 선언하지 않는다.
