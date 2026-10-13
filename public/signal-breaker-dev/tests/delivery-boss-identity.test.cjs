const test=require('node:test'),assert=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=id=>{const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
test('CH01 has its own boss identity and readable windup before the discharge',()=>{
 const g=make('CH-01'),b=g.boss;assert.equal(b.identity,'delivery');
 assert.ok(b.nextDischargeAt>g.time+6);assert.equal(b.discharges,0);
 g.time=b.nextDischargeAt-1.34;g.step(DT);
 assert.equal(b.warningUntil,b.nextDischargeAt,'warning begins before damage');
 assert.equal(b.dischargeX,g.player.x,'lane locks on operator at windup');
 assert.ok(g.events.some(e=>e.kind==='bosswarning'));
});
test('CH01 warning gives time to dodge and fires exactly once per scheduled pulse',()=>{
 const g=make('CH-01'),b=g.boss;g.time=b.nextDischargeAt-1.34;g.step(DT);const life=g.player.life;
 g.player.x+=90;g.time=b.nextDischargeAt-DT/2;g.step(DT);
 assert.equal(g.player.life,life,'moving away from locked lane avoids discharge');
 assert.equal(b.discharges,1);assert.equal(b.warningUntil,0);
 const next=b.nextDischargeAt;g.step(DT);assert.equal(b.discharges,1);assert.ok(next>g.time+8);
});
test('CH01 stationary operator hit respects invulnerability and bounded health loss',()=>{
 const g=make('CH-01'),b=g.boss;g.time=b.nextDischargeAt-1.34;g.step(DT);
 const life=g.player.life;g.time=b.nextDischargeAt-DT/2;g.step(DT);
 assert.equal(g.player.life,life-1);assert.ok(g.player.invuln>0);
 g.step(DT);assert.equal(g.player.life,life-1,'single discharge cannot cause repeated collision damage');
});
test('CH01 rewarded reflection doubles boss weak point damage after shield release',()=>{
 const g=make('CH-01'),b=g.boss;
 for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,bounces:0,life:1});
 assert.equal(b.phase,'exposed');assert.equal(b.hp,3);
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,bounces:1,life:1});
 assert.equal(b.hp,1,'banked precision hit takes away two armour points');
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,bounces:0,life:1});
 assert.equal(b.phase,'rearming');assert.equal(b.gatePhase,2);
 assert.equal(b.hp,b.maxHp);
 // Regression: the fifth gate, not the first, is the final exposed core.
 b.gatePhase=b.maxGatePhases;b.phase='exposed';b.hp=1;
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,bounces:0,life:1});
 assert.equal(b.phase,'resolved');
});
test('CH02 baseline boss does not inherit CH01 discharge behaviour',()=>{
 const g=make('CH-02'),b=g.boss;assert.equal(b.identity,'conveyor');
 g.time+=40;g.step(DT);assert.equal(g.events.some(e=>e.kind==='bosswarning'||e.kind==='bossdischarge'),false);
});
