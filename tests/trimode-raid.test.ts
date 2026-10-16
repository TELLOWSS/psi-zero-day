import {it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import {guardContents} from '../src/content/guard-campaign';
import {advanceDefense,applyDefenseCommand,createDefenseRun} from '../src/engine/defense';
import {recommendDefenseAction} from '../src/app/defense-tactics';
import {GUARD_PLANNING_STYLES} from '../src/app/guard-planning-style';
import {recordDefenseCombat} from '../src/engine/defense-tactical-stats';
import {decodeDefenseSave,encodeDefenseSave,emptyDefenseSaveDocument} from '../src/app/defense-save';
import {validDefenseTacticalStats} from '../src/app/defense-tactical-validation';
import type {DefenseEnemyState} from '../src/domain/defense';

it('keeps cross-mode intel monotonic, optional, isolated and resilient to unavailable storage',()=>{
 const data=new Map<string,string>([['unrelated-save','keep']]),sandbox={localStorage:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync('public/assets/shared/signal-encounter-intel-v1.js','utf8'),sandbox);
 const api=(sandbox as typeof sandbox&{SignalEncounterIntel:{read:()=>any;record:(...args:string[])=>any;normalize:(v:unknown)=>any}}).SignalEncounterIntel;
 expect(api.read().watch.mastery).toBe('unseen');api.record('watch','stage_14','observed');
 expect(api.read().breaker.mastery).toBe('unseen');expect(api.read().verifiedAt).toBeNull();
 api.record('watch','stage_14','verified');api.record('watch','stage_14','observed');
 expect(api.read().watch.mastery).toBe('verified');api.record('guard','GD-07','verified');expect(api.read().guard.mastery).toBe('unseen');
 expect(data.get('unrelated-save')).toBe('keep');expect(api.normalize({eventId:'wrong'}).watch.mastery).toBe('unseen');
 sandbox.localStorage.setItem=()=>{throw Error('blocked')};api.record('breaker','CH-04','observed');expect(api.read().breaker.mastery).toBe('observed');
});

it('records actual first effective contact, leaked route and support time with save validation',()=>{
 const c=guardContents[5]!;let run=createDefenseRun(c,'COORDINATOR','telemetry');
 const enemy:DefenseEnemyState={id:'probe',routeId:'lower',enemyId:'NORMAL',hp:100,distance:100,spawnSequence:1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0};
 run={...run,status:'RUNNING',tick:20,enemies:[enemy]};
 run=recordDefenseCombat(run,[{id:'actual',padId:'P2',towerId:'PULSE',levelId:'L1',targets:[{id:enemy.id,enemyId:'NORMAL',distance:100,point:{x:100,y:450},damage:5,resolved:false}]}]);
 expect(run.enemies[0]!.firstContact).toMatchObject({padId:'P2',tick:20,point:{x:100,y:450}});
 run=applyDefenseCommand(run,c,{type:'UseSupport'});expect(run.tacticalStats!.supportEvents?.[0]).toMatchObject({kind:'SUPPORT',tick:20});
 run={...run,freezeMovementUntilTick:0,enemies:[{...run.enemies[0]!,distance:99999}]};run=advanceDefense(run,c);
 expect(run.tacticalStats!.routeLeaks?.[0]).toMatchObject({routeId:'lower',firstContact:{padId:'P2',tick:20}});
 expect(decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},c,1))?.payload.activeRun).toEqual(run);
 expect(validDefenseTacticalStats({...run.tacticalStats,routeLeaks:Array(25).fill(run.tacticalStats!.routeLeaks![0])})).toBe(false);
 expect(validDefenseTacticalStats({...run.tacticalStats,supportEvents:[{kind:'SUPPORT',supportId:'COORDINATOR',tick:-1,waveId:1}]})).toBe(false);
});

it('clears GD06 with three legal different blueprints and equal starting budgets',()=>{
 const c=guardContents[5]!,reports=[];
 for(const style of GUARD_PLANNING_STYLES){
  let run=createDefenseRun(c,'COORDINATOR','trimode-'+style,{ultimateUnlocked:true});const budget=run.resource;
  for(let ticks=0;!['WON','LOST'].includes(run.status)&&ticks<40000;ticks++){
   if(run.status==='READY'||run.status==='INTERMISSION'){
    if(style==='BALANCED'&&run.waveId===4&&process.env.PSI_TRIMODE_CHECKPOINT_OUTPUT)fs.writeFileSync(process.env.PSI_TRIMODE_CHECKPOINT_OUTPUT,encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},c,1));
    const before=run;expect(advanceDefense(run,c,100)).toBe(before);
    if(c.map.transition?.beforeWave===run.waveId&&!run.appliedTransitionIds?.length)run=applyDefenseCommand(run,c,{type:'ConfirmTransition'});
    for(let i=0;i<40;i++){const a=recommendDefenseAction(c,run,style);if(!a)break;run=applyDefenseCommand(run,c,a.command);}
    run=applyDefenseCommand(run,c,{type:'StartWave'});
   }
   if(run.supportCooldownRemaining===0){try{run=applyDefenseCommand(run,c,{type:'UseSupport'});}catch{}}
   if(ticks%100===0){const a=recommendDefenseAction(c,run,style);if(a)run=applyDefenseCommand(run,c,a.command);}
   run=advanceDefense(run,c);
  }
  reports.push({style,budget,status:run.status,shield:run.shield,tick:run.tick,loadout:run.towers.map(t=>`${t.padId}:${t.towerId}:${t.levelId}`),stats:run.tacticalStats});
 }
 if(process.env.PSI_TRIMODE_SIMULATION_OUTPUT)fs.writeFileSync(process.env.PSI_TRIMODE_SIMULATION_OUTPUT,JSON.stringify(reports,null,2));
 expect(reports.map(r=>r.status)).toEqual(['WON','WON','WON']);expect(new Set(reports.map(r=>r.budget)).size).toBe(1);expect(new Set(reports.map(r=>r.loadout.join('|'))).size).toBe(3);
 expect(reports.every(r=>Object.entries(r.stats?.byLevel??{}).some(([key,row])=>key.includes(':L4')&&row.damage>0))).toBe(true);
},60000);
