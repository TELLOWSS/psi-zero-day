import {describe,it,expect} from 'vitest';
import {readEndgameHomeStatus} from '../src/app/endgame-home';
import {encodeDefenseSave,emptyDefenseSaveDocument} from '../src/app/defense-save';
import {guardPersistenceContent} from '../src/app/guard-save-version';
import {guardStageIds} from '../src/content/guard-campaign';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
const storage=(data:Record<string,string>)=>({getItem:(key:string)=>data[key]??null});
describe('Read-only endgame home',()=>{
 it('shows no false progress for guests, unreadable storage and corrupted saves',()=>{
  expect(readEndgameHomeStatus().watchClears).toBe(0);
  expect(readEndgameHomeStatus({getItem:()=>{throw Error('blocked');}}).guardClears).toBe(0);
  const bad=readEndgameHomeStatus(storage({'psi-zero-day.guard.save.v2':'{"payload":{}}','psi.survivors.stage_stars':'bad'}));
  expect(bad.veteran).toBe(false);expect(bad.guardClears).toBe(0);expect(bad.watchClears).toBe(0);
 });
 it('recognizes completed Guard saves and excludes normal stars from mastery',()=>{
  const now='2026-11-07T00:00:00.000Z';
  const records=guardStageIds.map(id=>({scenarioId:id,finishedRuns:1,clears:1,bestStars:3 as const,bestMasteryStars:0 as const,bestScore:100,bestShield:1,bestCompletedWaves:6,lastResultRunId:null,updatedAt:now}));
  const save=encodeDefenseSave({...emptyDefenseSaveDocument(),records},guardPersistenceContent,1);
  const result=readEndgameHomeStatus(storage({'psi-zero-day.guard.save.v2':save}));
  expect(result.guardUnlocked).toBe(true);expect(result.guardClears).toBe(6);expect(result.guardMastered).toBe(0);
 });
 it('counts watch stage completion using actual stars, growth and wallet claims',()=>{
  const stars=Object.fromEntries(PATROL_STAGE_IDS.slice(0,48).map(id=>[id,[true,false,false]]));
  const wallet={clearRewardClaims:['stage_49','stage_50'],difficultyClearRecords:{stage_01:{mastery:3},stage_02:{mastery:2}}};
  const r=readEndgameHomeStatus(storage({'psi.survivors.stage_stars':JSON.stringify(stars),'psi.survivors.store_wallet':JSON.stringify(wallet),'psi.survivors.last_played_stage':'stage_50'}));
  expect(r.watchClears).toBe(50);expect(r.veteran).toBe(true);expect(r.watchUnlocked).toBe(true);expect(r.watchMastered).toBe(1);expect(r.lastStageNumber).toBe(50);
 });
});
