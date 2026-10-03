import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { applyTacticalItem, tacticalSupplyFor } from '../src/engine/survivors-items';
import { CHARACTER_PROFILES, createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
const idle={moveX:0,moveY:0};
function engine(){const e=new SurvivorsEngine(createInitialSurvivorsState(),42);e.start();e.state.interactiveHazards=[];return e;}
describe('tactical supplies and build progression',()=>{
 it('every character profile references an existing hero image',()=>{
  for(const profile of Object.values(CHARACTER_PROFILES)) expect(existsSync(new URL('../public'+profile.heroBannerUri,import.meta.url))).toBe(true);
 });
 it('cycles milestone supplies and supplies a control kit for a designated boss',()=>{
  expect(tacticalSupplyFor(0,false)).toBe(null);expect(tacticalSupplyFor(11,false)).toBe(null);
  expect([12,24,36,48].map(n=>tacticalSupplyFor(n,false))).toEqual(['record_beacon','radio_battery','control_kit','record_beacon']);
  expect(tacticalSupplyFor(13,true)).toBe('control_kit');
 });
 it('spawns one milestone item from actual control and never duplicates boss/milestone drops',()=>{
  const e=engine();e.state.hazardsNeutralized=11;
  e.state.hazards=[{id:'boss',isStageBoss:true,type:'CRANE_BOSS',x:100,y:100,hp:0,maxHp:100,speed:0,radius:30,damage:10,expValue:1}];
  e.update(1/60,idle);e.update(1/60,idle);
  expect(e.state.drops.filter(d=>d.itemKind)).toHaveLength(1);expect(e.state.drops.find(d=>d.itemKind)?.itemKind).toBe('control_kit');
 });
 it('a battery adds exactly 30, caps at maximum and does not generate experience',()=>{
  const e=engine();e.state.ultimateCharge=50;
  e.state.drops=[{id:'battery',x:700,y:450,exp:0,itemKind:'radio_battery'}];e.update(1/60,idle);
  expect(e.state.ultimateCharge).toBe(80);expect(e.state.currentExp).toBe(0);
  applyTacticalItem(e.state,'radio_battery');expect(e.state.ultimateCharge).toBe(100);
 });
 it('beacon recalls only experience, leaving healing and other supplies in place',()=>{
  const e=engine();e.state.drops=[{id:'exp',x:10,y:10,exp:3},{id:'heal',x:20,y:20,exp:0,isHeal:true},{id:'supply',x:30,y:30,exp:0,itemKind:'radio_battery'}];
  applyTacticalItem(e.state,'record_beacon');
  expect(e.state.drops.map(d=>[d.x,d.y])).toEqual([[700,450],[20,20],[30,30]]);
  e.update(1/60,idle);expect(e.state.currentExp).toBe(3);expect(e.state.drops).toHaveLength(2);
 });
 it('kit blocks two contacts, gives no control credit, then restores normal damage',()=>{
  const e=engine();applyTacticalItem(e.state,'control_kit');
  const hp=e.state.player.hp;
  for(let i=0;i<3;i++){
   e.state.player.invincibleTime=0;
   e.state.hazards=[{id:String(i),type:'GAS_LEAK',x:700,y:450,hp:1000,maxHp:1000,speed:0,radius:12,damage:8,expValue:1}];
   e.update(1/60,idle);
  }
  expect(e.state.player.hp).toBe(hp-8);expect(e.state.hazardsNeutralized).toBe(0);expect(e.state.environmentalKills).toBe(0);
 });
 it('kit refresh is capped and pause freezes its remaining time',()=>{
  const e=engine();applyTacticalItem(e.state,'control_kit');e.state.controlKit!.charges=1;e.state.controlKit!.remaining=4;
  applyTacticalItem(e.state,'control_kit');expect(e.state.controlKit).toEqual({charges:2,remaining:12});
  e.setPaused(true);e.update(0.25,idle);expect(e.state.controlKit!.remaining).toBe(12);
  e.setPaused(false);e.state.controlKit!.remaining=0.01;e.update(1/60,idle);expect(e.state.controlKit).toBeUndefined();
 });
 it('bulk experience preserves the current choice and offers queued levels one at a time',()=>{
  const e=engine();e.addExp(10);const first=[...e.state.perkOptions];e.addExp(100);
  expect(e.state.level).toBe(2);expect(e.state.perkOptions).toEqual(first);
  let choices=0;
  while(e.state.phase==='levelup' && choices<10){e.applyPerk(e.state.perkOptions[0]!.id);choices++;}
  expect(choices).toBeGreaterThan(1);expect(e.state.phase).toBe('playing');expect(e.state.currentExp).toBeLessThan(e.state.nextLevelExp);
 });
 it('offers a held weapon upgrade, then missing support, then its evolution',()=>{
  const e=engine();e.triggerLevelUp();expect(e.state.perkOptions[0]!.id).toBe('radio_boost');
  e.state.activePerks.radio_boost=5;e.triggerLevelUp();expect(e.state.perkOptions[0]!.id).toBe('magnet_beacon');
  e.state.activePerks.magnet_beacon=1;e.triggerLevelUp();expect(e.state.perkOptions[0]!.id).toBe('satellite_broadcast');
 });
});
