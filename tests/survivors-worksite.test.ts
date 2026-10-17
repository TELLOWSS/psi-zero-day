import {describe,it,expect} from 'vitest';
import {PATROL_STAGES} from '../src/engine/patrol-survivors-engine';
import {createTerrain,terrainHit,terrainContains,terrainWaypoint} from '../src/engine/survivors-terrain';
import sites from '../content/design/survivors-worksites-v1.json';
import {worksiteFamily} from '../src/domain/survivors-worksite';
describe('authored worksite footprints',()=>{
 it('covers each existing operation once without creating new campaigns',()=>{
  const numbers=Object.values(sites.families).flat().sort((a,b)=>a-b);expect(numbers).toEqual(Array.from({length:50},(_,i)=>i+1));
 });
 it('gives every workface a distinct physical arrangement while keeping the exit corridor clear',()=>{
  const signatures=new Set<string>();
  for(const stage of Object.values(PATROL_STAGES)){
   const terrain=createTerrain(stage);expect(terrain).toHaveLength(4);signatures.add(JSON.stringify(terrain));
   expect(terrainHit(terrain,{x:700,y:40},{x:700,y:860},20)).toBeUndefined();
   for(const o of terrain){expect(o.x).toBeGreaterThanOrEqual(40);expect(o.y+o.height).toBeLessThanOrEqual(840);for(const target of stage.hazards)expect(terrainContains(o,target,16)).toBe(false);}
   for(const target of stage.hazards){const waypoint=terrainWaypoint(terrain,{x:700,y:450},target,16);expect(Math.hypot(waypoint.x-700,waypoint.y-450)>0||Math.hypot(target.x-700,target.y-450)===0).toBe(true);}
  }
  expect(signatures.size).toBe(50);expect(worksiteFamily(7)).toBe('remodel');expect(worksiteFamily(42)).toBe('plant');
 });
});
