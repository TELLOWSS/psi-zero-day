import {describe,it,expect} from 'vitest';
import {handoffStoryEvidence,defenseStoryEvidence,persistStoryEvidence,readStoryEvidence,STORY_EVIDENCE_KEY,LEGACY_STORY_EVIDENCE_KEY} from '../src/app/story-evidence';
import {mergeStoryEvidence,storyEvidenceReaction,type StoryEvidenceReceipt} from '../src/domain/story-evidence';
import {saveOperationHandoff,readOperationHandoffs} from '../src/app/operation-handoff-store';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
import type {DefenseScenarioRecord} from '../src/domain/defense-save';
import {createDefenseRun,applyDefenseCommand,advanceDefense,defenseResult} from '../src/engine/defense';
import {guardContents} from '../src/content/guard-campaign';
import {applyDefenseOutcome,emptyDefenseSaveDocument,encodeDefenseSave,decodeDefenseSave} from '../src/app/defense-save';
import {guardFailureReview,guardTacticalReport} from '../src/app/guard-tactical-report';

const handoff:OperationHandoff={version:1,characterId:'yoon',stageId:'stage_40',stageNumber:40,outcome:'victory',zones:4,cartStops:1,rubbleCleared:2,damageTaken:0,stars:[true,true,true]};
const record:DefenseScenarioRecord={scenarioId:'guard-gd-03-v1',lastResultRunId:'latest-loss',updatedAt:'2026-10-19T01:00:00.000Z',finishedRuns:2,clears:1,bestStars:3,bestScore:500,bestShield:20,bestCompletedWaves:8,lastResultWon:false};
describe('player review record provenance',()=>{
 it('does not turn a previous clear into the latest run result',()=>{
  const r=defenseStoryEvidence(record)!;
  expect(r).toMatchObject({outcome:'incomplete',sourceRunId:'latest-loss',sourceAreaId:'guard-gd-03-v1',incidentId:'training.general'});
  const {lastResultWon,...old}=record;
  expect(defenseStoryEvidence(old)?.outcome).toBe('unknown');
  expect(defenseStoryEvidence({...record,updatedAt:'2026-10-15'})?.observedAt).toBeNull();
 });
 it('keeps an unrelated worksite and undated legacy handoff distinct from an Episode 01 field fact',()=>{
  const r=handoffStoryEvidence(handoff);
  expect(r).toMatchObject({incidentId:'training.general',sourceAreaId:'stage_40',sourceRunId:null,observedAt:null});
  expect(storyEvidenceReaction(r,null)).toBe('story.evidence.general');
  const ramp=defenseStoryEvidence({...record,scenarioId:'training-ramp-v1',lastResultWon:true})!;
  expect(ramp.incidentId).toBe('ep01.ramp');
  expect(storyEvidenceReaction(ramp,null)).toBe('story.evidence.guard.question');
 });
 it('retains legacy history without assigning a source, date or incident',()=>{
  const old:StoryEvidenceReceipt={schemaVersion:1,contentVersion:'ep01.story-evidence.v1',sourceMode:'guard',sourceRecordId:'old',incidentId:'ep01.ramp',outcome:'observed',observationIds:[]};
  const merged=mergeStoryEvidence([old],[old]);expect(merged).toHaveLength(1);
  expect(merged[0]).toMatchObject({sourceKind:'legacy',sourceRunId:null,observedAt:null,incidentId:'training.general'});
  const raw=JSON.stringify([old]),data=new Map([[LEGACY_STORY_EVIDENCE_KEY,raw]]);
  const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  expect(persistStoryEvidence([],storage).saved).toBe(true);
  expect(data.get(LEGACY_STORY_EVIDENCE_KEY)).toBe(raw);
  expect(JSON.parse(data.get(STORY_EVIDENCE_KEY)!)[0].schemaVersion).toBe(2);
 });
 it('selects chronologically and merges repeated or reordered imports deterministically',()=>{
  const first=defenseStoryEvidence({...record,lastResultRunId:'z-old',updatedAt:'2026-10-18T01:00:00Z'})!;
  const next=defenseStoryEvidence({...record,lastResultRunId:'a-new'})!;
  expect(mergeStoryEvidence([first],[next,first])).toEqual(mergeStoryEvidence([next],[first,next]));
  expect(mergeStoryEvidence([next],[first]).at(-1)?.sourceRunId).toBe('a-new');
 });
 it('stamps only a newly saved handoff and does not manufacture metadata on read',()=>{
  let raw=JSON.stringify([handoff]);const storage={getItem:()=>raw,setItem:(_k:string,v:string)=>{raw=v;}};
  expect(readOperationHandoffs(storage)[0]?.observedAt).toBeUndefined();
  expect(saveOperationHandoff(handoff,storage)).toBe(true);
  const saved=readOperationHandoffs(storage)[0]!;expect(saved.runId).toBeTruthy();expect(Date.parse(saved.observedAt!)).toBeGreaterThan(0);
  expect(handoff.runId).toBeUndefined();
 });
 it('keeps current receipts playable under corrupt or denied storage',()=>{
  const receipt=defenseStoryEvidence(record)!;
  const storage={getItem:()=>'{',setItem:()=>{throw Error('quota');}};
  expect(readStoryEvidence(storage)).toEqual([]);
  expect(persistStoryEvidence([receipt],storage)).toEqual({receipts:[receipt],saved:false});
 });
});

describe('player review leak feedback',()=>{
 it('shows the latest swift targeting observation supporting its advice even after an unrelated leak',()=>{
  const c=guardContents[2]!,run={...createDefenseRun(c,'COORDINATOR','mixed-leaks'),status:'LOST' as const};
  const report=guardTacticalReport(c,run)!;
  const swift={enemyId:'SWIFT' as const,routeId:'main',waveId:2,tick:100,point:{x:900,y:200},targetsAtLeak:[{padId:'P1',targetMode:'STRONG' as const}]};
  const latestSwift={...swift,tick:110,targetsAtLeak:[{padId:'P2',targetMode:'STRONG' as const}]};
  const other={...swift,enemyId:'NORMAL' as const,tick:120,targetsAtLeak:[]};
  const proof={...report,stats:{...report.stats,routeLeaks:[swift,latestSwift,other]}};
  const review=guardFailureReview(proof);
  expect(review.adviceId).toBe('guard.review.advice.targetSwift');
  expect(review.targetEvidence).toEqual(latestSwift);
  expect(proof.stats.routeLeaks).toEqual([swift,latestSwift,other]);
  expect(review.sampleCount).toBe(3);
 });
 it('records the actual target policy at a leak, preserves it after a later change and roundtrips it',()=>{
  const c=guardContents[2]!;let run=createDefenseRun(c,'COORDINATOR','target-proof');
  run=applyDefenseCommand(run,c,{type:'Build',towerId:'PULSE',padId:'P1'});
  run=applyDefenseCommand(run,c,{type:'SetTargetMode',towerInstanceId:run.towers[0]!.id,targetMode:'STRONG'});
  run=applyDefenseCommand(run,c,{type:'StartWave'});
  // A single test enemy at the exit; all movement/leak accounting uses the real engine.
  run={...run,enemies:[{id:'exit-fast',enemyId:'SWIFT',hp:999,distance:99999,spawnSequence:0,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0}]};
  run=advanceDefense(run,c);
  const leak=run.tacticalStats?.routeLeaks?.find(e=>e.enemyId==='SWIFT');
  expect(leak?.targetsAtLeak).toEqual([{padId:'P1',targetMode:'STRONG'}]);
  run=applyDefenseCommand(run,c,{type:'SetTargetMode',towerInstanceId:run.towers[0]!.id,targetMode:'FIRST'});
  run={...run,status:'LOST',shield:0};const report=guardTacticalReport(c,run)!;
  expect(guardFailureReview(report).adviceId).toBe('guard.review.advice.targetSwift');
  expect(report.stats.routeLeaks?.[0]?.targetsAtLeak?.[0]?.targetMode).toBe('STRONG');
  const doc=applyDefenseOutcome(emptyDefenseSaveDocument(),c,run,defenseResult(run),'2026-10-19T01:00:00Z').document;
  const restored=decodeDefenseSave(encodeDefenseSave(doc,c,1))!.payload;
  expect(restored.records[0]?.lastResultWon).toBe(false);
  expect(restored.records[0]?.lastTacticalReport).toEqual(report);
  expect(applyDefenseOutcome(restored,c,run,defenseResult(run)).applied).toBe(false);
 });
 it('never reconstructs targeting from the final loadout of an old report',()=>{
  const c=guardContents[2]!,run={...createDefenseRun(c,'COORDINATOR','old'),status:'LOST' as const};
  const report=guardTacticalReport(c,run)!;
  expect(guardFailureReview(report).targetEvidence).toBeUndefined();
  expect(guardFailureReview(report).adviceId).toBe('guard.review.advice.changeOne');
 });
});
