# TASK-009D — 콘셉트 비주얼 → 실제 게임 자산 파이프라인

## 목표

기존 콘셉트 캐릭터·맵·UI를 코드에 직접 박지 않고 정식 asset manifest로 연결한다.
실제 이미지가 아직 없는 개발환경에서는 현재 CSS 맵/작업자 실루엣을 그대로 사용하고,
원화 파일과 manifest가 들어오면 같은 UI가 자동으로 production art로 전환된다.

## 런타임 흐름

`visuals.json(asset_id/path 계획)`
→ `scripts/build-episode01-assets.mjs`
→ `content/episode01/assets.json`
→ `ContentRegistry.getAsset()`
→ `EpisodeSession.assetUri()`
→ `strategy-assets.ts`
→ `StrategyMapShell / CharacterCard`

`src/engine/*`에는 자산 로딩이나 UI 규칙을 넣지 않는다.

## 캐릭터 슬롯

현재 8명 모두 portrait / map sprite 2종을 예약한다.

- player
- kang-taesik
- yoon-sungho
- lee-jaehoon
- lim-junho
- choi-minseok
- seo-jeongmin
- oh-seungjae

예시:

- `public/assets/episode01/characters/lim-junho-portrait.webp`
- `public/assets/episode01/characters/lim-junho-map.webp`

Portrait는 대화/인물카드, map은 전략 현장맵 토큰에 사용한다.
파일이 없으면 CharacterCard와 StrategyMapShell의 기존 CSS 캐릭터가 fallback이다.

## 현장 맵 슬롯

- `public/assets/episode01/backgrounds/foundation-map.webp`
- asset id: `ep01.background.foundation.map`

파일이 등록되면 코드로 그린 건물·크레인·도로 배경을 감추고 원화 맵을 사용한다.
위험핀, 작업구역, 캐릭터, HUD, 현장행동 버튼은 원화 위에 계속 인터랙티브 레이어로 남는다.

## 권장 제작 기준

### Map
- 16:9 landscape.
- 권장 원본 1920×1080 이상.
- 가상의 한국 공동주택 골조현장.
- 진입부 / 경사로 / 야적장 / 게이트가 시각적으로 구분되어야 한다.
- 실제 회사명·현장명·식별 가능한 로고 금지.
- 위험핀과 캐릭터 UI가 올라갈 여백을 확보한다.

### Character map art
- 투명 배경 WebP 권장.
- 전신 또는 3/4신 실루엣이 작은 화면에서도 구별되어야 한다.
- 8명의 나이·체형·안전모·작업복 실루엣을 명확하게 차별화한다.
- 안전모에 가짜 글자/회사명 금지. 단순 추상 표식만 허용한다.

### Portrait
- 투명 또는 단순 배경.
- 얼굴/상반신 중심.
- 표정변형을 추가할 경우 동일 캐릭터 identity를 유지한다.

## Manifest 생성

실제 WebP 파일을 정해진 위치에 넣은 뒤:

```bash
npm run assets:manifest
```

스크립트가 존재하는 파일만 찾아 `content/episode01/assets.json`에 다음을 자동 기록한다.

- asset_id
- uri
- format
- bytes
- SHA-256 hash
- preload policy

검증:

```bash
npm run assets:check
```

현재 실제 그림 파일이 없으므로 assets.json은 빈 manifest가 정상이다.

## Fallback 규칙

1. manifest에 배경 asset 없음 → CSS 현장맵.
2. 캐릭터 map asset 없음 → CSS 작업자 미니 캐릭터.
3. portrait asset 없음 → 기존 대화창 CSS 인물 실루엣.
4. 일부 캐릭터만 art가 들어와도 혼합 렌더링 가능.
5. 이미지 로드 실패 시 broken-image 아이콘을 보여주지 않고 fallback 시각을 유지한다.

## 기존 콘셉트와 연결할 때

File Library에 보관된 기존 캐릭터/NPC 전략공략집과 안전현장 RPG 콘셉트의 디자인 언어를 기준으로 사용한다.
단, 기존 시안을 그대로 복사하는 것이 아니라 현재 확정된 캐릭터 구성과 역할에 맞춰 최종 identity를 다시 확인한 뒤 export한다.

## Director Review

이 단계는 자산 로딩·표현 경로만 만든다.
PSI 공식, 위험도 계산, 경제 공식, 사고확률 및 CoreEngine 규칙은 변경하지 않는다.
