const test=require('node:test'),assert=require('node:assert/strict');
const {FiringPose,HOLD_SECONDS}=require('../src/firing-pose.js');
const {Game}=require('../src/engine.js');
const make=()=>{const g=new Game('CH-03',20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();return g;};
test('visible muzzle holds the exact most recently fired vector, even when smart aiming instantly flips',()=>{
 const g=make(),pose=new FiringPose();g.setAimDirection(1,-.5);g.cooldown=0;assert.ok(g.fire());
 const event=g.drainEvents().find(e=>e.kind==='fire');assert.ok(event);
 assert.ok(pose.register(event));
 const shot=g.shots.find(s=>s.kind===event.weapon);
 const before=pose.sample(g);assert.ok(before.active);
 assert.ok(Math.hypot(before.launch.muzzle.x-shot.x,before.launch.muzzle.y-shot.y)<.000001);
 assert.ok(before.launch.direction.x>0);
 g.setAimDirection(-1,-.8);
 assert.ok(g.launchGeometry().direction.x<0);
 const locked=pose.sample(g);assert.ok(locked.launch.direction.x>0,'visual recoil cannot flip backward during live shot');
 assert.equal(locked.weapon,event.weapon);
 assert.equal(locked.sourceId,event.sourceId);
});
test('visible presentation follows operator movement without altering actual ballistic state',()=>{
 const g=make(),pose=new FiringPose();g.setAimDirection(-1,-.8);g.cooldown=0;g.fire();
 const event=g.drainEvents().find(e=>e.kind==='fire');pose.register(event);
 const shots=JSON.stringify(g.shots),pre=g.player.x;
 g.move(1,1/60,false,true);
 const visual=pose.sample(g);assert.ok(g.player.x>pre);
 assert.ok(Math.abs(visual.launch.grip.x-g.player.x)<1e-8);
 assert.ok(Math.abs(visual.launch.muzzle.x-(visual.launch.grip.x+visual.launch.direction.x*22))<1e-8);
 assert.equal(JSON.stringify(g.shots),shots,'rendering must not mutate physical projectiles');
});
test('a new shot replaces the recoil direction without interrupting AUTO, FIRE, or cooling',()=>{
 const g=make(),pose=new FiringPose();g.setAimDirection(-1,-.4);g.fire();
 const first=g.drainEvents().find(e=>e.kind==='fire');pose.register(first);
 g.cooldown=0;g.setAimDirection(1,-.5);g.fire();
 const second=g.drainEvents().find(e=>e.kind==='fire');pose.register(second);
 assert.ok(pose.sample(g).launch.direction.x>0);
 assert.notEqual(second.sourceId,first.sourceId);
 assert.equal(g.state,'playing');
});
test('after brief visual recoil timeout display follows the live current aim',()=>{
 const g=make(),pose=new FiringPose();g.setAimDirection(1,-.4);g.fire();pose.register(g.drainEvents().find(e=>e.kind==='fire'));
 g.setAimDirection(-1,-.8);g.time+=HOLD_SECONDS+.001;
 const visual=pose.sample(g);
 assert.equal(visual.active,false);assert.ok(visual.launch.direction.x<0);
 assert.equal(visual.weapon,g.weapon);
});
test('invalid events and stage reset cannot restore stale weapon poses',()=>{
 const g=make(),pose=new FiringPose();
 assert.equal(pose.register({kind:'fire',t:1,dx:NaN,dy:0}),false);
 assert.equal(pose.register({kind:'boss',t:1,dx:1,dy:0}),false);
 g.setAimDirection(-1,-.8);g.fire();pose.register(g.drainEvents().find(e=>e.kind==='fire'));
 pose.reset();
 assert.equal(pose.sample(g).active,false);
});
test('all 5 boss stages and both new primaries retain visual-to-physics muzzle contract',()=>{
 for(const id of ['CH-01','CH-02','CH-03','CH-04','CH-05']){
  const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});g.start();
  for(const x of [-1,1]){
   g.setAimDirection(x,-1);g.cooldown=0;assert.ok(g.fire());
   const event=g.drainEvents().find(e=>e.kind==='fire');const p=new FiringPose();p.register(event);
   const v=p.sample(g),s=g.shots.find(q=>q.id===Number(event.sourceId?.split(':')[1]));
   assert.ok(s);assert.ok(Math.hypot(s.x-v.launch.muzzle.x,s.y-v.launch.muzzle.y)<1e-6,id+' projectile launches exactly at screen muzzle');
   assert.ok(Math.sign(s.vx)===Math.sign(v.launch.direction.x),id+' never displays a backward-fired projectile');
  }
 }
 for(const [id,weapon] of [['CH-02','bankshot'],['CH-03','resonance']]){
  const g=new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});assert.ok(g.setLoadout([weapon,'net']));g.start();g.selectWeapon(weapon);g.setAimDirection(-1,-.7);g.fire();
  const event=g.drainEvents().find(e=>e.kind==='fire'),pose=new FiringPose();pose.register(event);
  assert.equal(pose.sample(g).weapon,weapon);assert.equal(pose.sample(g).launch.color,require('../src/chapter-content.js').WEAPONS[weapon].color);
 }
});
