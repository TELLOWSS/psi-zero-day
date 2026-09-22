# Phase D — Visual Quality Rebaseline v1

**Status: ACTIVE PRODUCTION BASELINE**  
**Effective: 2026-09-21**

Director가 현재 실제 게임 화면과 목표 상용 화면을 직접 비교한 결과, Phase D의 품질 판정을 다시 고정한다.

> **BINARY LOCKED ≠ VISUAL PRODUCTION LOCKED**

파일이 존재하고 hash/format 검증을 통과했다는 사실만으로 실제 플레이 화면이 완성된 것은 아니다. Episode 01은 **현장이 먼저 보이고 UI가 그 현장을 해석하는 게임**이어야 한다.

## 공통 Visual Gate

- 큰 빈 검정 화면을 최종 장면으로 인정하지 않는다.
- 사람, 자재, 장비, 동선, 위험 신호가 같은 현장 공간에 존재해야 한다.
- HUD는 현장을 가리지 않고 현장을 읽게 해야 한다.
- 선택 UI가 결정에 필요한 시각적 단서를 덮지 않아야 한다.
- 주연 캐릭터 identity/PPE/role prop/scale이 장면 사이에서 유지되어야 한다.
- PC, phone portrait, phone landscape, tablet에서 장면 hierarchy가 동일해야 한다.
- Final Art / UI / Sound / Motion은 하나의 NEW PSI 상용 디자인 언어로 묶는다.

## First Wave — TBM → FIELD

### TBM
Reference event: `e01_08g_tbm_field_gap`.

목표는 '패널 위 TBM'이 아니라 **오후에 작업조건이 바뀐 실제 현장에서 다시 TBM을 여는 장면**이다. material yard, changed route/access, active crew가 계속 보이고, PSI TRACE와 change-control UI가 그 차이를 해석해야 한다.

### FIELD
Reference event: `e01_04_junho_signal`.

목표는 두 캐릭터가 어두운 무대 위에 떠 있는 화면이 아니라 **작은 신호가 실제 작업 공간 안에서 보이는 장면**이다. 작업구역·동선·장비/자재 맥락이 살아 있어야 하며 플레이어는 설명을 읽기 전에 무엇이 이상한지 먼저 볼 수 있어야 한다.

## Production Order

1. D-1 Title Cast — **LOCKED**
2. D-2 Visual Quality Rebaseline — **TBM → FIELD first**
3. D-3 Episode runtime prop — `material_stack realistic-v2`
4. D-4 Remaining scene/UI/sound/direction visual lock
5. D-5 strict `phase-d:check` + Episode 01 Cinematic Vertical Slice Lock

Source of truth:
- `content/episode01/phase-d-visual-quality-rebaseline-v1.json`
- `src/app/episode01-visual-quality-rebaseline.ts`
- `tests/episode01-visual-quality-rebaseline.test.ts`


## TBM Reference Implementation — 2026-09-23

Reference event/node: `e01_08g_tbm_field_gap / tbm_action`.

Status: **RUNTIME IMPLEMENTED / SCREEN QA REQUIRED**.

The reference frame now composes the existing final work-yard surface with the existing
`access-barrier`, `open-edge`, and `material-stack` scene-element assets. The four locked
characters remain on one floor plane while a restrained field-route cue identifies the afternoon
changed condition. No new placeholder image or event/choice branch was added.

The implementation is intentionally not marked `VISUAL_PRODUCTION_LOCKED` until the five
required viewport screenshots are inspected. The next runtime expansion remains FIELD after this
TBM reference frame passes screen QA.


## FIELD Reference Implementation — 2026-09-23

Reference event/node: `e01_04_junho_signal / listen`.

Status: **RUNTIME IMPLEMENTED / SCREEN QA REQUIRED**.

The FIELD reference now keeps the ramp-entry world visible and gives the small signal a physical
read: vehicle passage trace, displaced gravel, and a slightly raised steel-plate edge sit inside the
same scene as Player and Lim Junho. Choi Minseok remains visible as an operational background
presence, while the judgment dock is constrained so it does not cover the clue.

No new placeholder image, event, choice, effect, or Episode topology was added. The implementation
must still pass the same five-profile screenshot review before it can be marked
`VISUAL_PRODUCTION_LOCKED`.
