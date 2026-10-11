const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=(id='CH-03')=>{const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
const warn=g=>{const b=g.boss;g.time=b.nextPressureAt-1.48;g.step(DT);assert.ok(b.warningUntil>g.time);return b;};
test('CH03 cyclone extractor has distinct identity, attack cycle, and source stage',()=>{
 const g=make(),b=g.boss;
 assert.equal(b.identity,'extraction');assert.equal(b.pressureBursts,0);assert.equal(b.pressureVents,0);
 assert.ok(b.nextPressureAt>g.time+2&&b.nextPressureAt<g.time+4);
 assert.equal(b.surges,undefined);
});
test('CH03 announces pressure and mist hit at intake releases pressure and cancels attack',()=>{
 const g=make(),b=warn(g);assert.ok(g.events.some(e=>e.kind==='pressurewarning'));
 const t=b.nextPressureAt;
 g.shotBoss({kind:'mist',x:b.x,y:b.y,r:13,life:1,bounces:0});
 assert.equal(b.warningUntil,0);assert.equal(b.pressureVents,1);
 assert.ok(b.nextPressureAt>t);assert.ok(b.mistUntil>g.time);
 assert.ok(g.events.some(e=>e.kind==='pressurevent'));
 const hp=g.player.life;g.time=t+DT;g.step(DT);
 assert.equal(g.player.life,hp,'mist mitigation prevents predicted pressure hit');
});
test('CH03 can mitigate with an already deployed mist field',()=>{
 const g=make(),b=warn(g);g.deployField('mist',b.x+32,b.y);
 const expected=g.player.life;g.step(DT);assert.equal(b.pressureVents,1);assert.equal(b.warningUntil,0);
 assert.equal(g.player.life,expected);
});
test('CH03 pressure burst hurts once in extractor corridor when unmitigated',()=>{
 const g=make(),b=g.boss;g.player.x=b.x;
 warn(g);const hp=g.player.life;g.time=b.nextPressureAt-DT/2;g.step(DT);
 assert.equal(g.player.life,hp-1);assert.equal(b.pressureBursts,1);assert.equal(b.warningUntil,0);
 assert.ok(g.events.some(e=>e.kind==='pressureburst'));g.step(DT);
 assert.equal(g.player.life,hp-1);assert.equal(b.pressureBursts,1);
});
test('CH03 dust column can be sidestepped; no automatic capture or safety action',()=>{
 const g=make(),b=warn(g),hp=g.player.life;
 g.player.x=b.x-220;g.time=b.nextPressureAt-DT/2;g.step(DT);
 assert.equal(g.player.life,hp);assert.equal(b.pressureBursts,1);
 assert.equal(b.pressureVents,0);
});
test('CH03 sealed and unstabilized core cannot be damaged by mist; active gate timing matters',()=>{
 const g=make(),b=g.boss;g.shotBoss({kind:'mist',x:b.x,y:b.y,r:13,life:1});
 assert.equal(b.phase,'sealed');assert.ok(b.mistUntil>g.time);
 for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1,bounces:0});
 assert.equal(b.phase,'exposed');assert.equal(b.hp,5);
 g.time=5.4;assert.equal(g.gateStatus().open,false);b.mistUntil=g.time+1;
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.hp,4,'closed damper prevents bonus');
 g.time=8.1;assert.equal(g.gateStatus().open,true);b.mistUntil=g.time+1;
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.hp,2,'open gate and stabilized extractor double damage');
});
test('CH03 pressure status does not leak into CH01/CH02/CH04/CH05',()=>{
 for(const id of ['CH-01','CH-02','CH-04','CH-05']){
  const g=make(id);assert.notEqual(g.boss.identity,'extraction');
  g.time+=30;g.advanceExtractionBoss();
  assert.equal(g.events.some(e=>['pressurewarning','pressureburst','pressurevent'].includes(e.kind)),false);
 }
});
test('paused and settled boss do not emit further pressure bursts',()=>{
 const g=make(),b=warn(g),time=g.time;
 g.pause();g.update(8);assert.equal(g.time,time);assert.equal(b.pressureBursts,0);
 g.pause();b.phase='resolved';g.time=b.nextPressureAt+2;g.advanceExtractionBoss();
 assert.equal(b.pressureBursts,0);
});
