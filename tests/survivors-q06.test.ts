import { it, expect } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState, PERK_CATALOG } from '../src/engine/patrol-survivors-engine';
import { STAGE_IDS } from '../src/app/survivors-save';
it('deterministic engine smoke: movement, attacks, collection, perk choice/reroll, evolution, ultimate, pause, result and restart',()=>{
 const e=new SurvivorsEngine(createInitialSurvivorsState(),123);e.start();
 const x=e.state.player.x;e.update(1/60,{moveX:1,moveY:0});expect(e.state.player.x).toBeGreaterThan(x);
 e.state.drops.push({id:'fixture-drop',x:e.state.player.x,y:e.state.player.y,exp:100,isHeal:false});
 e.update(1/60,{moveX:0,moveY:0});expect(e.state.phase).toBe('levelup');
 e.state.rerollsLeft=1;expect(e.rerollPerks()).toBe(true);
 const options=e.state.perkOptions;expect(options.length).toBeGreaterThan(0);
 e.applyPerk(options[0]!.id);
 let queued=0;while(e.state.phase==='levelup'&&queued<10){e.applyPerk(e.state.perkOptions[0]!.id);queued++;}
 expect(queued).toBeGreaterThan(0);expect(e.state.phase).toBe('playing');
 e.setPaused(true);const time=e.state.gameTime;e.update(1,{moveX:1,moveY:0});expect(e.state.gameTime).toBe(time);e.setPaused(false);
 // Synthetic fixture only verifies the engine pathway, not natural progression or browser play.
 e.state.activePerks.radio_boost=PERK_CATALOG.radio_boost.maxLevel;
 e.applyPerk('satellite_broadcast');expect(e.state.activePerks.satellite_broadcast).toBe(1);
 e.state.ultimateCharge=100;expect(e.triggerDirectorShout()).toBe(true);expect(e.state.directorCutinPhase).toBe('cutin');
 e.state.maxTime=e.state.gameTime+0.01;e.update(1/60,{moveX:0,moveY:0});expect(e.state.phase).toBe('victory');
 const restart=new SurvivorsEngine(createInitialSurvivorsState(),123);expect(restart.state.phase).toBe('ready');expect(restart.state.psiCredits).toBe(0);
});
it('all ten stage identities survive a terminal engine result (controlled fixture)',()=>{
 for(const stageId of STAGE_IDS){const e=new SurvivorsEngine(createInitialSurvivorsState('player',undefined,stageId),1);e.start();e.state.maxTime=1/60;e.update(1/60,{moveX:0,moveY:0});expect(e.state.phase).toBe('victory');expect(e.state.stageId).toBe(stageId);expect(e.state.stage.id).toBe(stageId);}
});
