const a=require('node:assert/strict'),{test}=require('node:test'),{Game}=require('../src/engine.js'),P=require('../src/practice-rules.js'),T=require('../src/tutorial-rules.js'),V=require('../src/battle-viewport.js');
for(const id of Object.keys(P.BUILDS))test('complete build rehearsal: '+id,()=>{
 const g=new Game('CH-01',701,{practice:true,practiceCharacter:id,lab:true});
 a.equal(g.practice,true);a.equal(g.lab,true);a.equal(g.veteran,false);a.equal(g.premiumRun,false);a.equal(g.operation,false);a.equal(g.checkpoint(),null);a.equal(g.cores.length,28);
 a.deepEqual([...new Set(g.cores.map(c=>c.kind))].sort(),['dust','load','metal','power']);a.equal(g.evolution.capstone,true);a.equal(g.weaponLevel,3);a.equal(g.loadout[1],P.BUILDS[id].support);
 a.ok(g.configurePracticeCharacter(id));g.start();a.equal(g.configurePracticeCharacter('player'),false);
 const target=g.cores.find(c=>c.kind===(g.evolution.frame==='arc'?'dust':'metal'));g.setAim(target.x,target.y);a.ok(g.fire());a.equal(g.shots[0].recipe,P.BUILDS[id].recipe);a.equal(g.shots[0].capstone,true);
 for(let n=0;n<120*8;n++){if(n%14===0)g.assistAim(true);g.fire();g.update(1/120);a.ok(g.cores.length<=36);a.ok(g.shots.length<=32);a.ok(g.particles.length<=100);}
 a.ok(g.cleared>0,'real projectile collisions resolve hazard signals');a.ok(g.practiceSpawned>28,'defeated signals are replenished');
 const paused=g.time;g.pause();g.update(.05);a.equal(g.time,paused);g.pause();
 g.time=89.99;g.update(.03);a.equal(g.state,'won');a.equal(g.player.life,5);a.equal(g.checkpoint(),null);
});
test('ordinary snapshots and early wave budgets remain independent of practice',()=>{
 const g=new Game('CH-01',701,{operation:true,premiumRun:true,extended:true,burst:true,continuous:true});a.equal(g.snapshot().practice,undefined);a.equal(g.configurePracticeCharacter('player'),false);a.equal(g.evolution.capstone,false);a.ok(g.cores.length<28);
});
test('read-only chapter guide uses actual source, reflection and capture facts',()=>{
 const g=new Game('CH-01',17,{causal:true});const before=JSON.stringify(g.snapshot());a.equal(T.lesson(g).actionId,'breaker.guide.move');a.equal(JSON.stringify(g.snapshot()),before);g.start();for(let i=0;i<3;i++)g.move(1,.05);a.equal(T.lesson(g).actionId,'breaker.guide.source');g.source.verified=true;g.shotsFired=1;g.reflectedHits=1;g.captureUnits=1;a.equal(T.lesson(g).actionId,'breaker.guide.next');
});
test('veteran guide follows exclusive recipe, branch and final state',()=>{
 const g=new Game('CH-01',7,{operation:true,premiumRun:true,extended:true,veteran:true});a.equal(T.lesson(g).completed,0);g.evolution={frame:'laser',recipe:'prism',branch:'focus',capstone:true};a.equal(T.lesson(g).completed,3);
});
test('reserved viewport framing includes operator, body and every relay',()=>{
 for(const [width,height] of [[844,194],[568,124],[390,528],[768,708]]){
  const player={x:290,y:563},boss={x:750,y:205,nodes:[{x:650,y:170},{x:850,y:170},{x:750,y:325}]},v=V.frame({width,height,player,boss});
  for(const [x,y] of [[251,594],[329,594],[601,85],[899,315],[620,140],[880,200],[720,295]]){const sx=(x-v.x)*v.scale,sy=(y-v.y)*v.scale;a.ok(sx>=0&&sx<=width);a.ok(sy>=0&&sy<=height);}
 }
});

test('complete-build atlas is a real transparent six-cell delivery image',async()=>{
 const sharp=require('sharp'),meta=await sharp(require('node:path').join(__dirname,'../art/psi-practice-weapons-v1.webp')).metadata();
 a.equal(meta.width,1536);a.equal(meta.height,1024);a.equal(meta.hasAlpha,true);
 const {data,info}=await sharp(require('node:path').join(__dirname,'../art/psi-practice-weapons-v1.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)transparent++;a.ok(transparent/(info.width*info.height)>.5);
});
