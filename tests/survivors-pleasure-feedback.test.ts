import {expect,it} from 'vitest';
import {PleasureFeedback} from '../src/ui/survivors-pleasure-feedback';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';

const pickup={id:1,type:'pickup' as const,x:10,y:20,collected:true};
const kill={type:'RUNAWAY_CART' as const,x:30,y:40,projectileId:'attack-1'};
it('coalesces only actual collection receipts without changing them',()=>{
 const feedback=new PleasureFeedback(),events=[pickup,{...pickup,id:2},{...pickup,id:3,collected:false}];
 const before=JSON.stringify(events);feedback.observe(events,[],3,1);
 expect(feedback.update(.1,1.1)).toBe(0);expect(feedback.update(.04,1.15)).toBe(2);
 expect(feedback.update(.1,1.25)).toBe(0);expect(JSON.stringify(events)).toBe(before);
});
it('requires an actual final non-worker receipt and cooldown; empty scenery is not clear',()=>{
 const feedback=new PleasureFeedback();expect(feedback.observe([],[],0,0)).toBe(false);
 expect(feedback.observe([],[kill],1,1)).toBe(false);
 expect(feedback.observe([],[kill],0,2)).toBe(true);
 expect(feedback.observe([],[kill],0,3)).toBe(false);
 expect(feedback.observe([],[{...kill,type:'UNHELMETED'}],0,12)).toBe(false);
 expect(feedback.observe([],[kill],0,13)).toBe(true);
});
it('counts only matching engine projectile facts, never a temporal combo',()=>{
 const feedback=new PleasureFeedback();feedback.observe([],[kill,{...kill,x:35},{...kill,projectileId:'attack-2'},{...kill,projectileId:undefined}],4,0);
 feedback.observe([],[],4,.13);
 expect(feedback.marks.filter(m=>m.kind==='group').map(m=>m.count)).toEqual([2]);
});
it('bounds transient effects, freezes age for pause and resets retry state',()=>{
 const feedback=new PleasureFeedback();feedback.observe(Array.from({length:100},(_,id)=>({...pickup,id})),[],1,0);
 expect(feedback.marks.length).toBeLessThanOrEqual(32);feedback.update(0,0);expect(feedback.marks.every(m=>m.age===0)).toBe(true);
 feedback.reset();expect(feedback.marks).toEqual([]);expect(feedback.update(1,2)).toBe(0);
});
it('emits actual lethal projectile attribution and collection facts from the engine',()=>{
 const state=createInitialSurvivorsState();state.phase='playing';state.interactiveHazards=[];state.player.critRate=0;
 state.hazards=[{id:'qa-target',type:'RUNAWAY_CART',x:state.player.x+80,y:state.player.y,hp:1,maxHp:1,speed:0,radius:20,damage:0,expValue:1}];
 state.projectiles=[{id:'qa-projectile',kind:'radio',x:state.hazards[0]!.x,y:state.hazards[0]!.y,vx:0,vy:0,radius:10,damage:10,duration:1,pierce:1}];
 state.drops=[{id:'qa-drop',x:state.player.x,y:state.player.y,exp:1}];
 const engine=new SurvivorsEngine(state);engine.update(1/60,{moveX:0,moveY:0});
 expect(state.lastKilledEvents).toContainEqual(expect.objectContaining({projectileId:'qa-projectile',type:'RUNAWAY_CART'}));
 expect(engine.drainAudioEvents()).toContainEqual(expect.objectContaining({type:'pickup',collected:true}));
});
