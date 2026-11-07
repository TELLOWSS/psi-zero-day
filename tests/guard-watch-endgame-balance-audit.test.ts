import {describe,expect,it} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {createDefenseRun,applyDefenseCommand,advanceDefense} from '../src/engine/defense';
import {recommendDefenseAction} from '../src/app/defense-tactics';
import {guardMasteryWaveDirective} from '../src/engine/guard-mastery';
import {PATROL_STAGES,createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {spawnPressure,selectStageHazard} from '../src/engine/survivors-difficulty';
import {masteryStageFocus,authoredStageHazardMix} from '../src/engine/survivors-mastery-focus';

describe('Endgame comparative balance audit (deterministic bots, not human win-rate)',()=>{
 it('covers all six authored Guard scenarios, checks disclosure and samples heuristic-defense outcomes',()=>{
   expect(guardContents).toHaveLength(6);
   const rows:{stage:string;mode:string;status:string;shield:number;leaks:number;ticks:number}[]=[];
   for(const content of guardContents){
     for(const mastery of [false,true]){
       let run=createDefenseRun(content,'COORDINATOR',content.scenario.id+(mastery?'-veteran':'-baseline'),mastery?{masteryRun:true}:{});
       for(let ticks=0;ticks<38000&&!['WON','LOST'].includes(run.status);ticks++){
         if(run.status==='READY'||run.status==='INTERMISSION'){
           for(let j=0;j<40;j++){
             const advice=recommendDefenseAction(content,run);
             if(!advice)break;
             run=applyDefenseCommand(run,content,advice.command);
           }
           if(run.status==='INTERMISSION'&&content.map.transition?.beforeWave===run.waveId&&!run.appliedTransitionIds?.includes(content.map.transition.id)){
             run=applyDefenseCommand(run,content,{type:'ConfirmTransition'});
           }
           run=applyDefenseCommand(run,content,{type:'StartWave'});
         }
         if(run.supportCooldownRemaining===0){
           try{run=applyDefenseCommand(run,content,{type:'UseSupport'});}catch{/* no eligible target */}
         }
         run=advanceDefense(run,content);
       }
       const directives=content.waves.map(w=>guardMasteryWaveDirective(content,w.id));
       expect(directives[0]).toBeNull();
       expect(directives.every((d,i)=>i===0||d===null||content.waves[i]!.groups.some(g=>g.enemy===d.enemy))).toBe(true);
       rows.push({stage:content.scenario.id,mode:mastery?'mastery':'normal',status:run.status,shield:run.shield,leaks:Object.values(run.leakedByEnemy).reduce((sum,n)=>sum+(n??0),0),ticks:run.tick});
       expect(['WON','LOST']).toContain(run.status);
       expect(Number.isFinite(run.shield)).toBe(true);
       expect(run.tick).toBeLessThan(38000);
     }
   }
   console.info('GUARD_ENDGAME_HEURISTIC_BOT='+JSON.stringify(rows));
   expect(rows).toHaveLength(12);
 },90000);

 it('checks all 50 Watch stage focus sets, 3-act pacing and post-clear challenge contracts',()=>{
   expect(PATROL_STAGE_IDS).toHaveLength(50);
   const summary:{stage:number;focus:string|null;targetShareExtreme:number;targetShareMastery:number}[]=[];
   for(const id of PATROL_STAGE_IDS){
     const stage=PATROL_STAGES[id],focus=masteryStageFocus(stage);
     const mix=authoredStageHazardMix(stage);
     if(focus)expect(mix).toContain(focus.type);
     expect(selectStageHazard(stage,0,.8,180,.8,'mastery')).toBe('UNHELMETED');
     for(const time of [72,132]){
       const normal=spawnPressure(stage.stageNumber,time,'extreme'),master=spawnPressure(stage.stageNumber,time,'mastery');
       expect(master.hpScale).toBeGreaterThan(normal.hpScale);
       expect(master.interval).toBeLessThan(normal.interval);
       expect(master.telegraphLimit).toBe(normal.telegraphLimit);
       if(focus){
         const specialRolls=Array.from({length:100},(_,i)=>((i+.5)/100));
         const extreme=specialRolls.filter(roll=>selectStageHazard(stage,time,roll,180,.8,'extreme')===focus.type).length;
         const mastery=specialRolls.filter(roll=>selectStageHazard(stage,time,roll,180,.8,'mastery')===focus.type).length;
         expect(mastery).toBe(100);
         expect(mastery).toBeGreaterThanOrEqual(extreme);
         if(time===72)summary.push({stage:stage.stageNumber,focus:focus.type,targetShareExtreme:extreme/100,targetShareMastery:mastery/100});
       }
     }
   }
   console.info('WATCH_50_STAGE_FOCUS_AUDIT='+JSON.stringify(summary));
   expect(summary.length).toBeGreaterThan(40);
 });

 it('runs actual 60 Hz Watch weapon/collision/spawn loops with default and veteran equipment',()=>{
   const rows:{stage:string;difficulty:string;loadout:string;seconds:number;phase:string;hp:number;neutralized:number;remainingThreats:number}[]=[];
   for(const stageId of ['stage_01','stage_10','stage_20','stage_30','stage_40','stage_50'] as const){
     for(const difficulty of ['extreme','mastery'] as const){
       for(const loadout of ['default','veteran'] as const){
         const inventory=loadout==='veteran'?{owned:['shock_mantle','rescue_wing'],equipped:['shock_mantle','rescue_wing']}:{owned:[],equipped:[]};
         const state=createInitialSurvivorsState('yoon',undefined,stageId,difficulty,inventory);
         if(loadout==='veteran'){
           state.activePerks.radio_boost=5;
           state.activePerks.safety_drone=5;
           state.activePerks.floodlight=5;
           state.activePerks.satellite_broadcast=1;
           state.activePerks.hunter_swarm=1;
           state.player.damageMultiplier=1.8;
           state.player.cooldownReduction=.5;
         }
         const engine=new SurvivorsEngine(state,0x50262026);
         engine.start();
         const endFrames=60*45;
         for(let frame=0;frame<endFrames;frame++){
           if(state.phase==='levelup'){
             const perk=state.perkOptions.find(k=>k.category==='support')??state.perkOptions[0];
             if(perk)engine.applyPerk(perk.id);
             else break;
           }
           if(state.phase!=='playing')break;
           const t=frame/60;
           engine.update(1/60,{moveX:Math.cos(t*.19),moveY:Math.sin(t*.19)});
         }
         rows.push({stage:stageId,difficulty,loadout,seconds:Math.round(state.gameTime*10)/10,phase:state.phase,hp:Math.round(state.player.hp),neutralized:state.hazardsNeutralized,remainingThreats:state.hazards.length});
         expect(Number.isFinite(state.player.hp)).toBe(true);
         expect(Number.isFinite(state.gameTime)).toBe(true);
         expect(state.gameTime).toBeGreaterThan(0);
       }
     }
   }
   console.info('WATCH_REAL_ENGINE_60HZ='+JSON.stringify(rows));
   expect(rows).toHaveLength(24);
 },90000);

 it('checks late-game boss survivability under veteran automated equipment, not a human clear prediction',()=>{
   const rows=[];
   for(const difficulty of ['extreme','mastery'] as const){
     const state=createInitialSurvivorsState('yoon',undefined,'stage_50',difficulty,{owned:['shock_mantle','rescue_wing'],equipped:['shock_mantle','rescue_wing']});
     state.activePerks.radio_boost=5;state.activePerks.safety_drone=5;state.activePerks.floodlight=5;
     state.activePerks.satellite_broadcast=1;state.activePerks.hunter_swarm=1;
     state.player.damageMultiplier=1.8;state.player.cooldownReduction=.5;
     const engine=new SurvivorsEngine(state,0x50262026);engine.start();
     const frameLimit=60*180;
     for(let frame=0;frame<frameLimit;frame++){
       if(state.phase==='levelup'){
         const perk=state.perkOptions.find(p=>p.category==='support')??state.perkOptions[0];
         if(!perk)break;
         engine.applyPerk(perk.id);
       }
       if(state.phase!=='playing')break;
       const t=frame/60;
       engine.update(1/60,{moveX:Math.cos(t*.19),moveY:Math.sin(t*.19)});
     }
     rows.push({difficulty,seconds:Math.round(state.gameTime*10)/10,phase:state.phase,hp:Math.round(state.player.hp),neutralized:state.hazardsNeutralized,bossAlive:state.hazards.some(h=>h.isStageBoss&&h.hp>0),bossResolved:state.bossEncounter?.phase==='secured'||state.phase==='victory'});
     expect(Number.isFinite(state.gameTime)).toBe(true);
     expect(state.gameTime).toBeGreaterThan(20);
   }
   console.info('WATCH_STAGE50_FULL_3ACT_BOT='+JSON.stringify(rows));
 },90000);
});
