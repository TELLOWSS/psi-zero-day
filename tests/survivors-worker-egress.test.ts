import {describe,it,expect} from 'vitest';
import {createResolvedWorker,updateResolvedWorker,workerRouteTerrain} from '../src/engine/survivors-worker-egress';
import {safetyWalkway} from '../src/domain/survivors-safety-walkway';
import {createTerrain,terrainContains,terrainHit} from '../src/engine/survivors-terrain';
import {PATROL_STAGES,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import type {StageHazardObject} from '../src/domain/patrol-survivors';
import type {TerrainObject} from '../src/domain/survivors-terrain';
const W=1400,H=900,DT=1/60;
describe('educated worker uses the marked safety corridor',()=>{
 it('joins before travelling north or south and stays until the actual gate',()=>{
  for(const y of [200,700]){const worker=createResolvedWorker('crew',100,y,[],W,H);for(let i=0;i<240;i++)expect(updateResolvedWorker(worker,DT,[],[],W,H)).toBe(false);expect(worker.y).toBe(y);expect(worker.x).toBeCloseTo(500);expect(worker.remaining).toBe(1);
   let done=false,joined=false;for(let i=0;i<1000&&!done;i++){done=updateResolvedWorker(worker,DT,[],[],W,H);if(worker.route?.phase==='corridor'){joined=true;expect(worker.x).toBeCloseTo(safetyWalkway(W,H).centerX);}}
   expect(joined).toBe(true);expect(done).toBe(true);expect(worker.y).toBeCloseTo(y<H/2?-80:980);
  }
 });
 it('goes around expanded obstacle footprints without teleporting',()=>{
  const objects:TerrainObject[]=[{id:'pillar',kind:'pillar',x:330,y:120,width:100,height:180,hp:1,maxHp:1}];const worker=createResolvedWorker('crew',150,200,objects,W,H);let done=false;
  for(let i=0;i<2000&&!done;i++){const previous={x:worker.x,y:worker.y};done=updateResolvedWorker(worker,DT,objects,[],W,H);expect(terrainHit(objects,previous,worker,18)).toBeUndefined();expect(Math.hypot(worker.x-previous.x,worker.y-previous.y)).toBeLessThanOrEqual(100*DT+.001);}
  expect(done).toBe(true);
 });
 it('waits before an overhead warning then continues through the gate when it clears',()=>{
  const zone:StageHazardObject={id:'lift',type:'crane_drop_zone',x:700,y:300,radius:60,hp:1,maxHp:1,state:'warning',timer:2};const worker=createResolvedWorker('crew',700,500,[],W,H);worker.route!.exit='north';worker.route!.phase='corridor';
  for(let i=0;i<300;i++)updateResolvedWorker(worker,DT,[],[zone],W,H);expect(worker.y).toBeGreaterThanOrEqual(378);expect(worker.route!.waiting).toBe(true);const y=worker.y;updateResolvedWorker(worker,DT,[],[zone],W,H);expect(worker.y).toBe(y);
  zone.state='cooldown';let done=false;for(let i=0;i<600&&!done;i++)done=updateResolvedWorker(worker,DT,[],[zone],W,H);expect(done).toBe(true);
 });
 it('retreats from a newly warned footprint without leaving the corridor or teleporting',()=>{
  const zone:StageHazardObject={id:'lift',type:'crane_drop_zone',x:700,y:450,radius:60,hp:1,maxHp:1,state:'active',timer:1};const worker=createResolvedWorker('crew',700,450,[],W,H);const y=worker.y;updateResolvedWorker(worker,DT,[],[zone],W,H);expect(Math.abs(worker.y-y)).toBeCloseTo(100*DT);expect(worker.x).toBe(700);expect(worker.route!.waiting).toBe(true);
 });
 it('all 50 authored terrains provide usable corridor exits from both sides',()=>{
  for(const stage of Object.values(PATROL_STAGES)){const terrain=workerRouteTerrain(createTerrain(stage),stage.hazards);for(const point of [{x:80,y:180},{x:1320,y:720}]){const worker=createResolvedWorker(stage.id,point.x,point.y,terrain,W,H);let done=false;for(let i=0;i<2000&&!done;i++){done=updateResolvedWorker(worker,DT,terrain,[],W,H);expect(terrain.some(o=>terrainContains(o,worker,18))).toBe(false);if(worker.route?.phase==='corridor')expect(Math.abs(worker.x-700)).toBeLessThan(90);}expect(done,JSON.stringify({stage:stage.id,point,worker,terrain})).toBe(true);}}
 });
 it('pause freezes movement and education credit is not awarded again at exit',()=>{
  const e=new SurvivorsEngine();e.start();e.state.hazards=[{id:'crew',type:'UNHELMETED',x:100,y:180,hp:0,maxHp:1,speed:0,radius:10,damage:0,expValue:1}];e.update(DT,{moveX:0,moveY:0});const worker=e.state.resolvedWorkers!.find(w=>w.id==='crew')!;expect(worker).toBeDefined();const score=e.state.score,neutralized=e.state.hazardsNeutralized;expect(neutralized).toBe(1);e.state.phase='paused';const before={x:worker.x,y:worker.y};e.update(1,{moveX:0,moveY:0});expect({x:worker.x,y:worker.y}).toEqual(before);
  let done=false;for(let i=0;i<2000&&!done;i++)done=updateResolvedWorker(worker,DT,e.state.terrain??[],[],W,H);expect(done).toBe(true);expect(e.state.score).toBe(score);expect(e.state.hazardsNeutralized).toBe(neutralized);
 });
});
