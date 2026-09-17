# 대화 표정 1차 통합

- 임준호: 걱정 표정. 경사로 이상 제보와 답변 대기 대사에 연결.
- 강태식: 협력적 반응 표정과 팔을 내린 자세. 기존 관계 분기의 긍정 반응 대사에만 연결. 낮은 신뢰 분기는 기존 원화를 유지.
- 윤성호: 협력적 확인 표정. `ep01.reactions.yoon.high` 대사에 연결. 낮은 신뢰 반응은 기존 원화를 유지.
- 원화는 기존 캐릭터를 참조하여 built-in image_gen으로 편집했다. 1254×1254 투명 WebP 3종을 public/assets/episode01/characters에 저장했다.
- 파일: lim-junho-concerned.webp, kang-taesik-supportive.webp, yoon-sungho-appreciative.webp.
- 프롬프트: DIALOGUE-ART-PROMPTS-2026-09-18.json.
- 연결 정보: content/episode01/dialogue-art.json. UI에는 대사나 표정 조건을 하드코딩하지 않는다. 화자와 대사 ID가 모두 일치해야 표현을 변경한다.
- 기존 게임 규칙·분기·저장 형식은 변경하지 않았다. 등록된 변형 자산이 없으면 기본 초상화를 사용한다.
- 전체 테스트 398개 통과, TypeScript 및 Vite 빌드 통과. 기존 500KB 청크 경고는 남아 있다.
- 나머지 인물의 표정과 현장 행동 애니메이션, 양중·안전대 형상 검토, 외부 플레이테스트는 후속 작업이다. 두 장의 표정 원화 추가를 전체 애니메이션 완성으로 보지 않는다.
