# 본편 군집 전투와 접속 화면 개선

2026-10-15 · 사용자의 후속 요청: 본편에서도 적이 적고 쉽게 끝나는 문제를 해결하고, 별도 이미지를 제작해 접속 화면의 난잡한 정보를 정리한다.

## 전투 설계와 구현

장갑 수치를 일괄 증가시키는 대신 **빠르게 해소되는 다수의 일반 신호 + 장갑을 가진 핵심 신호**를 혼합한다. 사람·근로자는 공격 대상이 아니다.

- EP01: 웨이브별 증원 `4~8개 → 10·13·16·19·22개`.
- EP02: 웨이브별 증원 `4~8개 → 14·18·22·26·30개`. 기존 본대의 장갑은 유지하며 새 일반 증원은 무장갑이다.
- EP03: 기본 대형 `6·11·4·14·8개 → 18·30·14·38·26개`에 기존 시드 변화를 적용한다. 4마리/5.2초 간격을 6마리/2.4초 간격으로 바꾸고, 동시 공급 제한은 12개에서 24개로 변경한다. 전체 엔진 개체 상한 36개는 유지한다.
- EP03 돌진·중계 역할과 큰 신호에는 기존 장갑을 유지한다. 무장갑 러너는 연쇄·관통으로 정리할 수 있어, 장갑 파괴 전후의 흐름이 달라진다. 처치·드롭·강화는 실제 전투에서 발생한다.
- 증원은 유한한 웨이브 계획에 포함한다. 무한 재생성이나 가짜 처치, 시간만 끄는 보스 HP 증가는 없다. 미공급 큐가 남으면 웨이브가 완료되지 않는다.
- `encounterVersion:2`를 신규 체크포인트에 저장한다. 필드가 없는 기존 저장은 버전 1 계획과 장갑으로 이어간다. 잘못된 버전이나 계획 질량과 맞지 않는 저장은 기존처럼 거부한다. 이미 완료한 캠페인 기록과 재화는 변경하지 않는다.

[동일 시드 15개 작전 비교](qa/cascade-lobby-20261015/encounters.json)는 계획 개체 수와 분할 후 해소 단위를 구분해 기록한다. 예를 들어 EP03 CH-01의 전체 해소 단위는 58에서 159로 증가한다. 이 수치는 가상의 처치 결과가 아니라 실제 유한 계획의 질량이다.

## 접속 화면

- 전용 키아트를 실제 웹 자산으로 제작했다. 기존 현장 미리보기 이미지는 각 현장 카드에 그대로 사용한다. 캐릭터 이미지를 새로 생성하거나 교체하지 않는다.
- 에피소드 선택 → 선택 현장과 큰 작전 준비 버튼 → 캐릭터·장비실·조작 교본 → 현장 선택 → 잔광 순으로 정리한다.
- 작전 목표·기록·아이템 설명·자유 개방은 ‘작전 안내 · 캠페인 기록 · 자유 개방’을 펼쳐 볼 수 있다. 시작 버튼을 중복 노출하던 하단 영역은 없앴다.
- 현장 카드는 선택·미리보기만 하고, 실제 준비 진입은 명시적 버튼으로 한다. 첫 접속의 의미 없는 ‘준비 화면으로’ 복귀 버튼을 숨기고 실제 진행/저장이 있는 경우에는 제공한다.
- 15개 캠페인의 다음 미완료 작전 안내와 에피소드 전환은 유지한다. 새 플레이어의 첫 화면에서만 중복되는 다음 작전 버튼을 생략한다.
- 한글은 이미지에 굽지 않고 기존 text_id로 렌더링해 작은 화면에서도 읽고 확대할 수 있다. 로비 전용 CSS이며 전투 HUD·조작부는 변경하지 않는다.

## 이미지 제작 이력

- 생성 방식: **내장 image_gen**, 텍스트로 신규 생성. 외부 입력 이미지·음원 없음.
- 원본: `C:/Users/user/.codex/generated_images/01a13458-6d9f-7992-9023-d99924880690/exec-1ced3cf9-2556-48d2-8177-bf392a60cd1a.png`.
- 게임 자산: [lobby-keyart-v1.webp](../public/signal-breaker-dev/art/lobby-keyart-v1.webp). Sharp WebP quality 87로 형식 변환. 원본은 보존한다.
- 실제 출력 크기·해시는 `release.json`의 자산 항목을 따른다. 이미지 생성 사용만으로 권리 검증 전체가 완료되었다는 의미는 아니다.
- 최종 프롬프트:

> Use case: stylized-concept. Create a final production cinematic key art backdrop for SIGNAL BREAKER, a Korean construction-site arcade action game's clean entry lobby. Wide landscape 16:9 2048x1152. Premium realistic painterly game environmental concept art, physically plausible wet steel platform, immense tower cranes and unfinished concrete structures in distant mist at dusk, warm amber sky meeting cool deep teal steel, delicate electric cyan and amber signal arcs converging near a metal industrial sensor assembly on the RIGHT THIRD. Strong readable central skyline with depth, elegant controlled energy, expensive art direction. Lower right steel workbench with engineered pulse emitter, no firearms. LEFT HALF has restrained, low contrast shadow and atmospheric negative space so accessible live Korean title and buttons can be overlaid. No people or faces: canonical character artwork is already separately provided in the game, do not invent replacements. No text, letters, logos, UI panels, icons, labels, numbers, borders, watermarks, gore or accidents. This is an original backdrop asset, not a screenshot mockup. Avoid busy collage and oversaturated particle clutter. Match the established game's dusk construction environment with tactile steel, tasteful cyan accents, amber light and cinematic depth.

## 검증

- 독립 테스트 **323개 통과**: 새 밀도·무장갑 일반 신호·신구 체크포인트 검사 포함. 루트 **2072개 통과 / 1개 제외**. 타입 검사와 프로덕션 빌드 통과.
- [로비 6개 화면](qa/cascade-lobby-20261015/lobby.json): 이미지 로딩, 가로 넘침 없음, 44px 이상 시작 버튼, 상세 기본 접힘, 현장 미리보기, 잠금·자유 개방, 캐릭터 선택, 준비 진입.
- [실제 15작전 전체 흐름](qa/cascade-lobby-20261015/campaign/full-journey.json): 세로·가로·PC, 일반 이동·조준·발사와 실제 추천 진화/튜닝을 사용한다. 승리·체력·재화 주입 없이 확인한다.
- [오프라인](qa/cascade-lobby-20261015/offline.json): 이미지·새 CSS 포함 캐시, 잔광의 재개와 저장 실패 회귀.
- [로비 오프라인 직접 검사](qa/cascade-lobby-20261015/lobby-offline.json): 네트워크를 끊고 메인 로비를 새로고침해 키아트, 새 CSS, 명시적 작전 준비를 확인했다.
- 로비 6화면, 캠페인 **15개 × 3화면 = 45회 실제 승리** 모두 통과했다. 에피소드 전환 시 다음 미완료 버튼이 숨던 조건을 수정하고 전체 흐름으로 재검증했다. 보상·진화·강화·엔딩·재접속 및 아카이브 무보상도 확인했다.
- 동일 브라우저 명령 흐름에서 EP01/02/03 평균 수집 부품은 각각 26.9/69.0/83.8개였다. 이전 기준선의 14.8/29.0/34.8개보다 늘어 실제로 해소·회수 기회가 증가했다. 평균 작전 시간은 58.9/82.5/98.8초였다. 이는 자동 입력 결과이며 실제 사용자 시간은 다르다. 단순히 플레이 시간을 늘리는 것을 성공 기준으로 삼지 않았다.
- 자동 시뮬레이션·헤드리스 브라우저의 결과이며 실제 Android 기기의 발열·프레임·피로도·사람의 재미 평가는 별도다.

릴리스 대상: **0.65.0-cascade-lobby**, 캐시 자산 **188개**. 공개 URL: https://psi-zero-day.vercel.app/signal-breaker-dev/index.html
