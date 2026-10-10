const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('../src/engine.js');
test('shuttle moves collision shape deterministically without changing stage geometry',()=>{
 const g=new Game('CH-02'),b=g.config.bumper[0],original=JSON.stringify(b);
 g.time=1.75;const at=g.bumperPosition(b);assert.ok(Math.abs(at.x-b.x-65)<1e-8);assert.ok(Math.abs(at.vx)<1e-8);assert.equal(JSON.stringify(b),original);
 g.time=5.25;assert.ok(Math.abs(g.bumperPosition(b).x-b.x+65)<1e-8);
});
test('moving bumper applies the collision at its rendered location',()=>{
 const g=new Game('CH-02',1,{lab:true});g.start();g.time=1.75;const b=g.bumperPosition(g.config.bumper[0]);
 const c={id:999,x:b.x+b.r+10,y:b.y,vx:-100,vy:0,r:14,tier:0,kind:'dust',age:0,glow:0};g.cores=[c];g.coreMotion(c,0);assert.ok(c.vx>0);assert.ok(c.x>=b.x+b.r+14);
});
test('timed gate closes for three seconds and does not consume a blocked core',()=>{
 const g=new Game('CH-03',1,{lab:true});g.start();const gate=g.config.gate;
 g.time=6;assert.equal(g.gateStatus().open,false);assert.equal(g.gateStatus().remaining,2);
 const c={id:999,x:gate.x-20,y:gate.y,vx:100,vy:0,r:14,tier:0,kind:'dust',stable:true,age:0,glow:0};g.cores=[c];g.coreMotion(c,0);assert.equal(g.cores.length,1);assert.equal(g.lastReason.code,'gatewait');
 g.time=8;g.coreMotion(c,0);assert.equal(g.cores.length,0);assert.equal(g.cleared,1);
});
test('legacy gate remains open and pause freezes device timing',()=>{
 const g=new Game('CH-01');assert.deepEqual(g.gateStatus(),{open:true,remaining:0});
 const moving=new Game('CH-02');moving.start();moving.update(.05);moving.pause();const x=moving.bumperPosition(moving.config.bumper[0]).x;moving.update(1);assert.equal(moving.bumperPosition(moving.config.bumper[0]).x,x);
});
