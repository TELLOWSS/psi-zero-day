const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {Game}=require('../src/engine.js');
function load(storage){const context={window:{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},console};vm.runInNewContext(fs.readFileSync(require.resolve('../src/talent-tech-tree.js'),'utf8'),context);return context.window.SignalBreakerTalentTech.manager;}
test('guide reward survives reload and cannot be claimed twice',()=>{
 const storage=new Map(),manager=load(storage);const points=manager.points;
 assert.equal(manager.claimGuideReward(),true);assert.equal(manager.points,points+3);
 assert.equal(manager.claimGuideReward(),false);assert.equal(manager.points,points+3);
 const reloaded=load(storage);assert.equal(reloaded.claimGuideReward(),false);assert.equal(reloaded.points,points+3);
});
test('malformed growth saves cannot inject ranks, tiers, sockets or invalid points',()=>{
 const storage=new Map([['psi.signal-breaker.talent-tech.v1',JSON.stringify({points:-9,talents:{kin_t1:999,eng_t1:-1,unknown:4},weaponLevels:{pulse:99,net:2,unknown:8},weaponSockets:{pulse:['bad','gem_pulse',null],net:'bad'}})]]),manager=load(storage);
 assert.equal(manager.points,5);assert.equal(manager.weaponLevels.pulse,1);assert.equal(manager.weaponLevels.net,2);assert.equal(manager.talents.kin_t1||0,0);assert.equal(manager.weaponSockets.pulse[0],null);
 assert.equal(manager.socketGem('pulse',.5,'gem_pulse'),false);assert.equal(manager.socketGem('pulse',0,'bad'),false);assert.equal(manager.addPoints(NaN),false);assert.equal(manager.addPoints(-5),false);assert.equal(manager.points,5);
});
test('prerequisites and engineering stock gate growth investment',()=>{
 const manager=load(new Map()),points=manager.points;
 assert.equal(manager.investTalent('def_t2'),false);assert.equal(manager.investTalent('eng_t5'),false);assert.equal(manager.points,points);
 assert.equal(manager.upgradeWeapon('scan'),false);assert.equal(manager.weaponLevels.scan,1);
 assert.equal(manager.investTalent('kin_t1'),true);const g=new Game('CH-01');g.start();g.applyTalentStats(manager.getStats());g.fire();const pulseSpeed=Math.hypot(g.shots[0].vx,g.shots[0].vy);
 const other=new Game('CH-01');other.start();other.fire();assert.ok(pulseSpeed>Math.hypot(other.shots[0].vx,other.shots[0].vy));
});
test('talent split shots remain deterministic across 100 seeds and within projectile budget',()=>{
 for(let seed=1;seed<=100;seed++){
  const games=[new Game('CH-01',seed),new Game('CH-01',seed)];
  for(const g of games){g.start();g.applyTalentStats({tripleSplitChance:.6,pulseSpeed:.2});for(let i=0;i<30;i++){g.cooldown=0;g.fire();assert.ok(g.shots.length<=32);}}
  assert.deepEqual(games[0].shots,games[1].shots);
 }
});
test('training immunity belongs to one engine instance and covers contact and boss hazards',()=>{
 const make=()=>{const g=new Game('CH-01',17,{operation:true,premiumRun:true,burst:true,continuous:true,extended:true});g.start();return g;};
 const training=make(),normal=make();training.godMode=true;
 for(const g of [training,normal]){g.cores=[];g.addCore({kind:'metal',tier:0,x:g.player.x,y:g.player.y-10,vx:0,vy:0});g.coreMotion(g.cores[0],0);}
 assert.equal(training.player.life,5);assert.equal(normal.player.life,4);
 for(const g of [training,normal]){g.player.life=5;g.player.invuln=0;g.wave=4;g.beginNextWave();const boss=g.boss;boss.warningUntil=g.time+1;boss.nextDischargeAt=g.time;boss.dischargeX=g.player.x;boss.dischargeHalfWidth=100;g.advanceDeliveryBoss();}
 assert.equal(training.player.life,5);assert.equal(normal.player.life,4);
});
