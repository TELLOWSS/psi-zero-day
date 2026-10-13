import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {isOperationHandoff} from '../domain/operation-handoff-validation';
import type {StrategyAction} from './strategy-actions';
import type {DefenseContent,DefenseRunState} from '../domain/defense';

function useful(record:OperationHandoff) {
  return isOperationHandoff(record)&&(record.rubbleCleared>0||record.cartStops>0||record.zones>0);
}
export function handoffStoryAction(record:OperationHandoff,actions:readonly StrategyAction[]) {
  if(!useful(record))return null;
  return actions.find(a=>a.enabled&&a.intent==='inspect'&&(
    ((record.rubbleCleared>0||record.cartStops>0)&&a.target.kind==='anchor'&&['entry','ramp','gate'].includes(a.target.anchor))
    ||(record.zones>0&&a.target.kind==='site')) )??null;
}
export function handoffDefenseBuild(record:OperationHandoff,content:DefenseContent,state:DefenseRunState) {
  if(!useful(record)||!['READY','INTERMISSION'].includes(state.status)||state.scenarioId!==content.scenario.id)return null;
  const towerId:'CONTROL'|'SENSOR'=record.rubbleCleared>0||record.cartStops>0?'CONTROL':'SENSOR';
  if(content.scenario.availableTowers&&!content.scenario.availableTowers.includes(towerId))return null;
  if(state.towers.some(t=>t.towerId===towerId))return null;
  const level=content.towers.find(t=>t.id===towerId)?.levels.find(l=>l.id==='L1');
  const pad=content.map.pads.find(p=>!state.towers.some(t=>t.padId===p.id));
  return level&&pad?{command:{type:'Build' as const,padId:pad.id,towerId},cost:level.cost,affordable:state.resource>=level.cost}:null;
}
