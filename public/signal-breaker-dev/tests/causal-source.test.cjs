const {test}=require('node:test'),a=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const C=require('../src/causal-source.js');
function game(){const g=new Game('CH-01',31,{extended:true,premiumRun:true,causal:true});g.start();return g;}
function step(g,seconds){for(let i=0;i<Math.round(seconds/DT);i++)g.update(DT);}
function clear(g){for(const c of [...g.cores]){c.stable=true;g.capture(c,true);}g.shots=[];}
test('first-wave source must be observed before a matching control request',()=>{
 const g=game();a.equal(g.controlSource('isolate'),false);a.equal(g.observeSource(),true);
 a.equal(g.controlSource('wrong'),false);a.equal(g.controlSource('isolate'),true);
 a.equal(g.controlSource('isolate'),false);a.equal(g.source.requested,true);a.equal(g.source.controlled,false);a.equal(g.source.verified,false);
});
test('clearing the screen alone cannot advance and produces bounded recurrent signals',()=>{
 const g=game();clear(g);step(g,8.1);a.equal(g.state,'playing');a.equal(g.wave,1);a.equal(g.source.emissions,1);
 a.equal(g.cores.filter(c=>c.echo).length,1);
 for(let i=0;i<Math.round(12/DT);i++){g.update(DT);a.ok(g.cores.filter(c=>c.echo).length<=2,'active recurrence stays bounded even after gate recovery');}
 a.ok(g.source.emissions>=2);a.equal(g.cleared,6);a.equal(g.maxUnits,32);
});
test('recurrent signals yield no score, mass, captures, chain or upgrade bonus',()=>{
 const g=game();clear(g);step(g,8.1);
 const values=()=>[g.score,g.cleared,g.captureUnits,g.stableCaptures,g.chain,g.bestChain,g.skillBonus,g.reflectedHits];
 const before=values();g.capture(g.cores[0],true);a.deepEqual(values(),before);
 step(g,6);g.tunings=['bank'];const after=values();g.pulse(g.cores[0],{vx:0,vy:-700,bounces:4});a.deepEqual(values(),after);
});
test('source control preserves residual cores and verifies only after two clear seconds',()=>{
 const g=game();g.observeSource();g.controlSource('isolate');step(g,1);a.ok(g.cores.length);
 a.equal(g.source.stableFor,0);step(g,2);a.equal(g.source.controlled,true);clear(g);step(g,1.9);a.equal(g.state,'playing');step(g,.2);
 a.equal(g.state,'intermission');a.equal(g.source.verified,true);a.equal(g.waveHistory.length,1);
 a.equal(g.chooseTuning(g.draft[0]),true);a.equal(g.wave,2);a.equal(g.source,null);
});
test('pause and intermission do not progress verification, emission, or gameplay',()=>{
 const g=game();g.observeSource();g.controlSource('isolate');clear(g);step(g,.5);g.pause();
 const frozen=g.snapshot();g.update(500);a.deepEqual(g.snapshot(),frozen);a.equal(g.observeSource(),false);
 g.pause();step(g,4.6);const checkpoint=g.snapshot();g.update(500);a.deepEqual(g.snapshot(),checkpoint);
});
test('causal checkpoint restores and old version-one saves remain valid',()=>{
 const g=game();g.observeSource();g.controlSource('isolate');clear(g);step(g,5.1);const cp=g.checkpoint();
 const r=Game.restoreCheckpoint(structuredClone(cp));a.ok(r);a.deepEqual(r.checkpoint(),cp);a.equal(r.source.verified,true);
 r.chooseTuning(r.draft[0]);a.equal(r.source,null);
 const old=structuredClone(cp);delete old.causal;const legacy=Game.restoreCheckpoint(old);a.ok(legacy);a.equal(legacy.causalMode,false);
 const bad=structuredClone(cp);bad.causal='yes';a.equal(Game.restoreCheckpoint(bad),null);
});
test('LAB, other chapters and legacy runs keep their original completion conditions',()=>{
 for(const [id,options] of [['CH-01',{}],['CH-01',{lab:true,causal:true}],['CH-02',{causal:true}]]){
  const g=new Game(id,31,options);a.equal(g.source,null);g.start();clear(g);g.update(DT);a.equal(g.state,'won');
 }
});
test('source rules are immutable and no event backlog appears after saturation',()=>{
 const s=C.createSource(),copy=structuredClone(s);const observed=C.observe(s);a.deepEqual(s,copy);
 a.equal(C.control(s,'isolate'),s);a.equal(C.control(observed,'wrong'),observed);
 let next={...s,nextEmission:0};for(let i=0;i<500;i++)next=C.advance(next,.25,2,2).source;
 const result=C.advance(next,.25,1,1);a.equal(result.emit,true);a.equal(result.source.nextEmission,6);
 for(const dt of [-1,NaN,1])a.throws(()=>C.advance(s,dt,0,0));
});

test('later wave checkpoint restores without reviving the completed first-wave source',()=>{
 const g=game();g.observeSource();g.controlSource('isolate');clear(g);step(g,5.1);g.chooseTuning(g.draft[0]);
 clear(g);step(g,.1);a.equal(g.wave,2);a.equal(g.state,'intermission');a.equal(g.source,null);
 const cp=g.checkpoint(),r=Game.restoreCheckpoint(structuredClone(cp));a.ok(r);a.equal(r.source,null);a.deepEqual(r.checkpoint(),cp);
 r.chooseTuning(r.draft[0]);a.equal(r.wave,3);a.equal(r.source,null);
});

test('control request is idempotent and recurrence continues until execution completes',()=>{
 const g=game();clear(g);step(g,7);g.observeSource();g.controlSource('isolate');
 a.equal(g.controlSource('isolate'),false);const first=g.source.controlRemaining;
 step(g,1.1);a.ok(g.source.controlRemaining<first);a.equal(g.source.controlled,false);a.equal(g.source.stableFor,0);
 a.equal(g.source.emissions,1);a.ok(g.cores.some(c=>c.echo));g.pause();const paused=g.snapshot();g.update(50);a.deepEqual(g.snapshot(),paused);
 g.pause();step(g,2);a.equal(g.source.controlled,true);a.equal(g.source.emissions,1);
 const events=g.drainEvents();a.equal(events.filter(e=>e.kind==='sourcerequested').length,1);a.equal(events.filter(e=>e.kind==='sourcecontrolled').length,1);
 clear(g);step(g,2.1);a.equal(g.state,'intermission');
});
test('execution completion cannot credit its whole simulation step as verified time',()=>{
 let s=C.control(C.observe(C.createSource()),'isolate');const original=structuredClone(s);
 const pending=C.advance(s,.25,0,0);a.deepEqual(s,original);a.equal(pending.source.controlled,false);a.equal(pending.source.stableFor,0);
 s={...s,controlRemaining:.1};const result=C.advance(s,.25,0,0);a.equal(result.source.controlled,true);a.ok(Math.abs(result.source.stableFor-.15)<1e-8);a.equal(result.emit,false);
});
