// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {SurvivorsHandoffResult} from '../src/ui/SurvivorsHandoffResult';
import {OPERATION_HANDOFF_KEY} from '../src/app/operation-handoff-store';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
const record:OperationHandoff={version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:2,cartStops:1,rubbleCleared:3,damageTaken:0,stars:[true,true,false]};
afterEach(()=>{vi.restoreAllMocks();localStorage.clear();});
const render=(row:OperationHandoff|null)=>renderToStaticMarkup(<SurvivorsHandoffResult record={row}/>);
describe('approved result handoff boundary',()=>{
 it('renders the approved scene without writing or mutating progress',()=>{
  localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([record]));
  const before=JSON.stringify(record),write=vi.spyOn(Storage.prototype,'setItem');
  expect(render(record)).toContain('player-stage12-handoff-v1.png');
  expect(write).not.toHaveBeenCalled();expect(JSON.stringify(record)).toBe(before);
 });
 it('hides missing, stale and inaccessible persisted evidence',()=>{
  expect(render(record)).toBe('');
  localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([{...record,damageTaken:1}]));
  expect(render(record)).toBe('');
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('unavailable');});
  expect(render(record)).toBe('');
 });
 it('does not attribute another actor or interrupted run to the approved scene',()=>{
  localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([record]));
  for(const row of [null,{...record,characterId:'lim_junho' as const},{...record,outcome:'defeat' as const},{...record,rubbleCleared:0}])expect(render(row)).toBe('');
 });
});
