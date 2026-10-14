const {test}=require('node:test'),assert=require('node:assert/strict');
const journey=require('../src/player-journey.js'),{TalentTechManager}=require('../src/talent-tech-tree.js');
test('fresh account continues at first operation; EP01 completion leads to EP02, ten wins lead to EP03',()=>{
 const records={};assert.deepEqual(journey.progress(records).next,{id:'CH-01',episode:1,veteran:false,key:'CH-01'});
 for(let n=1;n<=5;n++)records['CH-0'+n]={won:true};assert.equal(journey.progress(records).next.veteran,true);
 records['V-CH-01']={won:true};assert.equal(journey.progress(records).next.id,'CH-02');
 for(let n=2;n<=5;n++)records['V-CH-0'+n]={won:true};assert.deepEqual(journey.progress(records),{completed:10,total:15,next:{id:'CH-01',episode:3,veteran:true,key:'E3-CH-01'},episodeOne:5,episodeTwo:5,episodeThree:0});
});
test('mastery requires reflected target hits and preserves earned goals across replays',()=>{
 const empty={bestChain:0,reflectedHits:0,bounces:999,usedWeapons:new Set(['pulse'])};assert.deepEqual(journey.mastery(empty),{chain:false,reflect:false,gear:false});
 const earned=journey.mastery({...empty,bestChain:4,reflectedHits:3,usedWeapons:new Set(['pulse','net'])});assert.deepEqual(journey.mastery(empty,earned),{chain:true,reflect:true,gear:true});
});
test('recovery prioritizes an unverified source then missing evolution and actionable boss advice',()=>{
 const g={config:{id:'CH-03'},source:{verified:false},veteran:true,evolution:{recipe:null},boss:{phase:'sealed'}};
 assert.equal(journey.recovery(g),'breaker.journey.recovery.source');g.source.verified=true;assert.equal(journey.recovery(g),'breaker.journey.recovery.evolution');g.evolution.recipe='storm';assert.equal(journey.recovery(g),'breaker.journey.recovery.nodes');g.boss.phase='exposed';assert.equal(journey.recovery(g),'breaker.journey.recovery.mist');
});
test('storage failure is observable, retry persists the same earned reward without duplication',()=>{
 let fail=true,saved=null;const mgr=new TalentTechManager({storage:{getItem:()=>null,setItem:(k,v)=>{if(fail)throw Error('quota');saved=v;}}});
 assert.equal(mgr.claimGuideReward(),true);assert.equal(mgr.lastSaveSucceeded,false);assert.equal(mgr.points,8);assert.equal(mgr.claimGuideReward(),false);
 fail=false;assert.equal(mgr.save(),true);assert.equal(mgr.lastSaveSucceeded,true);assert.equal(JSON.parse(saved).points,8);assert.equal(JSON.parse(saved).guideRewardClaimed,true);
});
