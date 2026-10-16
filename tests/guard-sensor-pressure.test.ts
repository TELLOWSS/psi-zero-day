import {expect,it} from 'vitest';
import fs from 'node:fs';
import {guardContents} from '../src/content/guard-campaign';
import {validateDefenseContent} from '../src/content/defense';
import {createDefenseRun,applyDefenseCommand,advanceDefense} from '../src/engine/defense';
import {updateDefenseSensorPressure,defenseSensorBlocked,defensePressureWaveGroups} from '../src/engine/defense-sensor-pressure';
import {encodeDefenseSave,decodeDefenseSave,emptyDefenseSaveDocument} from '../src/app/defense-save';
import {recommendDefenseAction} from '../src/app/defense-tactics';
import {GUARD_PLANNING_STYLES} from '../src/app/guard-planning-style';
import type {DefenseRunState,DefenseEnemyState} from '../src/domain/defense';
const content=guardContents[5]!;
function fixture():DefenseRunState{
 let run=createDefenseRun(content,'COMMANDER','pressure-test');
 run=applyDefenseCommand(run,content,{type:'Build',towerId:'SENSOR',padId:'P1'});
 run=applyDefenseCommand(run,content,{type:'Build',towerId:'SENSOR',padId:'P2'});
 const core:DefenseEnemyState={id:'core',enemyId:'ARMORED',hp:1000,distance:0,spawnSequence:1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0,sensorPressure:{phase:'SEEK',remainingTicks:0,targetTowerId:null,targetPadId:null}};
 return {...run,status:'RUNNING',enemies:[core]};
}
it('locks one actual route-covering sensor, warns four seconds, blocks three seconds, and expires once',()=>{
 let run=updateDefenseSensorPressure(fixture(),content);const target=run.enemies[0]!.sensorPressure!.targetTowerId;
 expect(run.enemies[0]!.sensorPressure).toMatchObject({phase:'WARNING',remainingTicks:80});
 expect(defenseSensorBlocked(run,run.towers.find(t=>t.id===target)!)).toBe(false);
 for(let i=0;i<80;i++)run=updateDefenseSensorPressure(run,content);
 expect(run.enemies[0]!.sensorPressure).toMatchObject({phase:'ACTIVE',remainingTicks:60});
 expect(run.towers.filter(t=>defenseSensorBlocked(run,t))).toHaveLength(1);
 for(let i=0;i<60;i++)run=updateDefenseSensorPressure(run,content);
 expect(run.enemies[0]!.sensorPressure!.phase).toBe('SPENT');expect(run.towers.some(t=>defenseSensorBlocked(run,t))).toBe(false);
 expect(run.tacticalStats).toMatchObject({sensorWarnings:1,sensorInterruptions:1});
});
it('neutralizing or moving the actual locked sensor ends suppression; pause and freeze preserve the remaining window',()=>{
 let run=updateDefenseSensorPressure(fixture(),content);const target=run.towers.find(t=>t.id===run.enemies[0]!.sensorPressure!.targetTowerId)!;
 const paused={...run,paused:true};expect(advanceDefense(paused,content,100)).toBe(paused);
 expect(updateDefenseSensorPressure({...run,freezeMovementUntilTick:999},content).enemies).toEqual(run.enemies);
 const moved=applyDefenseCommand(run,content,{type:'RelocateTower',towerInstanceId:target.id,padId:'P3'});
 expect(updateDefenseSensorPressure(moved,content).enemies[0]!.sensorPressure!.phase).toBe('SPENT');
 run={...run,enemies:[]};expect(defenseSensorBlocked(run,target)).toBe(false);
});
it('only skips the targeted reveal pulse, keeps existing visibility and leaves sensor fire working',()=>{
 let run=fixture();run=applyDefenseCommand(run,content,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:'L2'});const backup=run.towers[0]!,target=run.towers[1]!,core={...run.enemies[0]!,distance:120,sensorPressure:{phase:'ACTIVE' as const,remainingTicks:60,targetTowerId:target.id,targetPadId:target.padId}};
 const veil:DefenseEnemyState={...core,id:'veil',enemyId:'VEILED',hp:1000,distance:125,sensorPressure:undefined,revealUntilTick:40};
 run={...run,enemies:[core,veil],towers:[target],spawnedByGroup:content.waves[0]!.groups.map(g=>g.count)};
 const next=advanceDefense(run,content);expect(next.enemies.find(e=>e.id==='veil')?.revealUntilTick).toBe(40);
 expect(next.tacticalStats!.damage).toBeGreaterThan(0);
 const other=advanceDefense({...run,towers:[target,backup]},content);
 expect(other.enemies.find(e=>e.id==='veil')!.revealUntilTick).toBeGreaterThan(40);
});
it('forecasts the same count and spawn time, restores pressure exactly, and leaves older active runs unchanged',()=>{
 const groups=defensePressureWaveGroups(content,content.waves[0]!,true);
 expect(groups[0]).toMatchObject({enemy:'ARMORED',count:1,pressureCore:true,startTick:0});expect(groups.reduce((n,g)=>n+g.count,0)).toBe(28);
 let run=updateDefenseSensorPressure(fixture(),content);
 const restored=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},content,1))!.payload.activeRun!;
 expect(restored).toEqual(run);expect(advanceDefense(restored,content,30)).toEqual(advanceDefense(run,content,30));
 run={...createDefenseRun(content,'OBSERVER','legacy'),sensorPressureEnabled:undefined};run=applyDefenseCommand(run,content,{type:'StartWave'});run=advanceDefense(run,content);
 expect(run.enemies[0]!.enemyId).toBe('NORMAL');expect(run.enemies[0]!.sensorPressure).toBeUndefined();
 expect(()=>validateDefenseContent({...content,sensorPressure:{waves:[1,1],warningTicks:0,activeTicks:999}})).toThrow();
 const invalid={...restored,enemies:[{...restored.enemies[0]!,sensorPressure:{...restored.enemies[0]!.sensorPressure!,remainingTicks:-1}}]};
 expect(decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:invalid},content,1))).toBeNull();
});
it('uses the same live timeline at 1x and 2x and exports only normally purchased QA equipment',()=>{
 let run=createDefenseRun(content,'COMMANDER','pressure-ui');
 for(const [towerId,padId] of [['PULSE','P1'],['SENSOR','P2'],['SENSOR','P3']] as const)run=applyDefenseCommand(run,content,{type:'Build',towerId,padId});
 if(process.env.PSI_PRESSURE_CHECKPOINT_OUTPUT)fs.writeFileSync(process.env.PSI_PRESSURE_CHECKPOINT_OUTPUT,encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},content,1));
 run=applyDefenseCommand(run,content,{type:'StartWave'});
 const normal=advanceDefense(run,content,120),fast=advanceDefense(applyDefenseCommand(run,content,{type:'SetSpeed',speed:2}),content,60);
 expect({...fast,speed:1}).toEqual(normal);expect(normal.tacticalStats!.sensorWarnings).toBeGreaterThan(0);
});
it('clears with three different legal styles and six crew using real responses at the same initial budget',()=>{
 const rows=[];
 for(const style of GUARD_PLANNING_STYLES)for(const support of content.scenario.availableSupports){
  let run=createDefenseRun(content,support,`pressure-${style}-${support}`,{ultimateUnlocked:true});const budget=run.resource;
  for(let step=0;step<40000&&!['WON','LOST'].includes(run.status);step++){
   if(['READY','INTERMISSION'].includes(run.status)){
    if(content.map.transition?.beforeWave===run.waveId&&!run.appliedTransitionIds?.length)run=applyDefenseCommand(run,content,{type:'ConfirmTransition'});
    for(let i=0;i<40;i++){const a=recommendDefenseAction(content,run,style);if(!a)break;run=applyDefenseCommand(run,content,a.command);}
    run=applyDefenseCommand(run,content,{type:'StartWave'});
   }
   if((run.eStopCooldownUntilTick??0)<=run.tick&&(run.enemies.some(e=>e.sensorPressure?.phase==='WARNING')||run.enemies.some(e=>e.enemyId==='BOSS'&&e.distance>1000)))run=applyDefenseCommand(run,content,{type:'TriggerEStop'});
   if(run.supportCooldownRemaining===0&&!['COMMANDER','SIGNALER'].includes(support)){try{run=applyDefenseCommand(run,content,{type:'UseSupport'});}catch{}}
   if(step%100===0){const a=recommendDefenseAction(content,run,style);if(a)run=applyDefenseCommand(run,content,a.command);}
   run=advanceDefense(run,content);
  }
  rows.push({style,support,budget,status:run.status,shield:run.shield,stats:run.tacticalStats,loadout:run.towers.map(t=>`${t.padId}:${t.towerId}:${t.levelId}`)});
 }
 if(process.env.PSI_PRESSURE_SIMULATION_OUTPUT)fs.writeFileSync(process.env.PSI_PRESSURE_SIMULATION_OUTPUT,JSON.stringify(rows,null,2));
 expect(rows.filter(r=>r.status!=='WON').map(r=>({style:r.style,support:r.support,status:r.status}))).toEqual([]);
 expect(new Set(rows.map(r=>r.budget)).size).toBe(1);expect(new Set(rows.filter(r=>r.support==='COORDINATOR').map(r=>r.loadout.join('|'))).size).toBe(3);
},60000);
