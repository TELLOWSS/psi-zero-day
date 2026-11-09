import {describe,it,expect} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {drawOmegaProtocolEnemy,OMEGA_INFECTED_VISUAL_ID} from '../src/ui/omega-protocol-enemy-render';
import {omegaBladeEligible} from '../src/domain/omega-protocol-blade';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';

const zombie=(id:string):Hazard=>({
 id,type:'UNHELMETED',x:150,y:170,hp:100,maxHp:100,
 radius:20,damage:5,speed:30,expValue:0,
} as Hazard);
function render(h:Hazard){
 const fills:string[]=[];
 const calls:{method:string;args:unknown[]}[]=[];
 let currentFill='';
 const target={};
 const ctx=new Proxy(target,{
  get(_t,p){
   if(p==='fillStyle')return currentFill;
   if(typeof p==='string')return (...args:unknown[])=>{
    calls.push({method:p,args});
    if(p==='fill')fills.push(currentFill);
   };
   return undefined;
  },
  set(_t,p,value){
   if(p==='fillStyle')currentFill=String(value);
   return true;
  },
 }) as CanvasRenderingContext2D;
 drawOmegaProtocolEnemy(ctx,h,1.2);
 return {fills,calls};
}
describe('OMEGA infected hard-hat worker ZOMBIE is fictional special-edition enemy',()=>{
 it('renders yellow/orange hard-hat dome, reflective vest and infected eyes across variants',()=>{
  expect(OMEGA_INFECTED_VISUAL_ID).toBe('HELMET_ZOMBIE');
  const helmets=new Set(['#ffcb3e','#f6da68','#ff9d40']);
  for(const id of ['zombie-01','zombie-02','zombie-03']){
   const {fills,calls}=render(zombie(id));
   expect(fills.some(x=>helmets.has(x))).toBe(true);
   expect(fills).toContain('#789c87'); // infection complexion
   expect(calls.some(x=>x.method==='arc'&&x.args[1]===-55)).toBe(true);
   expect(calls.some(x=>x.method==='fillRect'&&x.args[1]===-56)).toBe(true); // safety helmet brim
  }
 });
 it('preserves the normal Watch gun engine while OMEGA sword only uses gated protocol engine',()=>{
  const h=zombie('zombie-04');
  expect(omegaBladeEligible(h)).toBe(true);
  const normal=new SurvivorsEngine(createInitialSurvivorsState(),20261109);
  normal.start();
  normal.state.hazards=[h];
  expect(normal.damageProtocolConstruct(h.id,25)).toBe(0);
  expect(h.hp).toBe(100);
  const omega=new OmegaProtocolCombatSession(20261109,50);
  omega.engine.state.player.invincibleTime=999;
  omega.update(1/60,{moveX:1,moveY:0,triggerAction:false});
  const target=omega.engine.state.hazards[0]!;
  target.type='UNHELMETED';
  target.hp=100;target.maxHp=100;target.radius=20;target.speed=0;
  target.x=omega.engine.state.player.x+60;
  target.y=omega.engine.state.player.y;
  const hit=omega.blade();
  expect(hit?.hits).toBeGreaterThanOrEqual(1);
  expect(target.hp).toBeLessThan(100);
 });
 it('actually damages the infected helmet zombie with a native Watch radio projectile',()=>{
  const expedition=new OmegaProtocolCombatSession(20261109,50);
  const state=expedition.engine.state;
  const player=state.player;
  player.invincibleTime=999;
  const infected=state.hazards[0]!;
  infected.type='UNHELMETED';infected.radius=24;infected.speed=0;
  infected.x=player.x+115;infected.y=player.y;infected.hp=120;infected.maxHp=120;
  for(const h of state.hazards.slice(1))h.hp=0;
  // This is the actual existing engine projectile class, not a mock damage call.
  state.projectiles.push({
   id:'omega-real-gun-vs-zombie',kind:'radio',x:infected.x-12,y:infected.y,
   vx:720,vy:0,radius:7,damage:20,duration:1,pierce:1,
  });
  expedition.update(1/60,{moveX:0,moveY:0,triggerAction:false});
  expect(infected.hp).toBeLessThan(120);
  const impacts=expedition.engine.drainProjectileFeedback();
  expect(impacts.some(e=>e.phase==='impact'&&e.targetId===infected.id)).toBe(true);
 });
 it('spawns an actual helmet-zombie first in the real contaminated expedition',()=>{
  for(const seed of [20261109,777,2026]){
   const run=new OmegaProtocolCombatSession(seed,50);
   expect(run.plan.threatKinds).toContain('UNHELMETED');
   expect(run.engine.state.hazards.some(h=>h.type==='UNHELMETED'&&h.hp>0)).toBe(true);
  }
 });
 it('does not draw the helmet zombie when HP reaches zero',()=>{
  const dead=render({...zombie('zombie-05'),hp:0});
  expect(dead.calls).toHaveLength(0);
 });
});
