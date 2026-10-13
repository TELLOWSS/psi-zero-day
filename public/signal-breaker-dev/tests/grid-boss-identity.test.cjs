const test=require('node:test'),assert=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=(id='CH-05')=>{const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
const warn=g=>{const b=g.boss;g.time=b.nextArcAt-1.36;g.step(DT);assert.ok(b.warningUntil>g.time);return b;};
test('CH05 has its own three-channel command core and a two-tier active attack',()=>{
 const g=make(),b=g.boss;assert.equal(b.identity,'grid');assert.equal(b.stage,5);assert.equal(b.combatTier,1);
 assert.equal(b.band,0);assert.equal(b.arcs,0);assert.equal(b.isolations,0);
 assert.ok(b.nextArcAt>g.time+2&&b.nextArcAt<g.time+3);assert.equal(g.gridArcLanes()[0].x,370);
});
test('CH05 announces its active electrical lane before one bounded impact',()=>{
 const g=make(),b=warn(g);assert.ok(g.events.some(e=>e.kind==='gridwarning'));
 const lane=g.gridArcLanes()[0];g.player.x=lane.x;const hp=g.player.life;
 g.time=b.nextArcAt-DT/2;g.step(DT);
 assert.equal(g.player.life,hp-1);assert.equal(b.arcs,1);assert.equal(b.band,1);
 assert.ok(g.player.invuln>0);assert.ok(g.events.some(e=>e.kind==='gridarc'));
 g.step(DT);assert.equal(g.player.life,hp-1);assert.equal(b.arcs,1);
});
test('CH05 safe-lane read avoids damage even if no scan is available',()=>{
 const g=make(),b=warn(g);g.player.x=109;const hp=g.player.life;
 g.time=b.nextArcAt-DT/2;g.step(DT);
 assert.equal(g.player.life,hp);assert.equal(b.arcs,1);
});
test('CH05 scan DURING warning isolates one circuit, delaying its power surge',()=>{
 const g=make(),b=warn(g),former=b.nextArcAt,hp=g.player.life;
 g.deployField('scan',b.x,b.y);
 assert.equal(b.warningUntil,0);assert.equal(b.isolations,1);assert.ok(b.nextArcAt>former);
 assert.ok(b.scannedUntil>g.time);
 assert.ok(g.events.some(e=>e.kind==='gridisolated'));
 g.time=former+DT;g.step(DT);assert.equal(g.player.life,hp);assert.equal(b.arcs,0);
});
test('CH05 an old scan does not auto-cancel a future warning: user must respond to live information',()=>{
 const g=make(),b=g.boss;
 g.deployField('scan',b.x,b.y);
 assert.equal(b.isolations,0);warn(g);
 assert.ok(b.warningUntil>g.time);assert.equal(b.isolations,0);
 assert.ok(b.warningStarted>b.scanAppliedAt);
});
test('CH05 ordered relay nodes and passive scan cannot defeat the boss automatically',()=>{
 const g=make(),b=g.boss;
 g.shotBoss({kind:'pulse',x:b.nodes[1].x,y:b.nodes[1].y,r:8,life:1,bounces:0});assert.equal(b.nodes[1].hit,false);
 g.deployField('scan',b.x,b.y);assert.equal(b.phase,'sealed');assert.equal(b.hp,7);
 for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1,bounces:0});
 assert.equal(b.phase,'exposed');
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});assert.equal(b.hp,5,'recent scan grants double damage');
 assert.equal(b.phase,'exposed');
});
test('CH05 phase-2 escalation visibly changes attacks, but ordinary pulse still finishes it',()=>{
 const g=make(),b=g.boss;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1,bounces:0});
 for(let i=0;i<4;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.hp,3);assert.equal(b.combatTier,2);assert.equal(g.gridArcLanes()[0].half,164);
 assert.ok(g.events.some(e=>e.kind==='gridphase'));
 for(let i=0;i<3;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});
 assert.equal(b.phase,'resolved');
});
test('CH05 rotating live channels change left-centre-right over unmitigated pulses',()=>{
 const g=make(),b=g.boss,centres=[];
 for(let i=0;i<3;i++){
  warn(g);centres.push(g.gridArcLanes()[0].x);g.player.x=110;
  g.time=b.nextArcAt-DT/2;g.step(DT);
 }
 assert.deepEqual(centres,[370,750,970]);assert.equal(b.arcs,3);
});
test('CH05 escalation and electrical arcs never bleed into the earlier four bosses',()=>{
 for(const id of ['CH-01','CH-02','CH-03','CH-04']){
  const g=make(id);assert.notEqual(g.boss.identity,'grid');g.time+=50;g.advanceGridBoss();
  assert.equal(g.events.some(e=>['gridarc','gridwarning','gridscan','gridisolated','gridphase'].includes(e.kind)),false);
 }
});
test('CH05 pause and resolved state block new power arcs',()=>{
 const g=make(),b=warn(g),time=g.time;g.pause();g.update(10);assert.equal(g.time,time);assert.equal(b.arcs,0);
 g.pause();b.phase='resolved';g.time=b.nextArcAt+4;g.advanceGridBoss();assert.equal(b.arcs,0);
});
