import {it,expect} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {zeroBreachContent,validateDefenseContent} from '../src/content/defense';
import {createDefenseRun,applyDefenseCommand,advanceDefense,advanceDefenseWithCombat} from '../src/engine/defense';
import {guardPreparationCheck} from '../src/app/guard-preparation-check';
import {encodeDefenseSave,decodeDefenseSave,emptyDefenseSaveDocument} from '../src/app/defense-save';
import type {DefenseRunState,DefenseTargetMode} from '../src/domain/defense';
const c=guardContents[5]!;
function combat(mode:DefenseTargetMode):DefenseRunState{
 let state=createDefenseRun(c,'COORDINATOR','threat');
 state=applyDefenseCommand(state,c,{type:'Build',towerId:'PULSE',padId:'P2'});
 state=applyDefenseCommand(state,c,{type:'Build',towerId:'SENSOR',padId:'P3'});
 state=applyDefenseCommand(state,c,{type:'SetTargetMode',towerInstanceId:state.towers[0]!.id,targetMode:mode});
 state=applyDefenseCommand(state,c,{type:'StartWave'});state=advanceDefense(state,c);
 const template=state.enemies[0]!,sensor=state.towers[1]!;
 return {...state,towers:state.towers.map(t=>({...t,attackCooldown:0,revealCooldown:999})),spawnedByGroup:c.waves[0]!.groups.map(g=>g.count),enemies:[
  {...template,id:'normal',enemyId:'NORMAL',distance:200,hp:500,sensorPressure:undefined},
  {...template,id:'boss',enemyId:'BOSS',distance:160,hp:1000,sensorPressure:undefined},
  {...template,id:'core',distance:120,hp:600,sensorPressure:{phase:'WARNING',remainingTicks:70,targetTowerId:sensor.id,targetPadId:sensor.padId}}
 ]};
}
it('changes actual primary fire through a manual mode choice without changing damage, funds or defaults',()=>{
 const frames=(['FIRST','STRONG','THREAT'] as const).map(mode=>advanceDefenseWithCombat(combat(mode),c));
 expect(frames.map(f=>f.shots.find(s=>s.towerId==='PULSE')!.targets[0]!.id)).toEqual(['normal','boss','core']);
 expect(frames.map(f=>f.state.resource)).toEqual((['FIRST','STRONG','THREAT'] as const).map(mode=>combat(mode).resource));
 expect(createDefenseRun(c,'COORDINATOR','default').towers).toEqual([]);
 expect(c.defaultTargetMode).toBe('FIRST');
});
it('does not acquire hidden or out-of-range threats and falls back to a visible legal target',()=>{
 let state=combat('THREAT');const core=state.enemies[2]!,boss=state.enemies[1]!;
 state={...state,enemies:[state.enemies[0]!,{...boss,enemyId:'VEILED',revealUntilTick:0},{...core,distance:1400}]};
 const frame=advanceDefenseWithCombat(state,c);
 expect(frame.shots.find(s=>s.towerId==='PULSE')!.targets[0]!.id).toBe('normal');
});
it('keeps L4 follow-up targeting and an in-flight save consistent with the chosen threat mode',()=>{
 const fixture=combat('THREAT');
 const state={...fixture,towers:fixture.towers.map(t=>t.towerId==='PULSE'?{...t,levelId:'L4A' as const,charge:3}:t)};
 const frame=advanceDefenseWithCombat(state,c);
 expect(frame.shots.find(s=>s.towerId==='PULSE')!.targets[0]!.id).toBe('core');
 expect(frame.state.pendingAttacks).toHaveLength(2);
 expect(frame.state.pendingAttacks!.every(a=>a.targetMode==='THREAT')).toBe(true);
 const restored=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:frame.state},c,1))!.payload.activeRun!;
 expect(restored).toEqual(frame.state);
 const repeat=advanceDefenseWithCombat(restored,c,3);
 expect(repeat.shots.find(s=>s.phase==='IMPACT')!.targets[0]!.id).toBe('core');
});
it('round-trips a manually selected target mode, rejects it outside Guard and keeps earlier saves valid',()=>{
 let state=createDefenseRun(c,'COORDINATOR','save');
 state=applyDefenseCommand(state,c,{type:'Build',towerId:'PULSE',padId:'P2'});
 const old=encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:state},c,1);
 expect(decodeDefenseSave(old)!.payload.activeRun!.towers[0]!.targetMode).toBe('FIRST');
 state=applyDefenseCommand(state,c,{type:'SetTargetMode',towerInstanceId:state.towers[0]!.id,targetMode:'THREAT'});
 expect(decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:state},c,2))!.payload.activeRun).toEqual(state);
 let training=createDefenseRun(zeroBreachContent,'COORDINATOR','training');
 training=applyDefenseCommand(training,zeroBreachContent,{type:'Build',towerId:'PULSE',padId:zeroBreachContent.map.pads[0]!.id});
 expect(()=>applyDefenseCommand(training,zeroBreachContent,{type:'SetTargetMode',towerInstanceId:training.towers[0]!.id,targetMode:'THREAT'})).toThrow();
 expect(()=>validateDefenseContent({...zeroBreachContent,targetModes:['FIRST','STRONG','THREAT']})).toThrow();
});
it('measures the union of actual installed coverage and reports hidden-route gaps without mutating the run',()=>{
 let state=createDefenseRun(c,'COORDINATOR','ready');const wave=c.waves.find(w=>w.groups.some(g=>g.enemy==='VEILED'))!;
 expect(guardPreparationCheck(c,state,wave)[0]).toMatchObject({hidden:true,attackPercent:0,revealPercent:0});
 state=applyDefenseCommand(state,c,{type:'Build',towerId:'SENSOR',padId:'P2'});
 const before=JSON.stringify(state),one=guardPreparationCheck(c,state,wave)[0]!;
 expect(one.attackPercent).toBeGreaterThan(0);expect(one.revealPercent).toBeGreaterThan(0);expect(one.revealPercent).toBeLessThan(100);
 expect(JSON.stringify(state)).toBe(before);
 expect(guardPreparationCheck(c,{...state,towers:[state.towers[0]!,{...state.towers[0]!,id:'duplicate-test-only'}]},wave)[0]).toEqual(one);
});
it('previews shifted routes for W5 and evaluates both GD05 entries separately',()=>{
 const before=createDefenseRun(c,'COORDINATOR','shift'),wave=c.waves[4]!;
 const built=applyDefenseCommand(before,c,{type:'Build',towerId:'PULSE',padId:'P2'});
 expect(guardPreparationCheck(c,built,wave)).toEqual(guardPreparationCheck(c,{...built,mapPhase:'SHIFTED'},wave));
 const split=guardContents[4]!,rows=guardPreparationCheck(split,createDefenseRun(split,'COORDINATOR','split'),split.waves[0]!);
 expect(rows.map(r=>r.routeId)).toEqual(['upper','lower']);
});
