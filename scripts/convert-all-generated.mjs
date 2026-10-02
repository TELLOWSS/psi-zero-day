import { processAsset } from './process-generated-assets.mjs';

const brainDir = 'C:/Users/user/.gemini/antigravity-ide/brain/eb4a131f-b5ba-40a2-a5c6-fad99d0f6986';

const items = [
  {
    input: `${brainDir}/replan_pass_card_1790885786826.jpg`,
    output: 'public/assets/episode01/items/replan-pass.webp',
  },
  {
    input: `${brainDir}/radio_pack_item_1790885805431.jpg`,
    output: 'public/assets/episode01/items/radio-pack.webp',
  },
  {
    input: `${brainDir}/inspection_kit_item_1790885821344.jpg`,
    output: 'public/assets/episode01/items/inspection-kit.webp',
  },
  {
    input: `${brainDir}/traffic_control_item_1790885836057.jpg`,
    output: 'public/assets/episode01/items/traffic-control-pack.webp',
  },
  {
    input: `${brainDir}/access_lane_item_1790885850375.jpg`,
    output: 'public/assets/episode01/items/access-lane.webp',
  },
  {
    input: `${brainDir}/safety_rail_item_1790885864164.jpg`,
    output: 'public/assets/episode01/scene-elements/safety-rail.webp',
  },
  {
    input: `${brainDir}/mobile_scaffold_item_1790885879184.jpg`,
    output: 'public/assets/episode01/scene-elements/mobile-scaffold.webp',
  },
];

for (const item of items) {
  await processAsset(item.input, item.output, { size: 768, tolerance: 22, ramp: 25 });
}
console.log('All 7 high-quality 3D assets processed successfully!');
