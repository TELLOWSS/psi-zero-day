import {expect,it} from 'vitest';
import {SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {PlayerVoiceDirection} from '../src/ui/survivors-player-voice-direction';
import type {Hazard} from '../src/domain/patrol-survivors';

function session(){const engine=new SurvivorsEngine();engine.state.characterId='player';const direction=new PlayerVoiceDirection();direction.observe(engine.state);engine.start();direction.observe(engine.state);return {engine,direction,state:engine.state};}
it('announces accepted support only, not failed requests or persistent pending support',()=>{
 const {engine,direction,state}=session();expect(engine.requestSupport()).toBe(true);
 expect(direction.observe(state)?.cue).toBe('SUPPORT');expect(engine.requestSupport()).toBe(false);expect(direction.observe(state)).toBeUndefined();
});
it('acknowledges actual resolved worker IDs once with a 12 second cooldown',()=>{
 const {direction,state}=session();state.resolvedWorkers=[{id:'a',x:0,y:0,remaining:3}];
 expect(direction.observe(state)?.cue).toBe('WORKER_ACK');expect(direction.observe(state)).toBeUndefined();
 state.resolvedWorkers.push({id:'b',x:0,y:0,remaining:3});expect(direction.observe(state)).toBeUndefined();
 state.gameTime=13;expect(direction.observe(state)).toBeUndefined();state.resolvedWorkers.push({id:'c',x:0,y:0,remaining:3});
 expect(direction.observe(state)?.cue).toBe('WORKER_ACK');
});
it('announces evolution acquisition once but does not invent voice for ordinary upgrades',()=>{
 const {direction,state}=session();state.activePerks.radio_boost=2;expect(direction.observe(state)).toBeUndefined();
 state.activePerks.satellite_broadcast=1;expect(direction.observe(state)?.cue).toBe('EVOLUTION');expect(direction.observe(state)).toBeUndefined();
});
it('warns on nearby gas warning transitions and suppresses old warnings after pause',()=>{
 const {direction,state}=session();const gas:Hazard={id:'gas',type:'GAS_LEAK',x:state.player.x,y:state.player.y,hp:10,maxHp:10,speed:0,radius:10,damage:0,expValue:0,motion:{phase:'warning',timer:1,directionX:0,directionY:0}};
 state.hazards=[gas];expect(direction.observe(state)?.cue).toBe('GAS_WARNING');expect(direction.observe(state)).toBeUndefined();
 state.gameTime=9;state.phase='paused';state.hazards=[{...gas,id:'paused-gas'}];expect(direction.observe(state)).toBeUndefined();
 state.phase='playing';expect(direction.observe(state)).toBeUndefined();
});
it('uses the authored gas signature warning without speaking for unrelated vapor cues',()=>{
 const {direction,state}=session();state.signatureEvent={id:'gas_bloom',wave:2,title:'fixture',detail:'fixture',severity:'amber',mechanic:'fixture',workface:'fixture',stageSkin:state.stage.theme,stageAccent:'#ffffff',materialCue:'vapor',phase:'warning',remaining:1,positions:[{x:state.player.x,y:state.player.y,type:'GAS_LEAK'}]};
 expect(direction.observe(state)?.cue).toBe('GAS_WARNING');expect(direction.observe(state)).toBeUndefined();
});
it('opens the actual designated boss core once per phase, not on mere spawn or ordinary targets',()=>{
 const {direction,state}=session();const boss:Hazard={id:'boss',type:'CRANE_BOSS',x:state.player.x,y:state.player.y,hp:8,maxHp:100,speed:0,radius:20,damage:0,expValue:0,isStageBoss:true,bossEncounterManaged:true,bossPhase:2,bossAttackCycles:0,motion:{phase:'cooldown',timer:1,directionX:0,directionY:0}};
 state.hazards=[boss];expect(direction.observe(state)).toBeUndefined();boss.bossAttackCycles=1;
 expect(direction.observe(state)?.cue).toBe('CORE_OPEN');expect(direction.observe(state)).toBeUndefined();
 boss.bossAttackCycles=0;direction.observe(state);boss.bossAttackCycles=1;expect(direction.observe(state)).toBeUndefined();
});
it('consumes lower priority facts behind urgent warnings instead of queuing stale chatter',()=>{
 const {direction,state}=session();state.activePerks.satellite_broadcast=1;state.resolvedWorkers=[{id:'worker',x:0,y:0,remaining:3}];state.player.hp=state.player.maxHp*.2;
 expect(direction.observe(state)?.cue).toBe('LOW_HP');expect(direction.observe(state)).toBeUndefined();
});
it('plays retry only for explicitly marked defeat-to-preparation sessions',()=>{
 const engine=new SurvivorsEngine();engine.state.characterId='player';expect(new PlayerVoiceDirection().observe(engine.state)).toBeUndefined();
 const retry=new PlayerVoiceDirection(true);expect(retry.observe(engine.state)?.cue).toBe('RETRY');expect(retry.observe(engine.state)).toBeUndefined();
 engine.start();expect(retry.observe(engine.state)?.cue).toBe('START');
});
