import {expect,it} from 'vitest';
import {controlLineSpeed,tickFieldTactics} from '../src/engine/survivors-field-tactics';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
it('support arrives at the locked call position and uses finite charges/cooldown',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();expect(e.requestSupport()).toBe(true);expect(e.requestSupport()).toBe(false);
 const x=s.player.x;s.player.x+=150;const supply:Array<[number,number]>=[];
 tickFieldTactics(s,1.2,(x,y)=>supply.push([x,y]));expect(supply[0]![0]).toBe(x);expect(s.fieldTactics!.supportCharges).toBe(1);
 tickFieldTactics(s,30,()=>{});expect(e.requestSupport()).toBe(true);tickFieldTactics(s,30,()=>{});expect(e.requestSupport()).toBe(false);
});
it('utility zones slow selected risks without stacking or affecting people/bosses/falls',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s);e.start();expect(e.deployControlLine()).toBe(true);expect(e.deployControlLine()).toBe(false);
 expect(controlLineSpeed(s,s.player.x,s.player.y,'RUNAWAY_CART')).toBe(.65);
 for(const type of ['UNHELMETED','CRANE_BOSS','FALLING_DEBRIS'])expect(controlLineSpeed(s,s.player.x,s.player.y,type)).toBe(1);
 tickFieldTactics(s,8,()=>{});expect(e.deployControlLine()).toBe(true);expect(controlLineSpeed(s,s.player.x,s.player.y,'GAS_LEAK')).toBe(.65);
 tickFieldTactics(s,10,()=>{});expect(s.fieldTactics!.lines).toHaveLength(0);expect(e.deployControlLine()).toBe(false);
});
it('rejects gameplay commands during pauses and does not advance pending actions',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s);e.start();e.requestSupport();e.setPaused(true);
 const remaining=s.fieldTactics!.pendingSupport!.remaining;tickFieldTactics(s,3,()=>{throw Error('paused delivery');});
 expect(s.fieldTactics!.pendingSupport!.remaining).toBe(remaining);expect(e.requestSupport()).toBe(false);expect(e.deployControlLine()).toBe(false);expect(e.requestHandoff()).toBe(false);
});
it('objective readiness grants a choice instead of an automatic win; moving cancels handoff',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();s.gameTime=100;s.stageBossSpawned=true;s.stageBossNeutralized=true;s.hazardsNeutralized=100;
 for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='destroyed';
 e.update(1/60,{moveX:0,moveY:0});expect(s.phase).toBe('playing');expect(e.requestHandoff()).toBe(true);
 s.player.x+=73;tickFieldTactics(s,.1,()=>{});expect(s.fieldTactics!.handoff).toBeUndefined();expect(s.phase).toBe('playing');
});
it('damage cancels an ongoing handoff without rewarding incomplete evacuation',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();s.gameTime=100;s.stageBossSpawned=true;s.stageBossNeutralized=true;s.hazardsNeutralized=100;
 for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='destroyed';
 expect(e.requestHandoff()).toBe(true);s.hazards.push({id:'fixture',type:'GAS_LEAK',x:s.player.x,y:s.player.y,hp:10000,maxHp:10000,speed:0,radius:20,damage:2,expValue:0});
 e.update(1/60,{moveX:0,moveY:0});expect(s.fieldTactics!.handoff).toBeUndefined();expect(s.phase).toBe('playing');
});
