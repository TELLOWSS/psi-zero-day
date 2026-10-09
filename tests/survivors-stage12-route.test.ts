import {describe,it,expect} from 'vitest';
import {stage12RubbleRoute} from '../src/engine/survivors-stage12-route';
import {createTerrain,terrainHit,terrainMove} from '../src/engine/survivors-terrain';
import {PATROL_STAGES,createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {drawStage12RubbleRoute} from '../src/ui/survivors-stage12-route-renderer';
import type {TerrainObject} from '../src/domain/survivors-terrain';

describe('ST12 Gate 1B — visible corridor and genuine movement collision',()=>{
 it('switches from blocked to traversable only when the rubble itself is removed',()=>{
  const terrain=createTerrain(PATROL_STAGES.stage_12);
  const before=stage12RubbleRoute(terrain);
  expect(before).not.toBeNull();
  expect(before!.open).toBe(false);
  const hit=terrainHit(terrain,before!.from,before!.to,14);
  expect(hit?.object.id).toBe(before!.rubbleId);
  const blocked=terrainMove(terrain,before!.from,before!.to,14);
  expect(Math.hypot(blocked.x-before!.to.x,blocked.y-before!.to.y)).toBeGreaterThan(25);

  terrain.find(o=>o.id===before!.rubbleId)!.hp=0;
  const after=stage12RubbleRoute(terrain);
  expect(after).toMatchObject({open:true,rubbleId:before!.rubbleId});
  expect(terrainHit(terrain,after!.from,after!.to,14)).toBeUndefined();
  expect(terrainMove(terrain,after!.from,after!.to,14)).toEqual(after!.to);
 });
 it('never advertises an open route when a different barrier blocks the crossing',()=>{
  const debris:TerrainObject={id:'rubble',kind:'rubble',x:400,y:400,width:100,height:80,hp:0,maxHp:80};
  const horizontal:TerrainObject={id:'horizontal',kind:'pillar',x:320,y:428,width:280,height:20,hp:1,maxHp:1};
  const vertical:TerrainObject={id:'vertical',kind:'pillar',x:440,y:320,width:20,height:260,hp:1,maxHp:1};
  expect(stage12RubbleRoute([debris,horizontal,vertical])).toBeNull();
  expect(stage12RubbleRoute([])).toBeNull();
 });

 it('opens the visual route through two real cleanup actions, never awarding duplicate credits',()=>{
   const state=createInitialSurvivorsState('lim_junho',undefined,'stage_12');
   const routeBefore=stage12RubbleRoute(state.terrain??[]);
   expect(routeBefore?.open).toBe(false);
   const rubble=state.terrain?.find(o=>o.id===routeBefore!.rubbleId)!;
   state.player.x=rubble.x-40;
   state.player.y=rubble.y+rubble.height/2;
   state.hazards=[];state.interactiveHazards=[];
   const engine=new SurvivorsEngine(state);
   engine.start();
   const credits=state.psiCredits;
   expect(engine.clearTerrain()).toBe(true);
   expect(stage12RubbleRoute(state.terrain??[])?.open).toBe(false);
   expect(engine.clearTerrain()).toBe(false); // Cooling down, not a double reward.
   for(let i=0;i<50;i++)engine.update(1/60,{moveX:0,moveY:0});
   expect(engine.clearTerrain()).toBe(true);
   const routeAfter=stage12RubbleRoute(state.terrain??[]);
   expect(routeAfter?.open).toBe(true);
   expect(terrainMove(state.terrain??[],routeAfter!.from,routeAfter!.to,14)).toEqual(routeAfter!.to);
   expect(state.terrainRecord?.rubbleCleared).toBe(1);
   expect(state.psiCredits-credits).toBe(40);
   expect(engine.clearTerrain()).toBe(false);
 });
 it('draws only the ST12 state, preserving the collision-derived label in reduced motion',()=>{
  const terrain=createTerrain(PATROL_STAGES.stage_12),labels:string[]=[];
  const f=()=>undefined;
  const ctx={
    save:f,restore:f,beginPath:f,moveTo:f,lineTo:f,stroke:f,setLineDash:f,
    strokeText:(s:string)=>labels.push(s),fillText:(s:string)=>labels.push(s),
    closePath:f,fill:f,
  } as unknown as CanvasRenderingContext2D;
  drawStage12RubbleRoute(ctx,'stage_11',terrain,true);
  expect(labels).toHaveLength(0);
  drawStage12RubbleRoute(ctx,'stage_12',terrain,true);
  expect(labels).toContain('잔재 장애 · 우회 필요');
  terrain.find(o=>o.kind==='rubble')!.hp=0;
  drawStage12RubbleRoute(ctx,'stage_12',terrain,true);
  expect(labels).toContain('잔재 정리 · 직접 통과 가능');
 });
});
