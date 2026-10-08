import {describe,it,expect} from 'vitest';
import {terrainMove,terrainHit,terrainWaypoint,terrainContains,createTerrain} from '../src/engine/survivors-terrain';
import {createInitialSurvivorsState,SurvivorsEngine,PATROL_STAGES} from '../src/engine/patrol-survivors-engine';
import {selectSurvivorsAutoTarget} from '../src/engine/survivors-auto-target';
import type {TerrainObject} from '../src/domain/survivors-terrain';
import type {Hazard,Projectile} from '../src/domain/patrol-survivors';
import {PATROL_DIFFICULTIES,DIFFICULTY_WARNING_SCALE} from '../src/domain/survivors-challenge';
import {updateHazardMotion} from '../src/engine/patrol-hazard-motion';
const wall:TerrainObject={id:'wall',kind:'pillar',x:100,y:100,width:80,height:80,hp:1,maxHp:1};
const hazard=(x:number,y:number):Hazard=>({id:`h${x}`,type:'RUNAWAY_CART',x,y,hp:100,maxHp:100,radius:15,speed:100,damage:10,expValue:1});
describe('workface terrain gameplay',()=>{
 it('gives beginners more warning while preserving a readable extreme warning floor',()=>{
  const player=createInitialSurvivorsState().player;player.x=240;player.y=140;
  const read=(mode:keyof typeof DIFFICULTY_WARNING_SCALE)=>{const h=hazard(40,140);h.motion={phase:'approach',timer:0,directionX:0,directionY:0};updateHazardMotion(h,player,1/60,100,DIFFICULTY_WARNING_SCALE[mode]);return h.motion.timer;};
  expect(read('story')).toBeGreaterThan(read('standard'));expect(read('standard')).toBeGreaterThan(read('hard'));expect(read('extreme')).toBeGreaterThanOrEqual(.85);
  expect(PATROL_DIFFICULTIES.extreme.hp/PATROL_DIFFICULTIES.standard.hp).toBeLessThan(1.5);
 });
 it('stops a swept dash and slides along a wall instead of passing through',()=>{
  const stopped=terrainMove([wall],{x:40,y:140},{x:300,y:140},14);expect(stopped.x).toBeLessThan(86);expect(stopped.x).toBeGreaterThan(84);
  const slide=terrainMove([wall],{x:85,y:140},{x:105,y:160},14);expect(slide.x).toBeLessThan(86);expect(slide.y).toBe(160);
 });
 it('routes a pursuer around a barrier without oscillating at a corner',()=>{
  let p={x:40,y:140};const target={x:240,y:140};
  for(let i=0;i<400;i++){const next=terrainWaypoint([wall],p,target,15),d=Math.hypot(next.x-p.x,next.y-p.y)||1,step=Math.min(d,2);p=terrainMove([wall],p,{x:p.x+(next.x-p.x)/d*step,y:p.y+(next.y-p.y)/d*step},15);}
  expect(Math.hypot(p.x-target.x,p.y-target.y)).toBeLessThan(3);
 });
 it('selects a visible target instead of continually shooting the closer blocked target',()=>{
  const blocked=hazard(220,140),visible=hazard(50,300),origin={x:40,y:140};
  expect(selectSurvivorsAutoTarget([blocked,visible],origin.x,origin.y,450,h=>!terrainHit([wall],origin,h,2))?.id).toBe(visible.id);
 });
 it('cart impact opens a weak point and grants no free kill or repeated impact count',()=>{
  const s=createInitialSurvivorsState();s.terrain=[{...wall}];s.player.x=240;s.player.y=140;s.interactiveHazards=[];
  const h=hazard(60,140);h.motion={phase:'charge',timer:1,directionX:1,directionY:0};s.hazards=[h];
  const e=new SurvivorsEngine(s);const motion=e as unknown as {updateHazards(dt:number):void};
  motion.updateHazards(.2);expect(h.motion.phase).toBe('cooldown');expect(h.weakPointExposed).toBe(true);expect(h.hp).toBe(100);expect(s.terrainRecord?.cartStops).toBe(1);
  motion.updateHazards(.1);expect(s.terrainRecord?.cartStops).toBe(1);
 });
 it('blocks a moving projectile before an enemy behind cover',()=>{
  const s=createInitialSurvivorsState();s.terrain=[{...wall}];s.player.x=40;s.player.y=140;s.interactiveHazards=[];
  const h=hazard(230,140);s.hazards=[h];
  const p:Projectile={id:'p',x:40,y:140,vx:1000,vy:0,damage:100,duration:2,pierce:2,kind:'radio',radius:4};s.projectiles=[p];
  const e=new SurvivorsEngine(s) as unknown as {updateProjectiles(dt:number):void;checkCollisions():void};e.updateProjectiles(.25);e.checkCollisions();
  expect(h.hp).toBe(100);expect(p.duration).toBe(0);expect(p.x).toBeLessThan(100);
 });
 it('clears nonstructural rubble with a paced action and cannot clear concrete pillars',()=>{
  const s=createInitialSurvivorsState();s.terrain=[{...wall,kind:'rubble',hp:80,maxHp:80}];s.player.x=70;s.player.y=140;s.interactiveHazards=[];
  const e=new SurvivorsEngine(s);e.start();expect(e.clearTerrain()).toBe(true);expect(e.clearTerrain()).toBe(false);
  for(let i=0;i<50;i++)e.update(1/60,{moveX:0,moveY:0});expect(e.clearTerrain()).toBe(true);
  expect(s.terrain[0]!.hp).toBe(0);expect(s.terrainRecord?.rubbleCleared).toBe(1);
  expect(terrainMove(s.terrain,{x:40,y:140},{x:240,y:140},14).x).toBe(240);
 });
 it('provides a clear central route and never places terrain on authored target footprints',()=>{
  for(const stage of Object.values(PATROL_STAGES)){
   const objects=createTerrain(stage);expect(objects.length).toBeGreaterThan(0);
   expect(terrainHit(objects,{x:700,y:40},{x:700,y:860},20)).toBeUndefined();
   for(const o of objects)for(const target of stage.hazards)expect(terrainContains(o,target,16)).toBe(false);
  }
 });
});
