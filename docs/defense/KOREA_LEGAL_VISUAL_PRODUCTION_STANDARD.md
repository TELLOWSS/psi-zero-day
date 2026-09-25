# PSI : ZERO DAY — 대한민국 법규 기반 초고퀄리티 이미지 제작 표준

상태: **ABSOLUTE PRODUCTION STANDARD**  
기준일: **2026-09-25**

이 문서는 모든 맵·캐릭터·장비·가설시설·안전시설·위험상황 이미지 제작의 공통 Gate다.

## 1. 절대 원칙

1. **법규가 먼저, 이미지가 나중이다.**
2. 법적 수치·거리·높이·각도·허용범위는 임의 생성하지 않는다.
3. 실제 회사명·현장명·피해자를 그대로 쓰지 않는다.
4. 위험 장면은 만들 수 있다. 다만 반드시 `HAZARD_SIGNAL` 또는 `TRANSITION`으로 취급하고, 안전한 정상상태처럼 보이게 만들지 않는다.
5. Final Art는 WebP / PNG / JPG / AVIF. 저급 SVG·픽토그램·벡터 placeholder를 Final로 승격하지 않는다.
6. **ONE PRODUCTION GENERATION**: 맵만 영화급이고 타워·위험·캐릭터가 구형이면 FAIL.
7. **MOBILE FIRST**: 390×844에서 법적 안전요소와 핵심 위험이 읽혀야 한다.
8. 이미지가 gameplay 좌표의 권위가 되지 않는다. route/pad/risk 좌표는 코드가 권위값이다.

## 2. 법규 검증 파이프라인

`LEGAL FACT SHEET → TECHNICAL BLOCKOUT → HIGH-END RENDER → LEGAL VISUAL QA → GAMEPLAY QA → PRODUCTION LOCK`

### LEGAL FACT SHEET
장면마다 먼저 작성:
- 공종 / 공법 / 공정
- 장면 의도: COMPLIANT / HAZARD_SIGNAL / TRANSITION / AFTERMATH
- 적용 법령·조문
- 반드시 보여야 할 안전상태
- 위험상태로 보여도 되는 항목
- 숫자 검증이 필요한 항목
- 최종 검증일

### TECHNICAL BLOCKOUT
- 1000×600 runtime topology와 동일한 5:3 구도
- route/pad는 코드 좌표로만 고정
- 법규상 중요한 단부·개구부·통로·차량동선·격리구역을 먼저 배치
- AI가 임의로 구조물을 옮기지 못하도록 anchor mask / composition reference 사용

### HIGH-END RENDER
권장 master:
- Map: **4000×2400 이상**, 5:3
- Character full body: **2048×3072 이상**, transparent
- Props / equipment: **1536×1536 이상**, transparent
- Runtime: 원본 master에서 WebP/PNG로 파생

품질:
- 한국 건설현장 재질과 마모
- 실제 장비 비례와 중량감
- 자연광/현장조명 일치
- PPE 착용 디테일
- 흙·콘크리트·강재·가설재의 물성 차이
- 반복 텍스처, AI 글자, 가짜 로고, 왜곡된 장비 구조 금지
- HUD/텍스트/위험아이콘은 배경에 굽지 않음

## 3. 공종별 필수 법적 고증

### 순타·굴착
- 굴착 사전점검
- 굴착면 붕괴방지/흙막이
- 배수·용수 상태
- 차량계 건설기계 유도·접촉방지
- 안전 통로
- 단부/개구부 추락방지
- 토사 반출 흐름

### 역타·슬래브 하부굴착
- 제한된 시야와 작업공간
- 개구부/반출구 방호
- 장비/근로자 동선 분리
- 임시통로
- 흙막이/지보 상태

### 공동주택 리모델링
- 기존구조 조사
- 설비 이동·철거·보호
- 선택철거 순서와 구조안전
- 임시지지
- 안전통로·낙하방지
- 해체물 처리
- 기존/신설 접합부
- 증축규모를 임의로 2배 확대하지 않음

### 데이터센터
- MEP 인터페이스
- 전기실·UPS 구역
- 통전 전/후 상태의 명확한 차이
- 충전부 접근경계
- 격리/검증 상태
- 유자격 전기작업자 상태
- 통합시운전 복합상태

## 4. Production Lock 실패조건

다음 중 하나라도 있으면 LOCK 금지:
- 적용 법령 미기록
- 최신 법령 검증일 없음
- SVG/픽토그램 final art
- 안전모·안전대·안전화 등 PPE가 작업조건과 불일치
- 개구부/단부/통로/차량동선이 장면 의도와 불일치
- 굴착·해체·전기 상태가 실제 공법과 모순
- 실제 회사/현장/피해자 식별정보 노출
- AI 텍스트/로고 오염
- 390×844에서 위험과 조치가 식별되지 않음
- map/tower/risk/character가 서로 다른 품질 세대
- 실제 브라우저 스크린샷 검수 미완료

## 5. G8-A 현재 Gate

현재 `공동주택 신축 · 순타 · 개방 굴착`은 **HD_REFERENCE_ONLY**다.

다음 Final Map은:
- process-specific non-SVG raster
- 대한민국 굴착/차량계 건설기계/추락방지 법규 고증
- 실제 현장 재질·장비·흙막이·램프·배수·통로가 읽히는 월드
- 4000×2400+ master → runtime WebP
- 같은 화면의 대표 CONTROL / SWIFT도 동일 품질 세대

까지 완료한 뒤에만 Production Candidate로 승격한다.
