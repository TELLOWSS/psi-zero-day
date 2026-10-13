# 성장 초상과 본편 활성 인물 경계

## 확인된 활성 경로

PlayableEpisode는 snapshot.state.flags에서 projectCharacterGrowth를 계산해 CharacterCard에 전달한다. 승인 focused/skilled PNG는 여기서만 사용한다. TBM production scene은 이 카드를 숨긴다.

실제 장면은 EpisodeImmersiveScene의 episode-immersive-cast가 담당한다. 현재 자산 우선순위는 episode01CharacterPerformanceAsset(characterId, performance.expression, resolve)의 표정 자산, 해당 fallback, characterMapUri다. 이 함수는 growth flag를 받지 않는다. 따라서 카드 PNG 승인만으로 실제 장면 인물이 성장 모습으로 변경되는 것은 아니다.

표정 자산의 계약은 content/episode01/character-performance-production.json이며 해석 소유자는 src/app/episode01-character-performance-assets.ts다. 성장 expression/resolved/calm_confident와 장면 performance expression은 서로 다른 계약이다. 이름이 비슷하다고 같은 자산 ID로 치환하지 않는다.

## 다음 구현 경계

- 승인 초상은 허리 위 구도다. 발과 바닥 접지 정보가 필요한 장면 map/full-body 자산으로 직접 대입하지 않는다.
- 카드 display:none을 강제로 해제해 장면 위에 중복 UI를 추가하지 않는다.
- 실제 장면 성장 연결은 기존 player map/performance의 전체 몸체·PPE·접지·표정 우선순위를 유지하는 단계별 자산 및 표시 계약부터 진행한다.
- 다음 단계 자산 제작은 기존 growth.player 조건만 사용한다. 승진·자격·능력치·장착·관심사 자동 해금은 포함하지 않는다.
- 기존 초상 승인 bytes는 유지한다. 새로운 full-body 파일은 별도 납품 파일이며 기존 초상 승인을 그대로 옮겨 기록하지 않는다.

이번 확인은 코드 읽기 감사다. 새 브라우저/자연 플레이/전체 회귀를 수행하지 않았고 제품·저장·자산은 변경하지 않았다. 전체 성장 기획 완료로 계산하지 않는다. 동기화는 사용자 요청 시만 진행한다.

## 후속 구현

기존 speaker tag에 승인된 player focused/skilled 초상과 기존 stage_label을 표시했다. 전신 actor 우선순위와 카드 숨김은 유지한다. PlayableEpisode에서 기존 dialogueGrowth를 읽기 전달하며 player와growth.character_id 일치 조건으로만 표시한다. 새 자산/해금/능력치/장착/저장 변경 없음. 실패는 기존 map 이미지로 복구한다.

actual EpisodeSession와 전체 PlayableEpisode source의 PC/폰 세로/폰 가로 x2단계6경로에서 이름표 초상 decode/실제48px bounding box/넘침/오류 검증 통과. 폰 세로 숙련 화면 직접 확인. 타입/Vitebuild 성공. seed 성장 flag 검증이며 자연훈련·모든장면·실기기·전신성장아트 구현 완료로 확대하지 않는다. 이전6경로는 카드 숨김 관측이었으며 최신 report는 이름표 표시 증거로 구분한다.
