const test=require('node:test');
const assert=require('node:assert/strict');
const {Game,WEAPONS}=require('../src/engine.js');
const make=id=>new Game(id,20261011,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true});
test('two new primaries are actual tactical equipment, not pulse display aliases',()=>{
  for(const id of ['bankshot','resonance']){assert.ok(WEAPONS[id]?.label);assert.ok(WEAPONS[id].glyph);assert.notEqual(WEAPONS[id].speed,WEAPONS.pulse.speed);assert.notEqual(WEAPONS[id].cooldown,WEAPONS.pulse.cooldown);}
  const first=make('CH-01');assert.equal(first.setLoadout(['bankshot','net']),false);
  const second=make('CH-02');assert.equal(second.setLoadout(['bankshot','net']),true);assert.equal(second.setLoadout(['resonance','net']),false);
  const third=make('CH-03');assert.equal(third.setLoadout(['resonance','net']),true);
});
test('bankshot reflected impact also resolves a neighbouring hazard signal',()=>{
  const g=make('CH-02');g.cores=[];g.addCore({x:430,y:230,vx:0,vy:0,tier:1,kind:'metal'});g.addCore({x:505,y:234,vx:0,vy:0,tier:1,kind:'metal'});
  const target=g.cores[0];g.weaponContact({kind:'bankshot',bounces:1,vx:900,vy:-200},target);
  assert.equal(g.events.some(e=>e.kind==='bankchain'),true);
  assert.equal(g.events.filter(e=>e.kind==='split').length,2,'reflected shot links two established cores');
  const direct=make('CH-02');direct.cores=[];direct.addCore({x:430,y:230,vx:0,vy:0,tier:1,kind:'metal'});direct.addCore({x:505,y:234,vx:0,vy:0,tier:1,kind:'metal'});
  direct.weaponContact({kind:'bankshot',bounces:0,vx:900,vy:-200},direct.cores[0]);
  assert.equal(direct.events.some(e=>e.kind==='bankchain'),false,'direct impact lacks reflected extra resolve');
  assert.equal(direct.events.filter(e=>e.kind==='split').length,1);
});
test('resonance shot hits nearby group at once, not distant hazards',()=>{
  const g=make('CH-03');g.cores=[];for(const x of [400,465,485,820])g.addCore({x,y:232,vx:0,vy:0,tier:1,kind:'dust'});
  const target=g.cores[0],far=g.cores[3];
  g.weaponContact({kind:'resonance',bounces:0,vx:550,vy:-200},target);
  assert.equal(g.events.filter(e=>e.kind==='split').length,3,'impact plus at most two nearby cores');
  assert.ok(g.cores.some(c=>c.id===far.id),'far hazard does not receive radius damage');
  assert.ok(g.events.some(e=>e.kind==='resonance'),'area VFX event emitted');
});
test('both new weapons can open mandatory operation boss nodes and resolve the boss',()=>{
  for(const weapon of ['bankshot','resonance']){
    const g=make('CH-05');assert.ok(g.setLoadout([weapon,'net']));g.start();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];
    for(const n of g.boss.nodes)g.shotBoss({x:n.x,y:n.y,r:8,life:1,kind:weapon});
    assert.equal(g.boss.phase,'exposed');
    for(let i=0;i<g.boss.maxHp;i++)g.shotBoss({x:g.boss.x,y:g.boss.y,r:8,life:1,kind:weapon});
    assert.equal(g.boss.phase,'resolved');
  }
});
test('power progression recognizes alternate primary plus net combination',()=>{
  const g=make('CH-03');assert.ok(g.setLoadout(['resonance','net']));g.pickupCount=3;g.signalWatch=3;assert.equal(g.burstCombo(),'recovery');
});
test('new primary projectile origin, direction and projectile budget remain valid',()=>{
  for(const [stage,id] of [['CH-02','bankshot'],['CH-03','resonance']]){
    const g=make(stage);assert.ok(g.setLoadout([id,'net']));g.start();g.selectWeapon(id);g.setAimDirection(-1,-1);
    const origin=g.launchGeometry();assert.ok(g.fire());const s=g.shots[0],evt=g.drainEvents().find(e=>e.kind==='fire');
    assert.equal(s.kind,id);assert.ok(s.vx<0&&s.vy<0);assert.equal(s.x,origin.muzzle.x);assert.equal(s.y,origin.muzzle.y);assert.equal(evt.weapon,id);
    g.shots=Array.from({length:31},()=>({...s}));g.cooldown=0;g.fire();assert.ok(g.shots.length<=32,'32 projectile budget remains enforced');
  }
});
