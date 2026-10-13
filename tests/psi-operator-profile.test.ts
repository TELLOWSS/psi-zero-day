import {describe,it,expect} from 'vitest';
import {createOperatorProfile,migrateOperatorSave,validOperatorProfile,operatorProgress,snapshotOperatorProfile,settleOperatorRun,type OperatorRunReceipt} from '../src/domain/psi-operator-profile';
const receipt = (overrides: Partial<OperatorRunReceipt> = {}): OperatorRunReceipt => ({
  runId: 'run:1', stageId: 'CH-01', episode: 1, outcome: 'won',
  completedFieldIds: ['field:1','field:2','field:3','field:4','field:5'],
  verifiedEvidenceIds: ['incident:delivery:field:1:source','incident:delivery:field:2:chain'],
  newResearchObjectiveIds: ['recipe:prism:goal:1'], ...overrides,
});
describe('PSI operator profile save contract',()=>{
 it('migrates without rewriting records, credits, inventory, settings or checkpoint',()=>{
  const old={version:1,credits:300,records:{'CH-05':{won:true}},workshop:{owned:['catalyst']},checkpoint:{seed:7},settings:{sound:false},futureField:'keep'};
  const r=migrateOperatorSave(old);expect(r.ok).toBe(true);if(!r.ok)return;
  expect(r.save).toEqual({...old,operatorProfile:createOperatorProfile()});expect(r.save.records).toBe(old.records);expect(old).not.toHaveProperty('operatorProfile');
 });
 it('does not fabricate past mastery or XP from a legacy win',()=>{
  const r=migrateOperatorSave({records:{'V-CH-05':{won:true,signalChain:true}}});if(!r.ok)throw Error('migration');
  expect(r.save.operatorProfile.xp).toBe(0);expect(r.save.operatorProfile.confirmedEvidence).toEqual([]);
 });
 it('rejects corrupt or future profiles without replacing them',()=>{
  for(const profile of [{version:2},{...createOperatorProfile(),xp:-1},{...createOperatorProfile(),revision:1.5},{...createOperatorProfile(),settledRuns:['x','x']}])
   expect(migrateOperatorSave({operatorProfile:profile})).toEqual({ok:false,error:'invalid-profile'});
 });
 it('retains a valid profile and separates mutable arrays from the snapshot',()=>{
  const p=createOperatorProfile();p.confirmedEvidence=['source:1'];const r=migrateOperatorSave({operatorProfile:p});if(!r.ok)throw Error('migration');
  expect(r.migrated).toBe(false);r.save.operatorProfile.confirmedEvidence.push('source:2');expect(p.confirmedEvidence).toEqual(['source:1']);
 });
 it.each([[0,1,0],[119,1,0],[120,2,1],[259,2,1],[260,3,1],[5700,20,10],[10000,20,10]])('maps XP %i to level %i and points %i',(xp,level,points)=>{
  const result=operatorProgress(xp);expect(result.level).toBe(level);expect(result.earnedAbilityPoints).toBe(points);
 });
 it('uses the planned 170 XP example and preserves its input',()=>{
  const p=createOperatorProfile(),before=JSON.stringify(p),r=settleOperatorRun(p,receipt(),0);expect(JSON.stringify(p)).toBe(before);
  expect(r.ok).toBe(true);if(!r.ok)return;expect(r.awardedXp).toBe(170);expect(r.profile.revision).toBe(1);expect(operatorProgress(r.profile.xp).currentXp).toBe(50);
 });
 it('makes the same completion idempotent across reload and character changes',()=>{
  const r=settleOperatorRun(createOperatorProfile(),receipt(),0);if(!r.ok)throw Error('settle');
  const second=settleOperatorRun(JSON.parse(JSON.stringify(r.profile)),receipt(),1);
  expect(second).toEqual({ok:true,profile:r.profile,awardedXp:0,duplicate:true});
 });
 it('requires the current revision instead of overwriting a newer tab',()=>{
  const p=createOperatorProfile();expect(settleOperatorRun(p,receipt(),1)).toEqual({ok:false,error:'revision-conflict'});
 });
 it('uses stable evidence ids across retries and caps beginner repeat XP at 30',()=>{
  const first=settleOperatorRun(createOperatorProfile(),receipt(),0);if(!first.ok)throw Error('settle');
  const repeat=settleOperatorRun(first.profile,receipt({runId:'run:2'}),1);if(!repeat.ok)throw Error('settle');
  expect(repeat.awardedXp).toBe(30);expect(repeat.profile.confirmedEvidence).toEqual(first.profile.confirmedEvidence);
 });
 it('keeps veteran field XP separate and grants first completion by episode',()=>{
  const first=settleOperatorRun(createOperatorProfile(),receipt(),0);if(!first.ok)throw Error('settle');
  const veteran=settleOperatorRun(first.profile,receipt({runId:'run:v:1',episode:2}),1);if(!veteran.ok)throw Error('settle');
  expect(veteran.awardedXp).toBe(110);expect(veteran.profile.clearedStages).toEqual(['EP01:CH-01','EP02:CH-01']);
 });
 it('awards completed fields on defeat without a victory bonus or extra penalty',()=>{
  const r=settleOperatorRun(createOperatorProfile(),receipt({outcome:'lost',completedFieldIds:['field:1'],verifiedEvidenceIds:[],newResearchObjectiveIds:[]}),0);
  if(!r.ok)throw Error('settle');expect(r.awardedXp).toBe(10);expect(r.profile.clearedStages).toEqual([]);
 });
 it('limits novel confirmed records to three per receipt without marking excess records rewarded',()=>{
  const r=settleOperatorRun(createOperatorProfile(),receipt({verifiedEvidenceIds:['a','b','c','d']}),0);if(!r.ok)throw Error('settle');
  expect(r.awardedXp).toBe(190);expect(r.profile.confirmedEvidence).toEqual(['a','b','c']);
 });
 it('rejects duplicated fields, malformed IDs and more than five fields',()=>{
  for(const r of [receipt({completedFieldIds:['a','a']}),receipt({runId:''}),receipt({completedFieldIds:['a','b','c','d','e','f']}),receipt({stageId:'CH-99'})])
   expect(settleOperatorRun(createOperatorProfile(),r,0)).toEqual({ok:false,error:'invalid-receipt'});
 });
 it('does not alter the running snapshot when another settlement arrives',()=>{
  const p=createOperatorProfile(),snapshot=snapshotOperatorProfile(p),r=settleOperatorRun(p,receipt(),0);
  expect(r.ok).toBe(true);expect(snapshot).toEqual(createOperatorProfile());expect(validOperatorProfile(snapshot)).toBe(true);
 });
});
