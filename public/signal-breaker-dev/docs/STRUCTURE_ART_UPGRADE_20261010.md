# 맵 구조물 원화 고도화

배경과 구조물의 재질 차이를 줄이기 위해 단색 도형으로 표시하던 방호판·범퍼·전자석·회수 게이트·릴레이·보스 본체를 전용 원화로 교체했다. 금속 베벨·볼트·고무·코일·작업등을 같은 조명 방향과 색감으로 제작했다. 컨베이어는 실제 접촉면 위치를 유지하며 금속 음영·볼트·롤러·이동 표식을 보강했다. SB-02–04도 첫 챕터의 현장 원화 배경을 공유한다.

게임 규칙·충돌 위치·회수 조건은 변경하지 않았다. 원화 위에 기존 방호판 회전, 범퍼 압축, 게이트 통과 표시, 릴레이 전류, 보스 약점 상태를 연결했다. 저품질 설정에서도 원화와 필수 상태 표시는 유지한다. 로딩 실패 시 기존 도형 표시는 남지만 최종 원화로 집계하지 않는다.

## 자산 제작

Built-in imagegen, transparent_background=true. 원본: C:/Users/user/.codex/generated_images/01a11d14-64ed-7052-a499-63110506a078/exec-87d22166-ff34-4b0d-8d50-2613d1056566.png. 실제 1536×1024 RGBA. Pillow는 WebP 형식 변환에만 사용했고 배경 제거·새 그림 생성에는 사용하지 않았다. 출력: art/industrial-structures-v1.webp.

자동 생성 결과의 배치는 정확한 등분 셀이 아니므로 각 기계의 실제 영역을 측정해 렌더러에서 개별 crop으로 사용했다. 알파 채널과 실제 브라우저 합성을 확인했다. 하나의 아틀라스(442,484 bytes)로 공유 로딩하며 매 프레임 새 이미지를 만들지 않는다. 배경 패널 가장자리의 밝은 제작 테두리도 crop에서 제외했다.

## 검증

첫 챕터 5판 및 기존 시험판 4판 렌더 경로, 실제 브라우저 오류 없음. CH-01·04·05와 SB-03 화면 저장. 온라인에서 로딩한 캐릭터·장비와 새 구조물의 오프라인 재진입 확인. 모드 테스트 31개, 본편 회귀 2,037개 통과(1개 제외), 타입 검사 및 production build 통과. 사람의 미술 최종 승인과 실제 모바일 성능 평가는 별도다.

## 사용 프롬프트

Production game sprite atlas for SIGNAL BREAKER industrial side-view arcade. TRUE ALPHA TRANSPARENT background. Exactly SIX isolated machinery sprites in equal cells, 3 columns by 2 rows, centered with 12 percent padding, no overlap. Same painterly realistic 3D metal material finish as cinematic construction delivery bay at dusk: weathered dark teal steel, brushed silver bevels, bolts, rubber, restrained amber worklights, soft warm top-left key light and cool teal rim, crisp phone-readable silhouette. TOP LEFT: long horizontal narrow pivoting steel deflector beam, length to height 8:1, reinforced reflective upper edge, hazard-striped segments, no external stand. TOP MIDDLE: circular industrial rubber impact buffer, frontal view concentric thick rubber tire, steel bolted mounting flange, dark center. TOP RIGHT: electromagnet coil machine front-facing round center with steel horseshoe and ribbed copper coils, compact symmetrical silhouette. BOTTOM LEFT: tall narrow recovery portal, front view two armored pillars and connecting top/bottom steel frame, dark hollow transparent central opening, teal small status lamps; width to height 1:3. BOTTOM MIDDLE: relay node front circular mechanical electrical junction, silver bolted frame, amber lens center. BOTTOM RIGHT: large round industrial boss relay reactor front-view, concentric armored steel plates, six mechanical clamps, dark central energy aperture and restrained violet cyan seams. No glow clouds, no ground shadow outside objects, no floating UI rings, no labels, no letters, no people, no scenery. Everything outside machinery and portal opening is transparent alpha, not a brown or black backdrop. High-end authored production assets, not icons or simple vector shapes.
