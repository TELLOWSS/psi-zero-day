import raw from '../../content/defense/guard-campaign-v1.json';
import {validateDefenseContent} from './defense';
import type {DefenseSaveDocument,DefenseSupportId} from '../domain';
export const GUARD_ENTRY='guard-campaign';
export const guardContents=raw.contents.map(validateDefenseContent);
export const guardFoundationContents=guardContents.slice(0,3);
export const guardStageIds=guardContents.map(c=>c.scenario.id);
export const isGuardMap=(id:string|undefined|null)=>!!id?.startsWith('guard-gd-');
export const isGuardScenario=(id:string|undefined|null)=>guardStageIds.includes(id??'');
export function guardStageUnlocked(id:string,document:DefenseSaveDocument){
 const index=guardStageIds.indexOf(id);return index===0||(index>0&&document.records.some(r=>r.scenarioId===guardStageIds[index-1]&&r.clears>0));
}
export function guardSupportUnlocked(id:DefenseSupportId,document:DefenseSaveDocument){
 if(id==='COORDINATOR'||id==='OBSERVER')return true;
 const stage=guardSupportUnlockStage(id);
 return !!stage&&document.records.some(r=>r.scenarioId===stage&&r.clears>0);
}
export function guardSupportUnlockStage(id:DefenseSupportId){
 return id==='REBAR_LEAD'?guardStageIds[0]:id==='ENGINEER'?guardStageIds[1]:id==='COMMANDER'?guardStageIds[2]:id==='SIGNALER'?guardStageIds[3]:undefined;
}
