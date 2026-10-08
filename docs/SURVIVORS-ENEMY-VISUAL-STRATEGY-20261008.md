# General risk silhouette strategy — 2026-10-08

## Goal
Read the ordinary risk's behavior before reading its label, including on small mobile screens. Preserve the rule that people are not monsters: workers keep existing character artwork; new destructive-looking material silhouettes apply only to carts, vapor and falling material.

| Family | Silhouette | Material | Counterplay identity |
| --- | --- | --- | --- |
| Timber trolley | Long low open load | Orange frame, timber | Baseline approach and warned charge |
| Reinforced carrier | Broad cage, six wheels | Heavy rebar and dark steel | Existing reinforced-cart variant |
| Pallet runner | Narrow fork nose, compact cab | Yellow transport hardware | Existing side approach and locked charge |
| Pressure vapor | Tall rounded plume | Green translucent vapor | Existing pulse warning and release |
| Split vapor | Two lobes and thin neck | Amber vapor | Existing split-gas behavior |
| Crosswind vapor | Long curled ribbon | Teal vapor | Existing lateral drift |
| Rebar fall | Long jagged bundle | Rusted steel rods | Existing locked fall warning |
| Slab fall | Wide angular slab | Concrete, exposed aggregate | Existing wide-debris footprint |
| Steel fall | Short clustered blocks | Structural steel offcuts | Existing fall warning |

## Stage progression
Behavior traits take priority over region. Datacenter ordinary carts use the narrow transport silhouette; high-rise debris uses rebar; curing areas use concrete slabs; remaining debris alternates concrete/steel by stage. Bosses and authored signature events retain their dedicated production art. No new health multipliers, collision shapes, attack timings, difficulty or save IDs are introduced.

## Performance and readability
One 3x3 transparent WebP atlas, nine cached 256px frames, existing drawImage renderer. Shapes remain identical in low-performance mode. Reduced motion stops cosmetic deformation while retaining the selected silhouette. No steady-frame alpha scan, canvas texture filtering, extra particle generator or second simulation is introduced.

## Asset production
Built-in image generation: a realistic isometric construction material atlas with nine isolated objects, upper-left light, no people, labels, UI, logos or background. A second image-generation edit preserved the nine objects and corrected cell spacing. Selected source: `exec-ddff4374-6062-4753-8114-11102ce1a953.png`. Runtime asset: `public/assets/survivors/stage-threat-silhouettes-v1.webp` (1254x1254 RGBA source, alpha retained; WebP quality 90). All nine cell alpha bounds checked for complete objects and nonzero transparent gutters.

## Validation gate
Verify runtime selection and boss/signature isolation, existing full tests/typecheck/build, six mobile/tablet viewports, and an explicit rendered appearance showcase. Review screenshots at actual mobile scale before merging. This is nine authored silhouettes shared across 50 stages, not 50 unique monster models or a final physical Android performance claim.
