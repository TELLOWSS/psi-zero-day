const {test}=require('node:test'),a=require('node:assert/strict');
const {Game}=require('../src/engine.js');
const {TalentTechManager,TALENT_TREES,SOCKET_GEMS,BOSS_LOOT}=require('../src/talent-tech-tree.js');
const make=(stats={},options={})=>{const g=new Game('CH-01',17,options);g.applyTalentStats(stats);g.start();return g;};
const add=(g,x=500,y=200,kind='metal',tier=0)=>{g.addCore({x,y,kind,tier,vx:0,vy:0});return g.cores.at(-1);};
const shot={kind:'pulse',vx:0,vy:-770,bounces:0};

test('all 15 approved talents require predecessor ranks and investment never exceeds 31P',()=>{
 const m=new TalentTechManager();m.addPoints(100);
 a.equal(m.investTalent('def_t5'),false);
 for(const tree of Object.values(TALENT_TREES))for(const tier of tree.tiers)for(let n=0;n<tier.maxRank;n++)m.investTalent(tier.id);
 a.equal(m.spentPoints,31);a.equal(m.getAvailablePoints(),0);a.equal(m.investTalent('eng_t1'),false);m.resetTalents();a.equal(m.getAvailablePoints(),31);
});
test('five boss loot tables persist distinct gems, parts and one reward per run; sockets cannot mint items',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},m=new TalentTechManager({storage});
 a.equal(m.socketGem('pulse',0,'gem_kinetic'),false);a.equal(m.upgradeWeapon('pulse'),false);
 for(const id of Object.keys(BOSS_LOOT)){const before=m.points;const r=m.grantBossReward(id,'EP01:'+id+':17');a.equal(m.points,before+2);a.equal(m.grantBossReward(id,'EP01:'+id+':17'),null);a.equal(m.inventory[r.gemId],1);}
 a.equal(m.parts,5);a.equal(m.socketGem('pulse',0,'gem_kinetic'),true);a.equal(m.socketGem('pulse',1,'gem_kinetic'),false);a.equal(m.socketGem('pulse',0,null),true);a.equal(m.socketGem('pulse',1,'gem_kinetic'),true);a.equal(m.socketGem('net',0,'gem_kinetic'),false);
 a.equal(m.upgradeWeapon('scan'),true);a.equal(m.parts,4);
 const restored=new TalentTechManager({storage});a.equal(restored.parts,4);a.equal(restored.weaponLevels.scan,2);a.equal(restored.grantBossReward('CH-01','EP01:CH-01:17'),null);
});
test('socket bonuses apply to their mounted weapon and legacy mounted gems survive migration',()=>{
 const m=new TalentTechManager();m.grantBossReward('CH-01','x');m.socketGem('pulse',0,'gem_kinetic');const stats=m.getStats();
 a.equal(stats.weaponSocketStats.pulse.pulseSpeed,.12);a.equal(stats.weaponSocketStats.net.pulseSpeed,undefined);
 const g=make(stats),plain=make();g.fire();plain.fire();a.ok(Math.hypot(g.shots[0].vx,g.shots[0].vy)>Math.hypot(plain.shots[0].vx,plain.shots[0].vy));
 const legacy={weaponSockets:{pulse:['gem_kinetic',null,null]},points:8};const old=new TalentTechManager({storage:{getItem:()=>JSON.stringify(legacy)}});a.equal(old.inventory.gem_kinetic,1);a.equal(old.weaponSockets.pulse[0],'gem_kinetic');
});
test('legacy ungated ranks are refunded through available points without losing earned progression',()=>{
 const old={points:20,talents:{def_t5:1,kin_t1:5,kin_t3:1},weaponLevels:{pulse:4}};
 const m=new TalentTechManager({storage:{getItem:()=>JSON.stringify(old)}});a.equal(m.points,20);a.equal(m.spentPoints,5);a.equal(m.getAvailablePoints(),15);a.equal(m.talents.def_t5,0);a.equal(m.talents.kin_t3,0);a.equal(m.weaponLevels.pulse,4);
});
test('defense: damping, wider barrier, emergency protection, delayed release and shield stabilization act on state',()=>{
 const g=make({bounceVelocity:.15,shieldTolerance:.2,deflectionAngle:.1,emergencyShield:true,hazardDelay:.25,absoluteShieldShockwave:true,comboWindow:.4});
 a.equal(g.comboWindow(),2.9);for(let n=0;n<4;n++){g.player.invuln=0;g.damagePlayer('metal');}a.equal(g.player.life,1);a.equal(g.player.invuln,3);a.equal(g.growthState.emergencyUsed,true);a.equal(g.damagePlayer('metal'),false);
 const target=g.cores[0];a.equal(target.stable,false);g.cycleShield();a.equal(target.stable,true);
 const s={x:14,y:100,vx:-100,vy:0,r:8,life:1,bounces:0,kind:'pulse'};g.rail=[];g.cores=[];g.advanceShot(s,.02);a.ok(Math.abs(s.vx-91.5)<1e-9);
 const burst=make({hazardDelay:.25},{extended:true,premiumRun:true,burst:true});burst.cores=[];const dust=add(burst,500,200,'dust');burst.pulse(dust,shot);a.equal(dust.releaseAt,.3);
});
test('kinetic: impact knockback, armor penetration, reflected triple shot and weak-point overdrive are real',()=>{
 const g=make({pulseImpact:.2,hitStopBoost:.04,knockbackRadius:40,tripleSplitChance:.6,kineticOverdrive:true});g.cores=[];const first=add(g),near=add(g,520);g.pulse(first,shot);a.ok(near.vx>0);a.ok(g.events.some(e=>e.kind==='growthimpact'&&e.n===.04));
 for(let n=0;n<3;n++)g.event('impact',500,200,1,'metal');g.fire();a.equal(g.shots.length,3);g.cooldown=0;g.fire();a.equal(g.shots.length,4);
 g.event('node',600,200);a.equal(g.chain,10);a.equal(g.boostUntil,6);
 const opts={extended:true,premiumRun:true,operation:true,veteran:true},base=make({},opts),pierce=make({armorPierceMultiplier:2},opts);
 const c1=base.cores[0],c2=pierce.cores[0],before=c1.armor;base.pulse(c1,{...shot,element:'laser'});pierce.pulse(c2,{...shot,element:'laser'});a.equal(before-c2.armor,(before-c1.armor)*2);
});
test('engineering: field radius, extra capture, forecast, conditional cooldown and last-core recovery work',()=>{
 const magnet=make({magnetRadius:.25,magnetPull:.2});magnet.deployField('magnet',500,200);a.equal(magnet.fields[0].radius,225);
 const net=make({netCapacity:2,cooldownReduction:.15});net.cores=[];const c=add(net),extra=add(net,630);net.netBurst(c);a.ok(!net.cores.includes(extra));net.selectWeapon('net');net.fire();a.ok(net.cooldown<.53);
 const forecast=make({predictiveScanner:true},{extended:true,premiumRun:true,burst:true});a.ok(forecast.predictiveThreats().length>0);
 const drone=make({autoCleanDrone:true});const total=drone.maxUnits;drone.step(1/120);a.equal(drone.cleared,total);a.ok(drone.events.some(e=>e.kind==='cleandrone'));
});
test('each weapon Tier upgrade changes its own combat behavior and stays within core/projectile budgets',()=>{
 const pulse=make({weaponLevels:{pulse:4}});pulse.fire();a.equal(pulse.shots[0].pierceBudget,3);a.equal(pulse.shots[0].splashRadius,95);a.ok(pulse.cooldown<.29);
 const net=make({weaponLevels:{net:3}},{extended:true,premiumRun:true,burst:true});a.equal(net.captureRadius(),133);net.cores=[];const c=add(net);net.netBurst(c);a.equal(c.frozenUntil,1.5);const x=c.x;net.coreMotion(c,.1);a.equal(c.x,x);
 const magnet=make({weaponLevels:{magnet:4}});magnet.deployField('magnet',500,200);a.equal(magnet.fields[0].pulsing,true);magnet.cores=[];const metal=add(magnet,520);for(let i=0;i<10;i++)magnet.fieldForces(metal,.1);a.equal(metal.stable,true);a.ok(metal.vx>0);
 const mist=make({weaponLevels:{mist:2}});mist.deployField('mist',500,200);mist.cores=[];const dust=add(mist,500,200,'dust');for(let n=0;n<4;n++)mist.fieldForces(dust,.1);a.equal(dust.stable,true);
 const anchor=make({weaponLevels:{anchor:3}});anchor.cores=[];for(let n=0;n<3;n++)anchor.weaponContact({kind:'anchor'},add(anchor,400+n*20));a.equal(anchor.anchors.length,3);
 const scan=make({weaponLevels:{scan:4}});scan.deployField('scan',500,200);a.equal(scan.growthState.slowRemaining,1.5);scan.update(.06);a.ok(scan.time<.03);a.equal(scan.growthState.slowRemaining,1.44);
 for(const g of [pulse,net,magnet,mist,anchor,scan]){a.ok(g.shots.length<=32);a.ok(g.cores.length<=36);}
});
test('emergency protection and pending reflected shot survive checkpoints; forged runtime flags are rejected',()=>{
 const g=make({emergencyShield:true},{extended:true,premiumRun:true});g.growthState.emergencyUsed=true;g.growthState.nextTriple=true;
 for(const c of [...g.cores]){c.stable=true;g.capture(c,true);}g.step(1/120);const cp=g.checkpoint();a.ok(cp);const r=Game.restoreCheckpoint(cp);a.equal(r.growthState.emergencyUsed,true);a.equal(r.growthState.nextTriple,true);cp.growthState.slowRemaining=99;a.equal(Game.restoreCheckpoint(cp),null);
});
test('Tier 4 anchor neutralizes the hoist mechanism only after a real rail contact',()=>{
 const g=new Game('CH-04',17,{operation:true,extended:true,premiumRun:true});g.start();g.applyTalentStats({weaponLevels:{anchor:4}});g.wave=4;g.beginNextWave();const b=g.boss;
 a.equal(b.growthAnchored,undefined);const rail=g.railSegment(g.rail[0]),x=(rail.ax+rail.bx)/2,y=(rail.ay+rail.by)/2;
 g.advanceShot({kind:'anchor',x,y:y-40,vx:0,vy:1000,r:9,life:1,bounces:0},.05);a.equal(b.growthAnchored,true);
 g.tensionLockUntil=0;b.warningUntil=1;b.nextSnapAt=g.time;b.snapLeft=g.player.x-10;b.snapRight=g.player.x+10;g.advanceTensionBoss();a.equal(g.player.life,5);a.ok(b.secured>0);
});
test('the approved five-combo fever activates three-way fire without spending manual boost points',()=>{
 const g=make({}, {extended:true,premiumRun:true,burst:true});for(let n=0;n<5;n++)g.chainAction(1,500,200);a.equal(g.boostUntil,6);a.equal(g.runPoints,0);g.fire();a.equal(g.shots.length,3);a.ok(g.events.some(e=>e.kind==='overdrive'));
});
test('ordinary reflected hits without a splitting talent cannot invalidate a legitimate checkpoint',()=>{
 const g=make({}, {extended:true,premiumRun:true});for(let n=0;n<20;n++)g.event('impact',500,200,1,'metal');a.equal(g.growthState.reflectionHits,3);
 for(const c of [...g.cores]){c.stable=true;g.capture(c,true);}g.step(1/120);const restored=Game.restoreCheckpoint(g.checkpoint());a.ok(restored);a.equal(restored.growthState.reflectionHits,3);
});
test('a legitimate extended combo window from three owned sockets survives checkpoint restore',()=>{
 const g=make({comboWindow:.4,weaponSocketStats:{pulse:{comboWindow:.9}}},{extended:true,premiumRun:true});for(const c of [...g.cores]){c.stable=true;g.capture(c,true);}g.step(1/120);const cp=g.checkpoint();a.ok(cp.values.comboTime>3.3);a.ok(Game.restoreCheckpoint(cp));cp.values.comboTime=5;a.equal(Game.restoreCheckpoint(cp),null);
});
test('only effective compatible gems may be mounted, and schema 2 cannot invent unowned stock',()=>{
 const m=new TalentTechManager();m.grantBossReward('CH-03','socket-fixture');a.equal(m.socketGem('pulse',0,'gem_thermal'),false);a.equal(m.socketGem('net',0,'gem_thermal'),true);a.equal(m.socketGem('__proto__',0,'gem_thermal'),false);a.equal(m.upgradeWeapon('constructor'),false);
 const bad=new TalentTechManager({storage:{getItem:()=>JSON.stringify({schemaVersion:2,inventory:{},weaponSockets:{pulse:['gem_kinetic',null,null]}})}});a.equal(bad.weaponSockets.pulse[0],null);a.equal(bad.availableGems('gem_kinetic'),0);
 const old=new TalentTechManager({storage:{getItem:()=>JSON.stringify({weaponSockets:{net:['gem_kinetic',null,null]}})}});a.equal(old.weaponSockets.net[0],null);a.equal(old.availableGems('gem_kinetic'),1);
});
