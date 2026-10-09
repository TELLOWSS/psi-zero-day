# 주인공 집중·숙련 원화 납품 계약

2026-10-09 V2 순서2 실행 조사. 기존 인물 얼굴/나이/체형/PPE와 기본 tablet 유지. 최종 파일과 새 표시 조건은 별도 검수이며 기존 시그널워치 관심사 CG를 단계 원화로 재사용하거나 재명명하지 않는다.

| 단계 | 기존 명시 조건 | 기존 표현/도구 | 원화 납품 방향 |
|---|---|---|---|
| initial | growth.player 미설정/유효하지 않은 값 | attentive/careful, safety_tablet | 기존 승인 초상 유지 |
| focused | growth.player=focused | resolved/decisive, tablet+inspection_camera | 확인 대상을 보며 판단을 정리한 자세, 카메라는 보유 도구이지 자동 장착 아님 |
| skilled | growth.player=skilled | calm_confident/commanding, tablet+camera+stopwork_card | 침착한 안내 자세, 계급/훈장/자격 변경 없음 |

기존 `training.player.site_basics`는 focused와 camera 보유를 연결하고 auto_equip은 비어 있다. 숙련 단계 도달 조건은 이 조사에서 새로 만들지 않는다. 신규 점수/처치횟수/관심사 선택으로 skilled를 부여하지 않는다.

실제 투영은 character-growth.ts→PlayableEpisode→CharacterCard이고 장비 투영은 character-loadout.ts다. 24개 표현 계약을 한국어로 표시하며 enum/플래그/인벤토리는 유지한다. 사용자가 집중 단계 초상을 디자인·파일 단위로 승인하여 player와 focused가 동시에 일치할 때만 연결했다. 초기·숙련·다른 인물은 기존 초상이며 로딩 실패 시 기존 초상으로 복구한다. 정확 파일과 SHA는 PLAYER-FOCUSED-PORTRAIT-APPROVAL.json을 따른다. 숙련 그림은 아직 연결하지 않았다.

로컬 전체 회귀 1,924건 통과/1건 제외 및 prebuild/build 성공 후, 실제 CharacterCard/제품 CSS의 PC·폰 세로·가로 18경로를 검증했다. 초기/focused/skilled/다른 인물/invalid/로드 실패 fallback을 확인했다. 첫 모바일 캡처에서 기존 CSS worker-mark가 투명 초상에 겹쳐 focused에만 loaded 시 숨기고 contain을 적용했다. 재검증에서 디코딩/비어 있지 않은 픽셀/넘침/오류/fallback/표시 비율 통과, 폰 세로 직접 화면 확인. 수정 후 타입·Vite build 재통과. 이 증거는 분리 fixture이며 실제 본편 전체 레이아웃·자연 훈련 도달·실기기 검증이 아니다. GitHub/Vercel 동기화는 사용자 요청 전 진행하지 않는다.

단계별 새 최종 파일 제작 시 identity reference와 정확SHA, 투명 초상/장면 CG의 슬롯 구분, 얼굴/PPE/도구/크롭, actor/stage 분리, invalid flag 초기 복귀, 장비 미자동장착, 저장 무변경 검증이 필요하다. 실기기/사용권/전체 최종아트 승인은 별도다.

## 숙련 파일 후보

내장 image_gen으로 기존 초상을 identity reference로 삼아 한 파일을 제작했다. `docs/branding/candidates/player-skilled-v1/player-skilled-portrait-v1.png`, SHA `6c4722740d3b9fd45faecbb2bb648cfed86aa887cf509739a35fec57d435a357`. 침착한 열린 손 안내와 기존 tablet, 허리 camera/빈 카드 홀더를 표현한다. 사용자 '승인 및 나머지 사항 문의없이 알아서 계속진행.' 답변으로 정확 파일 디자인 승인을 기록하고 public에 동일 bytes 복사했다. player/skilled 일치만 연결하며 숙련 도달 조건·장착·능력치·직업·관심사 변경 없음. 집중31/type/Vitebuild 및 PC/폰세로/가로24경로 분리 fixture 검증. 본편 전체 슬롯·자연훈련·실기기·사용권 검수는 별도다.
