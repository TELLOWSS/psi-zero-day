# Episode 01 Field Guide Completion — 2026-09-24

## Scope
Episode 01 Section 0 Field Guide: FG001 through FG010.

## Final runtime presentation
- FG001 현장 출입구 — EP01 `gate-dawn` production-scene reference crop; vehicle gate + adjacent worker entrance focus
- FG002 보행자 출입구 — EP01 `gate-dawn` production-scene reference crop; worker entrance + access-control focus
- FG003 차량·보행 동선 분리시설 — realistic-v2 final
- FG004 자재 야적장 — realistic-v2 final, verified Euroform storage + clear aisle only
- FG005 임시 분전반 — realistic-v2 final
- FG006 임시조명 — realistic-v2 final, current-site installed LED line-bar configuration
- FG007 안전용품 지급·교체 지점 — realistic-v2 final
- FG008 소화기 배치 지점 — realistic-v2 final
- FG009 응급구호함·AED — realistic-v2 final, first-aid and AED legal meanings kept separate
- FG010 현장 풍속·기상 확인 지점 — realistic-v2 final as a Korean-market product-family representation, not an exact model clone

## Integrity rules
FG001/FG002 Field Guide no longer depend on the legacy scene-element placeholder WebPs. They reuse the already-approved Episode 01 gate production scene with separate crop focus, while their map/strategy scene-element production status remains independent and is not falsely promoted.

FG003-FG010 keep their dedicated 768×768 realistic-v2 WebP contracts. FG004 does not reuse the rejected generic system-shoring-member geometry. FG010 does not encode tower-crane thresholds as universal site limits.

The runtime test requires all ten IDs to be EP01, contiguous from FG001 to FG010, and resolvable through manifest-backed WebP routes.
