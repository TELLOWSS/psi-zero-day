const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game,CHAPTER,DT}=require('../src/engine.js');
/* Deterministic controller proof, not a human success-rate or balance measurement.
   Uses ordinary movement speed, initial loadout, aiming, cooldown and damage rules. */
for(const config of CHAPTER)test(config.id+' has a physically playable clear path',()=>{
 const g=new Game(config.id);g.start();
 for(let i=0;i<12000&&g.state==='playing';i++){
  let target=g.cores.slice().sort((a,b)=>a.tier-b.tier)[0],relay=false;
  if(!target){target=g.circuit.find(n=>!n.hit)||g.boss?.nodes.find(n=>!n.hit)||(g.boss?.phase==='exposed'?g.boss:null);relay=true;}
  if(target){const wanted=Math.min(1000,Math.max(57,target.x+110));g.move(Math.sign(wanted-g.player.x),DT);const flight=Math.max(0,(g.player.y-25-target.y)/600);
   g.setAim(target.x+(relay?0:(target.vx||0)*flight),target.y+(relay?0:(target.vy||0)*flight));g.selectWeapon(relay?'pulse':g.loadout.includes('net')?'net':'pulse');if(Math.abs(wanted-g.player.x)<30)g.fire();}
  g.update(DT);
 }
 assert.equal(g.state,'won');assert.equal(g.cleared,g.maxUnits);assert.ok(g.player.life>0);assert.ok(g.shotsFired>0);
});
