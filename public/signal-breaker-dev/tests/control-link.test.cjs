const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('../src/engine.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('linked movement mirrors bearing while preserving player-chosen elevation',()=>{
 const g=new Game('CH-01');g.start();g.setAim(620,250);const right=g.launchGeometry().direction;
 g.move(-1,.05,true);const left=g.launchGeometry().direction;assert.ok(left.x<0);near(left.x,-right.x);near(left.y,right.y);assert.equal(g.shotsFired,0);
 g.move(1,.05,true);const again=g.launchGeometry().direction;near(again.x,right.x);near(again.y,right.y);
});
test('linked angle remains constant over movement and at world boundaries',()=>{
 const g=new Game('CH-01');g.start();g.setAim(610,300);g.move(-1,.05,true);const d=g.launchGeometry().direction;
 for(let i=0;i<100;i++)g.move(-1,.05,true);near(g.launchGeometry().direction.x,d.x);near(g.launchGeometry().direction.y,d.y);assert.equal(g.player.x,57);assert.equal(g.shotsFired,0);
});
test('vertical pad input adjusts angle without firing or selecting a target',()=>{
 const g=new Game('CH-01');g.start();g.setAim(620,350);const before=g.launchGeometry().direction.y;
 g.adjustAimElevation(-1,.05);assert.ok(g.launchGeometry().direction.y<before);assert.equal(g.shotsFired,0);
 g.move(-1,.05,true);g.adjustAimElevation(1,.05);assert.ok(g.launchGeometry().direction.x<0);assert.equal(g.shotsFired,0);
});
test('pad elevation reaches its shallow limit without a hidden minimum-angle jump',()=>{
 const g=new Game('CH-01');g.start();g.setAim(350,470);for(let i=0;i<60;i++)g.adjustAimElevation(1,.05);const d=g.launchGeometry().direction;near(Math.atan2(-d.y,Math.abs(d.x)),Math.PI/36);assert.equal(g.shotsFired,0);
});
test('precision mode keeps chosen world target and paused input cannot change aim',()=>{
 const g=new Game('CH-01');g.start();g.setAim(620,250);g.move(-1,.05,false);assert.equal(g.player.aimX,620);
 g.pause();const before=JSON.stringify(g.player);g.move(1,.05,true);g.adjustAimElevation(-1,.05);assert.equal(JSON.stringify(g.player),before);
});
