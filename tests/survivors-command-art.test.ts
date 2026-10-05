import {describe,it,expect} from 'vitest';
import {COMMAND_ART,commandArtProfile,authoredCommandFrame} from '../src/ui/survivors-command-art';
import {CHARACTER_MAP_ART} from '../src/ui/survivors-character-art';
import {loadAuthoredCommand} from '../src/ui/survivors-authored-command';

describe('character-specific authored command art',()=>{
 it('returns through the foreman intermediate poses and settles every actor before idle',()=>{
  const phases=[.0625,.1875,.3125,.4375,.5625,.6875,.8125,.9375];
  expect(phases.map(p=>authoredCommandFrame(CHARACTER_MAP_ART.kang_taesik,p))).toEqual([0,1,2,3,2,1,6,7]);
  for(const id of ['player','lim_junho','yoon_sungho','lee_jaehoon','safety_monitor'] as const)
   expect(phases.map(p=>authoredCommandFrame(CHARACTER_MAP_ART[id],p))).toEqual([0,1,2,3,4,5,6,7]);
  for(const src of Object.keys(COMMAND_ART)){
   for(const progress of [NaN,Infinity,-1,0,.96,.99,1,2])expect(authoredCommandFrame(src,progress)).toBe(0);
   for(let p=0;p<=1;p+=.001){const frame=authoredCommandFrame(src,p);expect(frame).toBeGreaterThanOrEqual(0);expect(frame).toBeLessThan(8);}
  }
 });
 it('reuses the exact same profile for actual legacy aliases without borrowing another character',()=>{
  expect(commandArtProfile(CHARACTER_MAP_ART.player)).toBe(commandArtProfile(CHARACTER_MAP_ART.jung));
  expect(commandArtProfile(CHARACTER_MAP_ART.kang_taesik)).toBe(commandArtProfile(CHARACTER_MAP_ART.park));
  expect(commandArtProfile(CHARACTER_MAP_ART.lim_junho)?.art).toContain('lim-command');
  expect(commandArtProfile(CHARACTER_MAP_ART.yoon_sungho)?.art).toContain('yoon-command');
  expect(commandArtProfile(CHARACTER_MAP_ART.lee_jaehoon)?.art).toContain('lee-command');
  expect(commandArtProfile(CHARACTER_MAP_ART.safety_monitor)?.art).toContain('safety-command');
  expect(commandArtProfile(CHARACTER_MAP_ART.yoon)).toBeUndefined();
 });
 it('only accepts explicit authored files and keeps each production sheet distinct',async()=>{
  for(const file of ['unknown.webp','constructor','toString','__proto__'])expect(commandArtProfile(file)).toBeUndefined();
  expect(new Set(Object.values(COMMAND_ART).map(profile=>profile.art)).size).toBe(6);
  expect(await loadAuthoredCommand({src:CHARACTER_MAP_ART.yoon} as HTMLImageElement)).toBe(false);
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
  const plan=COMMAND_ART['lee-jaehoon-map.webp']!;
  expect(plan.horizontalPadding).toBe(24);
  expect(plan.occluders![0]![0]).not.toEqual(plan.occluders![3]![0]);
  expect(plan.occluders![0]![1]).toEqual(plan.occluders![3]![1]);
  const monitor=COMMAND_ART['safety-monitor-v2.webp']!;
  expect(monitor.occluders![0]![0]).not.toEqual(monitor.occluders![3]![0]);
  expect(monitor.occluders![0]![1]).toEqual(monitor.occluders![3]![1]);
 });
});
