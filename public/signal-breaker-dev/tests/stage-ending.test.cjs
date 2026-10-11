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
 const g=winning();const r=Ending.record(g,7);a.equal(Ending.record(g,7).id,r.id);a.notEqual(Ending.record(g,8).id,r.id);a.equal(Ending.definition('CH-02'),null);a.equal(Ending.definition('CH-01').shots.at(-1).until,12);
});
