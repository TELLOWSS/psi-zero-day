const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game,CHAPTER,STAGES,WEAPONS,DT,mass}=require('../src/engine.js');
const {chapterReward,availableWeapons}=require('../src/chapter-content.js');
const core=(g,kind='metal',tier=0,x=500,y=220)=>{g.cores=[];g.addCore({x,y,vx:0,vy:0,tier,kind});return g.cores[0];};
test('five chapter IDs preserve all four legacy records; LAB earns nothing',()=>{
 assert.equal(CHAPTER.length,5);assert.equal(new Set([...STAGES,...CHAPTER].map(c=>c.id)).size,9);assert.equal(Object.keys(WEAPONS).length,6);
 assert.deepEqual(availableWeapons(0),['pulse','net']);assert.ok(availableWeapons(4).includes('scan'));
 assert.equal(chapterReward('CH-01',false,3,true),0);assert.equal(chapterReward('CH-01',true,3),0);assert.equal(chapterReward('SB-01',false,3),0);assert.equal(chapterReward('CH-01',false,3),95);
 const lab=new Game('CH-01',123,{lab:true});assert.ok(lab.setLoadout(['mist','scan'],3));assert.equal(new Game('CH-05').setLoadout(['anchor','scan']),false);
});
test('swept projectiles hit cores and thin rails even at extreme velocity',()=>{
 const g=new Game();g.rail=[];core(g,'metal',0,500,250);g.start();const shot={x:100,y:250,vx:60000,vy:0,r:8,kind:'pulse',life:1,bounces:0};g.advanceShot(shot,DT);assert.equal(g.cleared,1);assert.equal(shot.hit,true);
 const railGame=new Game();railGame.cores=[];railGame.rail=[{x:500,y:300,length:400,angle:0}];const s={x:500,y:100,vx:0,vy:50000,r:8,kind:'pulse',life:1,bounces:0};railGame.advanceShot(s,DT);assert.ok(s.bounces>0);assert.ok(s.vy<0);assert.ok(s.y<300);
});
test('rotating rail shape follows bounded travel and relative surface speed',()=>{
 const g=new Game();g.start();const before=g.railSegment(g.rail[0]);g.cycleShield();assert.deepEqual(g.railSegment(g.rail[0]),before);for(let i=0;i<40;i++)g.step(DT);assert.notDeepEqual(g.railSegment(g.rail[0]),before);assert.equal(g.shieldMotion,null);
 const moving=new Game();moving.shieldMotion={from:0,to:.5,start:0,duration:1};const ball={x:580,y:303,vx:0,vy:0,r:8};assert.ok(moving.bounceSegment(ball,{x:500,y:300,length:250,angle:0},7,1));assert.ok(ball.vy>0);
});
test('conveyor acts only at floor contact and supports reverse and stop',()=>{
 const g=new Game('CH-02',123,{lab:true});g.rail=[];g.config={...g.config,bumper:[]};const c=core(g,'metal',0,550,522);g.magnetOn=false;c.stable=true;g.coreMotion(c,DT);assert.ok(c.vx>0);g.cycleConveyor();assert.equal(g.conveyorDirection,0);g.cycleConveyor();assert.equal(g.conveyorDirection,-1);c.vx=0;c.y=522;g.coreMotion(c,DT);assert.ok(c.vx<0);c.vx=0;c.y=200;g.coreMotion(c,DT);assert.equal(c.vx,0);
});
test('portable magnet is bounded, metal-only, and switches polarity',()=>{
 const g=new Game('CH-02',123,{lab:true});g.magnetOn=false;g.deployField('magnet',600,220);const c=core(g);g.fieldForces(c,DT);assert.ok(c.vx>0);g.deployField('magnet',600,220);c.vx=0;g.fieldForces(c,DT);assert.ok(c.vx<0);c.kind='dust';c.vx=0;g.fieldForces(c,DT);assert.equal(c.vx,0);c.kind='metal';c.x=100;g.fieldForces(c,DT);assert.equal(c.vx,0);assert.equal(g.fields.length,1);
});
test('mist needs sustained exposure, ignores metal, and never awards capture',()=>{
 const g=new Game('CH-03',123,{lab:true}),c=core(g,'dust');g.deployField('mist',c.x,c.y);for(let i=0;i<60;i++)g.fieldForces(c,DT);assert.equal(c.stable,false);for(let i=0;i<32;i++)g.fieldForces(c,DT);assert.equal(c.stable,true);assert.equal(g.cleared,0);assert.equal(g.captureUnits,0);
 const metal=core(g,'metal');for(let i=0;i<120;i++)g.fieldForces(metal,DT);assert.equal(metal.stable,false);
});
test('anchor is one bounded tether and scanning cannot defeat a boss',()=>{
 const g=new Game('CH-04',123,{lab:true}),c=core(g,'load');g.weaponContact({kind:'anchor'},c);assert.equal(g.anchors.length,1);g.weaponContact({kind:'anchor'},c);assert.equal(g.anchors.length,0);g.weaponContact({kind:'anchor'},c);c.x+=300;g.fieldForces(c,DT);assert.equal(g.anchors.length,0);
 const boss=new Game('CH-05',123,{lab:true});boss.start();const n=boss.boss.nodes[0],s={x:n.x,y:n.y,vx:0,vy:-800,r:12,kind:'scan',life:1,bounces:0};boss.advanceShot(s,DT);assert.equal(n.hit,false);assert.equal(boss.score,0);assert.ok(boss.scanUntil>0);
});
test('gate rejects unstable dust; relay order and boss exposure cannot farm score',()=>{
 const g=new Game('CH-03',123,{lab:true});g.magnetOn=false;const c=core(g,'dust',1,g.config.gate.x-18,g.config.gate.y);c.vx=100;g.coreMotion(c,DT);assert.equal(g.cleared,0);c.stable=true;g.coreMotion(c,DT);assert.equal(g.cleared,2);
 const b=new Game('CH-05',123,{lab:true});b.start();const shot=n=>({x:n.x,y:n.y,r:8,kind:'pulse',life:1,vx:0,vy:-770});b.shotBoss(shot(b.boss.nodes[1]));assert.equal(b.boss.nodes[1].hit,false);for(const n of b.boss.nodes)b.shotBoss(shot(n));assert.equal(b.boss.phase,'exposed');const score=b.score;b.boss.exposure=8;b.step(DT);assert.equal(b.boss.phase,'sealed');for(const n of b.boss.nodes)b.shotBoss(shot(n));assert.equal(b.score,score);
});
test('crowded splits and duplicate captures conserve recovery mass',()=>{
 const g=new Game();g.cores=[];for(let i=0;i<36;i++)g.addCore({x:100+i*10,y:200,vx:0,vy:0,tier:1,kind:'metal'});const before=g.cores.reduce((n,c)=>n+mass(c.tier),0),c=g.cores[0];g.pulse(c,{vx:0,vy:-770,bounces:0});assert.equal(g.cores.reduce((n,c)=>n+mass(c.tier),0)+g.cleared,before);assert.equal(g.cores.length,36);assert.equal(g.score,0);g.capture(c);const cleared=g.cleared,score=g.score;g.capture(c);assert.equal(g.cleared,cleared);assert.equal(g.score,score);
});
test('contact feedback is bounded and pause freezes devices and fields',()=>{
 const g=new Game('CH-04',123,{lab:true});g.start();g.deployField('mist',500,200);g.drainEvents();for(let i=0;i<100;i++)g.contactEvent('same','bumper',500,200);assert.equal(g.events.length,1);g.cycleShield();g.pause();const state=JSON.stringify({t:g.time,rail:g.railSegment(g.rail[0]),fields:g.fields});for(let i=0;i<200;i++)g.update(DT);assert.equal(JSON.stringify({t:g.time,rail:g.railSegment(g.rail[0]),fields:g.fields}),state);
});
