// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {PINBALL_RECORD_KEY,readPinballBest,savePinballBest} from '../src/app/survivors-pinball-record';
afterEach(()=>{vi.restoreAllMocks();localStorage.clear();});
describe('optional offline pinball personal record',()=>{
 it('keeps practice records separate and never writes the reward wallet',()=>{
  savePinballBest({score:500,combo:3});savePinballBest({score:9000,combo:12},'practice');
  expect(readPinballBest()).toEqual({score:500,combo:3});expect(readPinballBest('practice')).toEqual({score:9000,combo:12});expect(localStorage.getItem('psi.survivors.store_wallet')).toBeNull();
 });
 it('keeps highest score and combo across sessions without awarding credits',()=>{
  savePinballBest({score:1000,combo:5});savePinballBest({score:200,combo:8});
  expect(readPinballBest()).toEqual({score:1000,combo:8});expect(localStorage.getItem('psi.survivors.credits')).toBeNull();
 });
 it('rejects corrupt values and tolerates unavailable storage',()=>{
  localStorage.setItem(PINBALL_RECORD_KEY,'{"version":1,"score":-1,"combo":2}');expect(readPinballBest().score).toBe(0);
  expect(savePinballBest({score:NaN,combo:2})).toEqual({score:0,combo:0});
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('unavailable');});
  expect(()=>savePinballBest({score:500,combo:3})).not.toThrow();
 });
});

it('separates records for rule variants while preserving legacy classic records',()=>{
 savePinballBest({score:200,combo:2});savePinballBest({score:900,combo:8},'bonus','rush');
 expect(readPinballBest()).toEqual({score:200,combo:2});expect(readPinballBest('bonus','rush')).toEqual({score:900,combo:8});
});
