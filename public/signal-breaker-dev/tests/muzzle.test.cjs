const {test}=require('node:test');const assert=require('node:assert/strict');const {Game}=require('../src/engine.js');
test('muzzle, preview, shot and fire event agree across weapons and aim directions',()=>{
 for(const weapon of ['pulse','net'])for(const x of [57,550,1043])for(const target of [[25,28],[1075,28],[550,496]]){
  const g=new Game();g.player.x=x;g.selectWeapon(weapon);g.setAim(...target);const before=JSON.stringify(g);const launch=g.launchGeometry();const preview=g.predictShot();assert.equal(JSON.stringify(g),before);assert.deepEqual(preview.points[0],launch.muzzle);g.fire();const s=g.shots[0],event=g.drainEvents().find(e=>e.kind==='fire');assert.equal(s.x,launch.muzzle.x);assert.equal(s.y,launch.muzzle.y);assert.equal(event.x,s.x);assert.equal(event.y,s.y);assert.ok(s.vy<0);assert.ok(Math.abs(s.vx/s.vy-launch.direction.x/launch.direction.y)<1e-9);
 }
});
