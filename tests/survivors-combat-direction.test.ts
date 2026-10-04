import {expect,it} from 'vitest';
import {CombatDirection} from '../src/ui/survivors-combat-direction';
import {equipmentSoundSamples} from '../src/ui/survivors-equipment-sound';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';
const event:ProjectileFeedback={projectileId:'a',kind:'radio',phase:'launch',x:0,y:0,angle:0,radius:12};
it('uses bounded local camera impulses, decays without input and respects reduced motion',()=>{
 const d=new CombatDirection();d.ingest(Array(500).fill(event),['broadcast_crown'],{x:0,y:0});
 expect(d.lightCount).toBe(8);expect(d.camera(false).x).toBe(-1.1);expect(d.camera(true)).toEqual({x:0,y:0});
 for(let i=0;i<6;i++)d.advance(.05);
 expect(Math.abs(d.camera(false).x)).toBeLessThan(.002);expect(d.lightCount).toBe(0);
});
it('gives Sync Gauntlet a stronger but still bounded presentation kick',()=>{
 const normal=new CombatDirection();normal.ingest([event],['broadcast_crown'],{x:0,y:0});
 const sync=new CombatDirection();sync.ingest([event],['sync_gauntlet'],{x:0,y:0});
 expect(Math.abs(sync.camera(false).x)).toBeGreaterThan(Math.abs(normal.camera(false).x));
 expect(Math.abs(sync.camera(false).x)).toBeLessThan(1.5);
 expect(sync.lightCount).toBe(1);
});
it('never dramatizes worker contacts or offscreen hazards and bounds busy light pools',()=>{
 const d=new CombatDirection();d.ingest([{...event,worker:true},{...event,x:600}],[],{x:0,y:0});
 expect(d.lightCount).toBe(0);expect(d.camera(false)).toEqual({x:0,y:0});
 d.ingest(Array(100).fill(event),[],{x:0,y:0},true);expect(d.lightCount).toBe(4);
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
