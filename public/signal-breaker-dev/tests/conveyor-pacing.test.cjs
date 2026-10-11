const test=require('node:test'),assert=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=()=>{const g=new Game('CH-02',20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
const fireAt=(g,x,y,kind='pulse')=>g.shotBoss({kind,x,y,r:8,bounces:0,life:1});
test('CH02 drives five distinct armour segments and only the final exposed core can finish the stage',()=>{
 const g=make(),b=g.boss;
 assert.equal(b.segment,1);assert.equal(b.maxSegments,5);assert.equal(b.hp,4);
 for(let stage=1;stage<=b.maxSegments;stage++){
  assert.equal(b.segment,stage);assert.equal(b.phase,'sealed');
  for(const n of b.nodes)fireAt(g,n.x,n.y);
  assert.equal(b.phase,'exposed');
  for(let i=0;i<b.maxHp;i++)fireAt(g,b.x,b.y);
  if(stage<b.maxSegments){
   assert.equal(b.phase,'rebuilding');assert.equal(b.segment,stage+1);
   assert.ok(b.transitionUntil>g.time);
   const newHP=b.hp;fireAt(g,b.x,b.y);fireAt(g,b.nodes[0].x,b.nodes[0].y);
   assert.equal(b.hp,newHP,'rebuilding rejects damage instead of instantly resolving');
   assert.equal(b.nodes[0].hit,false);
   g.time=b.transitionUntil+DT;g.step(DT);
   assert.equal(b.phase,'sealed');
  }else assert.equal(b.phase,'resolved');
 }
 assert.equal(g.events.filter(e=>e.kind==='bossphase').length,4);
 assert.equal(g.events.filter(e=>e.kind==='bossrearm').length,4);
 g.update(DT);assert.equal(g.state,'won');
});
test('CH02 warnings adapt their footprint as armoured drive loses segments',()=>{
 const g=make(),b=g.boss;assert.equal(b.dangerLeft,340);assert.equal(b.dangerRight,860);
 for(const n of b.nodes)fireAt(g,n.x,n.y);
 for(let i=0;i<b.maxHp;i++)fireAt(g,b.x,b.y);
 assert.equal(b.segment,2);
 assert.equal(b.dangerLeft,322);assert.equal(b.dangerRight,868);
 g.time=b.transitionUntil+DT;g.step(DT);
 assert.equal(b.phase,'sealed');
 b.nextSurgeAt=g.time+1.3;g.step(DT);
 assert.ok(b.warningUntil>g.time);
 const hp=g.player.life;g.player.x=330;g.time=b.nextSurgeAt-DT/2;g.step(DT);
 assert.equal(g.player.life,hp-1,'stage 2 enlarged danger area is enforced by engine');
});
test('CH02 conveyor stop still defeats warning and grants double weak-point damage after rearm',()=>{
 const g=make(),b=g.boss;
 for(const n of b.nodes)fireAt(g,n.x,n.y);
 for(let i=0;i<b.maxHp;i++)fireAt(g,b.x,b.y);
 g.time=b.transitionUntil+DT;g.step(DT);
 for(const n of b.nodes)fireAt(g,n.x,n.y);
 g.cycleConveyor();assert.equal(g.conveyorDirection,0);
 const hp=b.hp;fireAt(g,b.x,b.y);assert.equal(b.hp,hp-2);
 b.nextSurgeAt=g.time-DT;g.advanceConveyorBoss();
 assert.equal(b.intercepts,1,'belt stop continues to isolate subsequent overloads');
});
test('operation stages CH01 CH03 CH04 CH05 keep original single-cycle boss contract',()=>{
 for(const id of ['CH-01','CH-03','CH-04','CH-05']){
  const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();
  assert.equal(g.boss.segment,undefined,id+' must not inherit CH02 armour cycles');
 }
});
