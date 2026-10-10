import {describe,it,expect} from 'vitest';
import {SurvivorsPinballEngine} from '../src/engine/survivors-pinball-engine';
import {PinballSite} from '../src/engine/survivors-pinball-site';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
const idle={left:false,right:false,assist:false};
describe('new audio follows physical contact and actual fire',()=>{
 it('distinguishes perfect contact from a projectile and does not repeat while held',()=>{const e=new SurvivorsPinballEngine('practice',{table:'cargo',completedStages:PATROL_STAGE_IDS});e.launch();Object.assign(e.state,{x:245,y:743,vx:0,vy:100});e.update(1/240,{...idle,left:true});const sounds=e.drainSounds();expect(sounds.filter(s=>s.kind==='perfect')).toHaveLength(1);expect(sounds.filter(s=>s.kind==='shot')).toHaveLength(1);Object.assign(e.state,{x:245,y:743,vx:0,vy:100});e.update(1/240,{...idle,left:true});expect(e.drainSounds().filter(s=>s.kind==='shot'||s.kind==='perfect')).toEqual([]);});
 it('does not play a projectile for factory or when every target is destroyed',()=>{const e=new SurvivorsPinballEngine();e.launch();Object.assign(e.state,{x:245,y:743,vx:0,vy:100});e.update(1/240,{...idle,left:true});expect(e.drainSounds().some(s=>s.kind==='shot')).toBe(false);const site=new PinballSite('cargo');site.hp.fill(0);expect(site.fire({x:300,y:700,vx:0,vy:0})).toBe(false);});
 it('still reports actual fire when the bounded shot array is full',()=>{const site=new PinballSite('cargo'),ball={x:300,y:700,vx:0,vy:0};for(let i=0;i<16;i++)site.fire(ball);expect(site.shots).toHaveLength(16);expect(site.fire(ball)).toBe(true);expect(site.shots).toHaveLength(16);});
});
