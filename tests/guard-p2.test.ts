import {describe,it,expect} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {advanceDefense,applyDefenseCommand,createDefenseRun} from '../src/engine/defense';
import {fireDefenseUltimate,resolveDefensePending} from '../src/engine/defense-ultimate';
import {recommendDefenseAction} from '../src/app/defense-tactics';
import {decodeDefenseSave,encodeDefenseSave,emptyDefenseSaveDocument} from '../src/app/defense-save';
import {guardStoragePort,GUARD_V1_SAVE_KEY,GUARD_SAVE_KEY} from '../src/app/guard-storage';
import type {DefenseEnemyState,DefenseTowerId,DefenseLevelId} from '../src/domain/defense';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import assets from '../content/defense/guard-p2-art-v1.json';
import {defenseCameraSignal} from '../src/ui/useDefenseCamera';
import {updateDefenseUltimateFields,updateDefenseAnalysis} from '../src/engine/defense-ultimate';
const c=guardContents[3]!;
function enemy(id='a',distance=100):DefenseEnemyState{return {id,enemyId:'NORMAL',hp:1000,distance,spawnSequence:1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0};}
function equipped(family:DefenseTowerId,level:DefenseLevelId){
 let run={...createDefenseRun(c,'COMMANDER','p2',{ultimateUnlocked:true}),resource:10000};
 run=applyDefenseCommand(run,c,{type:'Build',towerId:family,padId:'P1'});
 for(const levelId of ['L2',level.endsWith('A')?'L3A':'L3B',level] as DefenseLevelId[])run=applyDefenseCommand(run,c,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId});
 return {...run,status:'RUNNING' as const,enemies:[enemy()]};
}
describe('Guard underground release contracts',()=>{
 it('follows the lower route in camera coordinates instead of the upper main route',()=>{
  const content=guardContents[4]!,before={...createDefenseRun(content,'COORDINATOR','camera'),status:'RUNNING' as const};
  const after={...before,enemies:[{...enemy(),routeId:'lower'}]};
  expect(defenseCameraSignal(before,after,content).focus).toEqual({x:100,y:450});
 });
 it('distinguishes piercing, volley repeats, expanding waves, locking and analysis',()=>{
  const content={...c,map:{...c.map,path:[[0,200],[1000,200]] as const}};
  for(const [family,levelId] of [['PULSE','L4A'],['PULSE','L4B'],['BURST','L4A'],['CONTROL','L4A'],['SENSOR','L4B']] as const){
   const base=equipped(family,levelId),tower={...base.towers[0]!,charge:3,analysisTicks:80};
   const run={...base,towers:[tower],enemies:[enemy('a',200),enemy('b',250),enemy('c',300)]};
   const level=content.towers.find(t=>t.id===family)!.levels.find(l=>l.id===levelId)!;
   const fire=fireDefenseUltimate(run,content,tower,level,run.enemies[0]!);
   if(family==='PULSE'&&levelId==='L4A'){expect(fire.state.pendingAttacks).toHaveLength(2);expect(fire.tower.charge).toBe(0);}
   if(family==='PULSE'&&levelId==='L4B'){expect(fire.shots[0]?.targets).toHaveLength(3);expect(fire.shots[0]!.targets[0]!.damage).toBeGreaterThan(fire.shots[0]!.targets[1]!.damage);}
   if(family==='BURST'){expect(fire.state.enemies[0]!.hp).toBe(1000);const first=resolveDefensePending({...fire.state,tick:1},content);expect(first.shots[0]?.targets.map(t=>t.id)).toEqual(['a']);const last=resolveDefensePending({...first.state,tick:12},content);expect(last.shots.flatMap(s=>s.targets).some(t=>t.id==='a')).toBe(false);}
   if(family==='CONTROL'){expect(fire.state.enemies[0]?.lockedUntilTick).toBe(12);const boss={...run.enemies[0]!,enemyId:'BOSS' as const};expect(fireDefenseUltimate({...run,enemies:[boss]},content,tower,level,boss).state.enemies[0]?.lockedUntilTick).toBeUndefined();}
   if(family==='SENSOR'){expect(fire.shots[0]!.targets[0]!.damage).toBe(level.damage+40);expect(updateDefenseAnalysis({...run,enemies:[]},content).towers[0]!.analysisTicks).toBe(76);}
  }
 });
 it('slows only contacts inside the actual boundary line',()=>{
  const content={...c,map:{...c.map,path:[[0,200],[1000,200]] as const}},base=equipped('CONTROL','L4B');
  const after=updateDefenseUltimateFields({...base,enemies:[enemy('inside',180),enemy('outside',300)]},content);
  expect(after.enemies[0]?.slowEffects[0]?.fraction).toBe(.6);expect(after.enemies[1]?.slowEffects).toHaveLength(0);
 });
 it('includes six independent stages and final candidate assets with recorded hashes',()=>{
  expect(guardContents.map(c=>c.waves.length)).toEqual([6,7,8,7,8,9]);
  expect(assets.towers).toHaveLength(8);expect(assets.boards).toHaveLength(3);
  for(const a of [...assets.towers,...assets.boards])expect(createHash('sha256').update(readFileSync('public/'+a.uri)).digest('hex')).toBe(a.sha256);
 });
 it.each(['PULSE','BURST','CONTROL','SENSOR'] as const)('%s final branches serialize and obey a single simultaneous slot',family=>{
  for(const level of ['L4A','L4B'] as const){
   const run=equipped(family,level);
   expect(decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},c,1))?.payload.activeRun).toEqual(run);
   let second=applyDefenseCommand(run,c,{type:'Build',towerId:'PULSE',padId:'P2'});
   for(const levelId of ['L2','L3A'] as const)second=applyDefenseCommand(second,c,{type:'Upgrade',towerInstanceId:'tower-2',levelId});
   expect(()=>applyDefenseCommand(second,c,{type:'Upgrade',towerInstanceId:'tower-2',levelId:'L4A'})).toThrow('one ultimate');
  }
 });
 it('delayed contacts keep their launch origin and survive a sale and save/resume',()=>{
  const run=equipped('BURST','L4B'),tower=run.towers[0]!,level=c.towers.find(t=>t.id==='BURST')!.levels.find(l=>l.id==='L4B')!;
  const launch=fireDefenseUltimate(run,c,tower,level,run.enemies[0]!);
  expect(launch.shots[0]?.phase).toBe('LAUNCH');expect(launch.state.enemies[0]?.hp).toBe(1000);
  const sold=applyDefenseCommand(launch.state,c,{type:'Sell',towerInstanceId:tower.id});
  const restored=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:sold},c,1))!.payload.activeRun!;
  expect(resolveDefensePending({...restored,tick:11},c).shots).toHaveLength(0);
  const impact=resolveDefensePending({...restored,tick:12},c);
  expect(impact.shots[0]?.origin).toEqual({x:110,y:200});expect(impact.state.enemies[0]!.hp).toBeLessThan(1000);
 });
 it('transition cannot be bypassed or double-grant relocation and survives storage',()=>{
  const content=guardContents[5]!,base={...createDefenseRun(content,'OBSERVER','shift',{ultimateUnlocked:true}),status:'INTERMISSION' as const,waveId:5};
  expect(()=>applyDefenseCommand(base,content,{type:'StartWave'})).toThrow('confirmation');
  const shifted=applyDefenseCommand(base,content,{type:'ConfirmTransition'});
  expect(applyDefenseCommand(shifted,content,{type:'ConfirmTransition'})).toBe(shifted);
  const restored=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:shifted},content,1))!.payload.activeRun!;
  const built=applyDefenseCommand(restored,content,{type:'Build',towerId:'PULSE',padId:'P1'});
  const moved=applyDefenseCommand(built,content,{type:'RelocateTower',towerInstanceId:'tower-1',padId:'P2'});
  expect(moved.redeploymentCredits).toBe(0);expect(moved.resource).toBe(built.resource);
  expect(()=>applyDefenseCommand(moved,content,{type:'RelocateTower',towerInstanceId:'tower-1',padId:'P3'})).toThrow();
  expect(applyDefenseCommand(moved,content,{type:'ConfirmTransition'}).redeploymentCredits).toBe(0);
 });
 it('direction support is local, finite, and only spent on a valid chosen tower',()=>{
  let run=createDefenseRun(c,'SIGNALER','direction');run=applyDefenseCommand(run,c,{type:'Build',towerId:'PULSE',padId:'P1'});
  run={...run,status:'RUNNING'};
  expect(()=>applyDefenseCommand(run,c,{type:'UseSupport'})).toThrow('direction');
  const after=applyDefenseCommand(run,c,{type:'UseSupport',towerInstanceId:'tower-1',direction:{x:210,y:200}});
  expect(after.guidance?.padId).toBe('P1');expect(after.supportCooldownRemaining).toBe(800);
  expect(after.enemies).toEqual(run.enemies);
 });
 it('keeps v1 bytes recoverable while migrating progress to schema 2',async()=>{
  const oldContent={...guardContents[0]!,rulesVersion:'guard-rules-1',contentVersion:'guard-foundation-1.0.0'};
  const oldRun=createDefenseRun(oldContent,'COORDINATOR','old');
  const {pendingAttacks,ultimateUnlocked,mapPhase,appliedTransitionIds,redeploymentCredits,...legacyRun}=oldRun;
  const bytes=encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:legacyRun},oldContent,7);
  const data=new Map([[GUARD_V1_SAVE_KEY,bytes]]);
  const port=guardStoragePort({read:async k=>data.get(k)??null,write:async(k,v)=>{data.set(k,v);},remove:async k=>{data.delete(k);},keys:async()=>[...data.keys()]});
  await port.read('psi-zero-day.defense.save.v1');
  expect(data.get(GUARD_V1_SAVE_KEY)).toBe(bytes);expect(decodeDefenseSave(data.get(GUARD_SAVE_KEY)!)?.schemaVersion).toBe(2);
 });
 it.each(guardContents.slice(3).map(c=>[c.scenario.id,c] as const))('normally buys and clears %s for all six crew',(_id,content)=>{
  for(const support of content.scenario.availableSupports){
   let run=createDefenseRun(content,support,'qa-'+support,{ultimateUnlocked:true});
   for(let ticks=0;!['WON','LOST'].includes(run.status)&&ticks<40000;ticks++){
    if(run.status==='READY'||run.status==='INTERMISSION'){
     if(content.map.transition?.beforeWave===run.waveId&&!run.appliedTransitionIds?.length)run=applyDefenseCommand(run,content,{type:'ConfirmTransition'});
     for(let n=0;n<40;n++){const a=recommendDefenseAction(content,run);if(!a)break;run=applyDefenseCommand(run,content,a.command);}
     run=applyDefenseCommand(run,content,{type:'StartWave'});
    }
    if(run.supportCooldownRemaining===0&&support!=='COMMANDER'&&support!=='SIGNALER'){try{run=applyDefenseCommand(run,content,{type:'UseSupport'});}catch{}}
    if(ticks%100===0&&run.status==='RUNNING'){const a=recommendDefenseAction(content,run);if(a)run=applyDefenseCommand(run,content,a.command);}
    run=advanceDefense(run,content);
   }
   if(run.status!=='WON')console.log(JSON.stringify({stage:content.scenario.id,support,wave:run.waveId,leaks:run.leakedByEnemy,towers:run.towers.map(t=>[t.padId,t.towerId,t.levelId])}));
   expect({support,status:run.status,wave:run.waveId,shield:run.shield}).toMatchObject({status:'WON'});
   expect(decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},content,1))?.payload.activeRun).toEqual(run);
  }
 },60000);
});
