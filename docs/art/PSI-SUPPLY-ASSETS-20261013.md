# PSI 발생원·보급 원화 제작 기록

- 도구: ChatGPT 내장 ImageGen. 현금 결제 API·외부 모델 호출 없음.
- 적용 파일: `public/signal-breaker-dev/art/psi-supply-atlas-v1.webp`
- 원화: 투명 RGBA 1254×1254, 2×2 셀. WebP94/alpha100 패킹만 수행.
- 셀 순서: 좌상 발생원 비콘 / 우상 화력 셀 / 좌하 충전 캐패시터 / 우하 워치 센서.
- 적용: 발생원 실제 월드 위치와 세 종류 획득 아이템. 충돌·획득 판정 크기는 유지.
- 상태: 런타임 적용 최종 후보, 최종 Director 미술 검토 전.

## 실제 생성 프롬프트

```text
Use case: stylized-concept. Asset type: one production transparent 2x2 game sprite atlas for NEW PSI industrial construction-site arcade. Four isolated equipment objects on a 1024x1024 canvas, each centered in its own exact 512x512 quadrant, fully inside the cell with 70px clear transparent padding; no object crosses a cell border. Top-left: rugged industrial signal-source beacon, compact round steel receiver housing with two short antennae, teal segmented emitter coil and amber caution lamps. Top-right: a chunky portable power-up battery cell with protected teal energy crystal, worn steel cage and two terminals. Bottom-left: amber charging capacitor with a copper coil and shielded power core, distinct squat silhouette. Bottom-right: cobalt/violet signal-watch sensor with triangular optical glass inside a steel enclosure, distinct prism silhouette. Match realistic cinematic steel, bolts, brass, dust wear, cables and restrained internal light used in a sunset construction worksite game. Sharp readable silhouettes at 32-48 screen pixels; premium detailed game object rendering, consistent front three-quarter perspective, warm top-left keylight with teal rim highlights. Genuine transparent background and transparent space between parts. No scene background, opaque square panels, text, letters, digits, logos, humans, drop shadows outside the objects, cartoons or generic flat shapes. Preserve practical industrial safety equipment identity; original fictional equipment design.
```
