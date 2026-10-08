# 난이도·지형 구현 기록

2026-10-09, 기획서의 기본 플레이 규칙을 구현했다.

## 적용 사항

- 입문/표준/고난도/극한의 체력 계수를 0.75/1.15/1.35/1.55로 설정했다. 속도는 0.9/1/1.08/1.12, 등장 간격 계수는 1.25/0.9/0.8/0.7이다. 강화 위험의 등장 시점은 기존 난이도별 차이를 유지한다. 일반 카트·가스·낙하 예고를 입문에서 길게 주며 카트 예고는 최소 0.85초, 가스와 반복 보스 낙하 예고는 최소 0.9초를 유지한다. 별도로 연출된 시그니처 이벤트의 예고는 원래 타임라인을 유지한다.
- 50개 스테이지에 고정 기둥 2개, 낮은 차폐 1개, 정리 가능 잔재물 1개를 배치한다. 목표·설비의 물리적 위치와 겹치면 후보 위치로 옮긴다. 시작·탈출의 중앙 세로 동선을 열어 두고 장애물을 난이도마다 몰래 변경하지 않는다.
- 플레이어와 지상 접근형 위험은 장애물을 통과하지 않는다. 이동은 모서리를 따라 미끄러지고 추적 경로는 장애물 모서리를 우회한다. 카트는 예고한 방향으로 돌진하며 지형 충돌 시 제동하고 2초간 약점을 노출한다. 충돌 자체에 무료 처치·보상은 없다.
- 무전·드론·헌터·그라우트·분사 투사체는 차폐에 막힌다. 자동 조준은 사선이 열린 대상을 우선한다. 확장형 광역·전기 효과는 차폐를 넘으며 가스와 낙하 위험도 엄폐로 막을 수 없다. 드론도 직접 사선을 확인한다.
- 잔재물은 근처의 T/정리 버튼을 두 번 사용해 제거한다. 정리 동작은 최소 0.6초 간격이며 자원·점수·경험치를 생성하지 않는다. 일반 탄환으로도 정리할 수 있다. 고정 기둥은 파괴하지 않는다. 드롭이 지형 안에 생기면 가장 가까운 접근 가능한 가장자리로 보정한다.
- 준비 화면에 난이도별 플레이 성격과 지형 설명을 제공한다. 보급소는 기존 일시정지 유지, 구매 가능한 후보가 남아 있고 예산이 충분하면 최소 한 개를 목록에 넣는다. 다음 웨이브의 현장 위험과 대응 요령을 확인할 수 있다.
- 결과 화면에 난이도, 지형 카트 제동, 통로 확보, 약점 적중, 받은 피해를 표시하고 스테이지·난이도별 최근 기록을 로컬 저장한다. 동선 확보와 무피해 성공 표시는 전투 능력을 추가하지 않는다. 실패 때 마지막 피해 유형에 따른 다음 대응을 알려준다. 서로 다른 성장 조건의 기록을 순위로 비교하지 않는다.

## 이미지

public/assets/survivors/terrain-workface-v1.png는 built-in image_gen으로 생성한 3×1 투명 아틀라스다. 고정 기둥·낮은 차폐·비구조 잔재물을 제작했다. 원본을 확인한 뒤 프로젝트에 복사했다. 충돌 경계는 별도 바닥 선으로 표시하고 플레이어가 가까우면 오브젝트 이미지를 반투명하게 한다. 기존 위험 경고는 이미지 위에 표시한다.

최종 프롬프트: Production transparent game sprite atlas for industrial worksite survival shooter. Strict 3 equally sized columns in one row, isolated object per cell, generous transparent margins, no overlap. Three detailed hand-painted semi-realistic 3/4 isometric industrial objects: left a short massive square concrete foundation pier with chipped edges and yellow corner strips, center a low stack of steel plates and metal storage crate serving as waist-height shielding, right a small pile of nonstructural masonry rubble and broken bricks in a marked clean-up area. Muted concrete gray charcoal steel safety yellow and rusty brick red. Match premium worn industrial equipment game assets. Camera from above enough to read footprints. Objects occupy centered lower 70% of each uniform square cell. No text, no arrows, no people, no background, real transparent alpha, no floor planes. One single 3x1 atlas PNG.

## 검증과 범위

단위 검증은 대시 관통 방지·벽 미끄러짐·우회 도달·사선 선택·카트 제동과 약점·탄환 차폐·잔재물 정리·50개 스테이지 중앙 통로와 목표 위치·난이도 예고 차이를 다룬다. 브라우저 검증은 실제 엔진에 지형 상황을 주입하여 PC/세로 모바일/가로 모바일에서 동작과 이미지 로딩을 확인한다. 결과는 artifacts/terrain에 기록한다.

기획서의 대규모 맵 변화, 신규 생성원 몬스터, 웨이브 중 동선 폐쇄, 성장 조건을 맞춘 순위 경쟁은 이번 기본 규칙에 포함하지 않는다. 예고 없는 폐쇄와 숨은 실력 연동은 도입하지 않는다. 난이도 수치의 체감과 시간당 보상 균형은 현장 사용자 플레이를 통한 후속 튜닝이 필요하다. 높은 난이도의 가치를 체력 증가만으로 만들지 않고 기존 강화 위험과 지형 대응을 먼저 시험하는 구현이다.
