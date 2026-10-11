const {test}=require('node:test'),a=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=(id='CH-01')=>{const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
const hit=(g,x,y,bounces=0)=>g.shotBoss({kind:'pulse',x,y,r:8,life:1,bounces});
test('CH01 five sequential gate locks require distinct relay releases and cannot end on first exposed hit',()=>{
 const g=make(),b=g.boss;a.equal(b.gatePhase,1);a.equal(b.maxGatePhases,5);
 for(let i=1;i<=b.maxGatePhases;i++){
  a.equal(b.phase,'sealed');a.equal(b.gatePhase,i);
  for(const n of b.nodes)hit(g,n.x,n.y);
  a.equal(b.phase,'exposed');
  for(let j=0;j<b.maxHp;j++)hit(g,b.x,b.y);
  if(i<b.maxGatePhases){
   a.equal(b.phase,'rearming');a.equal(b.gatePhase,i+1);a.equal(b.hp,b.maxHp);
   const hp=b.hp;hit(g,b.x,b.y);hit(g,b.nodes[0].x,b.nodes[0].y);
   a.equal(b.hp,hp,'rearm prevents accidental damage');a.equal(b.nodes[0].hit,false);
   g.time=b.resetUntil+DT;g.step(DT);a.equal(b.phase,'sealed');
  }else a.equal(b.phase,'resolved');
 }
 a.equal(g.events.filter(x=>x.kind==='gatephase').length,4);
 a.equal(g.events.filter(x=>x.kind==='gaterearm').length,4);
 g.update(DT);a.equal(g.state,'won');
});
test('CH01 reflected ammunition remains a meaningful precision advantage after gate re-lock',()=>{
 const g=make(),b=g.boss;
 for(const n of b.nodes)hit(g,n.x,n.y);
 const hp=b.hp;hit(g,b.x,b.y,1);a.equal(b.hp,hp-2);
 hit(g,b.x,b.y);a.equal(b.gatePhase,2);g.time=b.resetUntil+DT;g.step(DT);
 for(const n of b.nodes)hit(g,n.x,n.y);
 hit(g,b.x,b.y,0);a.equal(b.hp,b.maxHp-1);
 hit(g,b.x,b.y,1);a.equal(b.phase,'rearming');
});
test('CH01 warned discharge adapts the hitbox and retains fair locked-in warning',()=>{
 const g=make(),b=g.boss;const first=b.dischargeHalfWidth;
 for(const n of b.nodes)hit(g,n.x,n.y);
 for(let i=0;i<b.maxHp;i++)hit(g,b.x,b.y);
 a.ok(b.dischargeHalfWidth>first);a.equal(b.gatePhase,2);
 g.time=b.resetUntil+DT;g.step(DT);
 b.nextDischargeAt=g.time+3;g.time=b.nextDischargeAt-1.34;g.step(DT);
 a.equal(b.warningUntil,b.nextDischargeAt);
 a.equal(b.dischargeX,g.player.x);
 const life=g.player.life;
 g.player.x=b.dischargeX+b.dischargeHalfWidth+18;
 g.time=b.nextDischargeAt-DT/2;g.step(DT);
 a.equal(g.player.life,life,'outside telegraphed lane has no collision');
 a.ok(b.nextDischargeAt>g.time,'next attack scheduled');
});
test('CH02-05 have no delivery-specific repeating gate and keep unchanged unique identities',()=>{
 for(const id of ['CH-02','CH-03','CH-04','CH-05']){
  const g=make(id);a.equal(g.boss.gatePhase,undefined);
  a.notEqual(g.boss.identity,'delivery');
 }
});
