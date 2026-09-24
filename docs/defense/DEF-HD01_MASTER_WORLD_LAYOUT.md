# DEF-HD01-1 — DefenseGame MASTER WORLD Layout Lock

Date: 2026-09-24  
Target runtime: `src/ui/DefenseGame.tsx`  
Baseline: `ramp-01 / 1000×600 / 8 pads / 10 waves`

## Gate purpose

This Gate does **not** replace the DefenseGame engine and does **not** generate the final art yet.

It fixes the real construction-site world composition to the existing engine coordinates so that the next image-generation pass cannot drift away from gameplay topology.

## World concept

The existing zig-zag route becomes a believable **temporary logistics / risk-propagation circulation spine** through one active Korean high-rise construction site.

It must not look like a painted tower-defense track.

The player should read:

**west gate → logistics/material handling → north workface → central structural conflict zone → south service/pump zone → east active workface**

as one continuous site.

## Immutable route

```
(0,300)
→ (180,300)
→ (180,150)
→ (450,150)
→ (450,450)
→ (720,450)
→ (720,240)
→ (1000,240)
```

The bends at x=180, x=450 and x=720 are deliberate gameplay landmarks.

## Pad integration

The eight existing pads remain at the exact runtime coordinates.

They must **not** be drawn as futuristic sockets.

Each becomes a plausible clear intervention/staging hardstand:

| Pad | Coordinate | Construction-world reading |
|---|---:|---|
| P1 | 120,220 | west gate marshal hardstand |
| P2 | 260,220 | pedestrian/logistics separation point |
| P3 | 360,70 | elevated observation / crane signal position |
| P4 | 370,340 | central crossing intervention point |
| P5 | 530,240 | lifting exclusion / central workface control point |
| P6 | 600,370 | south logistics control point |
| P7 | 640,530 | plant/material staging intervention point |
| P8 | 800,320 | east workface access control point |

Every pad must remain visually open enough to host **any** tower family. The world art may suggest context, but it must not hard-code one tower type to one pad.

## Sector composition

### Z0 — SITE OFFICE
Upper-left perimeter.

Temporary offices, welfare cabins, small parking edge, fencing and a lighting mast. This creates believable site context without stealing focus from the route.

### Z1 — GATE
West entry.

Gatehouse, fencing, vehicle entry, pedestrian entry and traffic-control structures. P1 sits here.

### Z2 — LOGISTICS
West/north transition.

Material stacks, forklift staging, pedestrian segregation and temporary barriers. P2 sits between the route and handling edge.

### Z3 — NORTH WORKFACE
Upper central area.

Formwork, rebar bundles, edge protection and visible tower-crane structure. P3 is a long-sightline observation position.

### Z4 — CORE
Central construction mass.

Reinforced-concrete core, scaffolding, temporary stairs and high-conflict movement. P4 and P5 sit on opposite sides of this operational core.

### Z5 — SOUTH SERVICE
Lower central area.

Pump truck, ready-mix/service traffic, temporary power and material staging. P6/P7 must remain clear of vehicle swept paths.

### Z6 — EAST WORKFACE
Right side.

More advanced structure, access stair/hoist, edge protection and final active workface. P8 controls the final approach.

### Z7 — EAST BUFFER
Lower-right visual depth.

Fence, containers, secondary storage and lighting. Keep density lower so the final route section remains readable.

## Art rules

- High-oblique, near-orthographic camera.
- Approx. 70° elevation.
- 5:3 world ratio.
- Light from top-left; shadow to bottom-right.
- Cinematic realistic Korean high-rise construction site.
- One coherent worksite, not disconnected mini-scenes.
- Large masses and broad value grouping first; micro-detail second.
- No baked HUD.
- No text.
- No company logo.
- No risk icons.
- No pad labels.
- No arrows painted purely for gameplay.
- Runtime route, pad and actor overlays remain authoritative.

## Geometry safety

- Route art-clear half width: **42 logical px**.
- Pad permanent-prop keepout radius: **44 logical px**.
- Preferred visually clear radius around each pad: **58 logical px**.
- No large prop may hide a route bend.
- No structure may occupy the center of any P1–P8 location.

## Mobile rule

The final world must also survive the later `DEF-HD02` portrait camera system.

A 390px portrait camera sector should show:
- one readable route segment,
- at least one nearby interaction area,
- enough surrounding construction context to know where the player is.

Do not rely on tiny textures or tiny props for navigation.

## Lock decision

The source-of-truth layout is:

`content/defense/def-hd01-world-layout.json`

If final art conflicts with that file, the **layout contract wins** and the art must be regenerated or corrected.

## Next Gate

**DEF-HD01-2 — MASTER WORLD ART BRIEF + FIRST RENDER**

Only after this layout contract passes:
1. create the exact image-generation brief,
2. generate one MASTER WORLD candidate,
3. compare route/pad alignment against the 1000×600 contract,
4. reject immediately if any major route bend or pad context drifts,
5. only then continue to visual polish.

## STOP LINE

Until DEF-HD01-2 passes:
- no DefenseGame camera rewrite,
- no portrait-mode removal,
- no enemy/hazard semantic conversion,
- no character production,
- no equipment mass-production,
- no BGM integration,
- no balance changes.
