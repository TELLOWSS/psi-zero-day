import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {guardContents} from '../src/content/guard-campaign';
import {zeroBreachContent} from '../src/content/defense';
import {createDefenseRun,applyDefenseCommand,advanceDefense,advanceDefenseWithCombat,defenseResult} from '../src/engine/defense';
import {closeDefenseTacticalWave,withDefenseTacticalStats} from '../src/engine/defense-tactical-stats';
import {GUARD_PLANNING_STYLES} from '../src/app/guard-planning-style';
import {recommendDefenseAction} from '../src/app/defense-tactics';
import {GUARD_LAB_FIXTURES,compareGuardBranches} from '../src/app/guard-tower-lab';
import {guardWaveIntel} from '../src/app/guard-wave-intel';
import {encodeDefenseSave,decodeDefenseSave,emptyDefenseSaveDocument,applyDefenseOutcome} from '../src/app/defense-save';
import {guardMuzzleOffset,defenseCombatPan,guardSoundEnvelope} from '../src/app/guard-combat-presentation';
import type {DefenseCombatShot,DefenseRunState,DefenseEnemyState} from '../src/domain/defense';

describe('guard tactical depth',()=>{
 it('holds manual preparation without spawning, regenerating cooldowns or advancing game time',()=>{
  const c=guardContents[0]!,base=createDefenseRun(c,'COORDINATOR','manual');
  const run={...base,status:'INTERMISSION' as const,waveId:2,intermissionRemaining:200,supportCooldownRemaining:100};
  expect(advanceDefense(run,c,10000)).toBe(run);
  const started=applyDefenseCommand(run,c,{type:'StartWave'});expect(started.status).toBe('RUNNING');expect(started.supportCooldownRemaining).toBe(100);
  const legacy={...createDefenseRun(zeroBreachContent,'COORDINATOR','legacy'),status:'INTERMISSION' as const,waveId:2,intermissionRemaining:1};
  expect(advanceDefense(legacy,zeroBreachContent).status).toBe('RUNNING');
 });
 it('records actual clamped damage and resolved targets exactly once, including an eight-target salvo',()=>{
  const c={...guardContents[0]!,initialResource:10000};let run=createDefenseRun(c,'COORDINATOR','ledger');
  run=applyDefenseCommand(run,c,{type:'Build',padId:'P1',towerId:'BURST'});run=applyDefenseCommand(run,c,{type:'Upgrade',towerInstanceId:'tower-1',levelId:'L2'});run=applyDefenseCommand(run,c,{type:'Upgrade',towerInstanceId:'tower-1',levelId:'L3A'});
  const enemies:DefenseEnemyState[]=Array.from({length:8},(_,i)=>({id:`x${i}`,enemyId:'SWARM',hp:1,distance:120+i,spawnSequence:i+1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0}));
  run={...run,status:'RUNNING',enemies,spawnedByGroup:c.waves[0]!.groups.map(g=>g.count)};
  const frame=advanceDefenseWithCombat(run,c);expect(frame.shots[0]?.targets).toHaveLength(8);
  expect(frame.state.tacticalStats).toMatchObject({damage:8,resolved:8,shots:1,bestClear:{count:8,padId:'P1',waveId:1}});
  expect(frame.state.tacticalStats?.waves[0]).toMatchObject({resolved:8,leaks:0});
  expect(advanceDefense(frame.state,c,100).tacticalStats).toEqual(frame.state.tacticalStats);
 });
 it('preserves partial-history boundaries for old active runs and does not attribute earlier leaks to the resumed wave',()=>{
  const c=guardContents[0]!,base=createDefenseRun(c,'COORDINATOR','old');
  const old={...base,tacticalStats:undefined,tick:900,shield:18,leakedByEnemy:{NORMAL:2},waveId:3} satisfies DefenseRunState;
  const resumed=withDefenseTacticalStats(old,c),closed=closeDefenseTacticalWave(resumed);
  expect(closed.tacticalStats).toMatchObject({trackedFromTick:900,initialLeaks:2,initialShield:18});expect(closed.tacticalStats?.waves[0]).toMatchObject({leaks:0,shieldLost:0});
  const decoded=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:resumed},c,1));expect(decoded?.payload.activeRun).toEqual(resumed);
 });
 it('settles a bounded tactical report once and rejects damaged report fields',()=>{
  const c=guardContents[0]!,won={...createDefenseRun(c,'COORDINATOR','won'),status:'WON' as const};
  const first=applyDefenseOutcome(emptyDefenseSaveDocument(),c,won,defenseResult(won),'2026-10-15');
  expect(first.document.records[0]?.lastTacticalReport?.supportId).toBe('COORDINATOR');expect(applyDefenseOutcome(first.document,c,won,defenseResult(won),'2026-10-15').applied).toBe(false);
  const broken={...won,tacticalStats:{...won.tacticalStats!,damage:-1}};
  expect(decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:broken},c,1))).toBeNull();
 });
 it('keeps outcomes and tactical accounting identical at 1x/2x and after a saved checkpoint',()=>{
  const c=guardContents[0]!;let run=createDefenseRun(c,'COORDINATOR','speed-save');run=applyDefenseCommand(run,c,{type:'Build',towerId:'PULSE',padId:'P1'});run=applyDefenseCommand(run,c,{type:'StartWave'});run=advanceDefense(run,c,180);
  const restored=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},c,1))!.payload.activeRun!;
  const normal=advanceDefense(run,c,1000),fast=advanceDefense(applyDefenseCommand(restored,c,{type:'SetSpeed',speed:2}),c,500);
  expect({...fast,speed:1}).toEqual(normal);
 });
 it('compares all four families across five identical-condition trials and exposes armor/hidden trade-offs',()=>{
  const c=guardContents[0]!,before=JSON.stringify(c);
  for(const fixture of GUARD_LAB_FIXTURES)for(const tower of c.towers){const rows=compareGuardBranches(c,tower.id,fixture);expect(rows.map(r=>r.spawned)).toEqual([rows[0]!.spawned,rows[0]!.spawned]);expect(rows.every(r=>r.damage>=0&&r.resolved<=r.spawned)).toBe(true);}
  expect(compareGuardBranches(c,'PULSE','ARMORED')[1]!.damage).toBeGreaterThan(compareGuardBranches(c,'PULSE','ARMORED')[0]!.damage);
  expect(compareGuardBranches(c,'BURST','SWARM')[0]!.resolved).toBeGreaterThan(compareGuardBranches(c,'BURST','SWARM')[1]!.resolved);
  expect(compareGuardBranches(c,'PULSE','VEILED').every(r=>r.damage===0)).toBe(true);
  expect(compareGuardBranches(c,'SENSOR','VEILED').every(r=>r.damage>0)).toBe(true);expect(JSON.stringify(c)).toBe(before);
 });
 it('forecasts authored group timing without confusing spawn duration with travel duration',()=>{
  const c=guardContents[2]!,wave=c.waves[7]!,intel=guardWaveIntel(c,wave);
  expect(intel.count).toBe(63);expect(intel.groups.find(g=>g.enemy==='BOSS')).toMatchObject({start:8,end:8});expect(intel.duration).toBe(18.9);
 });
 it('keeps firing offsets attached to upright sprites in both projections and makes A/B sound envelopes distinct',()=>{
  for(const tower of guardContents[0]!.towers)for(const level of tower.levels){
   const shot={id:'calibration',towerId:tower.id,levelId:level.id,padId:'P1',targets:[]} satisfies DefenseCombatShot;
   const a=guardMuzzleOffset(shot),b=guardMuzzleOffset(shot,true);expect({x:-b.y,y:b.x}).toEqual(a);expect(Math.abs(a.x)).toBeLessThan(54);expect(a.y).toBeGreaterThan(-77);
  }
  for(const tower of guardContents[0]!.towers)expect(guardSoundEnvelope(tower.id,'L3A')).not.toEqual(guardSoundEnvelope(tower.id,'L3B'));
  const shot={id:'pan',towerId:'PULSE',levelId:'L1',padId:'P1',targets:[{id:'e',enemyId:'NORMAL',distance:0,point:{x:0,y:0},damage:1,resolved:false}]} satisfies DefenseCombatShot;
  expect(defenseCombatPan(shot)).toBe(-.6);expect(defenseCombatPan(shot,true)).toBe(.6);
 });
 it('normally clears three stages with three advice styles and four supports, with different resulting blueprints',()=>{
  const reports=[];
  for(const content of guardContents)for(const style of GUARD_PLANNING_STYLES)for(const support of ['COORDINATOR','OBSERVER','REBAR_LEAD','ENGINEER'] as const){
   let run=createDefenseRun(content,support,`depth-${content.map.id}-${style}-${support}`);
   for(let ticks=0;!['WON','LOST'].includes(run.status)&&ticks<40000;ticks++){
    if(run.status==='READY'||run.status==='INTERMISSION'){
     for(let i=0;i<40;i++){const advice=recommendDefenseAction(content,run,style);if(!advice)break;run=applyDefenseCommand(run,content,advice.command);}
     run=applyDefenseCommand(run,content,{type:'StartWave'});
    }
    if(run.supportCooldownRemaining===0){try{run=applyDefenseCommand(run,content,{type:'UseSupport'});}catch{}}
    run=advanceDefense(run,content);
   }
   reports.push({stage:content.scenario.id,style,support,status:run.status,shield:run.shield,ticks:run.tick,peak:run.tacticalStats?.peakSignals,stats:run.tacticalStats,loadout:run.towers.map(t=>`${t.padId}:${t.towerId}:${t.levelId}`)});
  }
  if(process.env.PSI_GUARD_SIMULATION_OUTPUT){fs.mkdirSync(path.dirname(process.env.PSI_GUARD_SIMULATION_OUTPUT),{recursive:true});fs.writeFileSync(process.env.PSI_GUARD_SIMULATION_OUTPUT,JSON.stringify(reports,null,2));}
  expect(reports.filter(r=>r.status!=='WON').map(r=>({stage:r.stage,style:r.style,support:r.support}))).toEqual([]);
  expect(new Set(reports.filter(r=>r.stage===guardContents[0]!.scenario.id&&r.support==='COORDINATOR').map(r=>r.loadout.join('|'))).size).toBeGreaterThan(1);
 });
});
