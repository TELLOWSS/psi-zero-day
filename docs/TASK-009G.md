# TASK-009G — 8인 캐릭터 실제 게임 자산 분리 제작

## 목적

TASK-009E/009F에서 승인된 상용 캐주얼 전략 비주얼을 실제 게임 자산 단위로 분리한다.
한 장의 홍보용 콘셉트 이미지가 아니라, 각 인물이 portrait/map sprite/expression에서 동일 인물로 유지되어야 한다.

## 승인 기준

- 8명은 이름표 없이도 서로 구분 가능해야 한다.
- 안전모 색만으로 구분하지 않는다.
- `체형 + 얼굴 + 복장 + 소품 + 자세` 중 최소 3개가 캐릭터마다 명확히 달라야 한다.
- Player는 젊은 여성 현장 안전관리자로 유지한다.
- 강태식/윤성호, 이재훈/임준호, 서정민/오승재는 특히 look-alike 금지 쌍으로 관리한다.
- 상용 캐주얼 전략게임 수준의 친근한 3D/2.5D 미감을 유지하되 유아틱하지 않는다.
- 실제 회사 로고, 현장명, 의미불명 문자, 과장된 슬랩스틱 사고 표현은 넣지 않는다.

## 게임용 산출물

각 캐릭터마다 다음 산출물이 필요하다.

1. `portrait.webp`
   - 상반신 중심.
   - 투명 배경.
   - 원본 1024×1024 이상.
   - 대화창/인물카드에서 얼굴과 소품을 즉시 읽을 수 있어야 한다.

2. `map.webp`
   - 전신 3/4 view.
   - 투명 배경.
   - 원본 768×1024 이상.
   - 52~64px 수준으로 축소해도 실루엣과 대표 소품이 남아야 한다.

3. 표정 5종
   - neutral / concern / resolve / relief / conflict.
   - 표정이 달라도 얼굴형과 연령감이 변하지 않아야 한다.

## 캐릭터별 핵심

- Player: 젊은 여성, compact athletic, 흰/청 안전모, 청색 안전조끼, 검측 태블릿.
- 강태식: 50대, broad heavy square, 주황 안전모, 콧수염, 장갑, 지시 자세.
- 윤성호: 40대 후반, muscular V, 황색 안전모, 탄 피부, 철근 묶음.
- 이재훈: 30대 초반, tall slim, 흰 안전모, 깔끔한 공사대리, 말린 도면.
- 임준호: 20대 초반, small narrow, 둥근 얼굴, 녹색 조끼, 무전기.
- 최민석: 30대 후반, dynamic raised arms, 주황 고시인성 조끼, 빨간 수신봉 2개.
- 서정민: 40대 중반, lean formal, 안경, 어두운 점검복, 클립보드.
- 오승재: 40대 초반, broad managerial, 짙은 현장재킷, 휴대전화/무전기.

## 데이터/검증

- 제작 규격: `content/episode01/character-art-production.json`
- 회귀 테스트: `tests/character-art-production.test.ts`
- 런타임 슬롯: `content/episode01/visuals.json`
- 실제 파일이 없는 동안 CSS fallback 유지.
- 최종 WebP가 등록되면 TASK-009D 자산 resolver가 자동 사용.

## 다음 제작 단계

첫 산출물은 **8인 Character Master Sheet**다.
한 화면에서 8명 전신과 대표 소품을 비교해 silhouette collision을 잡은 후, 캐릭터별 portrait와 map sprite를 개별 export한다.

