# 장비 점검 원화와 위기 해소 음성 제작

## 장비 점검 최종 후보

- 내장 image_gen 편집 모드로 제작. 원본: public/assets/survivors/player-command-eight-v1.png.
- 출력: public/assets/survivors/player-equipment-check-eight-v1.png. 기존 파일은 덮어쓰지 않았다.
- 투명 2열×4행, 순서 E/SE/S/SW/W/NW/N/NE. 기존 복장·안전모·태블릿·신체 비율을 유지하는 비발사 점검 자세다.
- 상태: FINAL CANDIDATE, 사람의 최종 외형 승인 전. 생성 이미지를 검사하거나 런타임에 연결했다고 VISUAL PRODUCTION LOCK으로 계산하지 않는다.
- 실제 출동 직후 안전할 때와 8초 이상 안전 대기 때 최대 0.9초 표시. 반복은 18초 이상 간격. 이동·실제 공격·피격·근접 위험·환경 위험·경고가 우선이며 점검을 즉시 중단한다. 입력이나 공격 타이머를 막지 않는다.
- 상점 착용 미리보기의 장비 점검 모드에서 원화와 실제 장착 장비를 함께 확인한다. 주인공 전용이며 다른 캐릭터에 이 원화를 사용하지 않는다. 정지/저감 모션을 존중한다.

### 저장한 제작 프롬프트

Edit the supplied transparent production character sprite sheet into a final-production-candidate EQUIPMENT CHECK pose sheet for the exact same Korean female construction-site safety engineer. Preserve identity, realistic rendered detail, white blue-striped hardhat, ponytail, navy workwear, blue safety vest, gloves, black boots and tablet. Preserve the 2-column by 4-row layout and directions east, southeast, south, southwest, west, northwest, north, northeast; full body, scale, ground anchor, foot stance, transparent alpha and safe helmet/boot margins. Change only a subtle upper-body performance: calmly check the tablet and radio clipped to the vest, right glove lowered toward the shoulder/vest radio rather than held at the mouth, slight attentive head inclination. Non-speaking, non-firing readiness check. No new costume, words, grid, glow, smoke, background or neighboring-cell overlap. Match the original photographic 3D-game realism, not a cartoon.

## 일반 위기 해소 음성: Manus 제작용

기존 START/SECURED 문장을 재사용하거나 가짜 숨소리를 합성하지 않는다. 새 파일을 받기 전에는 연결하지 않는다. 원래 성우·잠입 성우·남성 엔지니어 각각 기존 프로젝트에서 사용한 동일 화자를 선택한다. 실존 인물을 모사하거나 임의의 화자로 변경하지 않는다.

### 공통 프롬프트

시그널 워치의 기존 선택 화자와 같은 목소리로, 가까운 위험을 통제한 직후의 짧고 절제된 안도 반응을 제작하세요. 승리 축하나 맵 클리어 선언이 아니라 잠깐 숨을 돌리는 현장 엔지니어입니다. 과장된 신음, 부상 소리, 긴 숨, 음악, 효과음, 잔향, 웃음, 추가 대사 없이 지정된 내용만 생성하세요. 짧은 자연스러운 날숨 후 편안하고 또렷하게 말합니다. 경고음을 덮지 않는 평범한 발성, 약 0.7~1.4초. 음량을 크게 만들려고 소리 지르지 않습니다. 가능한 실제 네이티브 출력 포맷으로 내보내고 업샘플링하지 마세요. 텍스트와 화자를 유지한 A/B 자연스러운 변주를 각각 생성하세요.

| 버전 | A 대사 | B 대사 | 파일 식별자 |
| --- | --- | --- | --- |
| original | 좋아. | 됐어. | PSI_V_PLAYER_RELIEF_A/B_v01_original |
| covert | 좋아. | 됐어. | PSI_V_PLAYER_RELIEF_A/B_v01_covert |
| engineer | 좋아. | 됐어. | PSI_V_PLAYER_RELIEF_A/B_v01_engineer |

- 확장자는 실제 WAV/MP3 등 생성 포맷에 맞춘다. 6개 파일과 tool/model/voice ID, 제작일, 게임 공개 배포 사용권, 원본 형식·샘플레이트·채널 정보를 함께 제공한다.
- 예정 트리거: 실제 위험 해소 후 안전 상태, 20초 이상 반복 간격, 선택 성우 버전 일치. 경고·LOW_HP·CLEAR·START가 우선. 일시정지/종료/장면 변경 시 취소하고 오래된 대사를 뒤늦게 재생하지 않는다.
- 최종 원음 수신 후 해시·클리핑·무음·음량·청감·경고 동시 재생을 검증하고 연결한다. 위 대사는 제작용 텍스트이며 현재 게임 UI에 임의 표시하지 않는다.
