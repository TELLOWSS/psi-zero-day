const {test}=require('node:test'),a=require('node:assert/strict'),{CombatVfx}=require('../src/combat-vfx.js'),{Game,DT}=require('../src/engine.js');
test('actual firing and contact event presentation never changes deterministic combat state',()=>{
 const g=new Game('CH-01',17,{extended:true,premiumRun:true,operation:true,burst:true,continuous:true}),fx=new CombatVfx();g.start();for(let i=0;i<900;i++){g.assistAim();g.fire();g.update(DT);const events=g.drainEvents(),before=JSON.stringify(g);for(const e of events)fx.event(Object.freeze(e));fx.update(DT);a.equal(JSON.stringify(g),before);}a.ok(fx.seen.has('fire:pulse'));
});
test('event storms stay bounded at every quality and expire without new events',()=>{
 for(const quality of ['low','balanced','high']){const fx=new CombatVfx();fx.configure(quality,false);for(let i=0;i<5000;i++)fx.event({kind:'impact',x:i%1100,y:220});a.equal(fx.items.length,fx.limit());for(let i=0;i<20;i++)fx.update(.05);a.equal(fx.items.length,0);a.equal(fx.event({kind:'fire',x:NaN,y:0}),false);fx.reset();a.equal(fx.serial,0);a.equal(fx.seen.size,0);}
});
test('all weapon families, impacts and chains draw finite geometry with balanced save/restore',()=>{
 for(const quality of ['low','balanced','high'])for(const reduced of [false,true]){
 const fx=new CombatVfx();fx.configure(quality,reduced);let balance=0,calls=0;const c=new Proxy({}, {get(_,key){return (...args)=>{if(key==='save')balance++;if(key==='restore')balance--;for(const value of args)if(typeof value==='number')a.ok(Number.isFinite(value),key);calls++;if(key==='createRadialGradient')return {addColorStop(){}};};},set(){return true;}});
 for(const weapon of ['pulse','bankshot','resonance','net','magnet','mist','anchor','scan','arc','laser']){fx.event({kind:'fire',weapon,x:200,y:250,dx:.7,dy:-.7});fx.projectile(c,{kind:weapon,x:240,y:220,vx:500,vy:-300,trail:[{x:210,y:240},{x:225,y:230},{x:240,y:220}]});fx.draw(c);fx.update(.05);}
 for(const kind of ['impact','armorhit','armorbreak','evolved','bosshit','capture','electrochain','laserline'])fx.event({kind,x:300,y:150,toX:480,toY:240,material:'power'});for(const [recipe,n] of [['singularity',340],['plasma',230]])fx.event({kind:'evolutionfield',x:300,y:200,n,recipe,duration:2.4});fx.draw(c);a.equal(balance,0);a.ok(calls>100);a.equal(fx.status().reduced,reduced);
 }
});
