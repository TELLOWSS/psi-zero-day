# 참고 사진 대응 작업

사용자 2026-10-08 요청: EMP 최종 진화, 웨이브 보급 화면/재개, 아이템 효과와 주인공 오라, 모바일/PC 상점 최적화.

## 첫 수정 묶음

- 보급창 표시 중 일반 일시정지 창이 동시에 렌더링되는 조건 제거. 보급 종료의 기존 엔진 재개/프레임 기준 시간 갱신 유지.
- 현재 장착 내구도는 두 열 전체를 차지하며 해제/수리 버튼과 별도 행을 사용. 버튼 최소 높이 44px, 긴 문구 줄바꿈.
- 착용 미리보기 적용 영역을 일반 문서 흐름으로 전환해 뒤의 능력치/장비 내용을 덮지 않음. 지갑/탭의 기존 고정 표시 유지.
- 집중 회귀 7건, 타입 검사/prebuild/build 통과. 저장 fixture 기반 상점 수리/잔액/새로고침/오류/가로 넘침 4 viewport 통과. 실제 웨이브 보급 재개 및 사진과 동일 장착 조합의 교차 가림은 추가 검증 필요.

## 다음 순서

PR141 운영 동기화: 2026-10-08 사용자의 최신 수정 GitHub/Vercel 동기화 요청에 따라 검증된 혼잡 오라 개선을 반영했다. 최신 f5ac009 CI/preview 성공 후 main 병합, 운영 커밋 `517bbfae6a2d256abeb0ae6e3a16465b0354c618`, 배포 `dpl_5Wrgq1j1oaFFZ8C3cqBBUKqvXijc` READY/공개 별칭 확인. 운영 오라 fixture9경로 및 상점 사진조합4viewport 재통과. 아래의 과거 PR141 draft/운영140 문구는 해당 시점 기록이며 현재 상태가 아니다. 최종 전체 아트·자연 과밀·실기기 승인으로 확대하지 않는다.

장비 효과 후속 후보: 실제 drawPremiumGear의 점검 드론 억제 연결선이 모든 대상에서 주인공으로 모이는 표현을 정리했다. 일반 연결선은 가까운3개, 대상 표식16개까지; 혼잡은 연결선0/표식8개, 움직임 감소는 연결선0/표식 유지. 거리/id 정렬로 표식 선택을 안정화하며 engine 감속 대상·180 범위·억제율·저장·원화는 불변. 집중16건/타입/prebuild/build 통과. 기존 실제 전투 renderer fixture PC/폰세로/가로 x normal/busy/reduced9경로 통과, 모바일 busy 캡처를 직접 확인해 중심 연결선 제거와 주인공/노란 예고 분리를 관찰했다. 증거 `artifacts/equipment-target-readability/report.json`과9 PNG. 명시적 action1/정지 위험물4·46 fixture이며 자연 발동/실기기 성능 증거가 아니다. 현재 운영은 PR141이며 이 후속 후보는 운영 미반영.

후속 전체 회귀: 1,715건 통과·1건 제외. 기존 jsdom media/canvas 미구현 경고는 실제 브라우저 검증과 구분하며 테스트 실패로 발생하지 않았다. 최신 원격 CI 완료 전 병합하지 않는다.

EMP 후보는 2026-10-08 사용자가 보여준 표현의 운영 반영을 직접 승인. PR140 최종 f64d51a 검사 성공 후 운영 커밋 `b384914547f5df0b3a7fac3db4cb38d0a85a5de4`, 배포 `dpl_3tewDgkHfFtbfjtNwXq8KGWwyPNS` READY 및 별칭 확인. 운영 진화 fixture 6경로 통과. 전체 장비/오라/실기기 승인으로 확대하지 않음.

오라 혼잡 후보: 기존 authored wisps/frame crossfade/장비 팔레트 유지. busy 발동 추가 alpha .54→.24, 팽창 폭 60%로 제한. 일반 발동과 idle 장비 수 증가 계약 유지. 집중9건 통과. 실제 장비 조합/혼잡 화면 캡처 및 위험예고 대비 검수 전 운영 적용 보류. 전체 장비 효과 그래픽 고도화 완료가 아님.

오라 픽셀 후속: `tests/verify-aura-presence.mjs`는 게임과 같은 원화 준비/오라 렌더러 및 실제 장비 6종을 사용한다. 일반 alpha 합838518, busy400216(약48%), reduced0. 동일 시간의 픽셀 hash1731850211 유지, 변경 시간 hash247282030으로 변화. `artifacts/aura-presence/report.json`과 comparison.png를 확인했다. 이는 주인공 없는 분리 렌더러 fixture이며 실제 과밀 전투, 게임 일시정지, 모바일 몸체/위험예고 대비, 실기기 증거가 아니다. PR141 draft 및 운영140 유지.

사진 동일 조합 레이아웃 후속: `tests/verify-store-reference-layout.mjs`는 지갑1260 PSI, broadcast_crown 내구도10, sync_gauntlet 내구도40의 저장 fixture로 실제 상점 UI를 연다. 1440x900/390x844/844x390/1024x768 모두 내구도와 해제/수리 버튼 bounding-box 교차 없음, 버튼44px, fitting summary와 static 적용 영역 비중첩, 스크롤 후 조합 장착 접근, 가로 넘침/실행 오류 없음. 모바일 세로 loadout 및 fitting-bottom PNG를 직접 확인했다. 증거 `artifacts/store-reference-layout/report.json`과 8 PNG. 사진 브라우저 주소창/물리 기기 재현 또는 실제 전투 오라 검증은 아니다. 제품 코드 추가 변경 없이 PR139의 레이아웃 수정을 후속 확인했다.

전투 오라 후속: `tests/verify-aura-combat-scene.mjs`는 빌드의 실제 오라 렌더러 호출을 계측한다. 저장 장비6종, 정지된 위험물4/46개 warning 배치, 오라 action=1을 명시 주입한 fixture이다(originalAction=0도 보고). PC1440x900/폰390x844/가로844x390 x normal/busy/reduced 9경로 통과. 실제 authored asset 준비/장비6개/분기 호출, pause 게임시간 불변/연속 캔버스 hash 일치, nonblank/오류/넘침 없음. PC busy 및 모바일 normal/busy/reduced 화면을 직접 확인해 주인공 안전모·몸체와 주변 노란 위험 예고가 구분됨을 관찰했다. 첫 밀집 배치는 위험물 자체가 겹쳐 가림 평가가 불가능해 방사형 분산 배치로 바꿨으며, 이를 실제 과밀 전투 가림 해결로 주장하지 않는다. 증거 `artifacts/aura-combat-scene/report.json` 및9 PNG. 집중9건/타입 검사 재통과. 최종 시각 승인/자연 발동 도달/실제 과밀 성능/실기기는 미확정. 운영140 유지.

2026-10-08 운영 PR139 커밋 `79aa594f211be0a0199191bb200ba68712d15014`에서 새 저장 UI 입력 bot으로 첫 보급 확인. 엔진 상태는 읽기만 하는 bundle 계측이며 이동/선택/보급은 UI 입력. 게임 시간 65.23768초에서 보급 pause, P/Esc 후 동일 시간, 완료 후 65.93768초/playing. 중복 pause 0, 오류/실패 요청/넘침 없음. 증거 `artifacts/natural-progression/supply-resume/report.json`; 사람/실기기 검증과 구분. 성공 후 조기 종료를 이전 보고서는 observation-timeout으로 표기했지만 supplyCheck.pass=true이며 후속 도구는 supply-check-complete로 표기하도록 정리.

EMP 후보: 실제 활성 projectile 경로의 emp_pulse/plasma_arc를 긴 중심 방사선 대신 외곽 분절 방전/확산 파동으로 변경. plasma 시각 수명 .55초는 엔진 발사 수명과 일치. radius/피해/주기 미변경, reduced/busy 시 디테일 감소. 집중4건/타입 검사 통과. 실제 최종진화 화면/폰가로세로/위험예고 대비 검수 전 운영 적용 금지. 아이템 전체/오라 고도화 미완료.

EMP 브라우저 후속: `tests/verify-survivors-emp.mjs`에서 빌드 번들의 엔진을 capture하고 명시적으로 plasma_grid/높은 체력 fixture를 주입했다. 엔진이 생성한 radius165 plasma 발사체를 실제 전투 renderer로 표시하고 pause overlay만 숨겨 캡처. 1440x900/390x844/844x390 x 일반/움직임 감소 6경로에서 실제 pulse 존재, 캔버스 nonblank, 오류/가로 넘침 없음. 폰 세로 캡처를 직접 확인했으며 몸체와 현장 경고 구역이 읽힌다. `artifacts/emp-fixture/report.json` 및 PNG. 자연 진화 도달/사람/실기기/혼잡 상태/전체 시간축/최종 아트 승인 증거가 아니다. PR140 draft 유지; 후속 혼잡/감쇠 검증 및 전체 회귀 필요.

EMP 감쇠 후속: `tests/verify-emp-envelope.mjs`에서 실제 renderer를 일반/busy/reduced 상태별 시작(.55)/중간(.275)/종료(0)로 렌더링해 alpha 픽셀 검사. 9프레임 모두 중심48px 영역 alpha 합0, 중간 peak 감소, 종료 전체 alpha 합0 확인. busy 시작 alpha 합149255 < 일반268402. reduced는 움직임 감축이며 효과량 총합 감소를 주장하지 않음. `artifacts/emp-fixture/envelope.json`. 고정 캔버스 fixture이며 실제 과밀 전투/실기기 성능 증거는 아님.

보급 입력 후속: 기존 모달 키보드 잠금과 상단 재개 버튼에 보급창을 포함했다. fixture UI 회귀에서 실제 보급창 열기, P/Esc 잠금, 일반 pause 중복 없음, 완료 버튼 후 playing 및 엔진 시간 증가를 확인했다. 자연 플레이/실기기 증거와 구분한다. EMP/오라 고도화는 아직 적용하지 않았다.

1. 실제 보급 열기/닫기 후 이동·타이머·공격 재개 및 중복 dialog 없음 검증. 일반/보스 전환/레벨업 경계 상태 포함.
2. EMP 최종 진화의 이벤트 발생·지속 시간·좌표·강도·잔상 정리. 광선이 위험 예고와 주인공을 가리지 않게 하고 피해 판정은 변경하지 않음.
3. 장비 효과/오라의 body-local 좌표·배경 대비·몸체 가림·시간축/저감 모션·과밀 상태 제한 확인. 승인된 원화 우선, 임시 자산이나 자동 최종 Lock 금지.
4. 사진의 장착 조합과 손상 수치를 재현해 내구도/버튼 교차, fitting 마지막 내용/적용 버튼 접근성을 실제 bounding-box로 확인.
5. 최신 CI 통과 뒤 GitHub/main 및 Vercel 운영 반영과 공개 운영 검증.

이번 첫 묶음은 그래픽 고도화 전체 완료나 보급 재개 문제 전체 해결을 의미하지 않는다.
