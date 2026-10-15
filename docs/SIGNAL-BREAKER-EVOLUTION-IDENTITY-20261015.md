# 장비 개조 외형·소켓 반영·전투 진화 정체성 개선

2026-10-15 · 사용자 요청 두 가지: 장비 진화·소켓 화면에서 개조 결과가 보이지 않는 문제와, 전투 중 무기 테크트리 선택의 차이가 작은 문제를 수정한다.

## 확인한 원인

장비 화면은 모든 티어에 같은 6종 아이콘을 사용했다. 전투 진화는 전격 두 종류가 거의 같은 원형 연결, 레이저 두 종류가 거의 같은 직선 판정을 공유했다. 확산/집중 및 최종 노드의 이름도 모든 무기가 같았다. 영구 개조와 작전 한정 진화가 서로 다른 상태라는 안내도 부족했다.

## 장비 진화·소켓 화면

- 기존 6종 공구의 정체성을 유지하면서 **6종 × 4단계 = 24개 개조 외형**을 제작했다. 보유 장비 아이콘·4단계 경로·큰 개조 미리보기에 각각 해당 이미지를 사용한다. 선택한 미리보기와 실제 보유 티어를 별도로 표시한다.
- 6개 장비 선택 탭으로 한 장비에 집중하도록 정리했다. 모든 장비의 긴 설명을 한꺼번에 쌓거나 전체 경로 이름을 반복하지 않는다.
- 선택 티어는 **독립적인 실제 Game lab 인스턴스**에서 발사한다. 실제 성장 효과, 탄속·연사·충격파·관통·장비별 필드와 장착 젬 수치를 반영한다. 미리보기에서 본편 스냅샷과 저장소가 바뀌지 않는지 검사한다.
- 발사 시연은 사용자가 누른 한 장비만 재생한다. 대화상자가 닫히거나 화면 밖으로 나가면 업데이트하지 않는다. 움직임 축소·낮은 품질에서는 정적 시연을 사용한다. 이미지·텍스트 비교는 계속 가능하다.
- 실제 부품으로 개조하거나 보유 젬을 장착하면 보유 외형·시연·소켓 색상·수치가 다시 반영된다. 미리보기로 강화나 젬을 지급하지 않는다.
- 상단에 **현재 작전 진화**와 영구 개조의 차이를 안내한다. 영구 T1~T4·장착 젬은 유지되며, 작전 조합과 전투 분기는 해당 작전의 상태다. 시연이 무엇을 반영하는지도 명시한다.
- 앵커 T4가 T3와 거의 같던 문제를 수정했다. T4는 명중 주변 최대 2개를 추가 연동하고, 총 5개 고정·유지 시간 +1.5초를 적용한다. ‘보스 기믹 완전 무력화’, ‘위험 가스 100% 차단’처럼 구현과 맞지 않는 설명을 실제 범위·효과로 수정했다.

## 전투 진화 — 작동 방식부터 구분

| 조합 | 작동 방식 | 확산 분기 → 최종 | 집중 분기 → 최종 |
|---|---|---|---|
| 폭풍 | 다음 적을 기준으로 번개가 차례로 도약 | 뇌우 분기 6연쇄 → 천둥 그물 8연쇄 | 장거리 낙뢰 260/3개 → 심판 낙뢰 340/4개 |
| 특이점 | 착탄점에 모든 재질을 당기는 실제 인력장 | 반경 285/4개 → 340/6개, 2.4초 | 인력 650 → 850, 2.4초, 장갑 집중 |
| 프리즘 | 전방 직선 관통 | 실제 3방향 발사, 빔당 5개 → 넓은 3방향, 빔당 7개 | 거리 600/4개 → 800/6개, 장갑 집중 |
| 플라즈마 | 착탄점 주변 원형 타격 + 억류장 | 반경 160/5개 → 230/8개·중심 회수장 | 반경 110/3개 → 150/5개·중심 회수장, 장갑 집중 |

프리즘 3방향 분기는 발사 간격을 ×1.45로 조정한다. 방향과 다수 타격의 이점을 얻는 대신 단일 발사 빈도는 낮아진다. 집중 분기는 기존 상성 장갑 손상 +3, 최종 추가 +3을 유지한다. 무기별 분기명·설명·최종 이름과 실제 범위·대상 수를 선택 UI에 표시한다.

특이점의 인력장은 금속을 게이트로 보내는 영구 자력 장비의 T4 효과와 분리했다. 플라즈마는 직선 판정을 공유하던 상태에서 원형 판정으로 바뀌었다. 시각 효과는 실제 필드 중심·반경과 적중 좌표를 사용하며, 효과만 재생하고 처치를 만드는 방식이 아니다.

발사된 탄의 recipe/branch/capstone 스냅샷을 유지한다. 비행 중 보조 장비를 바꾸어도 이미 발사한 탄의 조합은 바뀌지 않는다. 부품·웨이브·선행 조건, 양립 불가 분기, 체크포인트 검증은 유지한다. 상한은 탄 32개, 필드 3개, 개체 36개이며 렌더링 효과도 기존 품질별 상한을 유지한다.

## 이미지 제작 이력

- 방식: 내장 **image_gen**으로 기존 `breaker-six-tools-ui-v4.webp`를 스타일·정체성 참고로 24개 개조 외형 생성 후 여백 정리 편집. 캐릭터와 기존 원본은 교체하지 않았다.
- 최종 원본: `C:/Users/user/.codex/generated_images/01a13458-6d9f-7992-9023-d99924880690/exec-ce1d6f49-19e5-426f-a945-37b2495a29f5.png`.
- 게임 자산: [gear-evolution-atlas-v1.webp](../public/signal-breaker-dev/art/gear-evolution-atlas-v1.webp), **1024×1536, alpha 보존**, WebP quality 90 형식 변환. 균등 셀 경계로 공구를 자르지 않고 `tech-tree-art.js`의 24개 개별 source rectangle을 사용해 손잡이·호스·노즐을 보존한다.
- 생성 프롬프트:

> Use case: precise-object-edit / production game equipment atlas expansion. Input image is the game's approved six-tool reference sheet, style and identity reference only. Create a NEW exact 4-column by 6-row sprite atlas, 24 separate full objects, transparent background, square cells of equal size, image aspect ratio 2:3, ideally 1024x1536. Each row is ONE same industrial safety tool evolving left to right from Tier1 to Tier4. Row1 pneumatic copper pulse emitter; row2 green mesh net launcher; row3 cyan horseshoe electromagnetic tool; row4 amber mist sprayer and reservoir; row5 mechanical steel anchor cable winch; row6 purple optical scanner. Match reference yellow construction housings, scratched steel, copper chambers, industrial ergonomics, side/isometric view, all tools pointing right. Every object centered inside its own cell with 12% transparent padding, no object overlaps or crosses cell boundaries. Columns increase physical silhouette, not just hue: Col1 compact standard tool, Col2 dual chambers or paired mechanisms, Col3 expanded layered emitter cages / larger reservoir / triple coil or cable anchors as appropriate, Col4 impressive premium engineered multi-component ultimate with titanium braces and refined glowing energy core. Keep each row immediately recognizable as the SAME tool across tiers. Strong different silhouettes between columns, excellent 3D product rendering, detailed tactile materials, controlled glows contained within each cell. Consistent scale conventions and centered composition, enough padding for all 24 objects. NO text, numbers, tier labels, grid borders, UI panels, logos, characters, background scene, firearms or weapons of war. These are game construction safety devices. Do not reproduce the reference's 3x2 layout: output MUST be exactly 4x6 with row order specified.

- 여백 정리 편집 프롬프트:

> Edit this exact 4-column by 6-row equipment atlas. Preserve all 24 tool designs, row order, evolution progression, materials, lighting and view. This is a precise sprite-sheet cleanup. Remove the brown background completely and replace with TRUE TRANSPARENT ALPHA, not a colored backdrop or checkerboard. Keep every one of the 24 full tool objects entirely inside its own equal-sized square cell: four equal columns at x 0%,25%,50%,75%, six equal rows at y 0%,16.6667%,33.3333%,50%,66.6667%,83.3333%. Shrink and re-center each tool to leave at least 10% clear transparent margin on every side of its own cell. NO rear handles, pipes, muzzle tips or glow may cross a cell boundary. In particular columns 2 and 3 must not protrude into the previous cell. Maintain exactly four objects in every row and exactly six rows. No text, borders, grid lines, labels, backgrounds or new objects. Output exact 2:3 aspect ratio, 1024x1536 or equivalent.

## 검증 자료

- 독립 테스트 **330개 통과**. 실제 연쇄 경로, 4재질 흡인, 원형/직선의 판정 차이, 3방향 발사, 탄 정체성, 필드·앵커 상한, 24개 자산 영역 검사 포함.
- 루트 테스트 **2072개 통과 / 1개 제외**, 타입 검사와 프로덕션 빌드 통과.
- [8개 빌드 실제 완주](qa/evolution-identity-20261015/build-simulation.json): 같은 시드의 EP03 CH-02를 4조합 × 2분기로 실제 조작 API만 사용해 완료했다. 체력·처치·부품·승리를 주입하지 않았다. 전 빌드에서 최종 분기까지 도달하고 159/159 해소를 확인했다.
- [장비 화면](qa/evolution-identity-20261015/workshop-browser.json): 세로·가로·PC, 각 24단계 미리보기, 본편/저장 불변, 닫힌 시연 정지, 실제 첫 보스 보상으로 부품·젬을 얻어 개조·장착 후 재접속 확인.
- [전체 캠페인](qa/evolution-identity-20261015/campaign/full-journey.json): 세로·가로·PC의 15작전 전체 진행·진화·튜닝·보상·엔딩·재접속.
- [오프라인 장비 화면](qa/evolution-identity-20261015/lobby-offline.json): 신규 이미지가 캐시된 뒤 네트워크를 끊고 로비·장비 화면·T4 외형을 연다.
- 완성 빌드에서 장비 화면 3개 화면 크기 × 24단계, 실제 보스 보상 개조·소켓·재접속 3회, **전체 캠페인 45회 승리**를 모두 확인했다. 새 외형의 T1/T4 캡처와 저장 불변 검사를 함께 남겼다.
- [움직임 축소](qa/evolution-identity-20261015/reduced-motion.json): OS 설정을 reduce로 실행해 시연을 눌러도 자동 애니메이션이 시작되지 않고 정적 상태가 유지됨을 확인했다. 특이점·플라즈마 필드의 렌더링은 모든 품질/움직임 축소 조합에서 유한 좌표와 save/restore 균형을 검사했다.
- 실제 Android의 발열·터치 체감과 사람의 선호는 별도 확인이 필요하다.

릴리스: **0.66.0-evolution-identity**, 캐시 자산 **189개**. 공개 진입점: https://psi-zero-day.vercel.app/signal-breaker-dev/index.html
