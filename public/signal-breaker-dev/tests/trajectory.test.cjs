const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,DT}=require('../src/engine.js');
test('preview leaves game, event queue, score and RNG untouched',()=>{
 const g=new Game();g.setAim(560,200);const before=JSON.stringify(g);
 const a=g.predictShot(),b=g.predictShot();assert.deepEqual(a,b);assert.equal(JSON.stringify(g),before);
 assert.ok(a.points.length>2);assert.ok(a.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
});
test('reflection markers agree with actual pulse and net rail collisions',()=>{
 for(const weapon of ['pulse','net'])for(let angle=0;angle<3;angle++){
  const g=new Game();g.cores=[];g.weapon=weapon;g.shieldAngle=angle;g.setAim(515,323);
  const forecast=g.predictShot();g.start();g.fire();const collisions=[];
  for(let i=0;i<240;i++){g.step(DT);for(const e of g.drainEvents())if(e.kind==='ricochet')collisions.push({x:e.x,y:e.y});}
  assert.deepEqual(forecast.contacts,collisions);
 }
});
test('net preview marks actual capture radius and current target',()=>{
 const g=new Game();g.rail=[];g.cores=[];g.addCore({x:290,y:350,vx:0,vy:0,tier:1,kind:'metal'});g.weapon='net';g.setAim(290,350);
 const p=g.predictShot();assert.equal(p.captureRadius,102);assert.equal(p.target.kind,'metal');assert.equal(p.target.tier,1);
});
