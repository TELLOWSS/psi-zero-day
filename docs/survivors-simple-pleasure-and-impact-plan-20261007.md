# 시그널 워치: 단순한 쾌감과 상점·타격음 개선

## 이번 적용 범위

- 상점 상단 고정 지갑: 스크롤·탭 변경 중에도 보유 PSI와 닫기 버튼 유지.
- 기존 장비 원화를 크게 보여주는 상품 진열, 등급별 강조와 장착 상태 구분. 임시 아트 추가 없음.
- 정비 탭: 파손되어 장착에서 빠진 장비를 포함한 모든 손상 장비 표시. 개별·전체 수리, 수리비와 잔액·부족 포인트 표시.
- 내구도 0은 파손·사용 불가이며 소유권은 유지. 수리 후 내구도 100 복구; 미장착 장비는 다시 장착. 사용자 확인에 따라 영구 파괴·재구매는 도입하지 않음.
- 전체 수리는 한 번의 원자적 거래. 포인트 부족·저장 실패 시 부분 수리나 일부 차감 없음.
- 내구도 15 이하인 사용 장비는 다음 클리어 때 파손될 수 있음을 표시. 미사용 장비가 저절로 손상되지는 않음.

## 복잡한 연계 없는 쾌감 아이디어

새 버튼, 조합 공식, 연계 퀘스트보다 이미 하는 행동의 결과를 즉시 느끼게 하는 방향. 아래는 기획이며 이번 상점 수정에 게임 규칙으로 끼워 넣지 않는다.

1. **한 번에 쓸어 담기**: 위험 해소 후 주변 보급품이 짧게 모이며 선명한 회수음과 포인트 합산이 한 번에 끝난다. 여러 숫자·문구 대신 최종 합산 하나. 기존 회수 행동의 보상만 명확하게 한다.
2. **묵직한 결정타**: 일반 타격은 짧고 경쾌하게, 중요한 마지막 타격은 한 번만 낮은 충격음·짧은 정지·파편으로 강조한다. 매 타격마다 과장하지 않아 피로와 소음 누적을 줄인다.
3. **샤우팅 한 방의 대비**: 발동 순간 잠깐 배경음을 눌렀다가 위험이 밀려나는 소리와 함께 복귀한다. 새 연계 조건 없이 기존 버튼 한 번의 결과를 더 또렷하게 만든다.
4. **큰 위험 해소 뒤의 안도감**: 보스 해결 직후 잔해 정리 → 짧은 확인 음성 → 보상 표시 순으로 간단하게 닫는다. 조작과 다음 작전 준비를 불필요하게 오래 막지 않는다.
5. **장비가 좋아진 느낌**: 장착 직후 실제 착용 원화와 대표 효과를 짧게 보여준다. 숫자 설명을 늘리기보다 다음 첫 사용에서 소리·발광의 차이를 확인하게 한다.
6. **돈의 쓸모가 바로 보이기**: 구매·수리 전후 잔액, 이번 작전 보상으로 정비 가능한 장비 수를 보여준다. 새 통화·출석 숙제·벌금 없이 기존 PSI 가치만 선명하게 만든다.

추천 우선순위는 1 → 2 → 3. 이미 존재하는 회수·충격·샤우팅 이벤트를 사용하고, 반복 음성·과도한 화면 흔들림·경고를 가리는 연출은 피한다. 구체적인 연출과 밸런스 변경은 Director 승인 후 별도 적용한다.

## 타격음 퀄리티 개선 가능성

가능하다. 현재도 녹음된 금속·콘크리트 타격, 장비 발사음, 드론 V3와 절차적 장비 피드백을 사용한다. 볼륨만 올리거나 기존 WAV를 업샘플링하는 것은 원음 품질 개선이 아니다.

가장 효과적인 순서:

1. **최종 후보 원음 개선**: 금속은 단단한 접촉과 짧은 공명, 콘크리트는 접촉과 자잘한 파편, 결정타는 저역 몸통과 짧은 고역 접촉을 한 파일에 균형 있게 담는다.
2. **반복 피로 줄이기**: 같은 계열 A/B/C를 만들되 음량·길이는 일관되게 한다. 기존 변형 선택기를 유지하고 끝없이 레이어를 추가하지 않는다.
3. **충격의 위치와 크기**: 근거리 핵심 타격은 명확하게, 먼 곳의 잔타는 낮춘다. 동시 타격에서 가장 의미 있는 접촉만 남긴다.
4. **음성과 경고 보호**: 상황별 음성·긴급 경고가 나올 때 반복 접촉음과 음악의 공간을 비운다. 모바일 스피커에서도 접촉의 중음역이 남아야 한다.
5. **검수 후 연결**: 원본 해시·PCM·피크·RMS·무음·반복 간격 점검, 실제 휴대폰·이어폰 청취. 샘플 피크와 true peak/LUFS를 혼동하지 않는다. 기존 녹음과 같은 음량으로 비교한다.

## 원음 제작 프롬프트

각 파일을 독립적으로 생성하고 특정 게임의 효과음을 복제하지 않는다. 실제 출력 형식을 기록하며, 도구가 제공하는 원본 해상도를 임의로 바꾸지 않는다. 음성·음악·긴 공간 잔향·과도한 찢어짐은 제외한다. 제공자 사용권을 함께 확인한다.

**공통**: Original premium industrial action-game impact, immediate readable contact, controlled body, short clean decay, no voice, no music, no clipped distortion, not an imitation of an existing game. Mono-compatible original PCM WAV; request native 48 kHz / 24-bit when supported, otherwise report the actual native format without upsampling. Produce one file per prompt and three natural variations A/B/C, with consistent perceived loudness.

- **금속 접촉**: Solid compact steel contact on a heavy industrial cart. Crisp midrange attack, dense mechanical body, short damped metallic ring. 0.18–0.32 seconds, no giant explosion, no prolonged screech.
- **콘크리트 접촉**: Dense concrete fragment impact. Clear dry contact, compact low-mid thud, fine brittle gravel tail. 0.16–0.30 seconds, no gunshot, no wet squelch.
- **중요한 결정타**: One decisive heavy industrial hazard-neutralization impact. Precise transient followed by a restrained low-mid pressure body and short debris release. 0.25–0.45 seconds, satisfying on a phone speaker, no booming sub-only sound, no voice or cinematic music.

최초 제작은 3계열 × A/B/C = 9파일이면 충분하다. 파일별 사용권·실제 출력 형식·도구·생성일·SHA-256을 첨부한다. 최종 청취 승인 전에는 기존 자산을 교체하지 않는다.
