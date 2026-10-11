const {test}=require('node:test'),a=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
const make=()=>{const g=new Game('CH-03',20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];return g;};
const hit=(g,x,y,kind='pulse')=>g.shotBoss({kind,x,y,r:kind==='mist'?13:8,life:1,bounces:0});
test('CH03 four filter canisters require four separate node and weak-point cycles',()=>{
 const g=make(),b=g.boss;a.equal(b.filterStage,1);a.equal(b.maxFilterStages,4);
 for(let i=1;i<=4;i++){
  a.equal(b.phase,'sealed');
  for(const node of b.nodes)hit(g,node.x,node.y);
  a.equal(b.phase,'exposed');
  for(let p=0;p<b.maxHp;p++)hit(g,b.x,b.y);
  if(i<4){a.equal(b.phase,'purging');a.equal(b.filterStage,i+1);a.equal(b.hp,b.maxHp);
   const health=b.hp;hit(g,b.x,b.y);a.equal(b.hp,health,'no damage before filter is reset');
   const until=b.purgeUntil;g.time=until+DT;g.step(DT);a.equal(b.phase,'sealed');a.ok(b.nodes.every(n=>!n.hit));
  }else a.equal(b.phase,'resolved');
 }
 a.equal(g.events.filter(e=>e.kind==='filterpurge').length,3);
 a.equal(g.events.filter(e=>e.kind==='filterrearm').length,3);
 g.update(DT);a.equal(g.state,'won');
});
test('CH03 mist at the intake speeds the current purge only once',()=>{
 const g=make(),b=g.boss;for(const n of b.nodes)hit(g,n.x,n.y);for(let i=0;i<b.maxHp;i++)hit(g,b.x,b.y);
 a.equal(b.phase,'purging');const original=b.purgeUntil;
 hit(g,b.x,b.y,'mist');a.ok(b.purgeUntil<original);a.equal(b.purgeMistBonus,true);
 a.equal(g.events.filter(e=>e.kind==='filterflush').length,1);
 const accelerated=b.purgeUntil;hit(g,b.x,b.y,'mist');a.equal(b.purgeUntil,accelerated);
 g.time=accelerated+DT;g.step(DT);a.equal(b.phase,'sealed');
});
test('CH03 retains unique pressure attack even while filters are purging',()=>{
 const g=make(),b=g.boss;for(const n of b.nodes)hit(g,n.x,n.y);for(let i=0;i<b.maxHp;i++)hit(g,b.x,b.y);
 a.equal(b.phase,'purging');b.nextPressureAt=g.time+2;g.player.x=b.x;
 g.time=b.nextPressureAt-1.42;g.step(DT);a.ok(b.warningUntil>0);
 const hp=g.player.life;g.time=b.nextPressureAt-DT/2;g.step(DT);
 a.equal(b.pressureBursts,1);a.equal(g.player.life,hp-1);
});
test('CH03 staged filter state does not change boss identities or story of other chapters',()=>{
 for(const id of ['CH-01','CH-02','CH-04','CH-05']){const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();g.wave=4;g.beginNextWave();a.equal(g.boss.filterStage,undefined);}
});
