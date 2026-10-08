import {describe,expect,it} from 'vitest';
import {MATERIAL_FEEL} from '../src/domain/survivors-material-feel';
import {WORKFACE_SPECIES} from '../src/engine/survivors-workface-roster';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {MaterialResolutionLayer,resolutionPose} from '../src/ui/survivors-material-resolution';
import {equipmentSoundSamples} from '../src/ui/survivors-equipment-sound';
import {readFeelSettings} from '../src/ui/survivors-feel-settings';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';

describe('field material contact and resolution',()=>{
 it('emits real damage, identity and one final receipt when a projectile controls equipment',()=>{
  const s=createInitialSurvivorsState(),engine=new SurvivorsEngine(s,42);engine.start();s.interactiveHazards=[];s.player.critRate=0;
  const h={id:'steel',type:'RUNAWAY_CART' as const,species:'rebar_rack' as const,x:s.player.x+100,y:s.player.y,hp:20,maxHp:20,speed:0,radius:18,damage:0,expValue:0};
  s.hazards=[h];s.projectiles=[{id:'first',kind:'radio',x:h.x,y:h.y,vx:0,vy:0,radius:12,damage:5,pierce:1,duration:1}];
  engine.update(1/60,{moveX:0,moveY:0});const first=engine.drainProjectileFeedback().find(e=>e.targetId==='steel')!;
  expect(first.species).toBe('rebar_rack');expect(first.appliedDamage).toBe(5);expect(first.finishing).toBe(false);
  s.projectiles=[{id:'last',kind:'grout_slug',x:h.x,y:h.y,vx:0,vy:0,radius:12,damage:99,pierce:1,duration:1}];
  engine.update(1/60,{moveX:0,moveY:0});const final=engine.drainProjectileFeedback().filter(e=>e.targetId==='steel'&&e.finishing);
  expect(final).toHaveLength(1);expect(final[0]!.appliedDamage).toBe(15);
  expect(s.lastKilledEvents?.filter(e=>e.species==='rebar_rack')).toHaveLength(1);
 });
 it('has twelve distinct bounded sound signatures, with more space for finishing tails',()=>{
  const hashes=new Set<number>();
  for(const species of WORKFACE_SPECIES){
   const normal=equipmentSoundSamples('radio','impact',false,12000,[],'RUNAWAY_CART',false,species);
   const final=equipmentSoundSamples('radio','impact',false,12000,[],'RUNAWAY_CART',false,species,true);
   expect(final.length).toBeGreaterThan(normal.length);expect(final.length).toBeLessThan(12000);
   let hash=0;for(let i=0;i<final.length;i+=17){expect(Number.isFinite(final[i])).toBe(true);expect(Math.abs(final[i]!)).toBeLessThanOrEqual(.98);hash=(Math.imul(hash,31)+Math.round(final[i]!*100000))|0;}hashes.add(hash);
  }
  expect(hashes.size).toBe(12);expect(new Set(Object.values(MATERIAL_FEEL).map(p=>p.action)).size).toBe(12);
 });
 it('preserves calm worker sounds even when equipment metadata is supplied',()=>{
  expect(equipmentSoundSamples('radio','impact',true,12000,[],undefined,false,'masonry',true)).toEqual(equipmentSoundSamples('radio','impact',true,12000));
 });
 it('bounds contact and final pools, ignores blocked contacts and workers, and expires on simulation time',()=>{
  const layer=new MaterialResolutionLayer();
  const e:ProjectileFeedback={projectileId:'p',kind:'radio',phase:'impact',x:20,y:30,angle:0,radius:10,species:'masonry',appliedDamage:5};
  layer.observe([{...e,worker:true},{...e,blocked:true},{...e,appliedDamage:0}],[]);expect(layer.contactSize).toBe(0);
  const events=Array.from({length:200},(_,i)=>({...e,targetId:String(i)})),kills=events.map(e=>({type:'FALLING_DEBRIS' as const,species:e.species!,x:e.x,y:e.y,radius:38}));
  const before=JSON.stringify({events,kills});layer.observe(events,kills);expect(layer.size).toBe(16);expect(layer.contactSize).toBe(24);
  layer.advance(0);expect(layer.size).toBe(16);
  for(let i=0;i<8;i++)layer.advance(.25);expect(layer.size).toBe(0);expect(layer.contactSize).toBe(0);expect(JSON.stringify({events,kills})).toBe(before);
 });
 it('settles each material with reduced-motion geometry fixed and delays individual falling pieces',()=>{
  for(const species of WORKFACE_SPECIES){const p=resolutionPose(species,.6,2,true);expect(p.x).toBe(0);expect(p.y).toBe(0);expect(p.angle).toBe(0);expect(p.scaleY).toBe(1);expect(resolutionPose(species,2).alpha).toBe(0);}
  expect(resolutionPose('masonry',.2,3).p).toBeLessThan(resolutionPose('masonry',.2,0).p);
  expect(resolutionPose('formwork_panel',.6).scaleY).toBeLessThan(1);
 });
 it('recovers corrupt preferences and clamps independently',()=>{
  expect(readFeelSettings('broken')).toEqual({shake:1,flash:1});
  expect(readFeelSettings('{"shake":-2,"flash":9}')).toEqual({shake:0,flash:1});
  expect(readFeelSettings('{"shake":0,"flash":0.4}')).toEqual({shake:0,flash:.4});
 });
});
