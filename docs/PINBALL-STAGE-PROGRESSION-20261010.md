# 현장 돌파 보상과 선택형 핀볼 성장

## 플레이 흐름

구역 완수 → 장비를 살 크레딧 확보 → 새 핀볼 배경·규칙 해금 → 원하는 조합으로 짧게 쉬거나 반복 연습 → 다음 구역. 안전을 지킨 실제 완수가 보상의 조건이며, 선택형 휴식으로 본편의 피로를 풀게 한다. 기존 점수·웨이브 보상은 유지하고 추가 정산만 연결한다.

## 클리어 크레딧

구역 번호 n에 대해 일반/스토리 난이도 기본 완수 보상은 `min(1200, 200 + (n−1)×50)` PSI. 처음 돌파한 구역은 `min(2000, 400 + (n−1)×100)` PSI 추가. 달성한 별 하나당 50 PSI, 최대 150 PSI 추가. 어려움은 완수·첫 돌파 금액 ×1.5, 극한은 ×2. 점수 보상과 합산하며 별 보상에는 난이도 배율을 적용하지 않는다.

| 구역 | 매번 완수 | 첫 돌파 추가 | 별 3개 포함 첫 완수 합계 |
| --- | ---: | ---: | ---: |
| 1 | 200 | 400 | 750 |
| 3 | 300 | 600 | 1,050 |
| 5 | 400 | 800 | 1,350 |
| 10 | 650 | 1,300 | 2,100 |
| 20 | 1,150 | 2,000 | 3,300 |
| 50 | 1,200 | 2,000 | 3,350 |

위 표는 일반 난이도이며 기존 점수 보상은 제외한다. 재도전에도 기본 완수·별 보상은 지급하고 첫 돌파 추가만 제외한다. 첫 돌파 수령 구역을 권위 있는 장비 지갑의 `clearRewardClaims`에 잔액과 함께 기록한다. 저장 실패 시 지급·청구 기록 모두 남기지 않고 결과 화면에서 재시도한다. 이미 완료된 구역은 기존 별/성장 기록으로 판별해 첫 돌파를 중복 지급하지 않는다. 패배에는 추가 클리어 보상을 주지 않는다.

## 핀볼 해금과 선택

진행도는 **서로 다른 완수 구역 수**다. 다른 캐릭터·난이도로 같은 구역을 반복해도 해금 수가 늘지 않는다. 기존 별, 검증된 캐릭터 성장 기록, 지갑 수령 기록을 합쳐 복구한다. 단순히 다음 구역이 열렸다는 이유로 완료로 계산하지 않는다.

| 완수 구역 수 | 새 배경 | 새 규칙 |
| --- | --- | --- |
| 0 | 야간 공장 | 정통: 세 범퍼 점등, 10초 세 공 러시 |
| 1 | 청빛 항만 | 리듬 연쇄: 연쇄 유지 3초, 스킬샷 4초 |
| 3 | 용광로 제철소 | 러시 축제: 서로 다른 두 범퍼 점등, 12초 세 공 러시 |
| 5 | — | 정밀 타격: 퍼펙트 500/러시 1,000점, 스킬샷 750점 |

배경과 규칙은 독립 선택, 무료 해금이다. 발사 전에 선택하고 진행 중에는 바꾸지 못한다. 선택은 오프라인 저장하며 손상/잠긴 선택은 기본값으로 복구한다. 기록은 규칙별로 분리해 비교가 공정하도록 한다. 기존 정통 기록은 그대로 읽는다.

핀볼 보너스는 완수 구역 수 c에 따라 기본 `min(300,100+20c)` PSI, 한 판 최대 `min(1200,400+60c)` PSI. 점수 100당 추가 5 PSI 방식은 유지한다. 연습은 같은 해금·규칙·물리를 사용하지만 모든 조합에서 지급 0이며 지갑 지급 콜백을 호출하지 않는다.

## 화면과 원화

‘배경 · 재미 선택’에서 세 배경 썸네일과 해금 조건, 규칙별 정확한 효과를 보여 준다. 데스크톱 선택 화면은 기존 콘솔 안에서 스크롤한다. 모바일은 정지 중 넓은 하단 선택 패널을 열며 테이블 크기와 위치를 유지한다. 설정을 열면 공과 시간·소리가 정지한다. 새 원화는 기존 최종 후보 테이블을 직접 편집한 full table 이미지이며 범퍼·레일·회수구 위치를 유지한다. 색 필터로 배경 다양성을 대신하지 않는다. 바닥/기계 재질과 조명, 항만 물류·제철 현장 세부를 다르게 그렸다.

### 원화 제작 기록

사용 방식: built-in image_gen 편집. 기준: `public/assets/survivors/pinball/factory-playfield-v2.png`. 출력: `harbor-playfield-v1.png`, `steelworks-playfield-v1.png` (1024×1536). 두 결과를 직접 확인하고 프로젝트 자산으로 복사했다. 최종 품질의 사용자 체감 승인을 자동 검사로 대체하지 않는다.

항만 프롬프트: Edit target: the provided premium factory pinball playfield. Create a final production NIGHT HARBOR cargo terminal variant of this exact game asset, portrait 2:3. Absolutely preserve pixel positions, sizes and silhouette of all three circular bumpers, both slings, every collision rail, bottom drain, and empty lower field for animated flippers. No flippers, balls, UI or text. Preserve top-down orthographic camera and playable geometry. Transform ONLY floor materials, decorative machinery beyond rails, and lighting: dark navy blue brushed steel plates, crisp cyan working lights, silver bumpers with cyan indicator lamps, orange harbor gantry crane above, container logistics detail confined to outside rail/top machinery area. Elegant cinematic photorealistic rendered miniature mechanical pinball table, tactile weathered metal, coherent shadows, extremely detailed final game art; floor stays matte and bright enough to read a small chrome ball. No fog, no huge blooming glare, no new obstacles, no position shifts. Single finished full table image, not mockup.

제철소 프롬프트: Edit target: this premium factory pinball playfield. Produce final production STEELWORKS furnace shift variant, portrait 2:3. Lock geometry precisely: all three circular bumpers stay at identical centers and sizes, slings and all boundary rails retain identical shape/position, lower empty floor/drain remain unchanged, no animated flippers or balls drawn. Top-down orthographic view. Replace only decorative materials, surroundings and lighting: dark graphite steel floor, deep red enamel trim, copper/brass bumper assemblies with warm amber lamps, steel foundry furnace glow ONLY outside upper rails, overhead heavy gantry crane, finely rendered heat-worn pipes and cooling duct machinery framing the table. Strong contrast and exquisite miniature tactile realism, aged brass and blackened steel, premium detailed mechanical pinball art. Warm molten orange focal accents against restrained dark red industrial edges; matte readable central floor for chrome game ball. No fire over playable field, no fog, no bloom washing out the rail, no text, no UI, no new obstacles. Single full finished table preserving input's spatial registration.

## 검증

구역·난이도 보상 경계, 첫 돌파/재도전, 지갑 잔액과 청구의 원자 저장, 저장 실패 재시도, 중복 클리어 수 방지, 기존 저장 해금, 잠긴 선택 차단, 모든 규칙의 실제 물리 조건과 연습 지급 0, 규칙별 기록, 선택 저장, 모바일 선택/전체화면·정지 흐름을 확인한다. 브라우저 클리어 QA는 엔진의 명시적인 승리 상태 배치로 정산 연결을 검사하며 자연 플레이 완료로 표현하지 않는다.

### 실행 결과

- 전체 테스트 1,969 통과 / 1 제외. typecheck와 production build 통과.
- 실제 앱에서 첫 돌파 지갑 저장 실패 → 재시도 → 750 PSI 정산, 재도전 추가 350 PSI로 누계 1,100, 첫 돌파 청구 1회 확인. 해당 수치는 명시적인 엔진 승리 fixture의 기존 획득 100 PSI와 별 1개 기준이다.
- 기존 완료 기록 0·1·3·5개로 해금, 선택 저장, 선택한 엔진 규칙과 보상 예산, 활성 판 변경 차단을 확인. PC/모바일 세로·가로 총 6개 조합 통과.
- 모바일 하단 선택 패널을 추가 검증하고 스크린샷 확인. 기존 핀볼 5화면 수동·멀티터치·전체화면·정지·연습 지갑 회귀도 통과.
- 규칙별 개인 기록을 분리하고 기존 정통 기록을 유지한다. 모든 연습 규칙은 PSI 0.
