# G7 DATA-CENTER-01 — 데이터센터 공정·에너지 상태 연구 기준선

상태: `RESEARCH_BASELINE`  
목적: 데이터센터를 단순한 "전기 위험이 큰 건물"로 만들지 않고, **MEP 다공종 시공 → 전기/UPS 설치·시험 → 통전 → 통합시운전**으로 갈수록 위험의 성격이 바뀌는 현장으로 모델링한다.

## 1. 게임에서 피해야 할 단순화

- 데이터센터 = 감전 위험 하나로 표현하지 않는다.
- 통전 전/후를 같은 맵에 숫자만 올리는 방식으로 처리하지 않는다.
- BOSS를 거대한 적으로 만들지 않는다. 데이터센터의 BOSS는 **여러 활성 계통과 작업팀이 동시에 연결된 복합사건**이다.
- 실제 전기 조작 절차를 게임 튜토리얼처럼 상세히 가르치지 않는다. 게임은 "상태 확인·격리·권한·검증이 선행되어야 다음 단계가 열린다"는 판단 구조를 다룬다.

## 2. 공신력 기준에서 읽히는 핵심

산업안전보건기준에 관한 규칙은 전기기계·기구의 충전부 방호, 전기작업자의 제한, 정전전로 및 충전전로 작업에 관한 조치를 규정한다. 또한 전기회로의 개방·변환·투입은 적합한 차단기 등을 사용하고, 자동 차단 후 안전이 증명되기 전 재투입하지 않도록 규정한다.

안전보건공단의 수전설비 안전관리 실무자료는 수전설비 작업에서 충전부 접촉에 의한 감전, 아크 화상, 관계자 외 접근, 조도 부족, 기계장치의 충전선로 접근 등을 주요 위험으로 제시한다.

따라서 G7에서는 "통전 여부"를 배경설정이 아니라 **세계 상태**로 사용한다.

## 3. 핵심 상태

- `ENERGY_STATE`
  - NOT_INSTALLED
  - INSTALLED
  - TESTING
  - LOCKED_OUT
  - ENERGIZED
  - LIVE_CRITICAL
- `SYSTEM_ISOLATION_STATE`
  - UNDEFINED
  - PLANNED
  - VERIFIED
- `INTERLOCK_STATE`
  - UNVERIFIED
  - VERIFIED
- `COMMISSIONING_STATE`
  - NOT_STARTED
  - PRECHECK
  - SINGLE_SYSTEM_TEST
  - INTEGRATED_TEST
  - VERIFIED
- `CROSS_TRADE_CONCURRENCY`
  - LOW
  - MEDIUM
  - HIGH

## 4. 대표 Vertical Slice

`DATA_CENTER / ELECTRICAL_UPS / COMMISSIONING`

흐름:

`MEP Rough-in 정리 → 전기/UPS 설치상태 확인 → 계통 경계/격리계획 확인 → 통전 전 점검 → 제한된 통전 상태 → 인터록 확인 → 단일계통 시험 → 통합시운전 → 검증완료`

## 5. Risk ID 변화

### MEP Rough-in
- SWARM: 케이블트레이·덕트·배관·장비 설치의 동시작업
- VEILED: 천장/바닥/샤프트에 누적되는 숨은 인터페이스
- SWIFT: 자재·장비 반입 동선

### Electrical / UPS 설치·시험
- ARMORED: 중량·전기 에너지·설비 자체의 큰 에너지
- VEILED: 설치된 계통의 실제 에너지 상태와 식별 불확실성

### Energization
- ARMORED가 상위로 이동
- VEILED는 "어디가 실제로 활성 상태인가"를 읽는 문제로 남음
- 무단 접근/상태 오인 방지를 세계 상태와 UI로 표현

### Integrated Commissioning
- BOSS: 여러 활성계통, 시험팀, 제어/인터록, 냉각·전기·IT 관련 상태가 결합된 복합사건
- SWARM: 다팀 동시작업
- VEILED: 상태전환과 인터페이스 불확실성

## 6. 대표 맵 문법

- MEP service corridor
- electrical / switchgear zone
- UPS / stored-energy zone
- restricted live-system boundary
- commissioning interface zone
- worker route / equipment route / cable-material route
- intervention anchor:
  - SENSOR: 상태 확인
  - CONTROL: 접근/작업구역 통제
  - PULSE: 명확한 단일 위험의 즉시조치
  - BURST: 다공종 간섭 정리

## 7. 공신력 기준

- 국가법령정보센터, 「산업안전보건기준에 관한 규칙」 제301조 및 제317조~제323조 전기 위험 방지 관련 조항
- 안전보건공단, 수전설비 안전관리 실무정보
- KOSHA GUIDE E-106, E-60, E-157, E-155 등 전기설비·정전전로·전기작업 위험성평가 관련 기술지침
- 안전작업허가 관련 KOSHA 자료의 작업구역 확인, 차단·식별, 작업완료 보고 원칙

## 8. G7 범위 제한

이번 Gate에서는 데이터센터 전체를 만들지 않는다.

오직:
1. 에너지/시운전 상태 모델
2. 대표 1개 데이터센터 맵
3. 상태에 따른 Risk top-3 변화
4. 안전한 통전/시운전 선행조건 Gate
5. 동일 DefenseGame 진입
6. PC / 390×844 QA

까지만 검증한다.

Production final art는 topology/runtime proof PASS 후 별도 Gate에서 잠근다.
