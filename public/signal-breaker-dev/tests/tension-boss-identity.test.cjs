const test=require('node:test'),assert=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=(id='CH-04')=>{const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
const warn=g=>{const b=g.boss;g.time=b.nextSnapAt-1.3;g.step(DT);assert.ok(b.warningUntil>g.time);return b;};
test('CH04 has distinct tension-relay identity, ordered nodes and active tension rail',()=>{
 const g=make(),b=g.boss;assert.equal(b.identity,'tension');assert.equal(b.stage,4);
 assert.ok(g.config.tension&&g.config.relays);assert.equal(b.snaps,0);assert.equal(b.secured,0);
 assert.ok(b.nextSnapAt>g.time+2&&b.nextSnapAt<g.time+3);
});
test('CH04 warning is predictable, anchoring the tension rail prevents a snap',()=>{
 const g=make(),b=warn(g);assert.ok(g.events.some(e=>e.kind==='tensionwarning'));
 const anticipated=b.nextSnapAt,hp=g.player.life;
 g.tensionHeld=g.tensionAngle();g.tensionLockUntil=g.time+5;g.advanceTensionBoss();
 assert.equal(b.warningUntil,0);assert.equal(b.secured,1);assert.ok(b.nextSnapAt>anticipated);
 assert.ok(g.events.some(e=>e.kind==='tensionsecured'));
 g.time=anticipated+DT;g.step(DT);assert.equal(g.player.life,hp);assert.equal(b.snaps,0);
});
test('CH04 rail-anchor projectile actually establishes rail lock',()=>{
 const g=make(),rail=g.rail[0];g.shots=[];const s={x:rail.x,y:rail.y-135,vx:0,vy:2200,kind:'anchor',r:9,life:1,bounces:0,trail:[]};
 for(let n=0;n<16&&s.life>0;n++)g.advanceShot(s,DT);
 assert.ok(g.tensionLockUntil>g.time,'shot at tension rail creates real anchor lock');
 assert.ok(g.events.some(e=>e.kind==='anchor'),'real anchor collision emitted');
});
test('CH04 unmitigated snapped cable hurts once in marked danger lane',()=>{
 const g=make(),b=g.boss;g.player.x=620;warn(g);
 const health=g.player.life;g.time=b.nextSnapAt-DT/2;g.step(DT);
 assert.equal(g.player.life,health-1);assert.equal(b.snaps,1);assert.equal(b.warningUntil,0);
 assert.ok(g.events.some(e=>e.kind==='tensionsnap'));assert.ok(g.player.invuln>0);
 g.step(DT);assert.equal(b.snaps,1);assert.equal(g.player.life,health-1);
});
test('CH04 player may dodge cable lane even without an anchor',()=>{
 const g=make(),b=warn(g);g.player.x=245;const hp=g.player.life;
 g.time=b.nextSnapAt-DT/2;g.step(DT);
 assert.equal(b.snaps,1);assert.equal(g.player.life,hp);
});
test('CH04 relay nodes require order and stopping moving rail doubles exposed hit',()=>{
 const g=make(),b=g.boss;
 g.shotBoss({kind:'pulse',x:b.nodes[1].x,y:b.nodes[1].y,r:8,life:1,bounces:0});
 assert.equal(b.nodes[1].hit,false,'out of order relay shot is rejected');
 for(const node of b.nodes)g.shotBoss({kind:'pulse',x:node.x,y:node.y,r:8,life:1,bounces:0});
 assert.equal(b.phase,'exposed');assert.equal(b.hp,6);
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.hp,5,'free-moving tension still takes standard damage');
 g.tensionLockUntil=g.time+4;
 g.shotBoss({kind:'bankshot',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.hp,3,'manual rail lock improves vulnerability');
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.hp,1);
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.phase,'rebalancing');assert.equal(b.loadStage,2);
 b.loadStage=b.maxLoadStages;b.phase='exposed';b.hp=1;
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.phase,'resolved');
});
test('CH04 tension snap does not leak into CH01/02/03/05',()=>{
 for(const id of ['CH-01','CH-02','CH-03','CH-05']){
  const g=make(id);assert.notEqual(g.boss.identity,'tension');g.time+=30;g.advanceTensionBoss();
  assert.equal(g.events.some(e=>['tensionwarning','tensionsnap','tensionsecured'].includes(e.kind)),false);
 }
});
test('pause and resolved state do not advance CH04 tension attack clock',()=>{
 const g=make(),b=warn(g),time=g.time;g.pause();g.update(8);
 assert.equal(g.time,time);assert.equal(b.snaps,0);
 g.pause();b.phase='resolved';g.time=b.nextSnapAt+2;g.advanceTensionBoss();
 assert.equal(b.snaps,0);
});
