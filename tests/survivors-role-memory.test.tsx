import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
import {canonicalHandoffRole,roleHandoffSignal} from '../src/domain/survivors-role-memory';
import {SurvivorsRoleMemory} from '../src/ui/SurvivorsRoleMemory';
import {SurvivorsResultSummary} from '../src/ui/SurvivorsResultSummary';
import copy from '../content/localization/survivors-operation-brief-ko.json';

const base:OperationHandoff={version:1,characterId:'player',stageId:'stage_01',stageNumber:1,outcome:'victory',zones:2,cartStops:3,rubbleCleared:1,damageTaken:0,stars:[true,false,false]};

it('shows a character-specific optional focus for all six roles and maps only recorded counters',()=>{
 const cases=[
  ['player','zones',2],['kang_taesik','rubbleCleared',1],['yoon_sungho','rubbleCleared',1],
  ['lee_jaehoon','zones',2],['lim_junho','cartStops',3],['safety_monitor','zones',2]
 ] as const;
 for(const [characterId,metric,count] of cases){
  const record={...base,characterId};
  expect(roleHandoffSignal(record)).toMatchObject({roleId:characterId,metric,count,recorded:true});
  const html=renderToStaticMarkup(<SurvivorsRoleMemory handoff={record}/>);
  expect(html).toContain(copy.roles[characterId].metric);
  expect(html).toContain(copy.roles[characterId].observed);
  expect(copy.roles[characterId].focus.length).toBeGreaterThan(15);
 }
});

it('retains legacy role mapping and never treats a missing counter as completed activity',()=>{
 expect(canonicalHandoffRole('park')).toBe('kang_taesik');
 expect(canonicalHandoffRole('jung')).toBe('player');
 expect(canonicalHandoffRole('yoon')).toBe('player');
 const record={...base,characterId:'lim_junho' as const,outcome:'defeat' as const,cartStops:0};
 expect(roleHandoffSignal(record).recorded).toBe(false);
 const html=renderToStaticMarkup(<SurvivorsRoleMemory handoff={record}/>);
 expect(html).toContain(copy.roles.lim_junho.notRecorded);
 expect(html).toContain(copy.lost);
 expect(html).not.toContain(copy.roles.lim_junho.observed);
});

it('adds role debrief to the real result panel without changing credits, scores, or unrecorded rewards',()=>{
 const html=renderToStaticMarkup(<SurvivorsResultSummary credits={12} stats={[{label:'점수',value:'123'}]} handoff={base}/>);
 expect(html).toContain('+12');
 expect(html).toContain('123');
 expect(html).toContain(copy.roles.player.observed);
 const noRecord=renderToStaticMarkup(<SurvivorsResultSummary credits={12} stats={[]}/>);
 expect(noRecord).not.toContain(copy.memory_title);
});
