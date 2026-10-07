import {expect,it} from 'vitest';
import {CombatDirection} from '../src/ui/survivors-combat-direction';
import {equipmentSoundSamples} from '../src/ui/survivors-equipment-sound';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';
const event:ProjectileFeedback={projectileId:'a',kind:'radio',phase:'launch',x:0,y:0,angle:0,radius:12};
it('uses bounded local camera impulses, decays without input and respects reduced motion',()=>{
 const d=new CombatDirection();d.ingest(Array.from({length:500},(_,i)=>({...event,projectileId:String(i)})),['broadcast_crown'],{x:0,y:0});
 expect(d.lightCount).toBe(8);expect(d.camera(false).x).toBe(-1.1);expect(d.camera(true)).toEqual({x:0,y:0});
 for(let i=0;i<6;i++)d.advance(.05);
 expect(Math.abs(d.camera(false).x)).toBeLessThan(.002);expect(d.lightCount).toBe(0);
});
it('never dramatizes worker contacts or offscreen hazards and bounds busy light pools',()=>{
 const d=new CombatDirection();d.ingest([{...event,worker:true},{...event,x:600}],[],{x:0,y:0});
 expect(d.lightCount).toBe(0);expect(d.camera(false)).toEqual({x:0,y:0});
 d.ingest(Array.from({length:100},(_,i)=>({...event,projectileId:String(i)})),[],{x:0,y:0},true);expect(d.lightCount).toBe(4);
});
it('gives critical contact precedence over launch regardless of event order and deduplicates light',()=>{
 const contact={...event,projectileId:'contact',phase:'impact' as const,critical:true,angle:Math.PI/2};
 const a=new CombatDirection(),b=new CombatDirection();a.ingest([event,contact],[],{x:0,y:0});b.ingest([contact,event],[],{x:0,y:0});
 expect(a.camera(false)).toEqual(b.camera(false));expect(a.camera(false).y).toBeCloseTo(-2.4);
 expect(a.heroLight.strength).toBeGreaterThan(0);a.advance(.1);expect(a.heroLight.strength).toBeLessThan(.04);
 const duplicates=new CombatDirection();duplicates.ingest(Array(100).fill(event),[],{x:0,y:0});expect(duplicates.lightCount).toBe(1);
 const invalid=new CombatDirection();invalid.ingest([{...event,angle:NaN}],[],{x:0,y:0});expect(invalid.camera(false)).toEqual({x:0,y:0});
});
it('drives boot contacts from real travel and never catches up with a burst',()=>{
 const d=new CombatDirection();expect(d.footstep(0,false)).toBe(false);
 expect(d.footstep(26,true)).toBe(false);expect(d.footstep(28,true)).toBe(true);
 expect(d.footstep(28,false)).toBe(false);expect(d.footstep(28,true)).toBe(false);
 expect(d.footstep(1000,false)).toBe(false);expect(d.footstep(1000,true)).toBe(false);
});
it('premium optical sound changes timbre, stays bounded and keeps worker confirmation calm',()=>{
 const base=equipmentSoundSamples('radio','impact',false,48000);
 const premium=equipmentSoundSamples('radio','impact',false,48000,['broadcast_crown']);
 expect(premium).not.toEqual(base);expect(premium.every(v=>Number.isFinite(v)&&Math.abs(v)<1)).toBe(true);
 expect(equipmentSoundSamples('radio','impact',true,48000,['broadcast_crown'])).toEqual(equipmentSoundSamples('radio','impact',true,48000));
 expect(equipmentSoundSamples('radio','impact',false,48000,['rescue_shell'])).toEqual(base);
});
it('does not change event facts or world positions',()=>{
 const facts=Object.freeze({...event});const listener=Object.freeze({x:0,y:0});
 const d=new CombatDirection();d.ingest([facts],[],listener);d.advance(.05);
 expect(facts).toEqual(event);expect(listener).toEqual({x:0,y:0});
});
