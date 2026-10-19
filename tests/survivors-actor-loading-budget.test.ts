import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import layouts from '../content/art/survivors-authored-actor-layouts-v1.json';
import {authoredDirectionSourcePlan,type AuthoredDirectionLayout} from '../src/ui/survivors-directional-art';

it('prepares every reviewed pose with each source loaded once and under half the original decoded source budget',()=>{
 for(const directions of Object.values(layouts)){
  const authored=directions as AuthoredDirectionLayout[],plan=authoredDirectionSourcePlan(authored);
  const resident=new Set<string>(),loaded=new Set<string>();let peak=0;
  const bytes=(src:string)=>{const png=readFileSync('public'+src);return png.readUInt32BE(16)*png.readUInt32BE(20)*4;};
  for(let direction=0;direction<8;direction++){
   for(const src of plan[direction]!.load){expect(loaded.has(src)).toBe(false);loaded.add(src);resident.add(src);}
   peak=Math.max(peak,[...resident].reduce((sum,src)=>sum+bytes(src),0));
   for(const pose of authored[direction]!.frames)expect(resident.has(pose.src??authored[direction]!.src)).toBe(true);
   for(const src of plan[direction]!.release)resident.delete(src);
  }
  expect(resident.size).toBe(0);expect(loaded.size).toBeGreaterThan(8);
  expect(peak).toBeLessThan([...loaded].reduce((sum,src)=>sum+bytes(src),0)/2);
 }
});
