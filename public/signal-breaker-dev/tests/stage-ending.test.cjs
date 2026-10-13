const {test}=require('node:test'),a=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js'),Ending=require('../src/stage-ending-content.js');
const winning=()=>{const g=new Game('CH-01',19,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true,causal:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];g.source={...g.source,observed:true,controlled:true,verified:true};g.boss.gatePhase=g.boss.maxGatePhases;for(const n of g.boss.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1});for(let i=0;i<g.boss.maxHp;i++)g.shotBoss({kind:'pulse',x:g.boss.x,y:g.boss.y,r:8,life:1});g.update(DT);a.equal(g.state,'won');return g;};
test('record requires engine victory, final boss, all residual signals and source verification',()=>{
 const g=winning();a.ok(Ending.valid(Ending.record(g,1)));
 for(const change of [x=>x.state='playing',x=>x.boss.phase='exposed',x=>x.source.verified=false,x=>x.cores.push({}),x=>x.pendingCores.push({}),x=>x.wave=3,x=>x.operation=false,x=>x.lab=true,x=>x.circuit.push({hit:false})]){const copy=winning();change(copy);a.equal(Ending.record(copy,1),null);}
});
test('ending memory is simulated evidence with no manufactured PSI scores or external sync',()=>{
 const g=winning(),before=g.snapshot(),r=Ending.record(g,2);a.deepEqual(g.snapshot(),before);a.equal(r.externalSync,false);a.equal(r.origin,'game');a.equal(r.measurementKind,'simulated');
 a.equal(r.indicators.educationUnderstanding,'unmeasured');a.equal(r.indicators.ppeCompliance,'unmeasured');a.equal(r.indicators.communicationReporting,'unmeasured');a.equal(r.indicators.stopWorkSensitivity,'unmeasured');a.equal(Ending.evidenceIds(r).length,3);
 a.equal(Ending.valid({...r,externalSync:true}),false);a.equal(Ending.evidenceIds({...r,origin:'site'}).length,0);
});
test('memory identity is stable within a run and replay cannot change reward state',()=>{
 const g=winning();const r=Ending.record(g,7);a.equal(Ending.record(g,7).id,r.id);a.notEqual(Ending.record(g,8).id,r.id);a.equal(Ending.definition('CH-06'),null);a.equal(Ending.definition('CH-01').shots.at(-1).until,13.5);
});
const campaignWin=id=>{const g=new Game(id,19,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];for(const n of g.circuit)n.hit=true;const b=g.boss;if(b.identity==='conveyor')b.segment=b.maxSegments;if(b.identity==='extraction')b.filterStage=b.maxFilterStages;if(b.identity==='tension')b.loadStage=b.maxLoadStages;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1});for(let i=0;i<b.maxHp;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1});g.update(DT);a.equal(g.state,'won');return g;};
for(const id of ['CH-02','CH-03','CH-04','CH-05'])test(id+' derives only terminal combat evidence without inventing source observation',()=>{
 const g=campaignWin(id),before=g.snapshot(),r=Ending.record(g,9);a.ok(Ending.valid(r));a.deepEqual(g.snapshot(),before);a.equal(r.evidence.sourceAssessment,'unmeasured');a.equal(r.evidence.observed,undefined);a.equal(r.externalSync,false);a.equal(Ending.evidenceIds(r).length,3);a.equal(r.evidence.intervention.count,0);
 for(const mutate of [g=>g.state='playing',g=>g.boss.identity='delivery',g=>g.boss.phase='exposed',g=>g.boss.nodes[0].hit=false,g=>g.cores.push({}),g=>g.pendingCores.push({}),g=>g.circuit.push({hit:false}),g=>g.wave=3,g=>g.operation=false,g=>g.lab=true]){const bad=campaignWin(id);mutate(bad);a.equal(Ending.record(bad,9),null);}
 if(id==='CH-02'){g.boss.segment=1;a.equal(Ending.record(g,9),null);}if(id==='CH-03'){g.boss.filterStage=1;a.equal(Ending.record(g,9),null);}if(id==='CH-04'){g.boss.loadStage=1;a.equal(Ending.record(g,9),null);}
 a.equal(Ending.valid({...r,stageId:'CH-01'}),false);a.equal(Ending.valid({...r,bossIdentity:'delivery'}),false);
});
test('finale recalls four authored worlds and ends at selection without CH06',()=>{
 const d=Ending.definition('CH-05');a.equal(d.nextStageId,null);a.equal(d.duration,22.5);a.equal(d.shots.filter(s=>s.id.startsWith('recall')).length,4);
 const fs=require('node:fs'),path=require('node:path');require('../src/localization-ko.js');
 for(const id of ['CH-01','CH-02','CH-03','CH-04','CH-05']){const d=Ending.definition(id);a.equal(d.duration,d.shots.at(-1).until);for(const shot of d.shots){a.ok(global.SignalBreakerText[shot.lineId]);a.ok(global.SignalBreakerText[shot.labelId]);}a.ok(fs.existsSync(path.join(__dirname,'..',d.image)));}
});
