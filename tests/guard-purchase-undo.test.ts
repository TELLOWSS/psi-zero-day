import {expect,it} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {advanceDefense,applyDefenseCommand,canUndoDefenseBuild,createDefenseRun} from '../src/engine/defense';
import {decodeDefenseSave,emptyDefenseSaveDocument,encodeDefenseSave} from '../src/app/defense-save';

const content=guardContents[0]!;
const initial=()=>createDefenseRun(content,'COORDINATOR','undo-test');
const build=(state=initial(),padId='P1')=>applyDefenseCommand(state,content,{type:'Build',towerId:'PULSE',padId});
it('refunds the last purchase in full without rewinding the run or reusing tower IDs',()=>{
 const start=initial(),built=build(start),undone=applyDefenseCommand(built,content,{type:'UndoBuild'});
 expect(undone.resource).toBe(start.resource);
 expect(undone.towers).toEqual([]);
 expect(undone.tick).toBe(built.tick);
 expect(undone.shield).toBe(built.shield);
 expect(undone.nextTowerSequence).toBe(built.nextTowerSequence);
 expect(canUndoDefenseBuild(undone)).toBe(false);
 expect(()=>applyDefenseCommand(undone,content,{type:'UndoBuild'})).toThrow();
});
it('preserves an earlier purchase and refunds only the most recent tower',()=>{
 const first=build(),second=build(first,'P2'),undone=applyDefenseCommand(second,content,{type:'UndoBuild'});
 expect(undone.towers).toEqual(first.towers);
 expect(undone.resource).toBe(first.resource);
});
it('keeps purchase cancellation available across save and reload',()=>{
 const built=build();
 const saved=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:built},content,1))!.payload.activeRun!;
 expect(canUndoDefenseBuild(saved)).toBe(true);
 expect(applyDefenseCommand(saved,content,{type:'UndoBuild'}).resource).toBe(initial().resource);
});
it('rejects cancellation after a wave starts or combat advances',()=>{
 const running=applyDefenseCommand(build(),content,{type:'StartWave'});
 expect(canUndoDefenseBuild(running)).toBe(false);
 const purchased=build({...running,paused:true},'P2');
 expect(canUndoDefenseBuild(purchased)).toBe(true);
 const advanced=advanceDefense({...purchased,paused:false},content);
 expect(canUndoDefenseBuild(advanced)).toBe(false);
 expect(()=>applyDefenseCommand(advanced,content,{type:'UndoBuild'})).toThrow();
});
it('does not cancel upgraded or sold equipment, and accepts legacy runs',()=>{
 const built=build(),id=built.towers[0]!.id;
 const upgraded=applyDefenseCommand(built,content,{type:'Upgrade',towerInstanceId:id,levelId:'L2'});
 expect(canUndoDefenseBuild(upgraded)).toBe(false);
 expect(canUndoDefenseBuild(applyDefenseCommand(built,content,{type:'Sell',towerInstanceId:id}))).toBe(false);
 expect(canUndoDefenseBuild(initial())).toBe(false);
});
