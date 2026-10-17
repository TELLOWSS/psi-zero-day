import {describe,it,expect} from 'vitest';
import {isStoryEvidenceReceipt,mergeStoryEvidence,storyEvidenceForScene,storyEvidenceReaction,type StoryEvidenceReceipt} from '../src/domain/story-evidence';
import {persistStoryEvidence,readStoryEvidence,STORY_EVIDENCE_KEY} from '../src/app/story-evidence';
import {normalizeStoryReader,DEFAULT_STORY_READER} from '../src/app/story-reader-settings';
import {identityFrameWeights} from '../src/ui/survivors-identity-frame';
const receipt:StoryEvidenceReceipt={schemaVersion:1,sourceMode:'watch',sourceRecordId:'actual-handoff',incidentId:'ep01.ramp',observationIds:['route-cleared'],outcome:'verified-clear',contentVersion:'ep01.story-evidence.v1'};
describe('story evidence boundaries',()=>{
 it('deduplicates receipts without converting a combat win into a field fact',()=>{
  expect(mergeStoryEvidence([receipt],[receipt])).toEqual([receipt]);
  expect(storyEvidenceReaction(receipt,null)).toBe('story.evidence.watch.question');
  expect(storyEvidenceForScene('e01_04_junho_signal',[receipt])).toEqual([receipt]);
  expect(storyEvidenceForScene('e01_01_arrival',[receipt])).toEqual([]);
  expect(storyEvidenceReaction({...receipt,outcome:'incomplete'},null)).toBe('story.evidence.watch.incomplete');
 });
 it('rejects future, malformed and oversized records and retains a bounded ledger',()=>{
  for(const r of [null,{}, {...receipt,schemaVersion:2},{...receipt,contentVersion:'future'},{...receipt,sourceRecordId:''},{...receipt,sourceMode:'story'},{...receipt,observationIds:[null]}])expect(isStoryEvidenceReceipt(r)).toBe(false);
  expect(mergeStoryEvidence([],Array.from({length:70},(_,i)=>({...receipt,sourceRecordId:String(i)})))).toHaveLength(50);
 });
 it('survives corrupt/quota storage, retaining current receipts without pretending they were saved',()=>{
  const storage={getItem:()=>'{broken',setItem:()=>{throw Error('quota');}};
  expect(readStoryEvidence(storage)).toEqual([]);
  expect(persistStoryEvidence([receipt],storage)).toEqual({receipts:[receipt],saved:false});
  let raw='';const usable={getItem:()=>raw,setItem:(key:string,value:string)=>{expect(key).toBe(STORY_EVIDENCE_KEY);raw=value;}};
  expect(persistStoryEvidence([receipt,receipt],usable).saved).toBe(true);expect(readStoryEvidence(usable)).toEqual([receipt]);
 });
 it('clamps reader preferences and ignores invalid values',()=>{
  expect(normalizeStoryReader(null)).toEqual(DEFAULT_STORY_READER);
  expect(normalizeStoryReader({fontScale:9,music:-1,voice:NaN})).toMatchObject({fontScale:1.35,music:0,voice:1});
 });
 it('never composites two faces or marks during direction/action transitions',()=>{
  const input=[{direction:1,frame:3,weight:.49},{direction:2,frame:6,weight:.51}];
  expect(identityFrameWeights(input)).toEqual([{direction:2,frame:6,weight:1}]);
  expect(input[1]!.weight).toBe(.51);expect(identityFrameWeights([])).toEqual([]);
 });
});
