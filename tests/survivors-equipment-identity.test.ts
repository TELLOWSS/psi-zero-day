import {expect,it,vi} from 'vitest';
import {STORE_ITEMS} from '../src/domain/survivors-store';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {premiumBodySocket,WEARABLE_PROFILES} from '../src/ui/survivors-wearable-art';
import {actorTorsoPoint} from '../src/ui/survivors-rig-renderer';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {EQUIPMENT_AURAS,EVOLUTION_IDENTITIES,drawEquipmentIdentity,drawEvolutionIdentity,drawEquipmentMantle} from '../src/ui/survivors-equipment-identity';
import {cinematicLook,drawCinematicContact} from '../src/ui/survivors-cinematic-vfx';
import {CombatDirection} from '../src/ui/survivors-combat-direction';
import {equipmentSoundSamples} from '../src/ui/survivors-equipment-sound';
const actor={src:'/assets/player-map.webp',naturalWidth:600,naturalHeight:1400} as HTMLImageElement;
const atlas={naturalWidth:1448,naturalHeight:1086} as HTMLImageElement;
const context=()=>new Proxy({} as CanvasRenderingContext2D,{get(target,key){if(!Reflect.has(target,key))Reflect.set(target,key,vi.fn());return Reflect.get(target,key);}});
it('keeps raster-loaded item motifs and bounds the silhouette mantle without changing game state',()=>{
 const ids=['broadcast_crown','shock_mantle','sync_gauntlet'];
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
 const before=JSON.stringify(s),c=context();drawEquipmentIdentity(c,s,atlas,false);expect(c.stroke).toHaveBeenCalled();
 const mantle=context();drawEquipmentMantle(mantle,s,atlas,false);expect(mantle.drawImage).toHaveBeenCalledTimes(4);
 const busy=context();drawEquipmentMantle(busy,s,atlas,false,true);expect(busy.drawImage).toHaveBeenCalledTimes(2);
 const reduced=context();drawEquipmentMantle(reduced,s,atlas,true);expect(reduced.drawImage).not.toHaveBeenCalled();expect(reduced.stroke).toHaveBeenCalled();
 expect(JSON.stringify(s)).toBe(before);expect(mantle.save).toHaveBeenCalledTimes(5);expect(mantle.restore).toHaveBeenCalledTimes(5);
});
it('calibrates all six categories for every character and mirrors the actual torso frame',()=>{
  const state=createInitialSurvivorsState(),pose=new SpriteMotionTracker().sample(state.player,0,0,0);
  for(const id of Object.keys(WEARABLE_PROFILES))for(const category of new Set(STORE_ITEMS.map(item=>item.category))){
    const point=premiumBodySocket(id,actor,74,category)!;
    expect(point.y).toBeLessThan(-33);expect(point.y).toBeGreaterThan(-68);expect(Math.abs(point.x)).toBeLessThan(14);
    const right=actorTorsoPoint(point,{...pose,facing:1,lean:.02,action:1},74,false);
    const left=actorTorsoPoint(point,{...pose,facing:-1,lean:.02,action:1},74,false);
    expect(left.x).toBe(-right.x);expect(left.y).toBe(right.y);
  }
  expect(premiumBodySocket('player',actor,74,'tempo')).not.toEqual(premiumBodySocket('kang_taesik',actor,74,'tempo'));
  expect(premiumBodySocket('unknown',actor,74,'tempo')).toBeUndefined();
});
it('gives all 16 purchases distinct aura identities without modifying gameplay',()=>{
  expect(Object.keys(EQUIPMENT_AURAS).sort()).toEqual(STORE_ITEMS.map(item=>item.id).sort());
  expect(new Set(Object.values(EQUIPMENT_AURAS).map(aura=>JSON.stringify(aura))).size).toBe(16);
  const ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
  const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
  const before=JSON.stringify(state),ctx=context();drawEquipmentIdentity(ctx,state,atlas,false);
  expect(ctx.drawImage).toHaveBeenCalledTimes(7);expect(JSON.stringify(state)).toBe(before);
  const quiet=context();drawEquipmentIdentity(quiet,state,atlas,true,true);
  expect(quiet.drawImage).not.toHaveBeenCalled();expect(quiet.stroke).toHaveBeenCalled();
  expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
});
it('distinguishes acquired evolutions from level five and keeps reduced-motion markers',()=>{
  const state=createInitialSurvivorsState(),ctx=context();state.activePerks.radio_boost=5;
  drawEvolutionIdentity(ctx,state,atlas,false);expect(ctx.stroke).not.toHaveBeenCalled();
  for(const [id,identity] of Object.entries(EVOLUTION_IDENTITIES)){
    expect(cinematicLook(identity.kind,5).evolved).toBe(true);
    state.activePerks[id as keyof typeof EVOLUTION_IDENTITIES]=1;
  }
  expect(cinematicLook('radio',5).evolved).toBe(false);
  const before=JSON.stringify(state);drawEvolutionIdentity(ctx,state,atlas,true);
  expect(ctx.stroke).toHaveBeenCalledTimes(21);expect(ctx.drawImage).not.toHaveBeenCalled();expect(JSON.stringify(state)).toBe(before);
});
it('adds confirmed evolution contact marks, bounded recoil and non-clipping sonic weight',()=>{
  const event={projectileId:'e',kind:'hunter_beam' as const,phase:'impact' as const,x:0,y:0,angle:0,radius:4,critical:true};
  const ctx=context();drawCinematicContact(ctx,event,0,.2,cinematicLook(event.kind,5),atlas,false,false);
  expect(ctx.stroke).toHaveBeenCalledTimes(7);
  const worker=context();drawCinematicContact(worker,{...event,worker:true},0,.2,cinematicLook(event.kind,5),atlas,false,false);
  expect(worker.drawImage).not.toHaveBeenCalled();
  const direction=new CombatDirection();direction.ingest(Array(200).fill({...event,phase:'launch'}),[],{x:0,y:0});
  expect(direction.camera(false).x).toBe(-1.5);expect(direction.camera(true)).toEqual({x:0,y:0});expect(direction.lightCount).toBe(8);
  for(const identity of Object.values(EVOLUTION_IDENTITIES))for(const phase of ['launch','impact','release'] as const){
    const data=equipmentSoundSamples(identity.kind,phase,false,48000);expect(data.every(value=>Number.isFinite(value)&&Math.abs(value)<1)).toBe(true);
  }
});
