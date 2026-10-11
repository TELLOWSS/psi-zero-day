const {test}=require('node:test'),a=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=(id='CH-04')=>{const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
const hit=(g,x,y,kind='pulse')=>g.shotBoss({kind,x,y,r:8,life:1,bounces:0});
test('CH04 requires four independent load-test node cycles before boss resolution',()=>{
 const g=make(),b=g.boss;a.equal(b.loadStage,1);a.equal(b.maxLoadStages,4);
 for(let stage=1;stage<=4;stage++){
  a.equal(b.phase,'sealed');a.equal(b.loadStage,stage);
  for(const n of b.nodes)hit(g,n.x,n.y);
  a.equal(b.phase,'exposed');
  for(let i=0;i<b.maxHp;i++)hit(g,b.x,b.y);
  if(stage<4){
   a.equal(b.phase,'rebalancing');a.equal(b.loadStage,stage+1);
   const hp=b.hp;hit(g,b.x,b.y);a.equal(b.hp,hp,'rebalancing resists free shots');
   g.time=b.calibrationUntil+DT;b.nextSnapAt=g.time+20;g.step(DT);
   a.equal(b.phase,'sealed');a.ok(b.nodes.every(n=>!n.hit));
  }else a.equal(b.phase,'resolved');
 }
 a.equal(g.events.filter(e=>e.kind==='loadstage').length,3);
 a.equal(g.events.filter(e=>e.kind==='loadrearm').length,3);
 g.update(DT);a.equal(g.state,'won');
});
test('CH04 actual anchor-rail hit accelerates load rebalancing once, without bypassing relays',()=>{
 const g=make(),b=g.boss;for(const n of b.nodes)hit(g,n.x,n.y);for(let i=0;i<b.maxHp;i++)hit(g,b.x,b.y);
 a.equal(b.phase,'rebalancing');const before=b.calibrationUntil;
 const rail=g.rail[0],shot={x:rail.x,y:rail.y-135,vx:0,vy:2200,kind:'anchor',r:9,life:1,bounces:0,trail:[]};
 for(let i=0;i<16&&shot.life>0;i++)g.advanceShot(shot,DT);
 a.ok(g.tensionLockUntil>g.time,'physical projectile actually locks the moving rail');
 g.step(DT);a.equal(b.anchorResetUsed,true);a.ok(b.calibrationUntil<before,'anchor speeds the recalibration');
 a.equal(g.events.filter(e=>e.kind==='loadbalanced').length,1);
 const after=b.calibrationUntil;g.step(DT);a.equal(b.calibrationUntil,after,'no farming repeated bonuses');
 g.time=b.calibrationUntil+DT;b.nextSnapAt=g.time+20;g.step(DT);
 a.equal(b.phase,'sealed');a.ok(b.nodes.every(n=>!n.hit));
});
test('CH04 snap warning and collision corridor expand after each failed load test',()=>{
 const g=make(),b=g.boss;const startLeft=b.snapLeft,startRight=b.snapRight;
 for(const n of b.nodes)hit(g,n.x,n.y);for(let i=0;i<b.maxHp;i++)hit(g,b.x,b.y);
 a.ok(b.snapLeft<startLeft&&b.snapRight>startRight);
 g.time=b.calibrationUntil+DT;b.nextSnapAt=g.time+20;g.step(DT);
 b.nextSnapAt=g.time+2;
 g.time=b.nextSnapAt-1.3;g.step(DT);a.ok(b.warningUntil>g.time);
 const hp=g.player.life;g.player.x=b.snapLeft+4;g.time=b.nextSnapAt-DT/2;g.step(DT);
 a.equal(g.player.life,hp-1,'expanded corridor has real hitbox');
});
test('CH04 load test phase state does not bleed into previous or final chapter',()=>{
 for(const id of ['CH-01','CH-02','CH-03','CH-05']){const g=make(id);a.equal(g.boss.loadStage,undefined);a.notEqual(g.boss.identity,'tension');}
});
