import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { episode01MorningPourPlate, EP01_MORNING_POUR_PLATES } from '../src/app/episode01-morning-pour';
import { episode01ImmersiveScene } from '../src/app/episode01-immersive-scene';

describe('Episode01 daylight director preview, without mutating narrative', () => {
 it('uses independent camera art at 09:24 and 09:45', () => {
  const arrival=episode01MorningPourPlate('e01_06_pump_arrival');
  const pouring=episode01MorningPourPlate('e01_07_first_pour');
  expect(arrival?.uri).not.toBe(pouring?.uri);
  expect(arrival?.camera).toBe('site-approach-wide');
  expect(pouring?.camera).toBe('slab-level-workface');
  expect(Object.keys(EP01_MORNING_POUR_PLATES)).toHaveLength(2);
  for(const plate of [arrival,pouring]){
   expect(plate?.approval).toBe('DIRECTOR_PREVIEW_ONLY');
   const svg=readFileSync('public/'+plate!.uri,'utf8');
   expect(svg).toContain('viewBox="0 0 1920 1080"');
   expect(svg).not.toContain('<text');
  }
 });
 it('preserves pre-existing concrete environment catalog and event engine identities',()=>{
  expect(episode01ImmersiveScene('e01_06_pump_arrival', undefined, undefined)?.background_asset_id).toBe('ep01.scene_bg.concrete_pour');
  expect(episode01ImmersiveScene('e01_07_first_pour', undefined, undefined)?.background_asset_id).toBe('ep01.scene_bg.concrete_pour');
  expect(episode01MorningPourPlate('e01_08_reactions')).toBeUndefined();
 });
});
