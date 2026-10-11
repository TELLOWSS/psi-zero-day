const test=require('node:test'),assert=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=id=>{const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
function warn(g){const b=g.boss;g.time=b.nextSurgeAt-1.55;g.step(DT);assert.ok(b.warningUntil>g.time);return b;}
test('CH02 is a conveyor boss, not a CH01-style player X-locked discharge',()=>{
 const g=make('CH-02'),b=g.boss;
 assert.equal(b.identity,'conveyor');assert.equal(b.discharges,undefined);assert.equal(b.surges,0);
 assert.equal(g.conveyorDirection,1);assert.ok(b.nextSurgeAt>g.time+2&&b.nextSurgeAt<g.time+3,'first overload appears in short boss encounters');
});
test('CH02 shows a timed belt-area warning and allows immediate stop intervention',()=>{
 const g=make('CH-02'),b=warn(g),old=b.nextSurgeAt;
 assert.ok(g.events.some(e=>e.kind==='beltwarning'));
 assert.equal(g.conveyorDirection,1);g.cycleConveyor();
 assert.equal(g.conveyorDirection,0);assert.equal(b.warningUntil,0);
 assert.equal(b.intercepts,1);assert.ok(b.nextSurgeAt>old);
 assert.ok(g.events.some(e=>e.kind==='beltintercept'));
 const hp=g.player.life;g.time=old+DT;g.step(DT);assert.equal(g.player.life,hp,'stopped belt cancels warned surge');
});
test('CH02 unmitigated overload hurts inside belt lane exactly once',()=>{
 const g=make('CH-02');g.player.x=600;const b=warn(g),hp=g.player.life;
 g.time=b.nextSurgeAt-DT/2;g.step(DT);
 assert.equal(g.player.life,hp-1);assert.ok(g.player.invuln>0);
 assert.equal(b.surges,1);assert.equal(b.warningUntil,0);
 assert.ok(g.events.some(e=>e.kind==='beltsurge'));
 g.step(DT);assert.equal(g.player.life,hp-1);assert.equal(b.surges,1);
});
test('CH02 operator beyond belt lane can dodge an overload without stopping equipment',()=>{
 const g=make('CH-02');g.player.x=290;const b=warn(g),hp=g.player.life;
 g.time=b.nextSurgeAt-DT/2;g.step(DT);
 assert.equal(b.surges,1);assert.equal(g.player.life,hp);
});
test('CH02 stopped conveyor turns exposed core into a two-point vulnerability',()=>{
 const g=make('CH-02'),b=g.boss;
 for(const node of b.nodes)g.shotBoss({kind:'pulse',x:node.x,y:node.y,r:8,bounces:0,life:1});
 assert.equal(b.phase,'exposed');assert.equal(b.hp,4);
 g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,bounces:0,life:1});
 assert.equal(b.hp,3,'running belt requires ordinary damage');
 g.cycleConveyor();assert.equal(g.conveyorDirection,0);
 g.shotBoss({kind:'bankshot',x:b.x,y:b.y,r:8,bounces:0,life:1});
 assert.equal(b.hp,1,'correct safety intervention doubles damage');
 g.shotBoss({kind:'resonance',x:b.x,y:b.y,r:8,bounces:0,life:1});
 assert.equal(b.phase,'resolved');
});
test('CH03 and CH01 do not inherit the CH02 belt attack',()=>{
 for(const id of ['CH-01','CH-03']){const g=make(id);assert.notEqual(g.boss.identity,'conveyor');g.time+=30;g.advanceConveyorBoss();assert.equal(g.events.some(e=>['beltwarning','beltsurge','beltintercept'].includes(e.kind)),false);}
});
test('paused games cannot advance the CH02 warning clock',()=>{
 const g=make('CH-02'),b=warn(g),time=g.time;
 g.pause();g.update(6);assert.equal(g.time,time);assert.equal(b.surges,0);assert.equal(b.warningUntil,b.nextSurgeAt);
});
