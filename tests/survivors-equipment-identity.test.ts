import {expect,it,vi} from 'vitest';
import {STORE_ITEMS} from '../src/domain/survivors-store';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {premiumBodySocket,WEARABLE_PROFILES} from '../src/ui/survivors-wearable-art';
import {actorTorsoPoint} from '../src/ui/survivors-rig-renderer';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {EQUIPMENT_AURAS,EVOLUTION_IDENTITIES,drawEquipmentIdentity,drawEvolutionIdentity,drawEquipmentMantle,mantleSignatures} from '../src/ui/survivors-equipment-identity';
import {cinematicLook,drawCinematicContact} from '../src/ui/survivors-cinematic-vfx';
import {CombatDirection} from '../src/ui/survivors-combat-direction';
import {ProjectileFeedbackLayer} from '../src/ui/survivors-projectile-feedback';
import {equipmentSoundSamples} from '../src/ui/survivors-equipment-sound';
import {applyActorTorsoTransform} from '../src/ui/survivors-rig-renderer';
const actor={src:'/assets/player-map.webp',naturalWidth:600,naturalHeight:1400} as HTMLImageElement;
const atlas={naturalWidth:1448,naturalHeight:1086} as HTMLImageElement;
const context=()=>new Proxy({} as CanvasRenderingContext2D,{get(target,key){if(!Reflect.has(target,key))Reflect.set(target,key,vi.fn());return Reflect.get(target,key);}});
it('attaches the silhouette mantle to the same rigged torso transform as worn equipment',()=>{
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['shock_mantle'],equipped:['shock_mantle']});
 const base=new SpriteMotionTracker().sample(s.player,0,0,0);
 const pose={...base,cycle:Math.PI/2,gaitBlend:1,action:1,reaction:.5,lean:.03,facing:-1 as const};
 const expected=context();applyActorTorsoTransform(expected,pose,74,true);
 const c=context(),before=JSON.stringify(s);drawEquipmentMantle(c,s,atlas,false,false,0,0,{pose,height:74,rigged:true});
 expect(vi.mocked(c.scale).mock.calls).toEqual(vi.mocked(expected.scale).mock.calls);
 expect(vi.mocked(c.transform).mock.calls).toEqual(vi.mocked(expected.transform).mock.calls);
 expect(vi.mocked(c.translate).mock.calls.slice(1,2)).toEqual(vi.mocked(expected.translate).mock.calls);
 expect(JSON.stringify(s)).toBe(before);
 const quiet=context();drawEquipmentMantle(quiet,s,atlas,true,false,0,1,{pose,height:74,rigged:true});
 expect(quiet.transform).not.toHaveBeenCalled();expect(quiet.scale).toHaveBeenCalledWith(-1,1);
 expect(quiet.drawImage).not.toHaveBeenCalled();
});
it('uses a restrained shield receipt for locked hits without critical camera kick',()=>{
 const event={projectileId:'locked',kind:'radio' as const,phase:'impact' as const,x:0,y:0,angle:0,radius:10,blocked:true,critical:true,actorKind:'CRANE_BOSS' as const};
 const layer=new ProjectileFeedbackLayer(),ctx=context();layer.ingest([event]);layer.draw(ctx,false,false,{atlas,materialAtlas:atlas,equipped:[]});
 expect(ctx.drawImage).toHaveBeenCalledTimes(1);expect(ctx.ellipse).toHaveBeenCalledTimes(1);
 const direction=new CombatDirection();direction.ingest([event],[],{x:0,y:0});expect(direction.camera(false)).toEqual({x:0,y:0});expect(direction.lightCount).toBe(0);
});
it('pulses the aura only on a local firing event and decays within bounded dimensions',()=>{
 const direction=new CombatDirection(),s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['shock_mantle'],equipped:['shock_mantle']});
 const event={projectileId:'fire',kind:'radio' as const,phase:'launch' as const,x:0,y:0,angle:0,radius:10};
 direction.ingest([{...event,x:500}],[],{x:0,y:0});expect(direction.auraStrength).toBe(0);
 direction.ingest([event],[],{x:0,y:0});expect(direction.auraStrength).toBe(1);
 direction.advance(.1);expect(direction.auraStrength).toBeLessThan(.31);
 const draw=(strength:number,reduced=false)=>{const ctx=context();drawEquipmentMantle(ctx,s,atlas,reduced,false,undefined,strength);return vi.mocked(ctx.drawImage).mock.calls.map(call=>call.slice(5));};
 expect(draw(1)).not.toEqual(draw(0));expect(draw(100)).toEqual(draw(1));expect(draw(NaN)).toEqual(draw(0));expect(draw(1,true)).toEqual(draw(0,true));
});
it('flows aura seals and silhouette energy on simulation time, with stable reduced motion and movement drag',()=>{
 const ids=['broadcast_crown','sync_gauntlet'];
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});s.activePerks.tesla_dome=1;
 const frame=(time:number,reduced=false,movingAngle?:number)=>{s.gameTime=time;const c=context();drawEquipmentIdentity(c,s,atlas,reduced,false,movingAngle);drawEvolutionIdentity(c,s,atlas,reduced);drawEquipmentMantle(c,s,atlas,reduced,false,movingAngle);return {translate:vi.mocked(c.translate).mock.calls,images:vi.mocked(c.drawImage).mock.calls.map(call=>call.slice(5)),lines:vi.mocked(c.lineTo).mock.calls};};
 expect(frame(0)).not.toEqual(frame(1));expect(frame(1)).toEqual(frame(1));
 expect(frame(0,true)).toEqual(frame(1,true));expect(frame(1,false,0)).not.toEqual(frame(1,false,Math.PI));
});
it('keeps raster-loaded item motifs and bounds the silhouette mantle without changing game state',()=>{
 const ids=['broadcast_crown','shock_mantle','sync_gauntlet'];
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
 const before=JSON.stringify(s),c=context();drawEquipmentIdentity(c,s,atlas,false);expect(c.stroke).toHaveBeenCalled();
 const mantle=context();drawEquipmentMantle(mantle,s,atlas,false);expect(mantle.drawImage).toHaveBeenCalledTimes(24);
 const busy=context();drawEquipmentMantle(busy,s,atlas,false,true);expect(busy.drawImage).toHaveBeenCalledTimes(8);
 const reduced=context();drawEquipmentMantle(reduced,s,atlas,true);expect(reduced.drawImage).not.toHaveBeenCalled();expect(reduced.stroke).toHaveBeenCalled();
 expect(JSON.stringify(s)).toBe(before);expect(mantle.save).toHaveBeenCalledTimes(28);expect(mantle.restore).toHaveBeenCalledTimes(28);
});
it('reserves paid signatures when all evolution identities are active',()=>{
 const ids=['broadcast_crown','shock_mantle','sync_gauntlet','barrier_forge','extraction_pack','inspection_wing'];
 const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
 for(const id of Object.keys(EVOLUTION_IDENTITIES))s.activePerks[id as keyof typeof EVOLUTION_IDENTITIES]=1;
 const before=JSON.stringify(s),normal=mantleSignatures(s),busy=mantleSignatures(s,true);
 expect(normal).toHaveLength(4);expect(normal.filter(v=>!v.evolved)).toHaveLength(2);
 expect(busy).toHaveLength(2);expect(busy.every(v=>!v.evolved)).toBe(true);
 expect(JSON.stringify(s)).toBe(before);
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
