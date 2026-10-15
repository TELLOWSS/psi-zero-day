# 디펜스 이미지 제작 프롬프트 세트

2026-10-15 내장 image_gen 제작. 아래는 각 호출의 제작 조건을 보존한 정리본이며 도구 입력의 문자 단위 전사본은 아니다. 런타임 원본 연결·해시·개별 추출 경계는 `content/defense/premium-art-v1.json`이 기준이다. 원본 디렉터리: `C:/Users/user/.codex/generated_images/01a13458-6d9f-7992-9023-d99924880690/`.

## 1. 장비 아틀라스 — 최종 선택

Output: `exec-6e716135-7ec3-44be-b6ed-84a7eaa044ec.png`.
Reference: `public/signal-breaker-dev/art/gear-evolution-atlas-v1.webp`.

Use case: stylized concept / final production equipment sprites. Create a transparent 4×4 atlas of sixteen grounded autonomous construction safety devices. Near orthographic elevated 65-degree camera, upper-left light. Premium realistic 3D materials: scratched yellow housings, dark steel, copper, hoses, restrained cyan/amber/violet indicators. Consistent scale and clear separation; every device completely visible. Reference material quality only, not handheld weapon layout.

Row PULSE: compact pneumatic transducer; twin chambers; L3A three short emitters; L3B long precision emitter. Row BURST: radial dish; multiple nozzles; wide eight-way diffuser; narrow triple concentrator. Row CONTROL: winch bollards; paired hydraulic drums; three heavy anchors; seven wide anchors. Row SENSOR: lidar tripod; dual heads; broad radar dish with four sensors; tall violet precision optical head. True alpha; no people, text, UI, logos or military guns.

## 2. 위험체 아틀라스 — 초안 생성

Output: `exec-fe1d4bdd-709a-499b-ae9e-8c57ab393e8f.png`.

Six nonliving industrial risk cores, 3 columns × 2 rows, camera 65 degrees, upper-left light, premium industrial materials consistent with the equipment. NORMAL cracked concrete/steel cyan core; SWIFT swept steel amber wedge; ARMORED layered heavy black steel cube; SWARM five small orbiting fragments; VEILED violet interference prism in technical mesh; BOSS reinforced load rings, hydraulics, four arms, amber center. No people, creatures, eyes, skulls, text, UI or background. Transparent alpha and no cropped objects.

## 3. 전투판 — 초기 생성

Output: `exec-61564a0d-9375-4505-905f-94c2c9f5a88e.png`.
References: `public/assets/defense/board/ramp-01-hd01.webp`, `public/signal-breaker-dev/art/lobby-keyart-v1.webp`.

Top-down approximately 80-degree Korean construction courtyard at dusk, amber lamps and teal distance, realistic painterly high-detail concrete, steel and scaffolding. 5:3 composition, no sky. Keep central 85% open playable concrete and put detailed structures around the perimeter. Preserve a clear 100-world-unit corridor through (0,300), (180,300), (180,150), (450,150), (450,450), (720,450), (720,240), (1000,240) on a 1000×600 plane. Keep eight existing installation pad locations unobstructed with radius 55. No baked path lines, pads, UI, people or labels.

## 4. 출전 키아트 — 최종 선택

Output: `exec-061bfecf-b656-4469-9119-0aef5c6e4afa.png`.
Reference: `public/signal-breaker-dev/art/lobby-keyart-v1.webp`.

Premium realistic painterly 16:9 construction command gantry overlooking Korean high-rise cranes at dusk. Wet detailed steel and concrete, amber task lights, teal distant city and cranes. Match Signal Breaker material and light quality. Keep left 40% low contrast for live headings and right foreground clear for compositing existing approved character art. No people, text, UI or logos.

## 5. 위험체 투명 배경 편집 — 최종 선택

Input: call 2 output. Output: `exec-69798012-3ff9-4b12-bd98-d20698cd0610.png`.

Preserve all six designs, positions, silhouettes, framing and material detail. Remove the broad brown/grey ambient background completely; outside the individual objects must have true alpha zero. Keep only tight local glow and complete fragments. No object clipping, layout changes, text or added objects. The final WebP alpha edges are additionally decoded and checked in tests.

## 6. 전투판 통행 영역 편집 — 최종 선택

Input: call 3 output. Output: `exec-979563bf-193c-4480-a9f5-6ae117a38972.png`.

Preserve camera, textures, lighting and surrounding scene exactly. Clear the left entry at x=0–20%, y=42–58%, the right exit at x=86–100%, y=32–48%, and the standing area around (64%,88%) with radius 6% of image width. These must remain flat open concrete without blocking props. Do not add painted routes, UI, pads, people or text.

## 파생 자산 처리

Sharp로 WebP 인코딩 및 개별 오브젝트 추출/투명 여백만 처리했다. 새 그림을 알고리즘으로 대신 만들지 않았다. 장비/위험체 전체 아틀라스 WebP 2개도 같은 출력 폴더에 보존했다. 실제 게임에는 장비 16개, 위험체 6개, 전투판·키아트 각 1개를 사용한다. 캐릭터 이미지는 새 생성이 아니라 기존 순찰 요원의 정식 파일을 사용한다.
