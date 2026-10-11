# NEW-PSI 위험 신호 그래픽 교체 — 2026-10-11

## 적용

- `core-materials-v2.webp`: 실제 플레이 렌더러가 읽는 RGBA WebP, 1254×1254, 558,156 bytes. 2×2 순서: 금속 / 분진 / 전류 / 하중.
- 금속은 파편, 분진은 입자 구름, 전류는 절연체 사이 아크, 하중은 각진 인양 블록으로 구분한다. 기존 원형 v1 자산은 되돌리기 위해 보존한다.
- 셀 전체를 기존 판정 지름에 맞춰 그린다. 상태 표시만 판정 바깥에 배치한다. 움직임 감소 설정을 지키며 품질 옵션 때문에 판정이나 게임 상태가 바뀌지 않는다.
- 기존 안정화 노출 값을 진행 호로 표시하고, 완료하면 명도와 체크 배지를 바꾼다. 추가 게임 규칙이나 전류·분진 원인 통제 시나리오를 구현한 것으로 계산하지 않는다.
- 새 오프라인 캐시 버전에 v2 자산을 연결했다. 실제 단말의 완전 오프라인 복구 및 FPS는 별도 확인 대상이다.

## 제작 및 검증 범위

내장 이미지 생성 도구로 새 원본을 제작했다. 기존 게임 자산을 참조하지 않았다. PNG→WebP 변환만 수행했고 창작 보정이나 리사이즈는 하지 않았다. 생성 자산의 상업 이용 권리 및 완성 게임의 저작권·상표 검토가 끝났다는 의미는 아니다.

로컬 모드 회귀 테스트 67개 통과. 네 화면 크기 브라우저 검증에는 새 자산 로드와 네 재질 프레젠테이션 fixture를 추가했다. 브라우저 결과는 연결된 CI 실행에서 확인한다. fixture 화면은 실제 플레이 밸런스 검증이 아니다.

## 최종 생성 프롬프트

Create a production quality original game sprite atlas, square canvas, exactly 2 columns and 2 rows equal square cells, transparent background with genuine alpha. Four individual isolated industrial hazard signal objects, each centered in its cell with ample transparent margin, no overlap, no text, no logos, no frames, no cast shadow outside objects. Top left: asymmetrical compact bundle of fractured brushed steel plates and exposed cyan signal filaments, strong metallic silhouette, not a sphere. Top right: concentrated warm ochre mineral dust cloud with fine particulate edges and a clearly visible dense amber center, no mechanical cage, cloud silhouette. Bottom left: branching violet electrical arc between two compact charcoal ceramic insulators, distinctive zigzag silhouette, controlled luminous edges. Bottom right: compact angular orange steel suspended load block with two diagonal braided tension cables, clearly square/angular silhouette. All four objects fit within a centered circular footprint occupying 72 percent of each cell width and height. Sophisticated stylized realistic 3D game art, detailed physically based metal, convincing depth, premium cinematic directional lighting from upper left, crisp silhouette legible at 48 pixels, restrained internal glow, clean antialiased alpha edges, absolutely no colored matte fringes or black baked backgrounds. Shared industrial science-fiction art direction for NEW-PSI, safety hazards are signals not creatures or enemies. Entirely original designs; no references to existing game characters, weapons or recognizable franchises. The grid is a sprite export layout, NOT a poster or concept sheet.
