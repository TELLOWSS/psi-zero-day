/** @vitest-environment jsdom */
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {guardContactSummary,guardDamageLabels,guardExitPressure} from '../src/app/guard-battle-feedback';
import {defensePathLength} from '../src/engine/defense-geometry';
import {guardEvolutionState} from '../src/app/guard-evolution';
import {guardMuzzleOffset,guardSoundEnvelope} from '../src/app/guard-combat-presentation';
import {compareGuardBranches,guardLabContent} from '../src/app/guard-tower-lab';
import origins from '../content/defense/guard-combat-presentation-v1.json';
import {createDefenseRun,applyDefenseCommand,advanceDefenseWithCombat} from '../src/engine/defense';
import {encodeDefenseSave,decodeDefenseSave,emptyDefenseSaveDocument} from '../src/app/defense-save';
import {DefenseTechTree} from '../src/ui/DefenseTechTree';
import {DefenseCombatFX,useDefenseCombatFX} from '../src/ui/DefenseCombatFX';
import {GuardBattleFields} from '../src/ui/GuardBattleAtmosphere';
import type {DefenseCombatShot,DefenseLevelId} from '../src/domain/defense';
const c=guardContents[3]!;
const hit=(id:string,resolved=true)=>({id,enemyId:'NORMAL' as const,distance:0,point:{x:500,y:450},damage:12,resolved});
const shot:DefenseCombatShot={id:'a',towerId:'CONTROL',levelId:'L4A',padId:'P1',phase:'IMPACT',origin:{x:110,y:200},targetPoint:{x:500,y:450},targets:[hit('one'),hit('two')]};
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers();});
describe('Guard planning audit and battle feel',()=>{
 it('warns about actual exit proximity along each individual route',()=>{
  const content=guardContents[4]!,run=createDefenseRun(content,'OBSERVER','exit');
  const length=defensePathLength(content.map.routes![1]!.path);
  const enemy={id:'risk',enemyId:'NORMAL' as const,hp:10,distance:length-100,routeId:'lower',spawnSequence:1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0};
  expect(guardExitPressure(content,{...run,status:'RUNNING',enemies:[enemy]})).toBe(1);
  expect(guardExitPressure(content,{...run,status:'RUNNING',enemies:[{...enemy,distance:0}]})).toBe(0);
  expect(guardExitPressure(content,{...run,enemies:[enemy]})).toBe(0);
 });
 it('deduplicates contacts and keeps launch frames out of actual clear counts',()=>{
  expect(guardContactSummary([shot,shot,{...shot,id:'launch',phase:'LAUNCH'}])).toMatchObject({hits:2,resolved:2,damage:24});
  const labels=guardDamageLabels(Array.from({length:24},(_,i)=>({...shot,id:String(i)})));expect(labels).toHaveLength(8);
 });
 it('does not replay a muzzle or traveling projectile on delayed impact, and uses actual secondary route contacts',()=>{
  const html=renderToStaticMarkup(<svg><DefenseCombatFX content={c} shots={[{...shot,targets:[hit('one'),{...hit('two'),point:{x:430,y:320}}]}]}/></svg>);
  expect(html).not.toContain('data-weapon-muzzle=');expect(html).not.toContain('data-weapon-flight=');
  expect(html).toContain('translate(500 450)');expect(html).toContain('translate(430 320)');expect(html).toContain('data-combat-phase="IMPACT"');
 });
 it('keeps effects bounded and expires old contacts during continuous fire',()=>{
  vi.useFakeTimers();
  let shots:readonly DefenseCombatShot[]=[shot];const state={...createDefenseRun(c,'COORDINATOR','fx'),status:'RUNNING' as const};
  function Probe(){const visible=useDefenseCombatFX(state,shots);return <output>{visible.map(s=>s.id).join(',')}</output>;}
  act(()=>root.render(<Probe/>));expect(host.textContent).toBe('a');
  act(()=>vi.advanceTimersByTime(300));shots=[{...shot,id:'b'}];act(()=>root.render(<Probe/>));
  act(()=>vi.advanceTimersByTime(400));expect(host.textContent).toBe('b');
  act(()=>vi.advanceTimersByTime(300));expect(host.textContent).toBe('');
 });
 it('requires an explicit confirm after a free evolution preview and distinguishes unavailable states',()=>{
  let run={...createDefenseRun(c,'COORDINATOR','tree'),resource:1000};run=applyDefenseCommand(run,c,{type:'Build',padId:'P1',towerId:'PULSE'});
  run=applyDefenseCommand(run,c,{type:'Upgrade',towerInstanceId:'tower-1',levelId:'L2'});
  const tower=run.towers[0]!,command=vi.fn(),definition=c.towers[0]!;
  act(()=>root.render(<DefenseTechTree content={c} tower={tower} resource={run.resource} advice={null} onCommand={command} ultimateAvailable/>));
  act(()=>host.querySelector<HTMLButtonElement>('[data-level="L3A"]')!.click());expect(command).not.toHaveBeenCalled();
  act(()=>host.querySelector<HTMLButtonElement>('.guard-evolution-confirm')!.click());
  expect(command).toHaveBeenCalledExactlyOnceWith({type:'Upgrade',towerInstanceId:tower.id,levelId:'L3A'});
  const final={...tower,levelId:'L4A' as const};
  expect(guardEvolutionState(definition,final,definition.levels[0]!,0,false)).toBe('completed');
  expect(guardEvolutionState(definition,tower,definition.levels.find(l=>l.id==='L3A')!,0,true)).toBe('resource');
  expect(guardEvolutionState(definition,tower,definition.levels.find(l=>l.id==='L4A')!,1000,false)).toBe('campaign-locked');
 });
 it('calibrates each final sprite and gives each final branch a distinct sound envelope',()=>{
  for(const family of c.towers){
   for(const level of ['L4A','L4B'] as const){expect(Object.keys(origins.origins)).toContain(family.id+'.'+level);const s={...shot,towerId:family.id,levelId:level},a=guardMuzzleOffset(s),b=guardMuzzleOffset(s,true);expect({x:-b.y,y:b.x}).toEqual(a);}
   expect(guardSoundEnvelope(family.id,'L4A')).not.toEqual(guardSoundEnvelope(family.id,'L4B'));
   expect(guardSoundEnvelope(family.id,'L4A')).not.toEqual(guardSoundEnvelope(family.id,'L1'));
  }
 });
 it('compares both final branches in five fixtures including measured control and reveal durations',()=>{
  const before=JSON.stringify(c);
  for(const family of c.towers)for(const fixture of ['MIXED','NORMAL','SWARM','ARMORED','VEILED'] as const){
   const rows=compareGuardBranches(c,family.id,fixture,'L4');
   expect(rows.map(r=>r.level)).toEqual(['L4A','L4B']);expect(rows.every(r=>r.resolved<=r.spawned&&r.slowEnemySeconds>=0&&r.revealedEnemySeconds>=0)).toBe(true);
  }
  expect(compareGuardBranches(c,'SENSOR','VEILED','L4').some(r=>r.revealedEnemySeconds>0)).toBe(true);
  expect(JSON.stringify(c)).toBe(before);
 });
 it('runs all 48 final-evolution and crew laboratory pairs with real commands, snapshots and pause invariance',()=>{
  const lab=guardLabContent(c),reports=[];
  for(const family of c.towers)for(const levelId of ['L4A','L4B'] as const)for(const support of c.scenario.availableSupports){
   let run=createDefenseRun(lab,support,'pair-'+family.id+'-'+levelId+'-'+support,{ultimateUnlocked:true});
   run=applyDefenseCommand(run,lab,{type:'Build',towerId:family.id,padId:'P1'});
   for(const level of ['L2',levelId==='L4A'?'L3A':'L3B',levelId] as DefenseLevelId[])run=applyDefenseCommand(run,lab,{type:'Upgrade',towerInstanceId:'tower-1',levelId:level});
   run=applyDefenseCommand(run,lab,{type:'StartWave'});run=advanceDefenseWithCombat(run,lab,20).state;
   try{run=applyDefenseCommand(run,lab,support==='COMMANDER'?{type:'RelocateTower',towerInstanceId:'tower-1',padId:'P2'}:support==='SIGNALER'?{type:'UseSupport',towerInstanceId:'tower-1',direction:{x:210,y:200}}:{type:'UseSupport'});}catch{/* A skill without an eligible target is correctly refused. */}
   const envelope=encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},lab,1);
   const restored=decodeDefenseSave(envelope)!.payload.activeRun!;
   expect(advanceDefenseWithCombat(restored,lab,200)).toEqual(advanceDefenseWithCombat(run,lab,200));
   const paused={...run,paused:true};expect(advanceDefenseWithCombat(paused,lab,100).state).toBe(paused);
   reports.push({family:family.id,levelId,support});
  }
  expect(reports).toHaveLength(48);
 });
 it('shows the active directional sector with the actual extended range',()=>{
  const base=createDefenseRun(c,'SIGNALER','fields');let run=applyDefenseCommand(base,c,{type:'Build',towerId:'PULSE',padId:'P1'});
  run=applyDefenseCommand({...run,status:'RUNNING'},c,{type:'UseSupport',towerInstanceId:'tower-1',direction:{x:210,y:200}});
  const html=renderToStaticMarkup(<svg><GuardBattleFields content={c} state={run}/></svg>);
  expect(html).toContain('data-guard-field="GUIDANCE"');expect(html).toContain('guard-guidance-cone');
 });
});
