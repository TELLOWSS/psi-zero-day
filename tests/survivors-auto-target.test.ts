import {expect,it} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {selectSurvivorsAutoTarget} from '../src/engine/survivors-auto-target';
import {createBossCombat} from '../src/engine/survivors-boss-combat';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
const hazard=(x:number):Hazard=>({id:String(x),type:'CRANE_BOSS',x,y:0,hp:100,maxHp:100,speed:0,radius:20,damage:1,expValue:1});
const boss=(x:number,phase:'weak_point'|'burst'|'pattern'|'recovery'|'arrival'|'secured')=>{
 const h=hazard(x);h.isStageBoss=true;h.bossGameplay=createBossCombat(bossGameplayForStage('stage_01'));h.bossGameplay.combatPhase=phase;return h;
};
it('prioritizes exposed weak points then burst bosses over nearer ordinary threats',()=>{
 const normal=hazard(10),weak=boss(200,'weak_point'),burst=boss(100,'burst');
 expect(selectSurvivorsAutoTarget([normal,burst,weak],0,0,260)).toBe(weak);
 expect(selectSurvivorsAutoTarget([normal,burst],0,0,260)).toBe(burst);
});
it('never extends range, targets locked bosses or picks dead/spent threats',()=>{
 const normal=hazard(40);
 for(const phase of ['arrival','pattern','recovery','secured'] as const)expect(selectSurvivorsAutoTarget([boss(5,phase),normal],0,0,260)).toBe(normal);
 expect(selectSurvivorsAutoTarget([boss(260,'weak_point'),normal],0,0,260)).toBe(normal);
 normal.hp=0;expect(selectSurvivorsAutoTarget([normal],0,0,260)).toBeNull();
});
it('preserves nearest selection, stable ties and legacy boss behavior without mutating state',()=>{
 const far=hazard(50),near=hazard(20),legacy=hazard(10);legacy.isStageBoss=true;
 const list=[far,near,legacy],before=JSON.stringify(list);
 expect(selectSurvivorsAutoTarget(list,0,0,260)).toBe(legacy);
 expect(selectSurvivorsAutoTarget([near,{...near,id:'tie'}],0,0,260)).toBe(near);
 expect(JSON.stringify(list)).toBe(before);
});
