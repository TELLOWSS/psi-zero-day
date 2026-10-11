const {test}=require('node:test'),a=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js'),{simulate}=require('../scripts/simulate-flow.cjs');
test('dust corridor clears with ordinary stationary input over all eight regression seeds',()=>{
 for(let seed=1;seed<=8;seed++){const r=simulate('CH-03',seed,'stationary');a.equal(r.state,'won');a.equal(r.cleared,r.total);a.ok(r.shots>0);}
});
test('shield occlusion pauses assisted fire but never forbids manual fire or clears nodes',()=>{
 const g=new Game('CH-05');g.start();g.cores=[];g.boss.nodes[0].hit=true;
 const before=g.shotsFired;let target;for(let i=0;i<10;i++)target=g.assistAim();
 a.equal(target.role,'node');a.equal(target.blocked,true);a.equal(target.aligned,false);a.equal(target.hint,'blocked');
 a.equal(g.shotsFired,before);a.equal(g.boss.nodes[1].hit,false);a.equal(g.fire(),true);
 g.player.x=1000;for(let i=0;i<10;i++)target=g.assistAim();a.equal(target.blocked,false);
});
test('stagnation uses simulation time, freezes on pause and resets after progress',()=>{
 const g=new Game('CH-03');g.start();g.cores=[];g.addCore({kind:'dust',tier:2,x:450,y:200,vx:0,vy:0});g.assistAim();
 g.time=7;const hint=g.assistAim().hint;a.equal(hint,'reposition');g.pause();g.update(10);a.equal(g.time,7);a.equal(g.assistAim(),null);
 g.pause();g.cores[0].stable=true;a.equal(g.assistAim().hint,null);
});
test('quiet contact keeps reflection physics and suppresses decorative impact events',()=>{
 const g=new Game('CH-01');g.start();g.cores=[];g.magnetOn=false;g.rail=[];
 const b=g.config.bumper[0];g.addCore({kind:'metal',tier:0,x:b.x-b.r-13,y:b.y,vx:1,vy:0});const c=g.cores[0];
 g.coreMotion(c,0);a.ok(c.vx<0);a.equal(g.events.filter(e=>e.kind==='bumper').length,0);
 c.x=b.x-b.r-13;c.vx=100;g.coreMotion(c,0);a.ok(c.vx<0);a.equal(g.events.filter(e=>e.kind==='bumper').length,1);
});
