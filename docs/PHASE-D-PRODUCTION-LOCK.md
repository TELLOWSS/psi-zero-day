# Episode 01 — Phase D Final Art · Sound · Direction Production Lock

**Status: IN PROGRESS**  
**Entered: 2026-09-21**

Phase C와 최종 player-facing regression gate를 통과했기 때문에 Episode 01은 **Phase D**에 진입한다. 여기서는 이벤트 구조를 다시 설계하지 않는다. 이미 잠긴 26-event topology 위에서 실제 최종 자산과 연출을 닫는다.

## Entry evidence

Phase D 진입 기준은 commit `128f77361248fc70b9afe1409bb787af7de2c795`에서 검증되었다.

- GitHub Actions run: `35550376043`
- TypeScript / Production build: PASS
- Responsive/browser QA: **5 viewport profiles PASS**
- Vitest: **121 test files / 687 tests PASS**
- 실제 앱 경계 `EpisodeSession.directed()`: 26-event full playthrough PASS
- STOP WORK → FIELD → TBM → STRATEGY → OFFICE → DAY RESULT → DAY 02 bridge PASS

최종 검수에서 발견된 DAY RESULT / OFFICE / DAY 02 모바일 선택지 clipping도 Phase D 진입 전에 수정하고 재검증했다.

## Phase D 현재 상태

| Track | 상태 | 현재 |
|---|---|---:|
| Immersive final backgrounds | **LOCKED** | 8 / 8 |
| Character performance wave | **LOCKED** | 5 / 5 |
| Production-v1 audio | **LOCKED** | 8 / 8 |
| Camera / transition / responsive direction | **LOCKED** | 5-profile regression green |
| Title-cast identity refresh | **LOCKED** | 8 / 8 new core binaries + three-surface QA |
| Visual quality rebaseline | **IN PROGRESS** | TBM → FIELD first |
| Episode 01 runtime scene elements | **PENDING** | 0 / 1 accepted final |

따라서 Phase D는 시작됐지만 **아직 완료는 아니다**.

## Phase D Final-only asset policy

Phase D에서는 **임시 시각물을 더 만들지 않는다**. 새로 만드는 시각 자산은 반드시 이미 정의된 Production slot을 직접 교체할 수 있는 **최종 후보(final candidate)** 여야 한다.

- 새 placeholder / mockup / fallback slot을 추가하지 않는다.
- 기존 legacy binary의 이름만 바꿔 final로 처리하지 않는다.
- CSS 실루엣이나 기능검증용 fallback을 최종 자산 수량에 포함하지 않는다.
- 캐릭터는 8개 title-cast portrait/map WebP를 **한 배치로** 교체하고 Main → Loading → MAP identity continuity를 통과해야 한다.
- Episode 01 runtime scene element는 현재 실제 배치되는 `material_stack`만 realistic-v2 최종본으로 교체한다.
- 최종 자산 intake로 생긴 회귀만 수정하고, 이 단계에서 새 Episode나 새 비주얼 체계를 열지 않는다.

현재 focus는 **D-2 — Visual Quality Rebaseline**이다. D-1 title cast는 8/8과 Main → Loading → MAP, five-profile QA를 통과해 잠겼다. 이제 TBM → FIELD 실화면을 먼저 목표 상용 품질 기준으로 끌어올린다.

## D-1 — Title cast identity refresh

**LOCKED — 2026-09-21**

- Final portrait/map WebP: **8 / 8**
- Binary replacement commit: `8dda5792806e6a7611226055fb90f28da83ca549`
- Final responsive/continuity evidence: workflow `35554336085`, artifact `10619463274`
- Main Title: PASS
- Cinematic Loading: PASS on desktop / phone / tablet
- Strategy MAP: PASS on desktop / phone
- Five-profile responsive gate: PASS

D-1은 재생산 단계가 아니다. 이후 identity/crop/scale 회귀가 실제 증거로 발견될 때만 다시 연다.

## D-2 — Visual Quality Rebaseline

Director의 현재 화면 ↔ 목표 화면 비교를 새 Production 기준선으로 고정했다.

**핵심: BINARY LOCKED ≠ VISUAL PRODUCTION LOCKED.**

현재 8개 immersive background binary는 exact hash 기준으로 유지하지만, 실제 player-facing composition이 어둡고 비어 보이거나 현장보다 패널이 먼저 보이면 Visual Lock으로 간주하지 않는다.

첫 작업 순서는 **TBM → FIELD**다. 이후 STOP WORK → STRATEGY → OFFICE → DAY RESULT를 같은 기준으로 닫는다.

상세 기준: `docs/PHASE-D-VISUAL-QUALITY-REBASELINE.md`.

## D-2 — Episode 01 runtime scene element

reusable scene-element catalog는 현재 118개 정의를 가진다. 그러나 **Episode 01의 실제 `event_elements`가 배치하는 것은 현재 `material_stack` 1개뿐**이다.

따라서 Episode 01 cinematic lock 때문에 118개 전부를 지금 만들지 않는다. 그것은 현장도감·후속 에피소드·공종 확장 자산 백로그이며, 지금 전부 요구하면 다시 ‘이미지만 끝없이 만드는’ 흐름으로 돌아간다.

Phase D blocker는 실제 Episode 01 runtime에 배치된 것만이다.

- `material_stack` — binary는 있으나 catalog 상태가 `replacement_required`; realistic-v2 최종 승인본 필요.

향후 `event_elements`에 새 요소가 실제 배치되면 자동으로 Phase D runtime scope에 들어온다.

## D-3 — 이미 잠긴 자산

현재 exact binary 검증 통과:
- Immersive backgrounds: **8/8**
- Character performance wave: **5/5**
- Production-v1 audio: **8/8**

이 자산은 다시 임시 스타일로 후퇴시키지 않는다.

## D-4 — 연출 Lock

Phase C에서 고정한 scene family의 카메라·조명·depth·UI 문법과 responsive regression fix를 production baseline으로 삼는다.

- STOP_WORK: zero-moment pressure
- FIELD: signal reading / human ensemble / DAY 02 threshold
- TBM: changed condition → crew voices → group judgment
- STRATEGY: tactical coordination
- OFFICE: fact → evidence → responsibility judgment
- DAY_RESULT: memory → people/record residue → tomorrow threshold

Phase D에서는 topology를 변경하지 않고 final asset replacement와 audio/transition polish만 허용한다.

## Scope rule

**Episode 01 완성과 장기 확장 자산을 분리한다.**

118개 전체 scene-element catalog를 Episode 01 Phase D blocker로 사용하지 않는다. `event_elements`에 실제 배치된 runtime 자산만 blocker다. 현장도감과 미래 공정용 요소는 별도 production backlog로 보존한다.

이는 Master Design Principles의 제작 순서와 동일하다: **Episode 01 완성형 샘플을 먼저 닫고, 그 위에서 공정·계절·공법·현장종류를 확장한다.**

## Commands

상태 확인: `npm run phase-d:status`

최종 Phase D gate: `npm run phase-d:check`

`phase-d:check`는 core production art, 신규 title-cast replacement, final backgrounds, performance wave, production audio, Episode 01 runtime scene-element scope, Episode 01 visual regression을 함께 검사한다.

기존 `release:production-check`는 더 넓은 상업 출시/전체 scene-element production gate로 남겨둔다. Phase D Episode 01 cinematic lock과 장기 전체 자산 완성도를 섞지 않는다.
