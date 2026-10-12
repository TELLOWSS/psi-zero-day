# PSI 장비 HUD 이미지 제작·적용 기록

## 제작 도구와 상태
ChatGPT 내장 ImageGen으로 투명 배경의 실제 비트맵 장비 아틀라스를 제작했다. 아래 설명은 재제작용 프롬프트 요약이며, 생성 결과는 최종 미술 검토 전의 후보 자산이다. Sharp는 생성 후 부품 영역 자르기·리사이즈·WebP 패킹에만 사용했다.

## 재제작용 프롬프트
Transparent 1536 × 1024 industrial game HUD equipment atlas, three columns and two rows. Top row: three hollow PSI control frames in field teal, aged brass amber, and cobalt grid variants. Bottom row: amber fire bezel, teal navigation ring, and PSI shield chip. Realistic weathered steel, fasteners, insulated cables, signal lights and precise mechanical surfaces, readable at small game UI sizes. Separate components with generous transparent spacing; all windows and ring centers transparent. No text, digits, characters, scene background or baked shadows outside the equipment. Consistent perspective and lighting, production game sprite quality.

## 실제 적용 파일
| 파일 (`public/signal-breaker-dev/art/`) | 적용 위치 |
|---|---|
| psi-hud-field-v1.webp | 기본 현장 HUD, 보스 상태 프레임, 장비 버튼 |
| psi-hud-brass-v1.webp | 황동 커스텀 HUD |
| psi-hud-grid-v1.webp | 그리드 커스텀 HUD |
| psi-fire-ring-v1.webp | 발사 버튼·프리즘 조준점 |
| psi-nav-ring-v1.webp | 이동·조준 패드, 기본 조준점 |
| psi-shield-chip-v1.webp | 체력·크레딧 표시, 비콘 조준점 |
| psi-hud-atlas-v1.webp | 생성 원화의 통합 보관본 |
| psi-hud-assets-v1.json | 추출 범위·제작 도구·검토 상태 |

HUD 프레임은 투명 창을 보존한 9분할 테두리로 화면 폭에 대응한다. 글자와 수치는 HTML로 렌더링해 한국어·해상도 변경에도 선명하게 유지한다. 장비 외형 선택은 실제 자산을 바꾸며, 구매 가격·진행 해금·진화 규칙은 순수 모듈에서 계산한다.

## Director 검토
실제 적용된 이미지는 최종 후보이며 미술 승인 완료로 계산하지 않는다. 작은 휴대폰에서의 표면 디테일·조준점 가독성, 황동/그리드의 PSI 정체성, 기존 보스의 자연스러운 부품 움직임과 손상 표현은 최종 미술 검토 대상이다.
