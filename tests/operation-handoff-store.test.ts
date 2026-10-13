import {describe, expect, it} from 'vitest';
import {OPERATION_HANDOFF_KEY, readOperationHandoffs, saveOperationHandoff} from '../src/app/operation-handoff-store';
import {isOperationHandoff} from '../src/domain/operation-handoff-validation';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
const record: OperationHandoff = {version:1, characterId:'kang_taesik', stageId:'stage_01', stageNumber:1, outcome:'victory', zones:2, cartStops:3, rubbleCleared:1, damageTaken:2.5, stars:[true,false,true]};
function storage(initial = '[]') {
 let value = initial;
 return {getItem: (_key: string) => value, setItem: (_key: string, next: string) => {value = next;}};
}
describe('patrol handoff persistence boundary', () => {
 it('retains independent characters and stages while updating the same operation', () => {
  const store = storage();
  expect(saveOperationHandoff(record, store)).toBe(true);
  saveOperationHandoff({...record, characterId:'player'}, store);
  saveOperationHandoff({...record, stageId:'stage_02', stageNumber:2}, store);
  saveOperationHandoff({...record, outcome:'defeat', rubbleCleared:0}, store);
  const rows = readOperationHandoffs(store);
  expect(rows).toHaveLength(3);
  expect(rows.at(-1)?.outcome).toBe('defeat');
  expect(rows[0]?.characterId).toBe('player');
 });
 it('rejects unknown identities, mismatched stages and impossible counters', () => {
  for (const invalid of [{...record, characterId:'unknown'}, {...record, stageId:'unknown'}, {...record, stageNumber:2}, {...record, zones:-1}, {...record, cartStops:0.5}, {...record, damageTaken:Infinity}, {...record, stars:[true]}]) expect(isOperationHandoff(invalid)).toBe(false);
  expect(readOperationHandoffs(storage(JSON.stringify([record, {...record, characterId:'unknown'}])))).toEqual([record]);
 });
 it('preserves bounded recent history and handles unavailable or malformed storage', () => {
  const rows = Array.from({length:51}, (_,i) => ({...record, cartStops:i}));
  expect(readOperationHandoffs(storage(JSON.stringify(rows)))[0]?.cartStops).toBe(1);
  expect(readOperationHandoffs(storage('{broken'))).toEqual([]);
  expect(readOperationHandoffs(null)).toEqual([]);
  expect(saveOperationHandoff(record, null)).toBe(false);
  const denied = {getItem: () => {throw Error('denied');}, setItem: () => {throw Error('denied');}};
  expect(readOperationHandoffs(denied)).toEqual([]);
  expect(saveOperationHandoff(record, denied)).toBe(false);
  expect(OPERATION_HANDOFF_KEY).toBe('psi.survivors.operation-handoff.v1');
 });
});
