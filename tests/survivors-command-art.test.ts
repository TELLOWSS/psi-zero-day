import {describe,it,expect} from 'vitest';
import {COMMAND_ART,commandArtProfile} from '../src/ui/survivors-command-art';
import {CHARACTER_MAP_ART} from '../src/ui/survivors-character-art';
import {loadAuthoredCommand} from '../src/ui/survivors-authored-command';

describe('character-specific authored command art',()=>{
 it('reuses the exact same profile for actual legacy aliases without borrowing another character',()=>{
  expect(commandArtProfile(CHARACTER_MAP_ART.player)).toBe(commandArtProfile(CHARACTER_MAP_ART.jung));
  expect(commandArtProfile(CHARACTER_MAP_ART.kang_taesik)).toBe(commandArtProfile(CHARACTER_MAP_ART.park));
  expect(commandArtProfile(CHARACTER_MAP_ART.lim_junho)?.art).toContain('lim-command');
  expect(commandArtProfile(CHARACTER_MAP_ART.yoon_sungho)?.art).toContain('yoon-command');
  for(const id of ['lee_jaehoon','safety_monitor','yoon'] as const)expect(commandArtProfile(CHARACTER_MAP_ART[id])).toBeUndefined();
 });
 it('only accepts explicit authored files and keeps each production sheet distinct',async()=>{
  for(const file of ['unknown.webp','constructor','toString','__proto__'])expect(commandArtProfile(file)).toBeUndefined();
  expect(new Set(Object.values(COMMAND_ART).map(profile=>profile.art)).size).toBe(4);
  expect(await loadAuthoredCommand({src:CHARACTER_MAP_ART.lee_jaehoon} as HTMLImageElement)).toBe(false);
 });
 it('keeps hands, protected face regions and command bands inside canonical body space',()=>{
  for(const profile of Object.values(COMMAND_ART)){
   expect(profile.top).toBeGreaterThanOrEqual(0);expect(profile.bottom).toBeGreaterThan(profile.top);expect(profile.bottom).toBeLessThan(1);
   expect(profile.rig.waist).toBeLessThan(.6);
   if(profile.preserve){const p=profile.preserve;expect(p.x+p.width).toBeLessThanOrEqual(1);expect(p.y+p.height).toBeLessThan(profile.bottom);}
   if(profile.occluders){expect(profile.occluders).toHaveLength(8);for(const polygons of profile.occluders)for(const polygon of polygons)for(const point of polygon)for(const value of point){expect(value).toBeGreaterThanOrEqual(0);expect(value).toBeLessThanOrEqual(1);}}
  }
 });
 it('gives the pointing glove a moving equipment occlusion, while retaining the relaxed free hand',()=>{
  const hands=COMMAND_ART['kang-taesik-map.webp']!.occluders!;
  expect(hands[0]![0]).not.toEqual(hands[3]![0]);expect(hands[0]![1]).toEqual(hands[3]![1]);
  expect(COMMAND_ART['lim-junho-map.webp']!.rig.protected).toHaveLength(1);
  const wire=COMMAND_ART['yoon-sungho-map.webp']!;
  expect(wire.occluders![0]![0]).not.toEqual(wire.occluders![3]![0]);
  expect(wire.occluders![0]![1]).toEqual(wire.occluders![3]![1]);
  expect(wire.rig.protected).toHaveLength(2);
 });
});
