const {test}=require('node:test'),a=require('node:assert/strict'),{Game,DT}=require('../src/engine.js'),E=require('../src/evolution-rules.js'),J=require('../src/player-journey.js');
const options={extended:true,premiumRun:true,burst:true,continuous:true,operation:true,causal:true};
function clearFirst(g){g.start();for(let i=0;i<360/DT&&g.wave===1&&g.state==='playing';i++){if(g.source&&!g.source.observed)g.observeSource();if(g.source&&!g.source.requested)g.controlSource('isolate');g.move(Math.sin(g.time*.35)>=0?1:-1,DT,false,true);g.assistAim();g.fire();g.update(DT);g.drainEvents();}return g;}
test('continuous manual tuning pauses after a real clear, retains items and resumes by a real candidate choice',()=>{
 const g=clearFirst(new Game('CH-01',17,{...options,autoTuning:false}));a.equal(g.state,'intermission');a.equal(g.wave,1);a.equal(g.tunings.length,0);a.ok(g.draft.length>1);const before=g.checkpoint(),time=g.time;for(let i=0;i<100;i++)g.update(.05);a.equal(g.time,time);a.deepEqual(g.checkpoint(),before);
 const chosen=g.draft.at(-1);a.equal(g.chooseTuning('fake'),false);a.equal(g.chooseTuning(chosen),true);a.equal(g.wave,2);a.ok(g.hasTuning(chosen));a.equal(g.continuous,true);
});
test('manual tuning survives checkpoint restoration, old checkpoints retain automatic behavior, malformed flag rejected',()=>{
 const g=clearFirst(new Game('CH-01',29,{...options,autoTuning:false})),d=g.checkpoint();a.ok(d);a.equal(Game.restoreCheckpoint(d).autoTuning,false);const old=structuredClone(d);delete old.autoTuning;a.equal(Game.restoreCheckpoint(old).autoTuning,true);a.equal(Game.restoreCheckpoint({...d,autoTuning:'false'}),null);
});
test('automatic continuous mode still picks a valid candidate and never requires a new control',()=>{
 const g=clearFirst(new Game('CH-01',17,options));a.equal(g.wave,2);a.equal(g.state,'playing');a.equal(g.tunings.length,1);a.equal(g.autoTuning,true);a.equal(g.setAutoTuning(false),false);g.pause();a.equal(g.setAutoTuning(false),true);
});
test('armor and boss HP progress do not produce a false stalled hint; actual lack of progress still does',()=>{
 const g=new Game('CH-01',17,{...options,causal:false});g.start();g.cores=[];g.boss=g.operationBoss();g.boss.phase='exposed';g.assistAim();g.time+=7;g.boss.hp--;a.notEqual(g.assistAim().hint,'reposition');g.time+=7;a.equal(g.assistAim().hint,'reposition');
 g.boss=null;g.addCore({x:650,y:230,vx:0,vy:0,tier:1,kind:'metal'});g.cores[0].armor=100;g.assistAim();g.time+=7;g.cores[0].armor-=1;a.notEqual(g.assistAim().hint,'reposition');
});
test('apparatus damage has a cause, invulnerability does not rewrite it, retry resets it',()=>{
 const g=new Game('CH-01',17,options);g.start();g.damagePlayer('metal',g.player.x,g.player.y,'delivery');a.equal(g.lastDamage.source,'delivery');a.equal(J.recovery({...g,source:null}),'breaker.gameplay.recovery.delivery');const before=JSON.stringify(g.lastDamage);g.damagePlayer('dust',0,0,'extraction');a.equal(JSON.stringify(g.lastDamage),before);g.reset();a.equal(g.lastDamage,null);
});
test('pressure warning occurs once per field, timer remains frozen in intermission, limit unchanged',()=>{
 const g=new Game('CH-03',17,{...options,veteran:true,continuous:false});g.start();const limit=E.limit(g);g.time=limit-7;g.events=[];E.step(g);E.step(g);a.equal(g.drainEvents().filter(e=>e.kind==='pressuretimewarning').length,1);a.equal(g.state,'playing');g.state='intermission';g.time=limit+1;E.step(g);a.equal(g.state,'intermission');g.state='playing';E.step(g);a.equal(g.failureReason,'pressure');a.equal(g.state,'lost');
});
test('recommended frame follows existing stage materials, player can deliberately override it',()=>{
 for(let n=1;n<=5;n++){const id='CH-0'+n,preferred=E.preferredFrame(id);a.equal(preferred,n===3?'arc':'laser');const g=new Game(id,17,{...options,veteran:true,continuous:false});a.equal(g.selectFrame(preferred),true);a.equal(g.selectFrame(preferred==='arc'?'laser':'arc'),true);}
});
test('deadline failure keeps evolution guidance instead of an earlier apparatus hit',()=>{
 const g=new Game('CH-03',17,{...options,veteran:true});g.start();g.source=null;g.lastDamage={source:'extraction',kind:'dust',time:2};g.failureReason='pressure';a.equal(J.recovery(g),'breaker.journey.recovery.evolution');g.failureReason=null;a.equal(J.recovery(g),'breaker.gameplay.recovery.extraction');
});
